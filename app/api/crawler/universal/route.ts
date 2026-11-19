// app/api/crawler/universal/route.ts
// Universal Jobs Crawler API endpoint
// Internal/Admin & System Cron only - Public access is strictly forbidden.

import { NextRequest, NextResponse } from 'next/server';
import { runUniversalCareersCrawler, VERIFIED_COMPANY_BOARDS } from '@/lib/crawler/universal-careers-crawler';
import { assertServerPermission } from '@/lib/admin/permissions';

export const dynamic = 'force-dynamic';

async function checkCrawlerAccess(req: NextRequest): Promise<{ authorized: boolean; error?: string }> {
  // 1. Allow Vercel Cron or secret-authenticated callers
  const authHeader = req.headers.get('authorization');
  const crawlerSecret = req.headers.get('x-crawler-secret');
  const configuredSecret = process.env.CRON_SECRET || process.env.CRAWLER_SECRET;

  if (configuredSecret && (authHeader === `Bearer ${configuredSecret}` || crawlerSecret === configuredSecret)) {
    return { authorized: true };
  }

  // 2. Allow authenticated administrators with 'sources:manage' permission
  const perm = await assertServerPermission(req, 'sources:manage');
  if (perm.authorized) {
    return { authorized: true };
  }

  return {
    authorized: false,
    error: 'Access denied: Universal crawler execution and direct access is restricted to administrators and system cron.',
  };
}

export async function GET(req: NextRequest) {
  const access = await checkCrawlerAccess(req);
  if (!access.authorized) {
    return NextResponse.json(
      { success: false, error: access.error },
      { status: 403 }
    );
  }

  try {
    const report = await runUniversalCareersCrawler();

    return NextResponse.json(
      {
        success: true,
        message: `Successfully crawled ${report.boardsChecked} company ATS career boards for remote roles open to Africa.`,
        crawled_at: report.timestamp,
        boards_checked: report.boardsChecked,
        total_roles: report.totalRolesFound,
        startup_roles: report.startupRolesFound,
        active_boards: VERIFIED_COMPANY_BOARDS.map((b) => ({
          name: b.name,
          ats: b.ats,
          website: b.website,
          is_startup: b.isStartup,
        })),
        jobs: report.openToAfricaRoles,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err: any) {
    console.error('Universal jobs crawler GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to crawl company career pages' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const access = await checkCrawlerAccess(req);
  if (!access.authorized) {
    return NextResponse.json(
      { success: false, error: access.error },
      { status: 403 }
    );
  }

  try {
    const report = await runUniversalCareersCrawler();

    return NextResponse.json({
      success: true,
      message: `Crawl completed. Indexed ${report.totalRolesFound} vacancies across ${report.boardsChecked} company boards (${report.startupRolesFound} startup vacancies).`,
      crawled_at: report.timestamp,
      total_roles: report.totalRolesFound,
      startup_roles: report.startupRolesFound,
      jobs: report.openToAfricaRoles,
    });
  } catch (err: any) {
    console.error('Universal jobs crawler POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to trigger universal crawler' },
      { status: 500 }
    );
  }
}
