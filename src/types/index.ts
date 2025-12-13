export interface LineItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  itemId?: string;
  costPrice?: number;
  margin?: number;
}

export interface QuotationLineItem {
  item_id: string;
  name?: string;
  description?: string;
  notes?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  total: number;
  cost_price?: number;
  margin?: number;
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
  cost_price?: number;
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
  payment_status?: string;
  amount_paid?: number;
  payment_date?: string;
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

export interface Goal {
  id: string;
  goal_type: 'revenue' | 'conversion_rate';
  target_value: number;
  period_type: 'monthly' | 'quarterly' | 'yearly';
  period_start: string;
  period_end: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalProgress {
  goal: Goal;
  current_value: number;
  progress_percentage: number;
  status: 'on-track' | 'behind' | 'achieved' | 'not-started';
  days_remaining: number;
}
