-- Create enum for product status
CREATE TYPE public.product_status AS ENUM ('online', 'offline', 'maintenance');

-- Add status column to products table
ALTER TABLE public.products
ADD COLUMN status public.product_status NOT NULL DEFAULT 'online';