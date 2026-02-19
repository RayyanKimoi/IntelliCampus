# IntelliCampus — Production Frontend Architecture Redesign

> **Design Philosophy**: Institutional, Intelligent, Calm, High-trust. Notion + Linear + Palantir + Duolingo intelligence system for universities.

---

## 1. LAYOUT SYSTEM — The Shell Model

### Three-Zone Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  TOP BAR (56px)                                                  │
│  ┌──────────┬─────────────────────────┬──────────────────────┐   │
│  │ ☰ Logo   │ [LEARNING] [ASSESSMENT] │ 🔔 ♿ 👤 Profile ▼   │   │
│  │          │      [INSIGHTS]         │                      │   │
│  └──────────┴─────────────────────────┴──────────────────────┘   │
├────────────┬─────────────────────────────────────────────────────┤
│            │ CONTEXT BAR (44px) — Course/Topic selector          │
│  SIDEBAR   ├─────────────────────────────────────────────────────┤
│  (220px)   │                                                     │
│            │  PRIMARY CONTENT AREA                                │
│  Mode-     │                                                     │
│  specific  │  (Panels, cards, charts, forms, AI chat)            │
│  nav items │                                                     │
│            │                                                     │
│  ─────     │                                                     │
│  USER      │                                                     │
│  ZONE      │                                                     │
│            │                                                     │
└────────────┴─────────────────────────────────────────────────────┘
```

### Key Zones

| Zone | Spec | Purpose |
|------|------|---------|
| **Top Bar** | `h-14`, `z-50`, `border-b` | Brand mark, Mode Switcher (pill tabs), notifications, accessibility toggle, user dropdown |
| **Sidebar** | `w-56` expanded / `w-14` collapsed / `w-0` mobile | Mode-contextual nav items. Changes based on active mode. User zone at bottom |
| **Context Bar** | `h-11`, conditionally visible | Course + Topic dropdown selectors. Scopes all content. Persisted in Zustand |
| **Content Area** | `flex-1`, CSS Grid with named areas, `max-w-[1440px]` | Standardized panel grid: `panel-sm` (320px), `panel-md` (480px), `panel-lg` (full) |

### Shell Variants

| Shell | Usage | Sidebar | Top Bar |
|-------|-------|---------|---------|
| `AppShell` | Dashboards, standard pages | Yes | Full |
| `AuthShell` | Login, register | No | Minimal |
| `FocusShell` | Assessments, boss battle | No | Minimal/hidden |
| `SplitShell` | AI chat, split-panel views | Yes | Full |

---

## 2. UI/UX DESIGN SYSTEM

### Color Architecture

```css
/* BRAND — Deep Institutional Navy */
--ic-brand:       210 80% 20%;       /* #0F2A4A — headers, sidebar bg */
--ic-brand-light: 210 60% 30%;       /* #1E3A5F — sidebar hover/active */
--ic-brand-muted: 210 30% 95%;       /* #F0F4F8 — page background */

/* SURFACE HIERARCHY (light mode) */
--surface-0:      0 0% 100%;         /* #FFFFFF — cards, dialogs */
--surface-1:      210 20% 97%;       /* #F5F7FA — page background */
--surface-2:      210 15% 93%;       /* #E8ECF1 — nested panels */
--surface-3:      210 12% 88%;       /* #D9DFE7 — dividers, borders */

/* TEXT HIERARCHY */
--text-primary:   210 50% 12%;       /* #162236 — headlines */
--text-secondary: 210 20% 40%;       /* #526070 — body text */
--text-tertiary:  210 15% 55%;       /* #788796 — captions */
--text-inverse:   0 0% 100%;         /* #FFFFFF — on brand bg */

/* SEMANTIC STATES */
--status-mastery:  160 60% 42%;      /* #2BA870 — success/progress */
--status-warning:  36 90% 55%;       /* #E8A830 — at-risk/attention */
--status-danger:   0 72% 55%;        /* #DC4848 — failure/critical */
--status-info:     210 80% 55%;      /* #3B7DD8 — info/links */
--status-neutral:  210 10% 70%;      /* #A0AAB4 — inactive */

/* MASTERY GRADIENT (core visual language) */
--mastery-0:      0 72% 55%;         /* Red    — 0-25% */
--mastery-25:     36 90% 55%;        /* Amber  — 25-50% */
--mastery-50:     45 95% 50%;        /* Yellow — 50-70% */
--mastery-75:     160 60% 42%;       /* Green  — 70-90% */
--mastery-100:    210 80% 45%;       /* Blue   — 90-100% (brand mastery) */
```

### Typography

```
FONT STACK:
  sans:  'Inter', system-ui, -apple-system, sans-serif
  mono:  'JetBrains Mono', 'Fira Code', monospace

SCALE (1.200 modular ratio):
  --text-2xs:   0.625rem  (10px)    Micro labels, badges
  --text-xs:    0.75rem   (12px)    Captions, timestamps
  --text-sm:    0.875rem  (14px)    Body text, nav items
  --text-base:  1rem      (16px)    Primary body, form labels
  --text-lg:    1.125rem  (18px)    Section headers
  --text-xl:    1.25rem   (20px)    Panel titles
  --text-2xl:   1.5rem    (24px)    Page titles
  --text-3xl:   1.875rem  (30px)    Dashboard hero metrics

WEIGHTS:
  400 Regular   → Body text
  500 Medium    → Nav items, labels
  600 Semibold  → Section titles, stat values
  700 Bold      → Page titles, hero numbers

LINE HEIGHTS:
  1.2  → Headlines, metrics
  1.5  → Body text
  1.75 → Long-form reading, AI chat

LETTER SPACING:
  -0.02em → Headlines
   0      → Body
   0.05em → ALL-CAPS labels, badges
```

### Spacing (8px Grid)

```
--space-0:   0     --space-5:   20px   --space-10:  40px
--space-1:   4px   --space-6:   24px   --space-12:  48px
--space-2:   8px   --space-8:   32px   --space-16:  64px
--space-3:   12px
--space-4:   16px
```

### Panel & Card System

| Component | Border | Shadow | Padding | Hover |
|-----------|--------|--------|---------|-------|
| **Panel** | `1px solid border` | None | `24px` | — |
| **Card** | `1px solid border` | None | `24px` | `border-color → brand-light`, subtle `translate-y` |
| **Metric Card** | `1px solid border`, left accent `3px solid status-color` | None | `16px` | — |
| **Stat Ring** | SVG circle with `dasharray` | None | — | — |

### Panel Header Pattern

```
Flex between: Title (text-lg semibold) + Action buttons
Optional: Icon prefix, badge suffix, description line
Border-bottom: 1px solid border
Padding-bottom: 16px, margin-bottom: 16px
```

---

## 3. STUDENT UX

### Mode Architecture

Students have 3 top-level modes (switched via ModeSwitcher in TopBar). The sidebar navigation changes per mode.

### LEARNING MODE

**Routes:**
```
/student/learning/overview       → Dashboard
/student/learning/session        → AI Tutor (course+topic scoped)
/student/learning/practice       → Spaced repetition
/student/learning/reinforcement  → Gamified modules hub
/student/learning/mastery        → Knowledge graph
/student/learning/controls       → Preferences & accessibility
```

**Sidebar:**
```
[Overview]          LayoutDashboard
[Learn]             MessageSquare
[Practice]          Target
[Reinforcement]     Gamepad2
[Mastery Graph]     GitBranch
[Controls]          SlidersHorizontal
```

#### Learning Overview Layout

```
┌──────────────────────┬──────────────────────┬──────────────────────┐
│ MASTERY RING         │ XP PROGRESS          │ STREAK STATUS        │
│ 72% Overall          │ Level 14 · 350/500   │ 🔥 12 days          │
│ [SVG donut]          │ [Progress bar]       │ [Calendar heatmap]   │
└──────────────────────┴──────────────────────┴──────────────────────┘
┌──────────────────────────────────┬──────────────────────────────────┐
│ ACTIVE TOPICS                    │ PERFORMANCE TREND                │
│ ▸ Calculus II          78%  ██▓  │ [Area chart — last 30 days]     │
│ ▸ Linear Algebra       45%  ██░  │ AI-predicted trajectory (dashed)│
│ ▸ Data Structures      92%  ████ │                                  │
│ [View Mastery Graph →]           │ [View Full Analytics →]          │
└──────────────────────────────────┴──────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│ RECOMMENDED NEXT ACTIONS (3 ActionCards)                             │
│ 🧠 Continue topic | ⚔️ Boss Battle | 📝 Due Assignment              │
└──────────────────────────────────────────────────────────────────────┘
```

#### AI Tutor Session (SplitShell)

```
┌──────────────────────────────────────────────┬──────────────────┐
│ SESSION TRANSCRIPT (70%)                      │ TOPIC CONTEXT    │
│                                               │ (30%, sticky)    │
│ Student → AI message flow                     │                  │
│ Alternating alignment (AI left, student right)│ Mastery: 45%     │
│                                               │ Prerequisites    │
│ KaTeX for math, syntax highlighting for code  │ Related concepts │
│                                               │ Session metadata │
│ ┌───────────────────────────────────────────┐ │                  │
│ │ [🎤 Voice] [Type message...]       [➤]   │ │ [View Graph →]  │
│ └───────────────────────────────────────────┘ │                  │
├───────────────────────────────────────────────┴──────────────────┤
│ AI MODE: [◉ Learning] [○ Assessment] [○ Practice]                │
└──────────────────────────────────────────────────────────────────┘
```

#### Mastery Graph (Signature Visual)

- **Engine**: `@xyflow/react` (React Flow)
- **Nodes**: Custom MasteryNode — circle with mastery ring + topic name + percentage
- **Edges**: Gradient from source to target mastery color
- **Interactions**: Draggable, zoomable, pinch-zoom on mobile
- **Click node**: Expands detail panel with topic info + action buttons
- **Locked nodes**: Missing prerequisites → lock icon, greyed out
- **Color coding**: Mastery gradient system (red → amber → yellow → green → blue)

#### Boss Battle (FocusShell)

```
Background: bg-gradient-to-b from-[#0a0e1a] to-[#1a1f35]
Boss card: Animated border glow (animate-pulse-glow)
HP bar: Red-to-green gradient, animated drain
Lives: Heart icons, dead = text-muted/30
Timer: Monospace, urgency color <10s
Options: 2x2 grid, hover border glow, selected = brand fill
Correct: Green flash + screen shake + boss damage animation
Wrong: Red flash + heart break animation
Victory: Confetti particles, XP display, mastery impact
```

### ASSESSMENT MODE

**Routes:**
```
/student/assessment/active       → Take assessment
/student/assessment/blueprint    → Question structure
/student/assessment/evaluation   → Results & grading
/student/assessment/integrity    → Integrity settings
/student/assessment/insights     → Assessment analytics
```

**Sidebar:**
```
[Active Assessment]    ClipboardCheck
[Question Blueprint]   FileCode
[Evaluation]           CheckCircle
[Integrity Controls]   Shield
[Assessment Insights]  BarChart3
```

#### Active Assessment (FocusShell)

- Full-screen, sidebar hidden
- Top: progress bar + timer
- Center: Question + options (vertical stack)
- Bottom: Navigation dots (filled=answered, hollow=unanswered, orange=flagged)
- Strict mode: Red banner indicator when AI hints disabled
- Timer turns red at <5 minutes

### INSIGHTS MODE

**Routes:**
```
/student/insights/dashboard      → Performance overview
/student/insights/analytics      → Detailed analytics
/student/insights/risk           → Risk & weakness indicators
```

**Sidebar:**
```
[Dashboard]            LayoutDashboard
[Learning Analytics]   TrendingUp
[Risk Indicators]      AlertTriangle
```

#### Insights Dashboard

```
┌───────────┬───────────┬───────────┬───────────┐
│ GPA Est.  │ Mastery   │ AI Usage  │ Risk      │
│ 3.72      │ 71%       │ 48 hrs    │ LOW ●     │
└───────────┴───────────┴───────────┴───────────┘
Performance Trajectory (multi-line: overall, predicted, class avg)
Mastery by Course (horizontal bars)
Learning Patterns (study time heatmap, AI sessions, best time)
```

---

## 4. FACULTY UX

### Routes
```
/teacher/overview                → Command center
/teacher/curriculum              → Courses, subjects, topics
/teacher/assessment-studio       → Create/manage assignments
/teacher/evaluation              → Grading, results, feedback
/teacher/cohort                  → Class intelligence
/teacher/monitoring              → Integrity, AI usage
/teacher/controls                → Learning preferences
/teacher/reports                 → Reports, exports
```

### Sidebar
```
[Overview]              LayoutDashboard
[Curriculum]            BookOpen
[Assessment Studio]     FlaskConical
[Evaluation & Results]  CheckSquare
[Cohort Intelligence]   Users
[Monitoring]            Eye
[Learning Controls]     SlidersHorizontal
[Reports & Export]      FileBarChart
```

### Command Center Layout

```
Metrics: Students, Avg Grade, At-Risk, AI Usage, Completion Rate
Charts: Class performance distribution + At-risk student list
Bottom: Upcoming deadlines + Quick actions
```

### Cohort Intelligence (Signature Faculty Feature)

```
MASTERY HEATMAP: Student × Topic grid
  ██ >80%  ▓▓ 50-80%  ░░ 20-50%  ── <20%  🔒 Locked

CLASS-WIDE WEAK TOPICS: Aggregated mastery with student counts
Actions: [Generate Remedial Content →] [Schedule Office Hours →]
```

---

## 5. ADMIN UX

### Routes
```
/admin/overview                  → Institutional dashboard
/admin/governance                → AI policy, academic integrity
/admin/knowledge-base            → Institutional content
/admin/users                     → User & role management
/admin/assessment-governance     → Assessment policy
/admin/analytics                 → Institutional analytics
/admin/security                  → Integrity & security audit
/admin/inclusion                 → Accessibility oversight
/admin/reports                   → Reports & accreditation
```

### Sidebar
```
[Overview]                  LayoutDashboard
[Policy Control]            Shield
[Knowledge Base]            Database
[User & Role]               UserCog
[Assessment Governance]     Scale
[Institutional Analytics]   BarChart3
[Integrity & Security]      Lock
[Inclusion Oversight]       Accessibility
[Reports & Accreditation]   FileCheck
```

### Institutional Overview

```
Metrics: Users (2,847), Courses (42), AI Sessions (12.4K), Avg GPA (3.41), System Health
Charts: User growth (12-month area chart) + Role distribution (donut)
Alerts: AI governance alerts + Recent admin actions audit trail
```

### AI Policy Control Panel

```
RESPONSE CONTROL:
  Allow Direct Answers      [Toggle OFF]
  Maximum Hints Per Topic   [Slider: 3]
  Strict Exam Mode          [Toggle ON]
  Assessment Window Lock    [Toggle ON]

CONTENT MODERATION:
  Blocked Keywords          [Tag input]
  Allowed Topics            [Dropdown]
  Response Language         [Dropdown]

USAGE LIMITS:
  Monthly Token Budget      [Progress bar 82%/1M]
  Max Sessions/Student/Day  [Number input]
  Max Message Length        [Number input]
```

---

## 6. COMPONENT ARCHITECTURE

```
frontend/src/components/
├── chrome/                    # App shell
│   ├── TopBar.tsx
│   ├── ModeSwitcher.tsx
│   ├── ContextBar.tsx
│   ├── Sidebar.tsx
│   ├── SidebarItem.tsx
│   ├── UserMenu.tsx
│   └── NotificationBell.tsx
│
├── shells/                    # Layout wrappers
│   ├── AppShell.tsx
│   ├── AuthShell.tsx
│   ├── FocusShell.tsx
│   └── SplitShell.tsx
│
├── panels/                    # Structural containers
│   ├── Panel.tsx
│   ├── PanelHeader.tsx
│   ├── MetricCard.tsx
│   ├── StatRing.tsx
│   ├── ActionCard.tsx
│   └── EmptyState.tsx
│
├── data/                      # Data visualization
│   ├── MasteryGraph.tsx
│   ├── MasteryNode.tsx
│   ├── MasteryEdge.tsx
│   ├── PerformanceChart.tsx
│   ├── DistributionChart.tsx
│   ├── HeatmapGrid.tsx
│   ├── TrendLine.tsx
│   ├── CalendarHeatmap.tsx
│   └── ProgressBar.tsx
│
├── ai/                        # AI interaction
│   ├── ChatTranscript.tsx
│   ├── ChatMessage.tsx
│   ├── ChatInput.tsx
│   ├── VoiceOrb.tsx
│   ├── ModeSelector.tsx
│   ├── TopicContextPanel.tsx
│   └── SessionMetadata.tsx
│
├── gamification/              # Gamified learning
│   ├── BossBattleArena.tsx
│   ├── BossCard.tsx
│   ├── QuestionCard.tsx
│   ├── LivesIndicator.tsx
│   ├── ScoreDisplay.tsx
│   ├── BattleTimer.tsx
│   ├── VictoryScreen.tsx
│   ├── DefeatScreen.tsx
│   ├── FlashcardStack.tsx
│   ├── SprintQuiz.tsx
│   ├── SpinWheel.tsx
│   └── LeaderboardTable.tsx
│
├── assessment/                # Assessment system
│   ├── AssessmentShell.tsx
│   ├── QuestionRenderer.tsx
│   ├── QuestionNavigator.tsx
│   ├── TimerBar.tsx
│   ├── IntegrityBadge.tsx
│   └── GradeDisplay.tsx
│
├── faculty/                   # Teacher components
│   ├── CohortHeatmap.tsx
│   ├── AtRiskList.tsx
│   ├── AssignmentBuilder.tsx
│   ├── QuestionEditor.tsx
│   ├── ContentUploader.tsx
│   └── GradeTable.tsx
│
├── admin/                     # Admin components
│   ├── PolicyEditor.tsx
│   ├── UserTable.tsx
│   ├── RoleBadge.tsx
│   ├── SystemHealthGrid.tsx
│   ├── GovernanceLog.tsx
│   └── UsageMeter.tsx
│
├── accessibility/             # Accessibility
│   ├── A11yToggle.tsx
│   ├── FontScaleSlider.tsx
│   └── FocusModeOverlay.tsx
│
└── ui/                        # shadcn/ui primitives (existing 19)
```

---

## 7. DEVELOPER IMPLEMENTATION

### Zustand Store Enhancement

```typescript
// store/uiStore.ts
interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  isMobile: boolean;
  theme: 'light' | 'dark';
  activeMode: 'learning' | 'assessment' | 'insights';
  activeCourseId: string | null;
  activeTopicId: string | null;
  dyslexiaFont: boolean;
  focusMode: boolean;
  adhdMode: boolean;
  fontScale: number;
  setActiveMode: (mode) => void;
  setActiveCourse: (courseId) => void;
  setActiveTopic: (topicId) => void;
  toggleSidebar: () => void;
}
```

### Navigation Config

```typescript
// lib/navigation.ts
const studentNavByMode = {
  learning: [
    { label: 'Overview',      href: '/student/learning/overview',      icon: LayoutDashboard },
    { label: 'Learn',         href: '/student/learning/session',       icon: MessageSquare },
    { label: 'Practice',      href: '/student/learning/practice',      icon: Target },
    { label: 'Reinforcement', href: '/student/learning/reinforcement', icon: Gamepad2 },
    { label: 'Mastery Graph', href: '/student/learning/mastery',       icon: GitBranch },
    { label: 'Controls',      href: '/student/learning/controls',      icon: SlidersHorizontal },
  ],
  assessment: [
    { label: 'Active Assessment',  href: '/student/assessment/active',     icon: ClipboardCheck },
    { label: 'Question Blueprint', href: '/student/assessment/blueprint',  icon: FileCode },
    { label: 'Evaluation',         href: '/student/assessment/evaluation', icon: CheckCircle },
    { label: 'Integrity Controls', href: '/student/assessment/integrity',  icon: Shield },
    { label: 'Insights',           href: '/student/assessment/insights',   icon: BarChart3 },
  ],
  insights: [
    { label: 'Dashboard',          href: '/student/insights/dashboard',  icon: LayoutDashboard },
    { label: 'Learning Analytics', href: '/student/insights/analytics',  icon: TrendingUp },
    { label: 'Risk Indicators',    href: '/student/insights/risk',       icon: AlertTriangle },
  ],
};
```

### App Router Structure

```
frontend/src/app/
├── layout.tsx                    # Root
├── page.tsx                      # Landing → redirect
├── auth/{login,register}/
├── student/
│   ├── layout.tsx                # AppShell(role='student')
│   ├── learning/{overview,session,practice,reinforcement/*,mastery,controls}/
│   ├── assessment/{active,blueprint,evaluation,integrity,insights}/
│   └── insights/{dashboard,analytics,risk}/
├── teacher/
│   ├── layout.tsx                # AppShell(role='teacher')
│   └── {overview,curriculum,assessment-studio,evaluation,cohort,monitoring,controls,reports}/
├── admin/
│   ├── layout.tsx                # AppShell(role='admin')
│   └── {overview,governance,knowledge-base,users,assessment-governance,analytics,security,inclusion,reports}/
└── api/                          # Unchanged
```

### Key Component Patterns

```tsx
// AppShell
<div className="flex h-screen overflow-hidden bg-surface-1">
  <Sidebar role={role} />
  <div className="flex flex-1 flex-col overflow-hidden">
    <TopBar />
    <ContextBar />
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-[1440px]">{children}</div>
    </main>
  </div>
</div>

// Panel
<div className="rounded-lg border border-border bg-card p-6">
  <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
    <h3 className="text-lg font-semibold">{title}</h3>
    {action}
  </div>
  {children}
</div>

// MetricCard
<div className="rounded-lg border border-border border-l-[3px] border-l-{accentColor} bg-card p-4">
  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
  <p className="mt-1 font-mono text-3xl font-semibold">{value}</p>
  <p className="mt-1 text-xs">{trend}</p>
</div>
```

### NPM Packages to Add

```
@xyflow/react    ^12.0.0    Mastery graph
framer-motion    ^11.0.0    Animations
sonner           ^1.5.0     Toasts
cmdk             ^1.0.0     Command palette (Cmd+K)
katex            ^0.16.0    Math rendering
react-katex      ^3.0.1     React KaTeX wrapper
```

---

## 8. BEFORE → AFTER

| Aspect | Before | After |
|--------|--------|-------|
| Navigation | Flat sidebar per role | Mode-switching + contextual sidebar |
| Layout | One DashboardLayout | AppShell + FocusShell + SplitShell |
| Colors | Generic shadcn blue | Deep navy brand + mastery gradient |
| Pages | 660-line monoliths | Composable panels + shared components |
| Student Routes | `/student/*` flat | `/student/{learning,assessment,insights}/*` |
| Mastery | Progress bars | Interactive knowledge graph (React Flow) |
| Boss Battle | Light theme quiz | Dark cinematic arena |
| Data Viz | Single chart | Heatmaps, rings, sparklines, distributions |
| Gamification | Submenu in sidebar | Dedicated "Reinforcement" section |
| Typography | Default Inter | Scaled system + mono for metrics |
| Voice | Basic mic | Pulsing orb with context |
| Faculty | Dashboard only | 8-section command center |
| Admin | Basic stats | Full governance + compliance system |
| Components | Empty folders | 50+ production components |
