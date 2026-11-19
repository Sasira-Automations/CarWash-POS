-- ========================================================
-- SPARKLE / WASHFLOW SUPABASE DATABASE SCHEMA
-- For ESP32-CAM Vehicle Detection & Dashboard Realtime Sync
-- ========================================================

-- ESP32-CAM capture metadata
CREATE TABLE IF NOT EXISTS public.vehicle_captures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_path TEXT NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    vehicle_class TEXT NOT NULL CHECK (
        vehicle_class IN ('bus', 'motorcycle', 'car', 'truck')
    )
);

CREATE INDEX IF NOT EXISTS idx_vehicle_captures_timestamp
ON public.vehicle_captures (captured_at DESC);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.vehicle_captures ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for Dashboard frontend)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vehicle_captures' AND policyname = 'Allow public read access'
    ) THEN
        CREATE POLICY "Allow public read access"
        ON public.vehicle_captures
        FOR SELECT
        TO public
        USING (true);
    END IF;
END $$;

-- Allow public insert access (for ESP32-CAM & Backend API)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vehicle_captures' AND policyname = 'Allow public insert access'
    ) THEN
        CREATE POLICY "Allow public insert access"
        ON public.vehicle_captures
        FOR INSERT
        TO public
        WITH CHECK (true);
    END IF;
END $$;

-- Allow public update access (for Bay status updates)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'vehicle_captures' AND policyname = 'Allow public update access'
    ) THEN
        CREATE POLICY "Allow public update access"
        ON public.vehicle_captures
        FOR UPDATE
        TO public
        USING (true);
    END IF;
END $$;

-- 3. Enable Realtime on the table (Safe if already added)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'vehicle_captures'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_captures;
    END IF;
END $$;

-- 4. Storage Bucket for ESP32-CAM Captured Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-captures', 'vehicle-captures', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public image access'
    ) THEN
        CREATE POLICY "Public image access" 
        ON storage.objects FOR SELECT 
        TO public 
        USING (bucket_id = 'vehicle-captures');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Allow ESP32-CAM image upload'
    ) THEN
        CREATE POLICY "Allow ESP32-CAM image upload" 
        ON storage.objects FOR INSERT 
        TO public 
        WITH CHECK (bucket_id = 'vehicle-captures');
    END IF;
END $$;

-- 5. Storage Bucket for User Profile Avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public avatar access'
    ) THEN
        CREATE POLICY "Public avatar access" 
        ON storage.objects FOR SELECT 
        TO public 
        USING (bucket_id = 'avatars');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Allow authenticated users to upload avatars'
    ) THEN
        CREATE POLICY "Allow authenticated users to upload avatars" 
        ON storage.objects FOR INSERT 
        TO public 
        WITH CHECK (bucket_id = 'avatars');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Allow authenticated users to update avatars'
    ) THEN
        CREATE POLICY "Allow authenticated users to update avatars" 
        ON storage.objects FOR UPDATE 
        TO public 
        USING (bucket_id = 'avatars');
    END IF;
END $$;

-- ========================================================
-- 6. AUDIT LOGGING SCHEMA & POLICIES
-- Tracks authentication, financial, and operational events
-- ========================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_email TEXT,
    action TEXT NOT NULL,
    category TEXT NOT NULL CHECK (
        category IN ('auth', 'security', 'pos', 'services', 'expenses', 'settings', 'operations')
    ),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimized indexes for fast audit log search & timeline filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
ON public.audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_category
ON public.audit_logs (category);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
ON public.audit_logs (action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email
ON public.audit_logs (user_email);

-- Enable Row Level Security (RLS) on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Allow authenticated staff & dashboard users to insert audit logs
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow log insert access" ON public.audit_logs;
    DROP POLICY IF EXISTS "Allow authenticated log insert" ON public.audit_logs;
    CREATE POLICY "Allow authenticated log insert"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
END $$;

-- 2. Allow anon clients to record pre-auth security events (failed login, rate limit lockout)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow anon auth security log insert" ON public.audit_logs;
    CREATE POLICY "Allow anon auth security log insert"
    ON public.audit_logs
    FOR INSERT
    TO anon
    WITH CHECK (category IN ('auth', 'security'));
END $$;

-- 3. Restrict reading audit logs strictly to authenticated users (protect sensitive audit logs from public)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow log read access" ON public.audit_logs;
    DROP POLICY IF EXISTS "Allow authenticated log read access" ON public.audit_logs;
    CREATE POLICY "Allow authenticated log read access"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (true);
END $$;

-- 4. Audit Log Immutability:
-- No UPDATE or DELETE policies are granted, ensuring audit trails are strictly append-only.

-- Enable Realtime publication for audit_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'audit_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
    END IF;
END $$;

-- ========================================================
-- 7. SECURITY, RATE LIMITING & PASSWORD HASHING NOTES
-- ========================================================
-- PASSWORD HASHING:
-- Supabase Auth automatically encrypts and hashes all passwords 
-- using the industry-standard bcrypt algorithm (cost factor 10) 
-- via pgcrypto / GoTrue before saving into auth.users.encrypted_password.
-- Passwords are never stored or transmitted in plain text.
--
-- TWO-FACTOR AUTHENTICATION (2FA / MFA):
-- Supabase Auth native MFA (TOTP) stores factors in auth.mfa_factors
-- and challenges in auth.mfa_challenges. Assurance levels:
--   aal1: Standard password or OAuth login
--   aal2: Verified with 2FA TOTP Authenticator (Google Authenticator, Authy, etc.)
--
-- RATE LIMITING:
-- Server-side brute force rate limiting is enforced by Supabase GoTrue Auth:
--   - Default: 30 requests per minute per IP on /auth/v1/token (password login)
--   - Configurable in Supabase Dashboard -> Authentication -> Rate Limits
-- Application-level rate limiting locks attempts after 5 consecutive failures
-- with exponential or 5-minute cooldown.


