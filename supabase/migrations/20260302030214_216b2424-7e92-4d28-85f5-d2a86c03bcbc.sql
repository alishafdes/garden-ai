
CREATE POLICY "Authenticated users can insert plants"
ON public.plants FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update plants"
ON public.plants FOR UPDATE
TO authenticated
USING (true);
