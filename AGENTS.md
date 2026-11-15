# Sync730 Master Architecture & Positioning Rules

## PROJECT
Sync730, a job platform live at sync730.vercel.app (Vercel). Work inside the existing codebase and stack. Do not introduce a new framework, UI library or parallel system. Keep auth, dashboards and recruiter tools working.

---

## POSITIONING (Source of Truth)
- **Role Verification:** Sync730 verifies that a **ROLE IS REAL, OPEN, and ELIGIBLE FOR PEOPLE LIVING IN AFRICA**. Roles span customer support, software engineering and other tech roles, plus non-tech roles listed by recruiters and companies.
- **No Company/Outcome Guarantees:** Sync730 does **NOT** verify companies (no CAC/TIN) and does **NOT** guarantee payment, contracts, pay levels or hiring outcomes. Never imply otherwise.
- **Belief:** Where you live shouldn't decide what you can become. Talent is everywhere. Real opportunity should be too.
- **Audience:** African professionals tired of ghost jobs and "worldwide remote" that means "US only". Enemy: false hope, not any company. Secondary audience: recruiters and companies who hire on ability, not address.
- **Voice:** Direct, warm, short sentences. Never use `"empowering"`, `"age of AI"`, `"signal"`, `"seamless"`, `"cutting-edge"`, `"unlock"`.

---

## NAMING
- **"Kanban Tracker" / "Tracker" is now "SyncFlow".**
- **Stages:** `Saved`, `Applied`, `Interviewing`, `Offer`.

---

## ICON RULES (Strict)
- **BANNED:** Sparkle, star-burst, magic, wand, robot, bot, brain, circuit, CPU, "AI chip" icons; the glyphs `✦` and `✨`; ALL emoji in the UI (`📍`, `🌍`, `⭐`, `🔖`, etc.); AI-style purple-blue glow gradients and shimmer animations.
- **Icon Set:** Use ONE icon set: `lucide-react`. 2px stroke, round caps, sizes 16/18/20.
- **ALLOWED Icons:** `Search`, `MapPin`, `Check`/`BadgeCheck`, `Globe`, `Bookmark` (outline/filled), `ArrowRight`, `X`, `SlidersHorizontal`, `Columns3`, `Menu`, `Flag`, `Video`, `ChevronDown`, `Building2`, `Users`, `Briefcase`.
- **Badges:** "Featured" badge is text only. AI features are described in plain words with no AI-style icon.
- **Accessibility:** Decorative icons get `aria-hidden="true"`; icon-only buttons need an accessible name.

---

## COPY & DATA RULES
- **Visual Language:** Cream background, white cards, black pill buttons, rounded corners.
- **Dates & Recency:** Keep `"Posted N days ago"` as is. Do NOT add `"Verified N days ago"`. Do NOT add any footnote about pay or salary sourcing.
- **Banned Claims:** Never mention CAC, TIN, payroll, contracts, or `"pays on time"`.
- **Missing Salary:** Shows muted `"Salary not disclosed"`. Never `"$0"`, blank, or a number without a currency.
- **No Inventions:** Do not invent testimonials, partner names, statistics, founder stories, or process claims.
- **Unconfirmed Claims:** Lines marked `[CONFIRM]` are unverified claims. Render them only behind a flag `showUnconfirmedClaims` (default `false`).
- **Structured Content:** Marketing copy lives in structured content files (`src/content/*.ts`), not hard-coded in components.
- **Quality Gates:** Lint, typecheck, and build must pass at the end of every task. Commit when done.

---

## ROLE ISOLATION & DATA SECURITY
- Keep `(candidate)`, `(recruiter)`, and `(admin)` routes strictly isolated.
- In production, verify user roles via server-side checks or Next.js Middleware before rendering data.
- Candidate privacy: enforce candidate masking on recruiter queries unless an active row exists in `token_unlocks`.
