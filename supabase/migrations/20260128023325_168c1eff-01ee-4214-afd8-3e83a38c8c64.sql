-- Add policy to allow deleting orders (for admin cleanup)
CREATE POLICY "Anyone can delete orders"
ON public.orders
FOR DELETE
USING (true);

-- Add policy to allow updating orders (for cancellation and check-in)
CREATE POLICY "Anyone can update orders"
ON public.orders
FOR UPDATE
USING (true);

-- Add policies for sellers management
CREATE POLICY "Anyone can insert sellers"
ON public.sellers
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update sellers"
ON public.sellers
FOR UPDATE
USING (true);