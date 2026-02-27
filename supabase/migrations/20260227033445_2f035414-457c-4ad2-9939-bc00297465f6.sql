
-- Create storage bucket for plant photos
INSERT INTO storage.buckets (id, name, public) VALUES ('plant-photos', 'plant-photos', true);

-- Allow authenticated users to upload photos
CREATE POLICY "Users can upload plant photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'plant-photos' AND auth.uid() IS NOT NULL);

-- Allow public read access
CREATE POLICY "Plant photos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'plant-photos');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own plant photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'plant-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
