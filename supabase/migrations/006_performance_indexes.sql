-- Migration 006: High Performance Indexes for Instant Query Execution
-- Run this in Supabase SQL Editor

CREATE INDEX IF NOT EXISTS idx_reports_report_date_session ON public.reports (report_date, session_type);
CREATE INDEX IF NOT EXISTS idx_reports_user_report_date ON public.reports (user_id, report_date);
CREATE INDEX IF NOT EXISTS idx_reports_timestamp_desc ON public.reports (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reports_location_id ON public.reports (location_id);
CREATE INDEX IF NOT EXISTS idx_report_files_report_id ON public.report_files (report_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON public.profiles (role, status);
