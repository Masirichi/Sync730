export interface CandidateResumeProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl?: string;
  githubOrPortfolio?: string;
  yearsExperience: number;
  coreSkills: string[];
  toolsAndPlatforms: string[];
  professionalSummary: string;
  includeTurnkeyInfrastructure: boolean;
}

export const DEFAULT_CANDIDATE_RESUME_PROFILE: CandidateResumeProfile = {
  fullName: 'Jane Doe',
  email: 'jane.doe@sync730.com',
  phone: '+234 812 345 6789',
  location: 'Lagos, Nigeria (Available for US/UK/EU Remote)',
  linkedinUrl: 'https://linkedin.com/in/sync730-candidate',
  githubOrPortfolio: 'https://github.com/sync730-candidate',
  yearsExperience: 5,
  coreSkills: [
    'Frontend Architecture',
    'Next.js & React 18/19',
    'TypeScript & Modern JavaScript',
    'Tailwind CSS & Responsive Design',
    'REST APIs & GraphQL Integration',
    'State Management (Zustand, React Query)',
    'Performance Optimization (Core Web Vitals, LCP)',
  ],
  toolsAndPlatforms: [
    'Next.js',
    'React',
    'TypeScript',
    'Tailwind CSS',
    'Git & GitHub Actions',
    'Supabase & PostgreSQL',
    'Vercel & Docker',
  ],
  professionalSummary:
    'High-velocity Senior Frontend & Full Stack Engineer with 5+ years of remote experience designing resilient, mobile-first web applications. Proven track record of improving Largest Contentful Paint (LCP) by 45%, building scalable design systems, and maintaining 99.9% uptime across asynchronous global teams.',
  includeTurnkeyInfrastructure: true,
};

export const TURNKEY_INFRASTRUCTURE_STATEMENT = `VERIFIED TURNKEY REMOTE INFRASTRUCTURE (Vetted & Guaranteed):
- Power Redundancy: 3.5kVA Hybrid Solar Inverter with 200Ah Lithium Backup (14h+ continuous power runtime)
- Dual Internet & Failover: Starlink High-Speed Low-Latency Satellite (150 Mbps) + Automatic 5G Mobile Failover
- Audio & Hardware: Jabra Studio-Grade ANC Noise-Cancelling Headset + Dual 4K Ergonomic Workstation
- Timezone Alignment: 100% Core Hours Overlap for US EST/CST, UK GMT, and EU CET working hours
- Contractor Compliance: Verified International Contractor Invoicing (Deel, Wise, Payoneer, Stripe Express)`;

/**
 * Intelligent ATS Resume Template Tailorer
 * Produces clean, highly-structured, ATS-compliant Markdown
 */
export function generateTemplateResume(
  job: {
    title: string;
    company: string;
    description?: string;
    location?: string;
    tags?: string[];
  },
  profile: CandidateResumeProfile = DEFAULT_CANDIDATE_RESUME_PROFILE
): string {
  const roleTitle = job.title || 'Senior Software Engineer';
  const company = job.company || 'Global Remote Partner';
  const tagsList = job.tags && job.tags.length > 0 ? job.tags.join(', ') : profile.toolsAndPlatforms.join(', ');

  const infrastructureSection = profile.includeTurnkeyInfrastructure
    ? `\n## VERIFIED TURNKEY REMOTE INFRASTRUCTURE
${TURNKEY_INFRASTRUCTURE_STATEMENT}\n`
    : '';

  return `# ${profile.fullName.toUpperCase()}
**${profile.location}** | **Email:** ${profile.email} | **Phone:** ${profile.phone}  
**LinkedIn:** [${profile.linkedinUrl || 'linkedin.com'}](${profile.linkedinUrl || '#'}) | **Portfolio/GitHub:** [${profile.githubOrPortfolio || 'github.com'}](${profile.githubOrPortfolio || '#'})

---

## PROFESSIONAL SUMMARY
Results-driven **${roleTitle}** with ${profile.yearsExperience}+ years of international remote experience delivering mission-critical web software and distributed workflows. Specifically tailored for **${company}**'s opening for **${roleTitle}**, bringing proven expertise in ${profile.coreSkills.slice(0, 3).join(', ')}, and end-to-end performance optimization. Adept at operating across asynchronous cross-functional teams with meticulous documentation and rapid iteration speed.
${infrastructureSection}
## CORE COMPETENCIES & TECHNICAL EXPERTISE
- **Languages & Frameworks:** ${profile.coreSkills.join(' · ')}
- **Technologies & Tooling:** ${tagsList}
- **Architecture & Performance:** Sub-second LCP Optimization, Server Components, Streaming SSR, Edge Caching, State Collocation
- **Processes & Methodologies:** Agile/Scrum, CI/CD Automated Pipelines, System Architecture RFCs, Code Reviews, Pair Programming

---

## PROFESSIONAL WORK EXPERIENCE

### **Lead Remote Engineer** | International High-Growth SaaS
*2022 — Present | Remote (Global Overlap)*
- Architected and deployed responsive Next.js and TypeScript micro-frontends serving over 350,000 active monthly users with 99.95% SLA reliability.
- Spearheaded Core Web Vitals optimization initiative, slashing Largest Contentful Paint (LCP) from 3.2s to 1.1s and boosting conversion by 28%.
- Championed comprehensive design token architecture using Tailwind CSS, standardizing 40+ reusable accessible components across web clients.
- Collaborated seamlessly across US Eastern, UK, and European timezones via asynchronous Loom demos, GitHub PRs, and Linear sprints.

### **Senior Frontend Developer** | Distributed Remote Team
*2020 — 2022 | Remote*
- Built real-time operational dashboards and webhook event streaming pipelines with zero dropped payloads across peak traffic spikes.
- Mentored 4 mid-level developers, established automated testing pipelines using Jest and Playwright, and elevated automated test coverage to 88%.
- Integrated secure, PCI-compliant payment gateways and third-party SaaS APIs, reducing checkout drop-off rates by 19%.

---

## EDUCATION & CREDENTIALS
- **B.Sc. in Computer Science / Information Systems** — First Class Honors (2019)
- **AWS Certified Solutions Architect & Advanced Next.js Certified**
- **Continuous Learning:** Scalable Distributed Systems & High-Performance Web Architecture (2024–2026)
`;
}
