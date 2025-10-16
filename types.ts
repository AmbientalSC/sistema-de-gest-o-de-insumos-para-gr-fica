
export enum Role {
  Manager = 'GESTOR',
  Collaborator = 'COLABORADOR',
}

export interface User {
  id: number;
  name: string;
  username: string;
  password?: string; // Should not be sent to frontend in real app
  role: Role;
}

export interface Item {
  id: number;
  name: string;
  barcode: string;
  description: string;
  unitOfMeasure: 'Folha' | 'Kg' | 'Litro' | 'Unidade';
  quantity: number;
  minQuantity: number;
  supplier?: string;
  location: string;
}

export enum MovementType {
  In = 'ENTRADA',
  Out = 'SAÍDA',
}

export interface StockMovement {
  id: number;
  itemId: number;
  itemName: string;
  userId: number;
  userName: string;
  type: MovementType;
  quantity: number;
  timestamp: Date;
}
