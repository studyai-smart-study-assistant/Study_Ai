
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id text, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: only admins can read roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role((auth.uid())::text, 'admin'));

-- Create api_key_usage table for logging
CREATE TABLE public.api_key_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service text NOT NULL,
    key_identifier text NOT NULL,
    endpoint text,
    status text NOT NULL DEFAULT 'success',
    error_code text,
    response_time_ms integer,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.api_key_usage ENABLE ROW LEVEL SECURITY;

-- Only admins can read usage logs
CREATE POLICY "Admins can view api usage"
ON public.api_key_usage FOR SELECT TO authenticated
USING (public.has_role((auth.uid())::text, 'admin'));

-- Service role can insert (edge functions)
CREATE POLICY "Service can insert usage logs"
ON public.api_key_usage FOR INSERT
WITH CHECK (true);
