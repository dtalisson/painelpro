
-- Create table to track login attempts for rate limiting
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  email TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- No public read access - only service role can access
-- Edge function will use service_role key

-- Index for fast lookups
CREATE INDEX idx_login_attempts_ip_time ON public.login_attempts(ip_address, attempted_at DESC);
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts(email, attempted_at DESC);

-- Auto-cleanup old records (older than 24h)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.login_attempts WHERE attempted_at < now() - interval '24 hours';
$$;
