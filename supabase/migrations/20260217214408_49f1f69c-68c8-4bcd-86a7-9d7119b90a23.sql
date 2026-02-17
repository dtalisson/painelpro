
-- Drop the overly permissive insert policy
DROP POLICY "Service can insert logs" ON public.activity_logs;

-- Edge functions use service_role key which bypasses RLS, so no INSERT policy needed for anon
-- Only allow admins to insert (for manual log entries if needed)
CREATE POLICY "Admins can insert logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
