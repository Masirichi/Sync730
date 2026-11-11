import { NextRequest, NextResponse } from 'next/server';
import {
  CandidateResumeProfile,
  DEFAULT_CANDIDATE_RESUME_PROFILE,
  TURNKEY_INFRASTRUCTURE_STATEMENT,
  generateTemplateResume,
} from '@/lib/resume/tailorer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      job_title,
      company_name,
      job_description,
      job_location,
      job_tags,
      candidate_profile,
    } = body;

    if (!job_title) {
      return NextResponse.json(
        { success: false, error: 'job_title is required' },
        { status: 400 }
      );
    }

    const title = job_title.trim();
    const company = (company_name || 'Hiring Partner').trim();
    const description = (job_description || '').trim();
    const tags = Array.isArray(job_tags) ? job_tags : [];
    const profile: CandidateResumeProfile = {
      ...DEFAULT_CANDIDATE_RESUME_PROFILE,
      ...(candidate_profile || {}),
    };

    let generatedMarkdown: string | null = null;
    let modelUsed = 'template_engine';

    // 1. Try Gemini API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && !geminiKey.includes('your_gemini_key')) {
      try {
        const prompt = `You are a Principal ATS Resume Specialist and Executive Recruiter.
Tailor an executive, ATS-compliant, high-converting Markdown resume for this candidate applying to the specified remote role.

## Target Job Details
- Title: ${title}
- Company: ${company}
- Location: ${job_location || 'Remote'}
- Required Tech / Tags: ${tags.join(', ')}
- Job Description Snippet:
${description.slice(0, 2500) || 'Full remote autonomy, strong engineering and product ownership, excellent communication.'}

## Candidate Profile
- Name: ${profile.fullName}
- Contact: ${profile.email} | ${profile.phone} | ${profile.location}
- Experience: ${profile.yearsExperience}+ years
- Summary: ${profile.professionalSummary}
- Core Skills: ${profile.coreSkills.join(', ')}
- Tools: ${profile.toolsAndPlatforms.join(', ')}

${
  profile.includeTurnkeyInfrastructure
    ? `## Turnkey Candidate Infrastructure Statement (Nigeria/Global South Vetted):\n${TURNKEY_INFRASTRUCTURE_STATEMENT}`
    : ''
}

## Strict Formatting Rules:
1. Output ONLY clean Markdown format.
2. Structure with # Candidate Name, ## PROFESSIONAL SUMMARY, ## CORE COMPETENCIES & TECHNICAL EXPERTISE, ## PROFESSIONAL WORK EXPERIENCE, ## EDUCATION & CERTIFICATIONS.
3. If Turnkey Infrastructure is provided, prominently embed a section ## VERIFIED TURNKEY REMOTE INFRASTRUCTURE to guarantee uninterrupted power, internet, and timezone reliability.
4. Align keywords and bullet points specifically to ${title} at ${company}.
5. Quantify achievements with metrics (e.g. 45% LCP boost, 99.9% uptime, 50+ tickets/day).
6. Do NOT include generic conversational preamble or markdown code fences; return raw markdown directly.`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
            signal: AbortSignal.timeout(3500),
          }
        );

        if (res.ok) {
          const data = await res.json();
          let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim().length > 100) {
            // Strip code fence if model wrapped in ```markdown
            text = text.replace(/^```(?:markdown)?\n/i, '').replace(/\n```$/i, '').trim();
            generatedMarkdown = text;
            modelUsed = 'gemini-1.5-flash';
          }
        }
      } catch (geminiErr) {
        console.warn('Notice: Gemini API tailoring call timed out or failed:', geminiErr);
      }
    }

    // 2. Try OpenAI API fallback if present
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!generatedMarkdown && openaiKey && !openaiKey.includes('your_openai_key')) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert ATS resume writer. Output ONLY clean Markdown formatted resume without conversational remarks.',
              },
              {
                role: 'user',
                content: `Tailor a resume for: ${title} at ${company}. Candidate: ${profile.fullName}, ${profile.yearsExperience} yrs exp. Skills: ${profile.coreSkills.join(', ')}. Include Turnkey remote infrastructure: ${profile.includeTurnkeyInfrastructure}`,
              },
            ],
            temperature: 0.3,
          }),
          signal: AbortSignal.timeout(3500),
        });

        if (res.ok) {
          const resData = await res.json();
          let text = resData.choices?.[0]?.message?.content;
          if (text && text.trim().length > 100) {
            text = text.replace(/^```(?:markdown)?\n/i, '').replace(/\n```$/i, '').trim();
            generatedMarkdown = text;
            modelUsed = 'gpt-4o-mini';
          }
        }
      } catch (openaiErr) {
        console.warn('Notice: OpenAI API tailoring call failed:', openaiErr);
      }
    }

    // 3. High-Fidelity Local Template Engine Fallback
    if (!generatedMarkdown) {
      generatedMarkdown = generateTemplateResume(
        {
          title,
          company,
          description,
          location: job_location,
          tags,
        },
        profile
      );
      modelUsed = 'ats-tailorer-engine';
    }

    // Calculate simulated ATS match score (91% - 98%)
    const matchScore = Math.min(98, Math.max(91, 88 + (tags.length > 0 ? 6 : 4)));

    return NextResponse.json({
      success: true,
      markdown: generatedMarkdown,
      match_score: matchScore,
      model_used: modelUsed,
      job: {
        title,
        company,
      },
    });
  } catch (error: any) {
    console.error('Resume generation endpoint error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate tailored resume' },
      { status: 500 }
    );
  }
}
