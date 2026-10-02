-- Migration 008: Fitur Absen Manual & Approval Admin
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. TABLE: manual_attendances
-- Menyimpan pengajuan presensi manual dari staff
-- =============================================
CREATE TABLE IF NOT EXISTS public.manual_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('morning', 'afternoon', 'evening', 'special')),
  actual_time TIME NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  location_name TEXT,
  routine_activity TEXT NOT NULL,
  incident_activity TEXT,
  field_condition TEXT,
  follow_up TEXT,
  reason TEXT NOT NULL, -- Alasan pengisian manual / terlambat
  replaces_report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL, -- Laporan yang akan digantikan (jika ada)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT, -- Catatan dari admin saat approval / penolakan
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 2. TABLE: manual_attendance_files
-- Menyimpan foto bukti dokumentasi absen manual
-- =============================================
CREATE TABLE IF NOT EXISTS public.manual_attendance_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manual_attendance_id UUID NOT NULL REFERENCES public.manual_attendances(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  drive_file_id TEXT,
  drive_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 3. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_manual_attendances_user_id ON public.manual_attendances(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_attendances_status ON public.manual_attendances(status);
CREATE INDEX IF NOT EXISTS idx_manual_attendances_date ON public.manual_attendances(report_date);
CREATE INDEX IF NOT EXISTS idx_manual_attendance_files_mid ON public.manual_attendance_files(manual_attendance_id);

-- =============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.manual_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_attendance_files ENABLE ROW LEVEL SECURITY;

-- Staff can view their own requests, admin can view all
CREATE POLICY "Users can view their own manual attendance requests"
  ON public.manual_attendances FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Staff can insert their own request
CREATE POLICY "Users can insert their own manual attendance requests"
  ON public.manual_attendances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can update status (approve/reject)
CREATE POLICY "Admins can update manual attendance requests"
  ON public.manual_attendances FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Files viewing policy
CREATE POLICY "Users can view files of accessible manual attendances"
  ON public.manual_attendance_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.manual_attendances ma
      WHERE ma.id = manual_attendance_files.manual_attendance_id
      AND (
        ma.user_id = auth.uid() 
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

-- Files insertion policy
CREATE POLICY "Users can insert files for their own manual attendances"
  ON public.manual_attendance_files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.manual_attendances ma
      WHERE ma.id = manual_attendance_files.manual_attendance_id
      AND ma.user_id = auth.uid()
    )
  );
