-- Create quotation_versions table to track all changes
CREATE TABLE public.quotation_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  quotation_data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quotation_id, version_number)
);

-- Enable RLS
ALTER TABLE public.quotation_versions ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Authenticated users can manage quotation versions" 
ON public.quotation_versions 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_quotation_versions_quotation_id ON public.quotation_versions(quotation_id);
CREATE INDEX idx_quotation_versions_created_at ON public.quotation_versions(created_at DESC);

-- Create function to automatically create version on quotation update
CREATE OR REPLACE FUNCTION public.create_quotation_version()
RETURNS TRIGGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Get the next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM public.quotation_versions
  WHERE quotation_id = NEW.id;
  
  -- Insert the version snapshot
  INSERT INTO public.quotation_versions (
    quotation_id,
    version_number,
    quotation_data,
    notes
  ) VALUES (
    NEW.id,
    next_version,
    row_to_json(NEW)::jsonb,
    'Auto-saved version'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-version on updates
CREATE TRIGGER create_version_on_update
AFTER UPDATE ON public.quotations
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION public.create_quotation_version();