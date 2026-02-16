
-- Create storage bucket for product downloads
INSERT INTO storage.buckets (id, name, public) VALUES ('downloads', 'downloads', true);

-- Anyone can download files (public read)
CREATE POLICY "Public can download files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'downloads');

-- Only admins can upload
CREATE POLICY "Admins can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'downloads' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'downloads' AND public.has_role(auth.uid(), 'admin'));

-- Admins can update
CREATE POLICY "Admins can update files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'downloads' AND public.has_role(auth.uid(), 'admin'));
