-- Migration 005: Add 'special' to session_type check constraint in Supabase SQL Editor
-- Run this in Supabase SQL Editor

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_session_type_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_session_type_check CHECK (session_type IN ('morning', 'afternoon', 'evening', 'special'));

-- Drop original strict unique constraint that only allowed 1 report per session per date
-- and replace with partial unique index only for routine sessions (morning, afternoon, evening),
-- allowing multiple incidental 'special' reports per day.
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_user_id_session_type_report_date_key;
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_routine_session_date ON public.reports (user_id, session_type, report_date) WHERE session_type IN ('morning', 'afternoon', 'evening');
