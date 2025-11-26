export interface LineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  itemId?: string;
}
