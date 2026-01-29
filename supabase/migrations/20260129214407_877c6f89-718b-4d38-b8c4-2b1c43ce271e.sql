-- Drop the foreign key constraint before changing column type
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_seller_id_fkey;

-- Change seller_id column from UUID to TEXT to store seller names
ALTER TABLE public.orders 
ALTER COLUMN seller_id TYPE TEXT;