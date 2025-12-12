-- Add cost_price column to items table for profit margin tracking
ALTER TABLE public.items
ADD COLUMN cost_price NUMERIC DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN public.items.cost_price IS 'Cost price of the item for profit margin calculation';
