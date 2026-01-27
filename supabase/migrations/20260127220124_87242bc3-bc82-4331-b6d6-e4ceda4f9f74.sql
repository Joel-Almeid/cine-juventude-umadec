-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'cancelled', 'used');

-- Create enum for product types
CREATE TYPE public.product_type AS ENUM ('single', 'combo_individual', 'combo_couple');

-- Create sellers table (vendedores)
CREATE TABLE public.sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    total_sales INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create orders table (vendas)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_whatsapp TEXT NOT NULL,
    seller_id UUID REFERENCES public.sellers(id),
    product_type product_type NOT NULL,
    product_name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status order_status DEFAULT 'paid',
    receipt_url TEXT,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create settings table for lot configuration
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

-- Enable RLS
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Public read access for sellers (vendedores list)
CREATE POLICY "Sellers are viewable by everyone"
ON public.sellers FOR SELECT
USING (true);

-- Public insert access for orders (anyone can buy)
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
WITH CHECK (true);

-- Public read access for orders (needed for ticket display)
CREATE POLICY "Orders are viewable by everyone"
ON public.orders FOR SELECT
USING (true);

-- Public read access for settings
CREATE POLICY "Settings are viewable by everyone"
ON public.settings FOR SELECT
USING (true);

-- Storage policies for receipts
CREATE POLICY "Anyone can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Receipts are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

-- Insert initial settings
INSERT INTO public.settings (key, value) VALUES 
('tickets_sold', '15'),
('tickets_total', '100'),
('pix_key', 'cinejuventude@email.com'),
('pix_name', 'CINE JUVENTUDE');

-- Insert initial sellers
INSERT INTO public.sellers (name) VALUES 
('João Silva'),
('Maria Santos'),
('Pedro Oliveira'),
('Ana Costa'),
('Lucas Ferreira'),
('Julia Almeida'),
('Gabriel Souza'),
('Beatriz Lima');

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;