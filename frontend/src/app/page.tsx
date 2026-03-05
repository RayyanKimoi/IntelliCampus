'use client';

import Link from 'next/link';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
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
  Zap,
  Target,
  Users,
  TrendingUp,
  Lock,
  Layers,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

// ─── Animation Variants ───────────────────────────────────────────────────────
const EASE: [number, number, number, number] = [0.25, 1, 0.5, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

const fadeUpDelay = (delay: number) => ({
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE, delay },
  },
});

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const staggerSlow = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14 } },
};

function Section({ children, className = '', variants }: { children: React.ReactNode; className?: string; variants?: any }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} variants={variants} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Features Data ────────────────────────────────────────────────────────────
const features = [
  {
    icon: Shield,
    title: 'Governed AI',
    desc: 'AI responses are strictly bound to curriculum content via RAG. Zero hallucinations, zero off-topic answers.',
  },
  {
    icon: Brain,
    title: 'Mastery Tracking',
    desc: 'Real-time mastery graphs per topic with automatic weak area detection and targeted recommendations.',
  },
  {
    icon: MessageSquare,
    title: 'AI Tutor Chat',
    desc: 'Interactive AI tutor with learning, practice, and assessment modes. Full voice input support.',
  },
  {
    icon: Trophy,
    title: 'Gamification Engine',
    desc: 'XP, streaks, boss battles, and leaderboards that keep students engaged and motivated every session.',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    desc: 'Granular insights for teachers and admins. Track cohort mastery, engagement trends, and outcomes.',
  },
  {
    icon: Accessibility,
    title: 'Accessibility First',
    desc: 'Dyslexia font mode, high contrast, focus mode, and ADHD support built directly into the platform.',
  },
];

// ─── Steps Data ───────────────────────────────────────────────────────────────
const steps = [
  {
    step: '01',
    title: 'Upload Your Curriculum',
    desc: 'Teachers upload course materials. The AI indexes and chunks them into a governed knowledge base.',
  },
  {
    step: '02',
    title: 'Students Interact with AI',
    desc: 'The AI tutor answers questions, generates practice problems, and guides students — all within curriculum bounds.',
  },
  {
    step: '03',
    title: 'Mastery is Measured',
    desc: 'Every interaction updates a per-topic mastery score. Weak areas are surfaced instantly for targeted review.',
  },
  {
    step: '04',
    title: 'Teachers Gain Insight',
    desc: 'Real-time dashboards show cohort progress, engagement depth, and individual student performance.',
  },
];

// ─── Benefits Data ────────────────────────────────────────────────────────────
const benefits = [
  {
    icon: Zap,
    title: 'Instant Answers, Verified Sources',
    desc: 'Students get AI answers tied directly to course materials — with source citations so they always know where knowledge comes from.',
  },
  {
    icon: Target,
    title: 'Precision Learning Paths',
    desc: 'Adaptive recommendations pinpoint exactly where each student needs more practice, cutting wasted study time by up to 40%.',
  },
  {
    icon: Users,
    title: 'Scale Without Compromise',
    desc: 'One platform serves thousands of students simultaneously, with consistent quality and governed safety across every interaction.',
  },
  {
    icon: Lock,
    title: 'Academic Integrity Built-in',
    desc: 'The AI never writes essays for students. It guides, hints, and Socratically questions — never completing assignments.',
  },
];

// ─── Trusted Logos (placeholder) ──────────────────────────────────────────────
const logos = ['OXFORD', 'MIT', 'STANFORD', 'CAMBRIDGE', 'YALE'];

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div style={{ backgroundColor: '#060B14' }} className="min-h-screen text-white overflow-x-hidden">

      {/* ── NAVBAR ── */}
      <header
        style={{ borderColor: '#1A2A40', backgroundColor: 'rgba(6,11,20,0.80)' }}
        className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/icons/logo.png" alt="IntelliCampus" className="h-9 w-9 object-contain" />
            <span className="font-bold text-white text-lg tracking-tight">IntelliCampus</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Benefits'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                style={{ color: 'rgba(255,255,255,0.55)' }}
                className="text-sm font-medium hover:text-white transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              style={{ color: 'rgba(255,255,255,0.65)' }}
              className="text-sm font-medium hover:text-white transition-colors hidden md:block"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="lp-btn-primary px-4 py-2 rounded-lg text-sm font-semibold text-white"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background orbs */}
        <div
          className="absolute top-1/4 right-0 w-[700px] h-[700px] rounded-full lp-pulse-glow pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(0,110,178,0.18) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(0,47,76,0.25) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 w-full py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-6"
            >
              <motion.div variants={fadeUp}>
                <div
                  style={{ borderColor: 'rgba(0,110,178,0.4)', backgroundColor: 'rgba(0,110,178,0.08)', color: '#5BB8FF' }}
                  className="inline-flex items-center gap-2 border rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                >
                  <Sparkles className="w-3 h-3" />
                  AI-Governed Academic Intelligence
                </div>
              </motion.div>

              <motion.h1
                variants={fadeUpDelay(0.08)}
                className="font-sans font-extrabold text-5xl lg:text-6xl xl:text-7xl leading-[1.08] tracking-tight text-white"
              >
                The Smarter Way<br />
                to{' '}
                <span className="lp-gradient-text font-serif italic font-normal">Master</span>{' '}
                Any Subject
              </motion.h1>

              <motion.p
                variants={fadeUpDelay(0.16)}
                style={{ color: 'rgba(255,255,255,0.55)', lineHeight: '1.75' }}
                className="text-lg max-w-lg"
              >
                IntelliCampus is an AI academic platform that keeps every answer
                strictly within your curriculum. Adaptive mastery, gamified
                engagement, and deep analytics — built for modern universities.
              </motion.p>

              <motion.div
                variants={fadeUpDelay(0.24)}
                className="flex flex-col sm:flex-row gap-3 pt-2"
              >
                <Link
                  href="/auth/register"
                  className="lp-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white text-sm"
                >
                  Start for Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/auth/login"
                  style={{ borderColor: '#1A2A40', color: 'rgba(255,255,255,0.7)' }}
                  className="inline-flex items-center justify-center gap-2 border px-6 py-3.5 rounded-xl font-semibold text-sm hover:border-[#006EB2] hover:text-white transition-all duration-300"
                >
                  Sign In <ChevronRight className="w-4 h-4" />
                </Link>
              </motion.div>

              <motion.div
                variants={fadeUpDelay(0.32)}
                style={{ color: 'rgba(255,255,255,0.35)' }}
                className="flex items-center gap-6 pt-2 text-xs"
              >
                {['No credit card required', 'FERPA compliant', 'Free forever plan'].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#006EB2]" />
                    {t}
                  </span>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Animated UI Mock */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 1, 0.5, 1] }}
              className="lp-float hidden lg:block"
            >
              <div
                style={{ backgroundColor: '#0E1624', borderColor: '#1A2A40' }}
                className="relative rounded-2xl border p-1 lp-glow"
              >
                {/* Top bar */}
                <div
                  style={{ backgroundColor: '#060B14', borderColor: '#1A2A40' }}
                  className="rounded-xl border p-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    <div
                      style={{ backgroundColor: '#0E1624', color: 'rgba(255,255,255,0.3)' }}
                      className="ml-4 flex-1 rounded-lg px-3 py-1.5 text-xs"
                    >
                      intellicampus.ai/tutor
                    </div>
                  </div>

                  {/* Chat bubbles */}
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <div
                        style={{ background: 'linear-gradient(135deg,#002F4C,#006EB2)' }}
                        className="max-w-[72%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs text-white"
                      >
                        Explain photosynthesis using only the uploaded lecture notes.
                      </div>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <div
                        style={{ background: 'linear-gradient(135deg,#002F4C,#006EB2)' }}
                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                      >
                        <Brain className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div
                        style={{ backgroundColor: '#1A2A40', color: 'rgba(255,255,255,0.75)' }}
                        className="max-w-[78%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs leading-relaxed"
                      >
                        Based on <span className="text-[#5BB8FF]">Lecture 4, slide 12</span>: Photosynthesis converts light energy into glucose via the Calvin cycle. The chloroplast absorbs photons…
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div
                        style={{ background: 'linear-gradient(135deg,#002F4C,#006EB2)' }}
                        className="max-w-[72%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-xs text-white"
                      >
                        Give me a practice question on this.
                      </div>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <div
                        style={{ background: 'linear-gradient(135deg,#002F4C,#006EB2)' }}
                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
                      >
                        <Brain className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div
                        style={{ backgroundColor: '#1A2A40', color: 'rgba(255,255,255,0.75)' }}
                        className="max-w-[78%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-xs leading-relaxed"
                      >
                        <span className="text-[#5BB8FF] font-semibold">Assessment Mode</span>: What is the primary product of the light-dependent reactions in photosynthesis?
                      </div>
                    </div>
                  </div>

                  {/* Mastery bar */}
                  <div
                    style={{ borderColor: '#1A2A40' }}
                    className="mt-4 pt-4 border-t"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span style={{ color: 'rgba(255,255,255,0.45)' }} className="text-[10px]">
                        Biology · Photosynthesis Mastery
                      </span>
                      <span className="text-[10px] text-[#5BB8FF] font-semibold">74%</span>
                    </div>
                    <div style={{ backgroundColor: '#1A2A40' }} className="h-1.5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '74%' }}
                        transition={{ duration: 1.2, delay: 0.8, ease: [0.25, 1, 0.5, 1] }}
                        style={{ background: 'linear-gradient(90deg,#002F4C,#006EB2)' }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <Section variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-16">
              <div
                style={{ color: '#5BB8FF', backgroundColor: 'rgba(0,110,178,0.1)', borderColor: 'rgba(0,110,178,0.3)' }}
                className="inline-block border rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-widest mb-5"
              >
                Platform Features
              </div>
              <h2 className="font-sans font-extrabold text-4xl lg:text-5xl text-white mb-4">
                Everything a modern university<br />
                <span className="lp-gradient-text font-serif italic font-normal">actually needs</span>
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.45)' }} className="max-w-xl mx-auto text-base">
                Built ground-up for governed, transparent AI in education — not retrofitted from a generic chatbot.
              </p>
            </motion.div>

            <motion.div
              variants={staggerSlow}
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {features.map(({ icon: Icon, title, desc }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  whileHover={{ y: -4, transition: { duration: 0.25 } }}
                  style={{
                    backgroundColor: '#0E1624',
                    borderColor: '#1A2A40',
                  }}
                  className="group relative rounded-2xl border p-6 cursor-default transition-all duration-300 hover:border-[#006EB2] hover:lp-glow-sm"
                >
                  {/* Hover glow overlay */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ boxShadow: 'inset 0 0 0 1px rgba(0,110,178,0.35), 0 0 32px rgba(0,110,178,0.12)' }}
                  />
                  <div
                    style={{ background: 'linear-gradient(135deg,rgba(0,47,76,0.8),rgba(0,110,178,0.2))', borderColor: '#1A2A40' }}
                    className="w-11 h-11 rounded-xl border flex items-center justify-center mb-5"
                  >
                    <Icon className="w-5 h-5 text-[#5BB8FF]" />
                  </div>
                  <h3 className="font-sans font-semibold text-lg text-white mb-2">{title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' }} className="text-sm">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how-it-works"
        style={{ borderColor: '#1A2A40' }}
        className="py-28 border-t"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            {/* Left: Steps */}
            <Section variants={stagger} className="flex flex-col gap-5">
              <motion.div variants={fadeUp}>
                <div
                  style={{ color: '#5BB8FF', backgroundColor: 'rgba(0,110,178,0.1)', borderColor: 'rgba(0,110,178,0.3)' }}
                  className="inline-block border rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-widest mb-5"
                >
                  How It Works
                </div>
                <h2 className="font-sans font-extrabold text-4xl lg:text-5xl text-white mb-4">
                  From upload to<br />
                  <span className="lp-gradient-text font-serif italic font-normal">mastery insight</span>
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.45)' }} className="text-base max-w-md">
                  IntelliCampus takes your course content and turns it into a governed,
                  intelligent tutor that measures learning in real time.
                </p>
              </motion.div>

              {steps.map(({ step, title, desc }, i) => (
                <motion.div
                  key={step}
                  variants={fadeUpDelay(i * 0.1)}
                  className="flex gap-5 items-start"
                >
                  <div
                    style={{ background: 'linear-gradient(135deg,#002F4C,#006EB2)', flexShrink: 0 }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white mt-0.5"
                  >
                    {step}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">{title}</h4>
                    <p style={{ color: 'rgba(255,255,255,0.45)', lineHeight: '1.7' }} className="text-sm">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </Section>

            {/* Right: Dashboard Mock */}
            <Section variants={stagger} className="lg:sticky lg:top-28">
              <motion.div
                variants={fadeUp}
                style={{ backgroundColor: '#0E1624', borderColor: '#1A2A40' }}
                className="rounded-2xl border p-5 lp-glow"
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="text-sm font-semibold text-white">Student Dashboard</span>
                  <span style={{ color: '#5BB8FF', backgroundColor: 'rgba(0,110,178,0.12)' }} className="text-[10px] px-3 py-1 rounded-full font-semibold">
                    Live
                  </span>
                </div>

                {/* Mastery bars */}
                {[
                  { subject: 'Organic Chemistry', pct: 82, col: '#006EB2' },
                  { subject: 'Cell Biology', pct: 67, col: '#0086D6' },
                  { subject: 'Genetics', pct: 45, col: '#00AAFF' },
                  { subject: 'Thermodynamics', pct: 91, col: '#004F80' },
                ].map(({ subject, pct, col }, i) => (
                  <div key={subject} className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span style={{ color: 'rgba(255,255,255,0.65)' }} className="text-xs">{subject}</span>
                      <span style={{ color: col }} className="text-xs font-bold">{pct}%</span>
                    </div>
                    <div style={{ backgroundColor: '#1A2A40' }} className="h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.15, ease: [0.25, 1, 0.5, 1] }}
                        style={{ background: `linear-gradient(90deg, #002F4C, ${col})` }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </div>
                ))}

                {/* Stats row */}
                <div
                  style={{ borderColor: '#1A2A40' }}
                  className="grid grid-cols-3 gap-3 pt-4 border-t mt-4"
                >
                  {[
                    { label: 'Study Streak', val: '14 days' },
                    { label: 'XP Earned', val: '3,240' },
                    { label: 'Rank', val: '#7 / 84' },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ backgroundColor: '#060B14', borderColor: '#1A2A40' }} className="rounded-xl border p-3 text-center">
                      <div className="text-white font-bold text-sm">{val}</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)' }} className="text-[10px] mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </Section>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section
        id="benefits"
        style={{ borderColor: '#1A2A40' }}
        className="py-28 border-t"
      >
        <div className="max-w-7xl mx-auto px-6">
          <Section variants={stagger}>
            <motion.div variants={fadeUp} className="text-center mb-14">
              <div
                style={{ color: '#5BB8FF', backgroundColor: 'rgba(0,110,178,0.1)', borderColor: 'rgba(0,110,178,0.3)' }}
                className="inline-block border rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-widest mb-5"
              >
                Why IntelliCampus
              </div>
              <h2 className="font-sans font-extrabold text-4xl lg:text-5xl text-white">
                Benefits that move the
                <span className="lp-gradient-text font-serif italic font-normal"> needle</span>
              </h2>
            </motion.div>

            <motion.div variants={staggerSlow} className="flex flex-col gap-4">
              {benefits.map(({ icon: Icon, title, desc }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  whileHover={{ x: 4, transition: { duration: 0.2 } }}
                  style={{ backgroundColor: '#0E1624', borderColor: '#1A2A40' }}
                  className="group flex items-start gap-6 rounded-2xl border p-6 hover:border-[#006EB2] transition-all duration-300"
                >
                  <div
                    style={{ background: 'linear-gradient(135deg,rgba(0,47,76,0.8),rgba(0,110,178,0.2))', borderColor: '#1A2A40', flexShrink: 0 }}
                    className="w-12 h-12 rounded-xl border flex items-center justify-center"
                  >
                    <Icon className="w-5 h-5 text-[#5BB8FF]" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-base mb-1.5">{title}</h4>
                    <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' }} className="text-sm">{desc}</p>
                  </div>
                  <ChevronRight
                    style={{ color: 'rgba(0,110,178,0.4)', flexShrink: 0 }}
                    className="w-5 h-5 mt-0.5 ml-auto self-center group-hover:text-[#006EB2] transition-colors duration-200"
                  />
                </motion.div>
              ))}
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        style={{ borderColor: '#1A2A40' }}
        className="py-28 border-t"
      >
        <div className="max-w-7xl mx-auto px-6">
          <Section variants={stagger}>
            <motion.div
              variants={fadeUp}
              style={{ backgroundColor: '#0E1624', borderColor: '#1A2A40' }}
              className="relative rounded-3xl border overflow-hidden text-center px-8 py-20"
            >
              {/* Radial glow behind content */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                aria-hidden
              >
                <div
                  style={{
                    width: '600px',
                    height: '600px',
                    background: 'radial-gradient(circle, rgba(0,110,178,0.18) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                  }}
                />
              </div>

              <div className="relative z-10 flex flex-col items-center gap-6">
                <motion.div variants={fadeUpDelay(0.1)}>
                  <div
                    style={{ color: '#5BB8FF', backgroundColor: 'rgba(0,110,178,0.1)', borderColor: 'rgba(0,110,178,0.3)' }}
                    className="inline-flex items-center gap-2 border rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                  >
                    <Sparkles className="w-3 h-3" />
                    Ready to Transform Learning?
                  </div>
                </motion.div>

                <motion.h2
                  variants={fadeUpDelay(0.18)}
                  className="font-sans font-extrabold text-4xl lg:text-6xl text-white max-w-3xl leading-tight"
                >
                  Give your students the{' '}
                  <span className="lp-gradient-text font-serif italic font-normal">unfair advantage</span>
                  {' '}of governed AI
                </motion.h2>

                <motion.p
                  variants={fadeUpDelay(0.26)}
                  style={{ color: 'rgba(255,255,255,0.45)' }}
                  className="text-lg max-w-lg"
                >
                  Join forward-thinking universities already using IntelliCampus to
                  drive measurable learning outcomes.
                </motion.p>

                <motion.div
                  variants={fadeUpDelay(0.34)}
                  className="flex flex-col sm:flex-row gap-3 pt-2"
                >
                  <Link
                    href="/auth/register"
                    className="lp-btn-primary inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-base"
                  >
                    Start for Free <ArrowRight className="w-4.5 h-4.5" />
                  </Link>
                  <Link
                    href="/auth/login"
                    style={{ borderColor: '#1A2A40', color: 'rgba(255,255,255,0.6)' }}
                    className="inline-flex items-center justify-center gap-2 border px-8 py-4 rounded-xl font-semibold text-base hover:border-[#006EB2] hover:text-white transition-all duration-300"
                  >
                    Sign In
                  </Link>
                </motion.div>

                <motion.p
                  variants={fadeUpDelay(0.4)}
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                  className="text-xs"
                >
                  No credit card required · Free forever plan · FERPA & GDPR compliant
                </motion.p>
              </div>
            </motion.div>
          </Section>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        style={{ borderColor: '#1A2A40' }}
        className="border-t py-10"
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/icons/logo.png" alt="IntelliCampus" className="h-8 w-8 object-contain" />
            <span className="font-bold text-white">IntelliCampus</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.25)' }} className="text-xs text-center">
            © {new Date().getFullYear()} IntelliCampus. AI-Governed Academic Intelligence.
          </p>
          <div className="flex items-center gap-5">
            {['Privacy', 'Terms', 'Contact'].map((item) => (
              <a
                key={item}
                href="#"
                style={{ color: 'rgba(255,255,255,0.3)' }}
                className="text-xs hover:text-white transition-colors duration-200"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
