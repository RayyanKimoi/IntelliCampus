import Link from 'next/link';
import {
  GraduationCap,
  Brain,
  Shield,
  Trophy,
  MessageSquare,
  BarChart3,
  Accessibility,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">IntelliCampus</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-sm mb-6">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>AI-Governed Academic Intelligence</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Learn Smarter with{' '}
            <span className="text-primary">AI-Powered</span>{' '}
            Academic Intelligence
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            IntelliCampus is a governed AI platform that keeps learning bound to your curriculum.
            Adaptive mastery tracking, gamified engagement, and accessibility-first design
            for modern universities.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Start Learning <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-md border bg-background px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Platform Features</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Everything you need for an AI-enhanced academic experience, governed and transparent.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                icon: Shield,
                title: 'Governed AI Responses',
                desc: 'AI answers are strictly bound to curriculum content via RAG. No hallucinations, no off-topic responses.',
              },
              {
                icon: MessageSquare,
                title: 'AI Tutor Chat',
                desc: 'Interactive AI tutor with learning, practice, and assessment modes. Voice input supported.',
              },
              {
                icon: Brain,
                title: 'Mastery Tracking',
                desc: 'Real-time mastery graphs per topic. Automatic weak area detection and targeted recommendations.',
              },
              {
                icon: Trophy,
                title: 'Gamification',
                desc: 'Boss battles, sprint quizzes, flashcards, spin wheel rewards, XP system, and leaderboards.',
              },
              {
                icon: BarChart3,
                title: 'Rich Analytics',
                desc: 'Performance trends, study patterns, and teacher insights powered by AI analysis.',
              },
              {
                icon: Accessibility,
                title: 'Accessibility First',
                desc: 'ADHD mode, dyslexia fonts, high contrast, focus mode, speech-to-text, and scalable fonts.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-based */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Built for Everyone</h2>
            <p className="mt-3 text-muted-foreground">
              Role-specific dashboards tailored to each user type.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {[
              {
                icon: BookOpen,
                role: 'Students',
                color: 'text-primary',
                bg: 'bg-primary/5',
                items: [
                  'AI-powered tutoring',
                  'Mastery-based learning',
                  'Gamified progress tracking',
                  'Accessibility settings',
                ],
              },
              {
                icon: GraduationCap,
                role: 'Teachers',
                color: 'text-success',
                bg: 'bg-green-50',
                items: [
                  'Curriculum management',
                  'Assignment creation',
                  'Class mastery analytics',
                  'AI-generated insights',
                ],
              },
              {
                icon: Shield,
                role: 'Administrators',
                color: 'text-warning',
                bg: 'bg-amber-50',
                items: [
                  'AI policy governance',
                  'User management',
                  'System usage analytics',
                  'Accessibility controls',
                ],
              },
            ].map((item) => (
              <div
                key={item.role}
                className="rounded-lg border bg-card p-6 text-center"
              >
                <div
                  className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${item.bg}`}
                >
                  <item.icon className={`h-7 w-7 ${item.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-3">{item.role}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground text-left">
                  {item.items.map((i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${item.color.replace('text-', 'bg-')}`} />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">IntelliCampus</span>
          </div>
          <p>Governed AI Academic Intelligence Platform for Universities</p>
          <p className="mt-1">v0.1.0</p>
        </div>
      </footer>
    </div>
  );
}
