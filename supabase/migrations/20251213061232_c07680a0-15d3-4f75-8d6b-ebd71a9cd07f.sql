-- Add payment tracking to quotations table
ALTER TABLE public.quotations
ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'
CHECK (payment_status IN ('unpaid', 'partially_paid', 'paid'));

-- Add optional fields for payment tracking
ALTER TABLE public.quotations
ADD COLUMN amount_paid NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN payment_date TIMESTAMPTZ;

-- Create index for payment_status for efficient filtering
CREATE INDEX idx_quotations_payment_status ON public.quotations(payment_status);

-- Add comment for documentation
COMMENT ON COLUMN public.quotations.payment_status IS 'Payment status: unpaid, partially_paid, or paid';
COMMENT ON COLUMN public.quotations.amount_paid IS 'Amount paid towards the quotation total';
COMMENT ON COLUMN public.quotations.payment_date IS 'Date when payment was completed (for paid status)';