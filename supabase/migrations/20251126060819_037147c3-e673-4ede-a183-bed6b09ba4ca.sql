-- Fix security warnings by setting search_path on functions

-- Update generate_quotation_number function with search_path
CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  year_part TEXT;
  sequence_num TEXT;
  next_num INTEGER;
BEGIN
  year_part := TO_CHAR(now(), 'YYYY');
  
  -- Get the next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(quotation_number FROM 10) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.quotations
  WHERE quotation_number LIKE 'ZEN-' || year_part || '-%';
  
  sequence_num := LPAD(next_num::TEXT, 4, '0');
  
  RETURN 'ZEN-' || year_part || '-' || sequence_num;
END;
$$;

-- Update update_updated_at_column function with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;