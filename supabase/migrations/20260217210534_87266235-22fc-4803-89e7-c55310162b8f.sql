-- Create app_status table
CREATE TABLE public.app_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'online',
  current_version TEXT NOT NULL DEFAULT '1.0',
  min_version TEXT NOT NULL DEFAULT '1.0',
  maintenance BOOLEAN NOT NULL DEFAULT false,
  message TEXT,
  message_online TEXT,
  message_offline TEXT,
  message_update_required TEXT,
  message_maintenance TEXT,
  download_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_status ENABLE ROW LEVEL SECURITY;

-- Public read access (for the API endpoint)
CREATE POLICY "Anyone can read app status"
ON public.app_status FOR SELECT
USING (true);

-- Admin-only write access
CREATE POLICY "Admins can insert app status"
ON public.app_status FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update app status"
ON public.app_status FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete app status"
ON public.app_status FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamp
CREATE TRIGGER update_app_status_updated_at
BEFORE UPDATE ON public.app_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();