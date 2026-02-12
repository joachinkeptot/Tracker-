# Analytics Tab - Visual Walkthrough

## Screen Layout Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│  RoomMap Ops - Community Tracking System                               │
├────────────────────────────────────────────────────────────────────────┤
│ [Areas] [Cohorts] [Activities] [Analytics] ⬅️ YOU ARE HERE              │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─ TIME PERIOD SELECTOR ───────────────────────────────────────────┐ │
│  │ [Last Week] [Last Month] [Last Quarter] [Custom Range]          │ │
│  │ Custom: [📅 Start Date] - [📅 End Date] [Apply]                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─ METRICS (4 Cards) ──────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────┐  │ │
│  │  │   PEOPLE 👥  │  │ ACTIVITIES 📊 │  │ LEARNING 📚  │  │ ENG │  │ │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├─────┤  │ │
│  │  │              │  │              │  │              │  │     │  │ │
│  │  │   1,234      │  │     89       │  │              │  │ 156 │  │ │
│  │  │              │  │              │  │ Ruhi: 23     │  │ vis │  │ │
│  │  │ New: 45      │  │ New: 12      │  │ JY: 34       │  │     │  │ │
│  │  │ +15% ↑       │  │ Conn: 234    │  │ Total: 57    │  │ 89  │  │ │
│  │  │   GREEN      │  │              │  │              │  │ con │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────┘  │ │
│  │                                                                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─ CHARTS (2 x 2 Grid) ────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │  ┌─ People Added Over Time ──┐  ┌─ Activity by Type ──────────┐ │ │
│  │  │                            │  │  JYCC Youth Study Devotional│ │ │
│  │  │  ↑                    ╱╲   │  │  ▄▄  ▄   ▄  ▄▄   ▄▄   ▄   │ │ │
│  │  │  │                  ╱  ╲  │  │  ██  ██  ██ ██   ██   ██  │ │ │
│  │  │  │          ╱╲     ╱    ╲ │  │  ██  ██  ██ ██   ██   ██  │ │ │
│  │  │  │         ╱  ╲   ╱      ╲│  │  12  34  45 23   56   12  │ │ │
│  │  │  └────────→────────────────│  └──────────────────────────┘ │ │
│  │  │    W1 W2 W3 W4 W5 W6      │                              │ │
│  │  └────────────────────────────┘                              │ │
│  │                                                                   │ │
│  │  ┌─ Participation Status ─────┐  ┌─ Learning by Week ────────┐ │ │
│  │  │ (Stacked Area Chart)       │  │ (Grouped Bars)           │ │ │
│  │  │ ▁▂▃▄▅▆▇█ Active (blue)     │  │   Ruhi    JY             │ │ │
│  │  │ ▁▂▃▄▅▆▇█ Inactive (gray)   │  │   ▄     ▄ ▄  ▄           │ │ │
│  │  │ ▁▂▃▄▅▆▇█ New (dark blue)   │  │   ██ ██ ██ ██ ██        │ │ │
│  │  │                            │  │   12  8  14  11  5        │ │ │
│  │  └────────────────────────────┘  └──────────────────────────┘ │ │
│  │                                                                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─ HOME VISITS HEAT MAP ────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │  Area      W1  W2  W3  W4  W5  W6  W7  W8  W9 W10 W11 W12       │ │
│  │  ─────────────────────────────────────────────────────────       │ │
│  │  North    [2] [5] [3] [ ] [4] [6] [2] [3] [ ] [1] [ ] [2]       │ │
│  │  South    [1] [2] [2] [3] [ ] [2] [4] [1] [2] [3] [1] [ ]       │ │
│  │  East     [ ] [1] [ ] [2] [1] [ ] [3] [2] [1] [ ] [2] [1]       │ │
│  │  West     [3] [2] [1] [ ] [2] [1] [2] [1] [3] [2] [ ] [ ]       │ │
│  │                                                                   │ │
│  │  Legend: Darker = More visits (hover for exact number)            │ │
│  │                                                                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌─ KEY INSIGHTS ────────────────────────────────────────────────────┐ │
│  │                                                                   │ │
│  │  💡 Community grew 15% with 45 new people this month             │ │
│  │  💡 East area needs attention - only 1 home visit recorded       │ │
│  │  💡 Learning completions up 25% (57 courses vs 46 last month)    │ │
│  │  💡 3 people have no activity connections - need outreach        │ │
│  │  💡 Strong engagement in North and South areas this quarter      │ │
│  │                                                                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  [📊 Export as PDF]                                                     │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## User Journey

### Journey 1: Monthly Review

```
1. Click Analytics tab
   ↓
2. See "Last Month" is default
   ↓
3. Scan 4 metric cards
   → People: 1,234 total, +45 new (+15%)
   → Activities: 89 total, good participation
   → Learning: 57 completions (23 Ruhi + 34 JY)
   → Engagement: 156 visits, 89 conversations
   ↓
4. Review charts to see trends
   → Growth trajectory positive ✓
   → Most participation from Youth & JY ✓
   → Learning engagement strong ✓
   ↓
5. Check heat map for geographic balance
   → North & South doing well
   → East needs more attention
   ↓
6. Read insights for action items
   → Focus on East area outreach
   → Consider scaling youth activities
   ↓
7. Export PDF for monthly report
   → Share with team
   → Archive for records
```

### Journey 2: Area-Based Analysis

```
1. Start at Analytics tab
   ↓
2. Review Heat Map carefully
   → North area: 5,4,6 visits in first 3 weeks (strong)
   → South area: 1,2,2 visits (steady)
   → East area: 0,1,0 visits (LOW)
   → West area: 3,2,1 visits (declining)
   ↓
3. Look at Insights
   → "East area has no activities in 8 weeks"
   ↓
4. Go to Areas tab to investigate East area
   ↓
5. Create action plan for East area
```

### Journey 3: Learning Progress Check

```
1. Click Analytics
   ↓
2. Set time period: "Last Quarter"
   ↓
3. Check Learning card
   → Ruhi: 23 completions this quarter
   → JY: 34 completions this quarter
   → Total: 57 learning activities
   ↓
4. View "Learning by Week" chart
   → Week 1-4: 5,4,6,7 completions
   → Week 5-8: 3,4,5,6 completions
   → Week 9-12: 2,3,4,6 completions
   ↓
5. Notice trend: slight dip mid-quarter, recovery at end
   ↓
6. Check insights for context
   → "Learning completions up 20% vs last quarter"
   ↓
7. Decide to maintain current momentum
```

---

## Feature Demonstrations

### Demo 1: Time Period Selection

```
BEFORE: Last Month selected
─────────────────────────────
People: 1,234 total, +45 new
Activities: 89 total
Insights: Shows monthly data

USER CLICKS: Last Quarter

AFTER: Last Quarter selected
──────────────────────────────
People: 1,234 total, +134 new (Q total)
Activities: 89 total
Charts: Now show 12-week view
Insights: Updated to quarterly trends
Heat Map: Shows all 12 weeks
```

### Demo 2: PDF Export

```
USER CLICKS: [📊 Export as PDF]
  ↓
Loading dialog appears (1-2 seconds)
  ↓
"Capturing analytics..."
  ↓
File downloaded: analytics-report.pdf
  ↓
Contains:
  - All 4 metric cards
  - All 4 charts
  - Full heat map
  - Insights section
  - Timestamp
  - Summary statistics
```

### Demo 3: Interactive Charts

```
HOVER over line in "People Added" chart
  → Tooltip appears: "Week 3: 12 new people"
  → Crosshair follows cursor

CLICK on bar in "Activity by Type" chart
  → Could enable drill-down (future feature)

HOVER on heat map cell
  → Cell enlarges slightly
  → Shows: "North area - Week 3: 6 visits"
  → Exact number becomes visible
```

---

## Mobile Experience

```
DESKTOP (1024px+)               TABLET (768px)               MOBILE (<768px)
┌─────────────────────┐       ┌──────────────────┐        ┌────────────────┐
│ Time Selector       │       │ Time Selector    │        │ Time Selector  │
├─────────────────────┤       ├──────────────────┤        ├────────────────┤
│ 4 Metrics (grid)    │       │ 2 Metrics (grid) │        │ 1 Metric/row   │
│ ▄▄ ▄▄ ▄▄ ▄▄         │       │ ▄▄ ▄▄            │        │ ▄▄             │
│ ▄▄ ▄▄ ▄▄ ▄▄         │       │ ▄▄ ▄▄            │        │ ▄▄             │
│                     │       │                  │        │ ▄▄             │
├─────────────────────┤       ├──────────────────┤        │ ▄▄             │
│ Charts (2x2)        │       │ Charts (1x2)     │        ├────────────────┤
│ [Chart] [Chart]     │       │ [Chart]          │        │ Charts (scroll)│
│ [Chart] [Chart]     │       │ [Chart]          │        │ [Chart]        │
│                     │       │                  │        │ [Chart]        │
│                     │       │ [Chart]          │        │ [Chart]        │
│                     │       │ [Chart]          │        │ [Chart]        │
├─────────────────────┤       ├──────────────────┤        ├────────────────┤
│ Heat Map            │       │ Heat Map (scroll)│        │ Heat Map       │
│ ┌─┬─┬─┬─┬─┬─┬─┬─┐ │       │ ┌─┬─┬─┬─┬─┬─┬─┐ │        │ (horiz scroll)│
│ ├─┼─┼─┼─┼─┼─┼─┼─┤ │       │ ├─┼─┼─┼─┼─┼─┼─┤ │        │ ┌─┬─┬─┬─┐    │
│ ├─┼─┼─┼─┼─┼─┼─┼─┤ │       │ ├─┼─┼─┼─┼─┼─┼─┤ │        │ ├─┼─┼─┼─┤    │
│ ├─┼─┼─┼─┼─┼─┼─┼─┤ │       │ ├─┼─┼─┼─┼─┼─┼─┤ │        │ ├─┼─┼─┼─┤    │
│ ├─┼─┼─┼─┼─┼─┼─┼─┤ │       │ ├─┼─┼─┼─┼─┼─┼─┤ │        │ └─┴─┴─┴─┘    │
│ └─┴─┴─┴─┴─┴─┴─┴─┘ │       │ └─┴─┴─┴─┴─┴─┴─┘ │        │               │
│                     │       │                  │        ├────────────────┤
├─────────────────────┤       ├──────────────────┤        │ Insights       │
│ Insights            │       │ Insights         │        │ ✓ Item 1       │
│ ✓ Insight 1         │       │ ✓ Item 1         │        │ ✓ Item 2       │
│ ✓ Insight 2         │       │ ✓ Item 2         │        │ ✓ Item 3       │
│ ✓ Insight 3         │       │ ✓ Item 3         │        ├────────────────┤
│ ✓ Insight 4         │       │ ✓ Item 4         │        │ [Export PDF]   │
│ ✓ Insight 5         │       │ ✓ Item 5         │        └────────────────┘
├─────────────────────┤       ├──────────────────┤
│ [Export PDF]        │       │ [Export PDF]     │
└─────────────────────┘       └──────────────────┘
```

---

## Color Code Reference

```
🟢 GREEN (#38b000)
  Used for: Positive changes, growth, good performance
  Example: +15% growth in People card

🔴 RED (#e63946)
  Used for: Negative changes, decline, warning
  Example: -5% activity decline

🔵 BLUE (#4cc9f0)
  Used for: Primary accent, highlights, important data
  Example: Chart lines, card titles, highlights

⬜ GRAY (#cad2c5)
  Used for: Inactive/secondary data, backgrounds
  Example: Inactive users in participation chart

🟦 DARK BLUE (varying opacity)
  Used for: Heat map intensity
  Example: More visits = darker color
```

---

## Data Example

```typescript
Sample Person Record:
{
  id: "person-123",
  name: "Ahmed Khan",
  area: "North",
  dateAdded: "2024-10-15",

  homeVisits: [
    { date: "2025-01-10", visitors: [...], completed: true },
    { date: "2025-01-20", visitors: [...], completed: false },
    { date: "2025-02-05", visitors: [...], completed: true }
  ],

  conversations: [
    { date: "2025-01-15", topic: "Learning goals", notes: "..." },
    { date: "2025-02-01", topic: "Family updates", notes: "..." }
  ],

  jyTexts: [
    { bookNumber: 1, dateCompleted: "2024-12-01" },
    { bookNumber: 2, dateCompleted: "2025-01-20" }
  ]
}

↓ Analytics calculates:

February Analytics (Last Month):
  - New people this month: 0 (dateAdded was Oct 2024)
  - Home visits: 2 (Jan 20, Feb 5)
  - Conversations: 1 (Feb 1)
  - Learning: 0 (already completed in Jan/Dec)
  - Area: North (affects heat map)

↓ Used in Heat Map:

North area, Week 1 (Jan 5-11): 1 visit (Jan 10)
North area, Week 2 (Jan 12-18): 0 visits
North area, Week 3 (Jan 19-25): 1 visit (Jan 20)
North area, Week 4 (Jan 26-Feb 1): 0 visits
North area, Week 5 (Feb 2-8): 1 visit (Feb 5)
```

---

**Visual Guide Version**: 1.0  
**Last Updated**: February 11, 2026  
**Component**: Analytics.tsx
