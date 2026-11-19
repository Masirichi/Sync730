// app/api/crawler/universal/route.ts
// Universal Jobs Crawler API endpoint
// Powers the live company careers & startup vacancies feeds on /find-work and /

import { NextRequest, NextResponse } from 'next/server';
import { runUniversalCareersCrawler, VERIFIED_COMPANY_BOARDS } from '@/lib/crawler/universal-careers-crawler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
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
