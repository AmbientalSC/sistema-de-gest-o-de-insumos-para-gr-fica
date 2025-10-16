import { User, Item, StockMovement, MovementType, Role } from '../types';

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

let userIdCounter = 3;
const users: User[] = [
  { id: 1, name: 'Admin Gestor', username: 'gestor', password: '1234', role: Role.Manager },
  { id: 2, name: 'Colaborador Exemplo', username: 'colab', password: '1234', role: Role.Collaborator },
];

let itemIdCounter = 4;
const items: Item[] = [
  { id: 1, name: 'Papel A4', barcode: '1234567890123', description: 'Papel para impressão', unitOfMeasure: 'Folha', quantity: 500, minQuantity: 100, supplier: 'Fornecedor X', location: 'Estante A' },
  { id: 2, name: 'Tinta Preta', barcode: '2345678901234', description: 'Tinta para impressora', unitOfMeasure: 'Litro', quantity: 10, minQuantity: 2, supplier: 'Fornecedor Y', location: 'Armário B' },
  { id: 3, name: 'Caixa de Clips', barcode: '3456789012345', description: 'Clips tamanho M', unitOfMeasure: 'Unidade', quantity: 50, minQuantity: 10, supplier: 'Fornecedor Z', location: 'Gaveta C' },
];

let movementIdCounter = 1;
const movements: StockMovement[] = [
  { id: movementIdCounter++, itemId: 1, itemName: 'Papel A4', userId: 1, userName: 'Admin Gestor', type: MovementType.In, quantity: 500, timestamp: new Date() },
];

// Auth
export async function apiLogin(username: string, password: string): Promise<User> {
  await delay();
  const found = users.find(u => u.username === username && u.password === password);
  if (!found) throw new Error('Usuário ou senha inválidos');
  const { password: _p, ...rest } = found as any;
  return rest as User;
}

// Users
export async function apiGetUsers(): Promise<User[]> {
  await delay();
  return users.map(({ password, ...rest }) => rest as User);
}

export async function apiAddUser(user: Partial<User>): Promise<User> {
  await delay();
  const newUser: User = {
    id: ++userIdCounter,
    name: user.name || 'Novo Usuário',
    username: user.username || `user${userIdCounter}`,
    password: user.password || '1234',
    role: user.role || Role.Collaborator,
  } as User;
  users.push(newUser);
  const { password, ...rest } = newUser as any;
  return rest as User;
}

// Items
export async function apiGetItems(): Promise<Item[]> {
  await delay();
  return items.map(i => ({ ...i }));
}

export async function apiAddItem(item: Partial<Item>): Promise<Item> {
  await delay();
  const newItem: Item = {
    id: ++itemIdCounter,
    name: item.name || 'Novo Insumo',
    barcode: item.barcode || String(Date.now()).slice(-13),
    description: item.description || '',
    unitOfMeasure: (item.unitOfMeasure as Item['unitOfMeasure']) || 'Unidade',
    quantity: item.quantity ?? 0,
    minQuantity: item.minQuantity ?? 0,
    supplier: item.supplier,
    location: item.location || '',
  };
  items.push(newItem);
  movements.push({ id: movementIdCounter++, itemId: newItem.id, itemName: newItem.name, userId: 1, userName: 'Sistema', type: MovementType.In, quantity: newItem.quantity, timestamp: new Date() });
  return { ...newItem };
}

export async function apiUpdateItem(item: Item): Promise<Item> {
  await delay();
  const idx = items.findIndex(i => i.id === item.id);
  if (idx === -1) throw new Error('Item não encontrado');
  items[idx] = { ...item };
  return { ...items[idx] };
}

export async function apiAddStock(itemId: number, quantity: number): Promise<void> {
  await delay();
  const item = items.find(i => i.id === itemId);
  if (!item) throw new Error('Item não encontrado');
  item.quantity += quantity;
  movements.push({ id: movementIdCounter++, itemId: item.id, itemName: item.name, userId: 1, userName: 'Sistema', type: MovementType.In, quantity, timestamp: new Date() });
}

// Movements
export async function apiGetMovementHistory(): Promise<StockMovement[]> {
  await delay();
  // return copy sorted desc
  return movements.slice().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map(m => ({ ...m }));
}

// Collaborator actions
export async function apiGetItemByBarcode(barcode: string): Promise<Item> {
  await delay();
  const item = items.find(i => i.barcode === barcode);
  if (!item) throw new Error('Item não encontrado');
  return { ...item };
}

export async function apiCheckoutItem(itemId: number, quantity: number): Promise<void> {
  await delay();
  const item = items.find(i => i.id === itemId);
  if (!item) throw new Error('Item não encontrado');
  if (item.quantity < quantity) throw new Error('Quantidade insuficiente');
  item.quantity -= quantity;
  movements.push({ id: movementIdCounter++, itemId: item.id, itemName: item.name, userId: 2, userName: 'Colaborador', type: MovementType.Out, quantity, timestamp: new Date() });
}

// Exports done as named functions above
