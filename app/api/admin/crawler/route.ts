import { NextRequest, NextResponse } from 'next/server';
import { crawlSources, JobCategory, JOB_CATEGORIES } from '@/lib/crawler';
import type { JobSource } from '@/lib/supabase/types';
import { assertServerPermission } from '@/lib/admin/permissions';
import { requireReason, recordDangerousAuditLog } from '@/lib/admin/audit';
import { getClientIp } from '@/lib/admin/security';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import { createBrowserClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    // 1. Permission check: Super admin & Moderator only
    const permission = await assertServerPermission(request, 'sources:manage');
    if (!permission.authorized) {
      return permission.response;
    }

    const { actor } = permission;
    const body = await request.json();
    const { reason, notes, source, category } = body;

    // 2. Server-side Reason Enforcement (min 10 characters)
    let validatedReason: string;
    try {
      validatedReason = requireReason(reason || notes, 10);
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          error: err.message || 'A valid reason of at least 10 characters is required to trigger the crawler.',
        },
        { status: 400 }
      );
    }

    const targetSource = (source as JobSource | 'all') || 'all';
    const targetCategory = (category as JobCategory | 'all') || 'all';

    // 3. Execute Multi-Source Crawler
    const { jobs, sourceCounts, categoryCounts, locationStats, crawledAt } =
      await crawlSources({
        source: targetSource,
        category: targetCategory,
      });

    // 4. Ingest as needs-review and hidden (is_active: false)
    try {
      const supabase = getServiceRoleClient() || createBrowserClient();
      const supabasePayload = jobs.map((j: any) => ({
        external_id: j.external_id,
        title: j.title,
        company: j.company || j.company_name,
        company_logo: j.company_logo || null,
        description: j.description || '',
        category: j.category || 'Other',
        job_type: j.job_type || 'full-time',
        candidate_required_location: j.candidate_required_location || 'Worldwide',
        location_tier: j.location_tier || 'Worldwide',
        salary: j.salary || null,
        url: j.apply_url || j.url || j.source_url || '#',
        source: j.source || 'crawler',
        tags: j.tags || [],
        eligibility: j.eligibility || { scope: 'africa_wide', countries: [] },
        role_verified_at: null,
        review_status: 'needs-review',
        status: 'needs_review',
        source_type: 'CRAWLER',
        is_active: false,
        is_featured: false,
        updated_at: new Date().toISOString(),
      }));

      await supabase
        .from('remote_jobs')
        .upsert(supabasePayload, { onConflict: 'external_id' });
    } catch (dbErr) {
      console.warn('Crawler database upsert notice:', dbErr);
    }

    // 5. Append-only Audit Log
    await recordDangerousAuditLog({
      actor_id: actor.id,
      actor_name: actor.name,
      action: 'TRIGGER_CRAWLER',
      target_type: 'REMOTE_JOB_CRAWLER',
      target_id: `crawl-${Date.now()}`,
      target_label: `Multi-Source Remote Crawl (${targetSource})`,
      reason: validatedReason,
      before: { publicly_visible: false },
      after: {
        total_crawled: jobs.length,
        default_status: 'needs_review',
        is_active: false,
        publicly_visible: false,
      },
      ip: getClientIp(request),
    });

    return NextResponse.json({
      success: true,
      crawled_at: crawledAt,
      total_processed: jobs.length,
      default_status: 'needs_review',
      is_active: false,
      publicly_visible: false,
      sources_summary: sourceCounts,
      categories_summary: categoryCounts,
      message: `Successfully crawled ${jobs.length} roles. All placed in needs_review queue (hidden from public).`,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/crawler POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to trigger crawler' },
      { status: 500 }
    );
  }
}
