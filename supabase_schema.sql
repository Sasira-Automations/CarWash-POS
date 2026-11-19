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

