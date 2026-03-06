import type React from 'react';
import {
  LayoutDashboard,
  Shield,
  BarChart3,
  FlaskConical,
  CheckSquare,
  Users,
  FileBarChart,
  Database,
  UserCog,
  Scale,
  Lock,
  Accessibility,
  FileCheck,
  Library,
  ShieldAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { FaBookBookmark, FaPencil, FaLightbulb } from 'react-icons/fa6';
import { MdAssignment, MdQuiz, MdInsights } from 'react-icons/md';
import { BsFileEarmarkBarGraphFill } from 'react-icons/bs';
import { IoIosChatboxes } from 'react-icons/io';
import { RiDashboardHorizontalFill } from 'react-icons/ri';
import { IoGameController } from 'react-icons/io5';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NavIcon = LucideIcon | React.ComponentType<any>;

export interface NavItem {
  label: string;
  href: string;
  icon: NavIcon;
}

// ── Student navigation by mode ──────────────────────────────────
export const studentNavByMode: Record<string, NavItem[]> = {
  learning: [
    { label: 'Overview',      href: '/student',              icon: RiDashboardHorizontalFill },
    { label: 'My Courses',    href: '/student/courses',      icon: FaBookBookmark },
    { label: 'AI Tutor',      href: '/student/ai-tutor',     icon: IoIosChatboxes },
    { label: 'Practice',      href: '/student/practice',     icon: FaPencil },
    { label: 'Gamification',  href: '/student/gamification', icon: IoGameController },
    { label: 'Mastery',       href: '/student/mastery',      icon: FaLightbulb },
    { label: 'Insights',      href: '/student/insights',     icon: MdInsights },
  ],
  assessment: [
    { label: 'Dashboard', href: '/student/assessment', icon: RiDashboardHorizontalFill },
    { label: 'Assignments', href: '/student/assessment/assignments', icon: MdAssignment },
    { label: 'Quizzes', href: '/student/assessment/quizzes', icon: MdQuiz },
    { label: 'Results', href: '/student/assessment/results', icon: BsFileEarmarkBarGraphFill },
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
