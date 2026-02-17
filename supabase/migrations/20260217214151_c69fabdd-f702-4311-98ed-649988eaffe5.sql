
-- Create logs table for tracking downloads, HWID resets, and app launches
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'download', 'hwid_reset', 'app_launch'
  license_key TEXT,
  software_name TEXT,
  hwid TEXT,
  ip_address TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read logs
CREATE POLICY "Admins can read logs"
ON public.activity_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow insert from edge functions (service role) and anon for public endpoints
CREATE POLICY "Service can insert logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (true);

-- Index for performance
CREATE INDEX idx_activity_logs_event_type ON public.activity_logs(event_type);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
