import { NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/manual-attendance/check-existing?date=YYYY-MM-DD&session=morning
export async function GET(request: Request) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const session = searchParams.get('session');

    if (!date || !session) {
      return NextResponse.json({ exists: false, report: null });
    }

    const adminClient = createAdminClient();
    const { data: existingReport } = await adminClient
      .from('reports')
      .select(`
        id,
        timestamp,
        routine_activity,
        field_condition,
        locations(name)
      `)
      .eq('user_id', profile.id)
      .eq('session_type', session)
      .eq('report_date', date)
      .maybeSingle();

    if (existingReport) {
      return NextResponse.json({
        exists: true,
        report: existingReport,
      });
    }

    return NextResponse.json({ exists: false, report: null });
  } catch (error: any) {
    console.error('Check existing error:', error);
    return NextResponse.json({ exists: false, report: null });
  }
}
