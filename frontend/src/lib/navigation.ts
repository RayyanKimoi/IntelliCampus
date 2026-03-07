import type React from 'react';
import {
  Shield,
  BarChart3,
  Database,
  UserCog,
  Scale,
  Lock,
  Accessibility,
  FileCheck,
  LayoutDashboard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Student learning icons from react-icons
import { RiDashboardHorizontalFill } from "react-icons/ri";
import { FaBookBookmark } from "react-icons/fa6";
import { IoIosChatboxes } from "react-icons/io";
import { FaPencil, FaPenToSquare, FaListCheck } from "react-icons/fa6";
import { IoGameController } from "react-icons/io5";
import { FaLightbulb } from "react-icons/fa6";
import { MdInsights, MdAssignment, MdQuiz, MdOutlineSecurity } from "react-icons/md";
import { BsFileEarmarkBarGraphFill } from "react-icons/bs";
import { ImBooks } from "react-icons/im";
import { LuBrainCircuit } from "react-icons/lu";

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
  { label: 'Overview',                href: '/teacher',                   icon: RiDashboardHorizontalFill },
  { label: 'Curriculum',              href: '/teacher/curriculum',         icon: ImBooks },
  { label: 'Assessment Studio',       href: '/teacher/assessment-studio',  icon: FaPenToSquare },
  { label: 'Evaluation & Results',    href: '/teacher/results',            icon: FaListCheck },
  { label: 'Cohort Intelligence',     href: '/teacher/cohort',             icon: LuBrainCircuit },
  { label: 'Integrity & Monitoring',  href: '/teacher/integrity',          icon: MdOutlineSecurity },
  { label: 'Reports & Export',        href: '/teacher/reports',            icon: BsFileEarmarkBarGraphFill },
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
