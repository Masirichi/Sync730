import { SiteHeader } from '@/components/site/site-header';
import { SiteFooter } from '@/components/site/site-footer';
import {
  Briefcase,
  Search,
  Users,
  TrendingUp,
  FileText,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Building2,
  Zap,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.08),transparent)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="animate-fade-up">
                <Badge variant="secondary" className="mb-5 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI-powered job matching
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  Find your next{' '}
                  <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    opportunity
                  </span>
                </h1>
                <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                  TalentHub connects ambitious candidates with world-class companies.
                  Streamlined applications, smart matching, and powerful tools for everyone.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button size="lg" asChild>
                    <a href="/register">
                      Get started free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="/candidate">Browse jobs</a>
                  </Button>
                </div>
                <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    No credit card
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Free for candidates
                  </div>
                </div>
              </div>

              <div className="relative animate-fade-in">
                <div className="rounded-2xl border border-border/60 bg-card p-2 shadow-2xl shadow-primary/10">
                  <img
                    src="https://images.pexels.com/photos/7710139/pexels-photo-7710139.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                    alt="Professional team collaborating in a modern office"
                    className="aspect-[4/3] w-full rounded-xl object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 hidden rounded-xl border border-border/60 bg-card p-4 shadow-lg sm:block">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">10k+</p>
                      <p className="text-xs text-muted-foreground">Hires made</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-b border-border/60 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
              {[
                { label: 'Active jobs', value: '2,500+' },
                { label: 'Companies', value: '800+' },
                { label: 'Candidates', value: '45k+' },
                { label: 'Hire rate', value: '94%' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-bold tracking-tight text-primary">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="secondary" className="mb-4">Features</Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to hire and get hired
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Powerful tools for candidates, recruiters, and admins — all in one platform.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Search, title: 'Smart Job Search', desc: 'AI-powered matching finds roles suited to your skills and experience automatically.' },
                { icon: FileText, title: 'Easy Applications', desc: 'Apply to multiple jobs with a single profile. Track every application in real time.' },
                { icon: Users, title: 'Candidate Pipeline', desc: 'Recruiters get a visual pipeline to manage candidates from application to offer.' },
                { icon: MessageSquare, title: 'Built-in Messaging', desc: 'Connect candidates and recruiters with integrated, real-time messaging.' },
                { icon: TrendingUp, title: 'Analytics & Insights', desc: 'Track hiring metrics, conversion rates, and time-to-hire with rich dashboards.' },
                { icon: ShieldCheck, title: 'Secure & Private', desc: "Row-level security keeps every user's data private and protected." },
              ].map((feature) => (
                <Card key={feature.title} className="group transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                    <CardDescription className="mt-2">{feature.desc}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* For Candidates */}
        <section id="for-candidates" className="border-y border-border/60 bg-muted/30 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <Badge variant="secondary" className="mb-4 gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  For Candidates
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Land your dream job faster
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Build your profile once, apply with a click, and let our matching engine surface the right opportunities.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    'Create a rich profile with skills, experience, and preferences',
                    'Get matched to jobs that fit your career goals',
                    'Track application status in real time',
                    'Chat directly with recruiters',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button size="lg" asChild>
                    <a href="/register">Start applying <ArrowRight className="ml-2 h-4 w-4" /></a>
                  </Button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Zap, title: '1-click apply', desc: 'No repetitive forms.' },
                  { icon: TrendingUp, title: 'Match score', desc: 'See your fit instantly.' },
                  { icon: MessageSquare, title: 'Direct chat', desc: 'Talk to recruiters.' },
                  { icon: FileText, title: 'Profile builder', desc: 'Stand out to employers.' },
                ].map((item) => (
                  <Card key={item.title} className="bg-card">
                    <CardContent className="p-5">
                      <item.icon className="h-8 w-8 text-primary" />
                      <h3 className="mt-3 font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* For Recruiters */}
        <section id="for-recruiters" className="py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="order-2 grid gap-4 sm:grid-cols-2 lg:order-1">
                {[
                  { icon: Building2, title: 'Post jobs', desc: 'Publish in minutes.' },
                  { icon: Users, title: 'Pipeline', desc: 'Visual candidate tracking.' },
                  { icon: TrendingUp, title: 'Analytics', desc: 'Hiring metrics at a glance.' },
                  { icon: ShieldCheck, title: 'Vetting', desc: 'Verified candidate profiles.' },
                ].map((item) => (
                  <Card key={item.title} className="bg-card">
                    <CardContent className="p-5">
                      <item.icon className="h-8 w-8 text-primary" />
                      <h3 className="mt-3 font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="order-1 lg:order-2">
                <Badge variant="secondary" className="mb-4 gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  For Recruiters
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Hire smarter, not harder
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Post jobs, manage candidates through a visual pipeline, and make data-driven hiring decisions.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    'Post unlimited job listings with rich descriptions',
                    'Manage candidates with a drag-and-drop pipeline',
                    'Access analytics on hiring funnel and conversion',
                    'Collaborate with your team on candidate reviews',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button size="lg" asChild>
                    <a href="/register">Start hiring <ArrowRight className="ml-2 h-4 w-4" /></a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden border-t border-border/60 bg-primary py-20 lg:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(40%_60%_at_80%_50%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to transform your hiring?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
              Join thousands of candidates and companies already using TalentHub.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" variant="secondary" asChild>
                <a href="/register">Create an account</a>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" asChild>
                <a href="/login">Sign in</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
