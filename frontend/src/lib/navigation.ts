import {
  LayoutDashboard,
  MessageSquare,
  Target,
  Gamepad2,
  GitBranch,
  SlidersHorizontal,
  ClipboardCheck,
  FileCode,
  CheckCircle,
  Shield,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  FlaskConical,
  CheckSquare,
  Users,
  Eye,
  FileBarChart,
  Database,
  UserCog,
  Scale,
  Lock,
  Accessibility,
  FileCheck,
  Trophy,
  GraduationCap,
  Library,
  ShieldAlert,
  Lightbulb,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// ── Student navigation by mode ──────────────────────────────────
export const studentNavByMode: Record<string, NavItem[]> = {
  learning: [
    { label: 'Overview', href: '/student', icon: LayoutDashboard },
    { label: 'My Courses', href: '/student/courses', icon: BookOpen },
    { label: 'AI Tutor', href: '/student/ai-tutor', icon: MessageSquare },
    { label: 'Practice', href: '/student/practice', icon: Target },
    { label: 'Gamification', href: '/student/gamification', icon: Gamepad2 },
    { label: 'Mastery', href: '/student/mastery', icon: GitBranch },
    { label: 'Insights', href: '/student/insights', icon: Lightbulb },
  ],
  assessment: [
    { label: 'Dashboard', href: '/student/assessment', icon: LayoutDashboard },
    { label: 'Assignments', href: '/student/assessment/assignments', icon: ClipboardCheck },
    { label: 'Quizzes', href: '/student/assessment/quizzes', icon: FileCode },
    { label: 'Results', href: '/student/assessment/results', icon: BarChart3 },
  ],
};

// ── Teacher navigation ──────────────────────────────────────────
export const teacherNav: NavItem[] = [
  { label: 'Overview',                href: '/teacher',                   icon: LayoutDashboard },
  { label: 'Curriculum',              href: '/teacher/curriculum',         icon: Library },
  { label: 'Assessment Studio',       href: '/teacher/assessment-studio',  icon: FlaskConical },
  { label: 'Evaluation & Results',    href: '/teacher/results',            icon: CheckSquare },
  { label: 'Cohort Intelligence',     href: '/teacher/cohort',             icon: Users },
  { label: 'Integrity & Monitoring',  href: '/teacher/integrity',          icon: ShieldAlert },
  { label: 'Reports & Export',        href: '/teacher/reports',            icon: FileBarChart },
];

// ── Admin navigation ────────────────────────────────────────────
export const adminNav: NavItem[] = [
  { label: 'Overview',                href: '/admin',                           icon: LayoutDashboard },
  { label: 'Policy Control',          href: '/admin/ai-policy',                 icon: Shield },
  { label: 'Knowledge Base',          href: '/admin/knowledge-base',            icon: Database },
  { label: 'User & Role',             href: '/admin/users',                     icon: UserCog },
  { label: 'Assessment Governance',   href: '/admin/assessment-governance',     icon: Scale },
  { label: 'Institutional Analytics', href: '/admin/analytics',                 icon: BarChart3 },
  { label: 'Integrity & Security',    href: '/admin/integrity',                 icon: Lock },
  { label: 'Inclusion Oversight',     href: '/admin/accessibility',             icon: Accessibility },
  { label: 'Reports & Accreditation', href: '/admin/reports',                   icon: FileCheck },
];
