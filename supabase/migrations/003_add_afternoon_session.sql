-- Migration 003: Add 'afternoon' to session_type check constraint in Supabase SQL Editor
-- Run this in Supabase SQL Editor

ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_session_type_check;
ALTER TABLE public.reports ADD CONSTRAINT reports_session_type_check CHECK (session_type IN ('morning', 'afternoon', 'evening'));
