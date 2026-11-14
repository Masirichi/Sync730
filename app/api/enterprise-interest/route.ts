// app/api/enterprise-interest/route.ts
// Server handler for Enterprise Interest requests

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const ipRateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = ipRateMap.get(ip);

  if (!record || now > record.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }

  if (record.count >= 5) {
    return true;
  }

  record.count += 1;
  return false;
}

const BACKUP_FILE = path.join(process.cwd(), '.sync730-enterprise-interest.json');

function saveToBackup(data: any) {
  try {
    let list: any[] = [];
    if (fs.existsSync(BACKUP_FILE)) {
      list = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));
    }
    list.push(data);
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write enterprise interest backup:', err);
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a few minutes before submitting again.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const {
      name,
      work_email,
      company,
      company_size,
      use_cases,
      message,
      consent,
      website_hp,
    } = body;

    if (website_hp) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
    }

    const fieldErrors: Record<string, string> = {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      fieldErrors.name = 'Full name is required';
    }

    if (!work_email || typeof work_email !== 'string' || !work_email.trim()) {
      fieldErrors.work_email = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(work_email.trim())) {
      fieldErrors.work_email = 'Please provide a valid work email';
    }

    if (!company || typeof company !== 'string' || !company.trim()) {
      fieldErrors.company = 'Company name is required';
    }

    if (!company_size || typeof company_size !== 'string' || !company_size.trim()) {
      fieldErrors.company_size = 'Please select company size';
    }

    if (!use_cases || typeof use_cases !== 'string' || !use_cases.trim()) {
      fieldErrors.use_cases = 'Please describe your organization use case';
    }

    if (!consent) {
      fieldErrors.consent = 'You must agree to the Privacy Policy to proceed';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json(
        { error: 'Please correct the highlighted errors.', fields: fieldErrors },
        { status: 422 }
      );
    }

    const payload = {
      id: `ent-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      work_email: work_email.trim().toLowerCase(),
      company: company.trim(),
      company_size: company_size.trim(),
      use_cases: use_cases.trim(),
      message: message ? message.trim() : null,
      consent_given: Boolean(consent),
      ip_address: ip,
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = await createServerClient();
      await supabase.from('enterprise_interest').insert([payload]);
    } catch {
      // Fallback persists to disk
    }

    saveToBackup(payload);

    const notifyEmail = process.env.DEMO_NOTIFY_EMAIL;
    if (notifyEmail) {
      console.log(`[ENTERPRISE NOTIFICATION] Notification queued for ${notifyEmail}: New enterprise inquiry from ${payload.name} (${payload.work_email}) at ${payload.company}`);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your interest! Our enterprise solutions team will reach out shortly.',
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
