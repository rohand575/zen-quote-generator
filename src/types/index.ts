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

export interface QuotationLineItem {
  item_id: string;
  quantity: number;
  unit_price: number;
  total: number;
}
