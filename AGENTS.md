# Sync730 Core Architecture Rules

## Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Shadcn UI
- Lucide React
- Supabase (`@supabase/ssr`)

## Role Isolation
- Keep `(candidate)`, `(recruiter)`, and `(admin)` routes strictly isolated.
- Always verify `user_profiles.role` via server-side checks or Next.js Middleware before rendering data.
- Unauthenticated users must be redirected to `/login`.
- Users attempting to access portals outside their assigned role must be redirected to their authorized dashboard.

## Data Privacy
- Enforce candidate masking (`is_masked = TRUE`) on all recruiter queries unless an active row exists in `token_unlocks`.
- When masked: candidate names, direct emails, phone numbers, and full resume links are obfuscated or replaced with anonymized placeholders (e.g. `Candidate #ID`, hidden contact details) until unlocked with tokens.

## Git Discipline
- Always create and switch to a new feature branch (e.g., `git checkout -b feat/sprint-1-crawler` or `feat/...`) before generating or modifying code.
- Commit clean, atomic commits with descriptive commit messages.

## UI/UX Standard
- Build responsive, mobile-first interfaces optimized for low-bandwidth cellular connections.
- Avoid heavy unoptimized assets, prioritize SVG icons (Lucide React), optimized CSS, and fast first contentful paint (FCP).
