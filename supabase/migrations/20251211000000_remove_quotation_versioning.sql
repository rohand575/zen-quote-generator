-- Remove quotation versioning functionality

-- Drop the trigger first
DROP TRIGGER IF EXISTS create_version_on_update ON public.quotations;

-- Drop the function
DROP FUNCTION IF EXISTS public.create_quotation_version();

-- Drop indexes
DROP INDEX IF EXISTS public.idx_quotation_versions_quotation_id;
DROP INDEX IF EXISTS public.idx_quotation_versions_created_at;

-- Drop the table (this will also drop the RLS policies)
DROP TABLE IF EXISTS public.quotation_versions;
