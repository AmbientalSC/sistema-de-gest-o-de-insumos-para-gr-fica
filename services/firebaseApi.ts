import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, Item, StockMovement, MovementType, Role } from '../types';

// Collections
const ITEMS_COLLECTION = 'items';
const MOVEMENTS_COLLECTION = 'movements';
const USERS_COLLECTION = 'users';

// ============================================
// AUTHENTICATION
// ============================================

export type ApiLoginResult = { user?: User; candidates?: User[] };

export async function apiLogin(username: string, password: string): Promise<ApiLoginResult> {
  try {
    // Convert username to email format for Firebase Auth
    const email = username.includes('@') ? username : `${username}@gestao-estoque.local`;

    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Try to get Firestore document by uid
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userCredential.user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Verificar se o usuário está ativo
      if (userData.active === false) {
        await firebaseSignOut(auth);
        throw new Error('Usuário desativado. Entre em contato com o administrador.');
      }

      return { user: {
        id: userDoc.id,
        name: userData.name,
        username: userData.username,
        role: userData.role,
        active: userData.active ?? true
      } as User };
    }

    // If no doc by uid, search all users for matching username (local-part) or provided username
    const allUsers = await apiGetUsers();
    const localUsername = (userCredential.user.email || '').split('@')[0];
    const candidates = allUsers.filter(u => (u.username && (u.username === localUsername || u.username === username)));

    if (candidates.length === 1) {
      const c = candidates[0];
      if (c.active === false) {
        await firebaseSignOut(auth);
        throw new Error('Usuário desativado. Entre em contato com o administrador.');
      }
      return { user: c };
    }

    if (candidates.length > 1) {
      // Multiple profiles found for same login — return candidates for UI selection
      return { candidates };
    }

    // Fallback for backward compatibility (no Firestore doc found)
    const isManager = username.toLowerCase() === 'gestor' ||
      email.toLowerCase().includes('gestor');

    return {
      user: {
        id: userCredential.user.uid,
        name: isManager ? 'Admin Gestor' : 'Colaborador',
        username: username,
        role: isManager ? Role.Manager : Role.Collaborator,
        active: true
      } as User
    };
  } catch (error: any) {
    console.error('Login error:', error);
    if (error.message && error.message.includes('desativado')) {
      throw error;
    }
    throw new Error('Usuário ou senha inválidos');
  }
}

export async function apiSignOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ============================================
// USERS (Gerenciamento completo com Auth + Firestore)
// ============================================

export async function apiGetUsers(): Promise<User[]> {
  try {
    const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
    return usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function apiAddUser(user: Partial<User>): Promise<User> {
  try {
    if (!user.username || !user.password || !user.name) {
      throw new Error('Nome, usuário e senha são obrigatórios');
    }

    // Criar usuário no Firebase Authentication
    const email = user.username.includes('@')
      ? user.username
      : `${user.username}@gestao-estoque.local`;

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      user.password
    );

    // Atualizar nome no perfil do Auth
    await updateProfile(userCredential.user, {
      displayName: user.name
    });

    // Criar documento no Firestore
    const newUser = {
      name: user.name,
      username: user.username,
      role: user.role || Role.Collaborator,
      active: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    await setDoc(doc(db, USERS_COLLECTION, userCredential.user.uid), newUser);

    return {
      id: userCredential.user.uid,
      ...newUser
    } as User;
  } catch (error: any) {
    console.error('Error adding user:', error);
    if (error && error.code === 'auth/email-already-in-use') {
      // Fallback: o e-mail já existe no Firebase Auth. Para permitir que o mesmo
      // e-mail seja usado em perfis diferentes (ex: gestor e colaborador),
      // criamos apenas o documento no Firestore em vez de falhar.
      try {
        const fallbackUser = {
          name: user.name,
          username: user.username,
          role: user.role || Role.Collaborator,
          active: true,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        const docRef = await addDoc(collection(db, USERS_COLLECTION), fallbackUser as any);
        return {
          id: docRef.id,
          ...fallbackUser
        } as User;
      } catch (e: any) {
        console.error('Fallback user creation failed:', e);
        throw new Error('Erro ao criar usuário: ' + (e.message || String(e)));
      }
    }
    throw new Error('Erro ao criar usuário: ' + (error?.message || String(error)));
  }
}

export async function apiUpdateUser(userId: string, updates: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Erro ao atualizar usuário');
  }
}

export async function apiToggleUserStatus(userId: string, active: boolean): Promise<void> {
  try {
    await apiUpdateUser(userId, { active });
  } catch (error) {
    console.error('Error toggling user status:', error);
    throw new Error('Erro ao alterar status do usuário');
  }
}

// ============================================
// ITEMS
// ============================================

export async function apiGetItems(): Promise<Item[]> {
  const itemsSnapshot = await getDocs(collection(db, ITEMS_COLLECTION));
  return itemsSnapshot.docs.map(doc => {
    const data: any = doc.data();
    return ({
      id: doc.id,
      ...data,
      quantity: Number(data.quantity) || 0,
      minQuantity: Number(data.minQuantity) || 0
    } as Item);
  });
}

export async function apiAddItem(item: Partial<Item>): Promise<Item> {
  const newItem = {
    name: item.name || 'Novo Insumo',
    barcode: item.barcode || String(Date.now()).slice(-13),
    description: item.description || '',
    unitOfMeasure: item.unitOfMeasure || 'Unidade',
    quantity: item.quantity ?? 0,
    minQuantity: item.minQuantity ?? 0,
    supplier: item.supplier || '',
    location: item.location || '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, ITEMS_COLLECTION), newItem);

  // Add initial movement
  if (newItem.quantity > 0) {
    await apiAddMovement({
      itemId: docRef.id,
      itemName: newItem.name,
      userId: auth.currentUser?.uid || 'system',
      userName: 'Sistema',
      type: MovementType.In,
      quantity: newItem.quantity,
      timestamp: new Date()
    });
  }

  return {
    id: docRef.id,
    ...newItem
  } as Item;
}

export async function apiUpdateItem(item: Item): Promise<Item> {
  const itemRef = doc(db, ITEMS_COLLECTION, item.id.toString());
  const updateData = {
    name: item.name,
    barcode: item.barcode,
    description: item.description,
    unitOfMeasure: item.unitOfMeasure,
    quantity: item.quantity,
    minQuantity: item.minQuantity,
    supplier: item.supplier,
    location: item.location,
    updatedAt: Timestamp.now()
  };

  await updateDoc(itemRef, updateData);
  return item;
}

export async function apiAddStock(itemId: number | string, quantity: number): Promise<void> {
  const itemRef = doc(db, ITEMS_COLLECTION, itemId.toString());
  const itemDoc = await getDoc(itemRef);

  if (!itemDoc.exists()) {
    throw new Error('Item não encontrado');
  }

  const itemData = itemDoc.data() as Item;
  const newQuantity = itemData.quantity + quantity;

  await updateDoc(itemRef, {
    quantity: newQuantity,
    updatedAt: Timestamp.now()
  });

  // Add movement
  await apiAddMovement({
    itemId: itemId.toString(),
    itemName: itemData.name,
    userId: auth.currentUser?.uid || 'system',
    userName: auth.currentUser?.email?.split('@')[0] || 'Sistema',
    type: MovementType.In,
    quantity: quantity,
    timestamp: new Date()
  });
}

// ============================================
// MOVEMENTS
// ============================================

export async function apiGetMovementHistory(): Promise<StockMovement[]> {
  const movementsQuery = query(
    collection(db, MOVEMENTS_COLLECTION),
    orderBy('timestamp', 'desc')
  );

  const movementsSnapshot = await getDocs(movementsQuery);

  return movementsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate() || new Date()
    } as StockMovement;
  });
}

async function apiAddMovement(movement: Partial<StockMovement>): Promise<void> {
  await addDoc(collection(db, MOVEMENTS_COLLECTION), {
    ...movement,
    timestamp: Timestamp.fromDate(movement.timestamp || new Date())
  });
}

// ============================================
// COLLABORATOR ACTIONS
// ============================================

export async function apiGetItemByBarcode(barcode: string): Promise<Item> {
  const itemsQuery = query(
    collection(db, ITEMS_COLLECTION),
    where('barcode', '==', barcode)
  );

  const itemsSnapshot = await getDocs(itemsQuery);

  if (itemsSnapshot.empty) {
    throw new Error('Item não encontrado');
  }

  const doc = itemsSnapshot.docs[0];
  const data: any = doc.data();
  return {
    id: doc.id,
    ...data,
    quantity: Number(data.quantity) || 0,
    minQuantity: Number(data.minQuantity) || 0
  } as Item;
}

export async function apiCheckoutItem(itemId: number | string, quantity: number): Promise<void> {
  const itemRef = doc(db, ITEMS_COLLECTION, itemId.toString());
  const itemDoc = await getDoc(itemRef);

  if (!itemDoc.exists()) {
    throw new Error('Item não encontrado');
  }

  const itemDataRaw: any = itemDoc.data();
  const itemData = {
    ...itemDataRaw,
    quantity: Number(itemDataRaw.quantity) || 0,
    minQuantity: Number(itemDataRaw.minQuantity) || 0
  } as Item;

  const requested = Number(quantity) || 0;
  if (itemData.quantity < requested) {
    throw new Error('Quantidade insuficiente');
  }

  const newQuantity = itemData.quantity - requested;

  await updateDoc(itemRef, {
    quantity: newQuantity,
    updatedAt: Timestamp.now()
  });

  // Add movement
  await apiAddMovement({
    itemId: itemId.toString(),
    itemName: itemData.name,
    userId: auth.currentUser?.uid || 'collaborator',
    userName: auth.currentUser?.email?.split('@')[0] || 'Colaborador',
    type: MovementType.Out,
    quantity: quantity,
    timestamp: new Date()
  });
}
