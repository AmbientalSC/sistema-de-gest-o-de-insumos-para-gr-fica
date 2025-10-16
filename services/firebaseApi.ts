import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  setDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, Item, StockMovement, MovementType, Role } from '../types';

// Collections
const USERS_COLLECTION = 'users';
const ITEMS_COLLECTION = 'items';
const MOVEMENTS_COLLECTION = 'movements';

// ============================================
// AUTHENTICATION
// ============================================

export async function apiLogin(username: string, password: string): Promise<User> {
  try {
    // Convert username to email format for Firebase Auth
    const email = username.includes('@') ? username : `${username}@gestao-estoque.local`;
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userCredential.user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('Dados do usuário não encontrados');
    }
    
    const userData = userDoc.data();
    return {
      id: userCredential.user.uid,
      name: userData.name,
      username: userData.username,
      role: userData.role as Role,
    } as User;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error('Usuário ou senha inválidos');
  }
}

export async function apiSignOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ============================================
// USERS
// ============================================

export async function apiGetUsers(): Promise<User[]> {
  const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
  return usersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as User));
}

export async function apiAddUser(user: Partial<User>): Promise<User> {
  try {
    // Create user in Firebase Auth
    const email = user.username!.includes('@') 
      ? user.username! 
      : `${user.username}@gestao-estoque.local`;
    
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      email, 
      user.password || '1234'
    );
    
    // Store user data in Firestore
    const userData = {
      name: user.name || 'Novo Usuário',
      username: user.username || `user${Date.now()}`,
      role: user.role || Role.Collaborator,
      createdAt: Timestamp.now()
    };
    
    await setDoc(doc(db, USERS_COLLECTION, userCredential.user.uid), userData);
    
    return {
      id: userCredential.user.uid,
      ...userData
    } as User;
  } catch (error: any) {
    console.error('Error adding user:', error);
    throw new Error('Erro ao adicionar usuário');
  }
}

// ============================================
// ITEMS
// ============================================

export async function apiGetItems(): Promise<Item[]> {
  const itemsSnapshot = await getDocs(collection(db, ITEMS_COLLECTION));
  return itemsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Item));
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
  return {
    id: doc.id,
    ...doc.data()
  } as Item;
}

export async function apiCheckoutItem(itemId: number | string, quantity: number): Promise<void> {
  const itemRef = doc(db, ITEMS_COLLECTION, itemId.toString());
  const itemDoc = await getDoc(itemRef);
  
  if (!itemDoc.exists()) {
    throw new Error('Item não encontrado');
  }
  
  const itemData = itemDoc.data() as Item;
  
  if (itemData.quantity < quantity) {
    throw new Error('Quantidade insuficiente');
  }
  
  const newQuantity = itemData.quantity - quantity;
  
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
