export type InventoryCategory =
  | 'LINEN'
  | 'TOILETRY'
  | 'FOOD_BEVERAGE'
  | 'CLEANING'
  | 'MAINTENANCE'
  | 'OFFICE'
  | 'OTHER';

export interface ItemResponse {
  id: number;
  itemCode: string;
  name: string;
  category: InventoryCategory;
  description?: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  unitCost: number;
  active: boolean;
  lowStock?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateItemRequest {
  name: string;
  category: InventoryCategory;
  description?: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  unitCost: number;
}

export interface UpdateItemRequest {
  name?: string;
  category?: InventoryCategory;
  description?: string;
  minThreshold?: number;
  unit?: string;
  unitCost?: number;
  active?: boolean;
}

export type MovementType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';

export interface StockMovementResponse {
  id: number;
  itemId: number;
  itemName?: string;
  movementType: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceNumber?: string;
  reason?: string;
  timestamp: string;
}

export interface StockMovementRequest {
  quantity: number;
  reason?: string;
  referenceNumber?: string;
}

export interface ReorderRuleResponse {
  id: number;
  itemId: number;
  itemName?: string;
  reorderQuantity: number;
  autoReorder: boolean;
  preferredSupplierId?: number;
  createdAt?: string;
}

export interface ReorderRuleRequest {
  itemId: number;
  reorderQuantity: number;
  autoReorder: boolean;
  preferredSupplierId?: number;
}
