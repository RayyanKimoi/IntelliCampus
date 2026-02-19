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
    { label: 'Learn', href: '/student/ai-chat', icon: MessageSquare },
    { label: 'Practice', href: '/student/practice', icon: Target },
    { label: 'Gamification', href: '/student/gamification', icon: Gamepad2 },
    { label: 'Mastery Graph', href: '/student/mastery', icon: GitBranch },
    { label: 'Settings', href: '/student/settings', icon: SlidersHorizontal },
  ],
  assessment: [
    { label: 'Active Assessment', href: '/student/assignments', icon: ClipboardCheck },
    { label: 'Question Blueprint', href: '/student/assignments', icon: FileCode },
    { label: 'Evaluation', href: '/student/assignments', icon: CheckCircle },
    { label: 'Integrity Controls', href: '/student/settings', icon: Shield },
    { label: 'Assessment Insights', href: '/student/leaderboard', icon: BarChart3 },
  ],
  insights: [
    { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { label: 'Learning Analytics', href: '/student/mastery', icon: TrendingUp },
    { label: 'Risk Indicators', href: '/student/mastery', icon: AlertTriangle },
  ],
};

// ── Teacher navigation ──────────────────────────────────────────
export const teacherNav: NavItem[] = [
  { label: 'Overview', href: '/teacher', icon: LayoutDashboard },
  { label: 'Curriculum', href: '/teacher/courses', icon: BookOpen },
  { label: 'Assessment Studio', href: '/teacher/assignments', icon: FlaskConical },
  { label: 'Evaluation & Results', href: '/teacher/analytics', icon: CheckSquare },
  { label: 'Cohort Intelligence', href: '/teacher/analytics', icon: Users },
  { label: 'Monitoring', href: '/teacher/analytics', icon: Eye },
  { label: 'Learning Controls', href: '/teacher/settings', icon: SlidersHorizontal },
  { label: 'Reports & Export', href: '/teacher/analytics', icon: FileBarChart },
];

// ── Admin navigation ────────────────────────────────────────────
export const adminNav: NavItem[] = [
  { label: 'Overview', href: '/admin', icon: LayoutDashboard },
  { label: 'Policy Control', href: '/admin/ai-policy', icon: Shield },
  { label: 'Knowledge Base', href: '/admin/usage', icon: Database },
  { label: 'User & Role', href: '/admin/users', icon: UserCog },
  { label: 'Assessment Governance', href: '/admin/ai-policy', icon: Scale },
  { label: 'Institutional Analytics', href: '/admin/usage', icon: BarChart3 },
  { label: 'Integrity & Security', href: '/admin/ai-policy', icon: Lock },
  { label: 'Inclusion Oversight', href: '/admin/accessibility', icon: Accessibility },
  { label: 'Reports & Accreditation', href: '/admin/usage', icon: FileCheck },
];
