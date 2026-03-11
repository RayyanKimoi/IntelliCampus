# Gamification Arena - Complete Implementation Guide

## 🎮 Overview
Full Duolingo-style gamification arena with sequential unlock system, XP rewards, and database integration.

## ✅ Features Implemented

### 1. **Visual System**
- ✅ 4-stage progression map with fixed coordinate positioning (zig-zag layout)
- ✅ **SVG-based path rendering** using continuous path elements (no rotated divs)
- ✅ Smooth path connections using SVG `<path>` with `M` (move) and `L` (line) commands
- ✅ Beige base path (#e5caa3) with green progress overlay (#5ce65c)
- ✅ Path dimensions: 22px strokeWidth, automatically calculated length
- ✅ **pathLength animation** for smooth progress fill using Framer Motion
- ✅ Rock → Flower transformation at 100% completion
- ✅ Animated droplets (4 minus completed games) floating above nodes
- ✅ SVG progress rings around nodes showing percentage completion
- ✅ Grass background with themed UI elements

### Node Coordinates
Nodes are positioned using fixed coordinates in viewBox space:
- **Stage 1 (Data Structures)**: x: 150px, y: 50px (left)
- **Stage 2 (Algorithms)**: x: 450px, y: 250px (right)
- **Stage 3 (Networks)**: x: 150px, y: 450px (left)
- **Stage 4 (OS)**: x: 450px, y: 650px (right)

### SVG Path Generation
The path is generated as a single continuous SVG path string:
```typescript
const generateSVGPath = () => {
  const points = stages.map(stage => ({
    x: stage.x + 70, // center offset
    y: stage.y + 70,
  }));
  
  // Create: M x1 y1 L x2 y2 L x3 y3 L x4 y4
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathD += ` L ${points[i].x} ${points[i].y}`;
  }
  return pathD;
};
```

### Path Rendering (SVG-Based)
Two overlapping SVG `<path>` elements:
1. **Base path**: Full beige path always visible
2. **Progress path**: Green path with animated `pathLength` property

```tsx
<path
  d={generateSVGPath()}
  stroke="#e5caa3"
  strokeWidth="22"
  strokeLinecap="round"
  fill="none"
/>

<motion.path
  d={generateSVGPath()}
  stroke="#5ce65c"
  strokeWidth="22"
  strokeLinecap="round"
  fill="none"
  initial={{ pathLength: 0 }}
  animate={{ pathLength: getTotalProgress() }}
  transition={{ duration: 1.5, ease: "easeOut" }}
/>
```

Key advantages:
- No rotation calculations needed
- Perfect alignment guaranteed by SVG coordinate system
- Smooth curves possible with `strokeLinecap="round"`
- Native browser path rendering
- Scalable and responsive with viewBox

### 2. **Sequential Unlock System**
- ✅ 4 mini-games per stage: Sprint Quiz, Spin the Wheel, Flashcards, Boss Battle
- ✅ Unlock thresholds based on stage completion: 
  - **Sprint Quiz**: 0% (always unlocked)
  - **Spin the Wheel**: 25% (unlocked after 1 game completed)
  - **Flashcards**: 50% (unlocked after 2 games completed)
  - **Boss Battle**: 75% (unlocked after 3 games completed)
- ✅ Lock visuals: greyed out, grayscale filter, 🔒 icon, disabled state
- ✅ Locked games are unclickable and show clear visual feedback

### 3. **XP Reward System**
- ✅ Sprint Quiz: **100 XP**
- ✅ Spin the Wheel: **100 XP**
- ✅ Flashcards: **200 XP**
- ✅ Boss Battle: **300 XP**
- ✅ Level system: 1000 XP per level
- ✅ XP progress bar in top header showing current level progress
- ✅ Total XP display next to avatar

### 4. **Database Integration**
- ✅ **StageProgress** model tracks:
  - `userId`: Student identifier
  - `stageId`: Stage number (1-4)
  - `completedGames`: Games finished in stage (0-4)
  - `progress`: Percentage completion (0-100)
- ✅ **StudentXP** model (already existed):
  - `totalXp`: Cumulative XP earned
  - `level`: Current level (auto-calculated)
  - `streakDays`: Login streak counter
- ✅ **XPLog** model (already existed):
  - Records every XP transaction with source and amount

### 5. **API Routes**
- ✅ **POST `/api/gamification/complete-game`**
  - Completes a mini-game and awards XP
  - Validates unlock requirements
  - Updates stage progress atomically
  - Handles level-up calculations
  - Returns updated XP and progress data

- ✅ **GET `/api/gamification/complete-game?userId=X`**
  - Fetches all stage progress for a user
  - Returns StudentXP data (level, total XP, streak)
  - Optional `stageId` parameter for single stage query

## 📁 Files Created/Modified

### New Files
1. **`frontend/src/app/api/gamification/complete-game/route.ts`**
   - API route for game completion and progress fetching
   - Transaction-based XP updates
   - Unlock validation logic

2. **`frontend/prisma/migrations/add_stage_progress.sql`**
   - SQL migration for StageProgress table
   - Unique constraint on (userId, stageId)
   - Foreign key with CASCADE delete

### Modified Files
1. **`frontend/prisma/schema.prisma`**
   - Added `StageProgress` model
   - Added `stageProgress` relation to User model

2. **`frontend/src/app/student/gamification/arena/page.tsx`**
   - Complete arena page with all features
   - **SVG-based path rendering system** (replaced rotated divs)
   - Real-time data fetching from API
   - Lock system integration
   - Smooth zig-zag path using SVG `<path>` elements
   - Framer Motion pathLength animation
   - XP progress display
   - Loading state

## 🗃️ Database Schema

### StageProgress Model
```prisma
model StageProgress {
  id             String   @id @default(cuid())
  userId         String   @map("user_id")
  stageId        Int      @map("stage_id") // 1-4
  completedGames Int      @default(0) @map("completed_games") // 0-4
  progress       Int      @default(0) // 0-100
  updatedAt      DateTime @updatedAt @map("updated_at")
  createdAt      DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, stageId])
  @@index([userId])
  @@map("stage_progress")
}
```

## 🔌 API Usage

### Complete a Game
```typescript
POST /api/gamification/complete-game
Content-Type: application/json

{
  "userId": "user_123",
  "stageId": 1,
  "gameType": "sprint" // or "wheel", "flashcards", "boss"
}

// Response
{
  "success": true,
  "message": "Completed Sprint Quiz! Earned 100 XP",
  "data": {
    "stageProgress": {
      "completedGames": 1,
      "progress": 25,
      ...
    },
    "xpEarned": 100,
    "totalXp": 1250,
    "level": 2
  }
}
```

### Fetch Stage Progress
```typescript
GET /api/gamification/complete-game?userId=user_123

// Response
{
  "stageProgress": [
    { "stageId": 1, "completedGames": 2, "progress": 50, ... },
    { "stageId": 2, "completedGames": 0, "progress": 0, ... }
  ],
  "studentXp": {
    "totalXp": 1250,
    "level": 2,
    "streakDays": 5
  }
}
```

## 🚀 Setup Instructions

### 1. Run Database Migration
```powershell
cd frontend
pnpm prisma migrate dev --name add_stage_progress
```

### 2. Generate Prisma Client
```powershell
pnpm prisma generate
```

### 3. (Optional) Seed Test Data
You can manually insert test data:
```sql
-- Insert stage progress for testing
INSERT INTO stage_progress (id, user_id, stage_id, completed_games, progress, updated_at, created_at)
VALUES 
  ('test_1', 'your_user_id', 1, 2, 50, NOW(), NOW()),
  ('test_2', 'your_user_id', 2, 0, 0, NOW(), NOW());

-- Insert XP data
INSERT INTO student_xp (id, user_id, total_xp, level, streak_days, last_activity_date)
VALUES ('xp_1', 'your_user_id', 1250, 2, 5, NOW())
ON CONFLICT (user_id) DO UPDATE SET total_xp = 1250, level = 2;
```

### 4. Start Development Server
```powershell
cd ..
pnpm dev
```

### 5. Access Arena
Navigate to: `http://localhost:3000/student/gamification/arena`

**Note**: The arena will work in **demo mode** even without running the migration. It will show Stage 1 with 0% progress and all games locked except Sprint Quiz. To enable full database functionality, run the migration steps above.

## 🎨 Visual Design Details

### SVG Path Architecture

#### **Why SVG Instead of Rotated Divs?**
The arena now uses native SVG `<path>` elements instead of CSS-rotated divs for several advantages:

1. **Perfect Alignment**: SVG coordinate system ensures paths always connect to exact node centers
2. **No Math Needed**: No rotation angle calculations, distance formulas, or transform matrices
3. **Smooth Rendering**: Browser-native path rendering with anti-aliasing
4. **Scalable**: viewBox makes the entire map responsive without recalculating positions
5. **Animation**: Framer Motion's `pathLength` provides smooth progress fill
6. **Maintainable**: Changing node positions only requires updating x/y coordinates

#### **SVG Structure**
```tsx
<svg viewBox="0 0 650 800" className="absolute inset-0">
  <defs>
    <filter id="pathShadow">
      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
    </filter>
  </defs>
  
  {/* Base beige path - always full */}
  <path d="M 220 120 L 520 320 L 220 520 L 520 720"
        stroke="#e5caa3" strokeWidth="22" />
  
  {/* Green progress path - animated */}
  <motion.path d="M 220 120 L 520 320 L 220 520 L 520 720"
               stroke="#5ce65c" strokeWidth="22"
               animate={{ pathLength: progress }} />
</svg>
```

#### **Path Generation Algorithm**
```typescript
// 1. Get center points of all nodes
const points = stages.map(stage => ({
  x: stage.x + 70,  // 140px node / 2
  y: stage.y + 70,
}));

// 2. Build SVG path string
let path = `M ${points[0].x} ${points[0].y}`;  // Move to first point
for (let i = 1; i < points.length; i++) {
  path += ` L ${points[i].x} ${points[i].y}`;  // Line to next point
}

// Result: "M 220 120 L 520 320 L 220 520 L 520 720"
```

#### **Progress Animation**
Uses Framer Motion's `pathLength` property (0 to 1 scale):
```typescript
const getTotalProgress = () => {
  let completed = 0;
  stages.forEach(stage => {
    completed += getStageProgress(stage.id);
  });
  return completed / (stages.length * 4);  // 16 total games
};

// Then animate
<motion.path
  animate={{ pathLength: getTotalProgress() }}
  transition={{ duration: 1.5, ease: "easeOut" }}
/>
```

### Node System
- **Base Color**: Beige solid (#e5caa3)
- **Progress Fill**: Green solid (#5ce65c)
- **Technology**: Native SVG `<path>` elements (no rotated divs)
- **Path String**: Generated using `M x y L x y` SVG path commands
- **Stroke Width**: 22px (thick and highly visible)
- **Stroke Linecap**: `round` (smooth rounded ends at nodes)
- **Animation**: Framer Motion `pathLength` property (0 to 1)
- **Duration**: 1.5s with easeOut timing
- **Shadow**: SVG feDropShadow filter for depth
- **Rendering**: SVG layer behind nodes (proper z-index layering)
- **ViewBox**: `0 0 650 800` - scalable and responsive
- **Progress Calculation**: `getTotalProgress()` returns 0-1 based on all completed games across all stages

### Node System
- **Locked State**: Grey rock image, no progress ring
- **In Progress**: Rock + green progress ring + droplets
- **Complete**: Flower image + green checkmark badge

### Mini-Game Buttons
- **Unlocked**: Emerald gradient, hover effects, arrow icon
- **Locked**: Grey gradient, 60% opacity, grayscale filter, lock icon

## 🔒 Unlock Logic

### How It Works
1. Calculate stage progress: `(completedGames / 4) * 100`
2. Compare with unlock thresholds: `[0, 25, 50, 75]`
3. Game unlocks when `progress >= threshold[gameIndex]`

### Example Flow
- Student starts Stage 1 (0% progress)
- Sprint Quiz is unlocked (0% threshold) ✅
- Completes Sprint → 25% progress
- Spin the Wheel unlocks (25% threshold) ✅
- Completes Wheel → 50% progress
- Flashcards unlock (50% threshold) ✅
- Completes Flashcards → 75% progress
- Boss Battle unlocks (75% threshold) ✅
- Completes Boss → 100% progress
- Rock transforms to flower 🌸

## 📊 XP Calculation

### Level Formula
```typescript
level = Math.floor(totalXp / 1000) + 1
```

### Examples
- 0-999 XP → Level 1
- 1000-1999 XP → Level 2
- 2000-2999 XP → Level 3

### Progress Bar
Shows progress within current level:
```typescript
xpInCurrentLevel = totalXp % 1000
progressPercentage = (xpInCurrentLevel / 1000) * 100
```

## 🐛 Error Handling

### API Validation
- ✅ Missing fields → 400 Bad Request
- ✅ Invalid stageId → 400 Bad Request
- ✅ Invalid gameType → 400 Bad Request
- ✅ Game locked → 403 Forbidden
- ✅ Stage already complete → 400 Bad Request
- ✅ Database errors → 500 Internal Server Error

### Frontend Handling
- ✅ Loading state during data fetch
- ✅ Graceful fallback for missing data (default to 0)
- ✅ **Demo mode fallback**: If API fails, uses demo data (Stage 1 with 0 progress)
- ✅ Error logging to console with warnings instead of errors
- ✅ Disabled buttons for locked games
- ✅ Works without database migration (demo mode)

## 🔄 Data Flow

### On Page Load
1. Component mounts → `useEffect` fires
2. Fetch all stage progress: `GET /api/gamification/complete-game?userId=X`
3. Update local state: `stageProgressData`, `studentXp`
4. Render arena with real data
5. Calculate unlock status for each game

### On Game Completion (Future Integration)
1. User completes mini-game in another page
2. Call API: `POST /api/gamification/complete-game`
3. API validates unlock status
4. Transaction updates: StageProgress → XPLog → StudentXP
5. Return updated data
6. Redirect to arena (or refresh data)
7. Arena shows updated progress, unlocked games, XP

## 🎯 Next Steps (Optional Enhancements)

### Suggested Improvements
1. **Real Game Integration**
   - Call complete-game API from Sprint/Wheel/Flashcards/Boss pages
   - Pass stageId context through navigation
   - Show XP earned animation after completion

2. **Animations**
   - Path fill animation on progress change
   - Level-up celebration modal
   - Droplet removal animation
   - Rock → Flower transformation animation

3. **Stage Selection**
   - Allow students to choose which stage to play
   - Show stage info modal with topic details
   - Track current active stage

4. **Leaderboards**
   - Weekly XP rankings
   - Stage completion speed
   - Boss battle high scores

5. **Rewards**
   - Unlock badges at milestones
   - Special effects for 100% completion
   - Bonus XP for streak maintenance

## 📖 Code Reference

### Key Functions in Arena Page

```typescript
// Get completed games for a stage
const getStageProgress = (stageId: number) => {
  const stageData = stageProgressData.find(s => s.stageId === stageId);
  return stageData?.completedGames || 0;
};

// Calculate percentage
const getProgressPercentage = (stageId: number) => {
  const stageData = stageProgressData.find(s => s.stageId === stageId);
  return stageData?.progress || 0;
};

// Check if game is locked
const getGameUnlockStatus = (gameIndex: number, currentStageId: number = 1) => {
  const progress = getProgressPercentage(currentStageId);
  const unlockThresholds = [0, 25, 50, 75];
  return progress >= unlockThresholds[gameIndex];
};

const isGameLocked = (gameIndex: number) => {
  return !getGameUnlockStatus(gameIndex, 1); // Currently always stage 1
};
```

## 🧩 Integration with Other Pages

### Sprint Quiz Integration
In `frontend/src/app/student/gamification/sprint/page.tsx`:
```typescript
// After quiz completion
const handleQuizComplete = async (score: number) => {
  const response = await fetch('/api/gamification/complete-game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      stageId: currentStageId, // Get from context or props
      gameType: 'sprint',
    }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Show XP earned animation
    toast.success(`+${data.data.xpEarned} XP!`);
    
    // Redirect to arena
    router.push('/student/gamification/arena');
  }
};
```

### Similar patterns for:
- Spin the Wheel → `gameType: 'wheel'`
- Flashcards → `gameType: 'flashcards'`
- Boss Battle → `gameType: 'boss'`

## 📝 Notes

- **Stage Selection**: Currently hardcoded to Stage 1 in unlock logic. Future enhancement should allow stage selection.
- **Course Mapping**: The 4 stages reference placeholder courses (Data Structures, Algorithms, Networks, OS). These should map to real courses in production.
- **Prisma Lock**: There may be a Prisma file lock preventing regeneration. Close VS Code or use task manager if needed.
- **Assets**: All icons/images must exist in `public/gamification/` folder structure.

## 🎨 Asset Requirements

Ensure these assets exist:
```
public/gamification/
├── arena/
│   ├── background/
│   │   ├── grass-bg.png
│   │   └── gamepanelbg.png
│   └── nodes/
│       ├── rock.png
│       ├── flower-ds.png
│       ├── flower-algo.png
│       ├── flower-cn.png
│       ├── flower-os.png
│       └── droplet.png
└── minigames/
    ├── sprint.png
    ├── wheel.png
    ├── flashcards.png
    └── boss.png
```

---

## ✅ Implementation Status

**Current Status**: ✅ **COMPLETE**

All major features implemented:
- ✅ **SVG-based path rendering system** (smooth, perfect connections)
- ✅ Visual progression map with zig-zag layout
- ✅ Framer Motion pathLength animation for progress
- ✅ Sequential unlock system with thresholds
- ✅ XP rewards (100/100/200/300)
- ✅ Database models (StageProgress)
- ✅ API routes (POST & GET)
- ✅ Real-time data fetching with demo mode fallback
- ✅ Lock visuals on games
- ✅ Level system and progress bar
- ✅ Migration file
- ✅ Drop shadow effects and rounded path caps

**Architecture**: Native SVG `<path>` elements replace rotated div approach for guaranteed alignment and smooth rendering.

**Ready for**: Game integration, testing, and optional enhancements listed above.
