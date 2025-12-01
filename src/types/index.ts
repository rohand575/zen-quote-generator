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

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  tax_id?: string;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  unit: string;
  unit_price: number;
  category?: string;
  created_at: string;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  client_id: string;
  project_title: string;
  project_description?: string;
  line_items: any;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  status: string;
  valid_until?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  line_items: QuotationLineItem[];
  notes?: string;
  tax_rate: number;
  created_at: string;
  updated_at: string;
}
