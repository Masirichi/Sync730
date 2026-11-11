# Sync730 Hub

> The work network for what comes next. Connect talent, recruiters, and opportunities in a human-centric platform.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (RBAC Auth & PostgreSQL)**.

---

## 🌟 Key Features

- **Public Showcase & Job Board**: High-impact landing page, searchable job listings, category filters, and detailed company profiles.
- **Candidate Portal**: Dashboard, application tracker, resume profile, skills inventory, interview schedules, and saved jobs.
- **Recruiter Workspace**: Job management, candidate pipeline tracking (Applied, Screening, Interview, Offer, Rejected), applicant review, and company profile editor.
- **Admin Management**: System overview, user management with role controls, job audit queue, and system activity logs.
- **Role-Based Access Control (RBAC)**: Secure authentication and row-level security (RLS) powered by Supabase with `candidate`, `recruiter`, and `admin` roles.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17+ or 20+
- npm / pnpm / yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Masirichi/Sync730.git
cd Sync730

# Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### Database Schema

Run the SQL migration script located at `supabase/schema.sql` in the Supabase SQL Editor to provision tables (`profiles`, `jobs`, `applications`, `audit_logs`), custom types, security triggers, and Row Level Security (RLS) policies.

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📦 Production Build

```bash
npm run build
npm run start
```
