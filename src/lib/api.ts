import { supabase } from '@/integrations/supabase/client';

// Re-export LineItem from types
export type { LineItem } from '@/types';

// Clients API
export const clientsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  create: async (client: any) => {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, client: any) => {
    const { data, error } = await supabase
      .from('clients')
      .update(client)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error} = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Items API
export const itemsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  create: async (item: any) => {
    const { data, error } = await supabase
      .from('items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, item: any) => {
    const { data, error } = await supabase
      .from('items')
      .update(item)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Quotations API
export const quotationsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        client:clients(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('quotations')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  create: async (quotation: any) => {
    // Generate quotation number
    const { data: quotationNumber, error: numberError } = await supabase
      .rpc('generate_quotation_number');
    
    if (numberError) throw numberError;

    const { data, error } = await supabase
      .from('quotations')
      .insert({
        ...quotation,
        quotation_number: quotationNumber,
      })
      .select(`
        *,
        client:clients(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  update: async (id: string, quotation: any) => {
    const { data, error } = await supabase
      .from('quotations')
      .update(quotation)
      .eq('id', id)
      .select(`
        *,
        client:clients(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('quotations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};
