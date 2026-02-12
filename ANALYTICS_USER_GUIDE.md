# 📊 Analytics Tab - Feature Overview

## Quick Start

Click the **Analytics** tab in the RoomMap Ops navigation to access the dashboard.

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TIME PERIOD SELECTOR                                               │
│  [Last Week] [Last Month] [Last Quarter] [Custom Range]             │
│  └─ Custom: [Start Date] to [End Date] [Apply]                     │
├─────────────────────────────────────────────────────────────────────┤
│  METRICS CARDS (4 Columns)                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐│
│  │   PEOPLE     │ │  ACTIVITIES  │ │  LEARNING    │ │ ENGAGEMENT   ││
│  │  1,234       │ │  89          │ │ Ruhi: 23     │ │ Visits: 156  ││
│  │ New: 45      │ │ New: 12      │ │ JY: 34       │ │ Conv: 89     ││
│  │ +15% ▲       │ │ Connect: 234 │ │ Total: 57    │ │ Families: 67 ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  CHARTS (2 Columns × 2 Rows)                                        │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐   │
│  │ People Added Over Time      │ │ Activity Attendance by Type │   │
│  │ [Line Chart - Weekly]       │ │ [Bar Chart]                 │   │
│  └─────────────────────────────┘ └─────────────────────────────┘   │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐   │
│  │ Participation Status        │ │ Learning Completions       │   │
│  │ [Stacked Area Chart]        │ │ [Grouped Bar Chart]         │   │
│  └─────────────────────────────┘ └─────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│  HEAT MAP: Home Visits by Area Over Time                            │
│  ┌────────────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐ │
│  │ Area Name  │ W1 │ W2 │ W3 │ W4 │ W5 │ W6 │ W7 │ W8 │ W9 │W10│ │
│  ├────────────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤ │
│  │ North      │ 2  │ 5  │ 3  │    │ 4  │ 6  │ 2  │ 3  │    │ 1  │ │
│  │ South      │ 1  │ 2  │ 2  │ 3  │    │ 2  │ 4  │ 1  │ 2  │ 3  │ │
│  │ East       │    │ 1  │    │ 2  │ 1  │    │ 3  │ 2  │ 1  │    │ │
│  │ West       │ 3  │ 2  │ 1  │    │ 2  │ 1  │ 2  │ 1  │ 3  │ 2  │ │
│  └────────────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  KEY INSIGHTS (Auto-Generated)                                      │
│  ✓ Area X has no new activities in 8 weeks                          │
│  ✓ 5 families have no activity connections                          │
│  ✓ Community grew 20% faster than last quarter                      │
│  ✓ JY cohort showing 34% increase in completions                    │
│  ✓ Home visits conducted in 15 of 16 areas this month               │
├─────────────────────────────────────────────────────────────────────┤
│  [📊 Export as PDF]                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1️⃣ Time Period Selection

- **Quick Select**: Buttons for Last Week, Last Month, Last Quarter
- **Custom Range**: Pick any start and end date
- **Real-time Updates**: All data refreshes based on selection

### 2️⃣ Four Metric Cards

| Card           | Metrics                         | Calculation                       |
| -------------- | ------------------------------- | --------------------------------- |
| **People**     | Total, New, % Change            | From `dateAdded` field            |
| **Activities** | Total, New, Connections         | From `people.connectedActivities` |
| **Learning**   | Ruhi, JY, Total                 | From completion dates             |
| **Engagement** | Visits, Conversations, Families | From actual records               |

### 3️⃣ Four Interactive Charts

1. **📈 People Added Over Time** (Line Chart)
   - Shows new member additions by week
   - Helps identify growth trends
2. **📊 Activity Attendance by Type** (Bar Chart)
   - Compares different activity types
   - Shows participation distribution
3. **📉 Participation Status Breakdown** (Stacked Area)
   - Tracks active, inactive, and new members
   - Shows engagement patterns over time
4. **📚 Learning Completions by Week** (Grouped Bars)
   - Ruhi vs. JY completions
   - Identifies learning acceleration/decline

### 4️⃣ Home Visits Heat Map

- **Rows**: Geographic areas
- **Columns**: 12-week rolling window
- **Color Intensity**: More visits = darker blue
- **Interactive**: Hover to see exact counts
- **Use Case**: Identify underserved areas and visit patterns

### 5️⃣ Auto-Generated Insights

Generated from data patterns:

- Areas with limited activity
- People needing engagement
- Community growth metrics
- Learning progress trends
- Engagement distribution

### 6️⃣ PDF Export

- Single click export
- Includes all charts and metrics
- Formatted for printing
- Named `analytics-report.pdf`

## Data Sources

All data pulled directly from application records:

```
People:
  ├─ dateAdded: for new member tracking
  ├─ homeVisits[].date: for engagement metrics
  ├─ conversations[].date: for engagement metrics
  ├─ jyTexts[].dateCompleted: for learning tracking
  ├─ studyCircleBooks[].dateCompleted: for learning tracking
  ├─ connections: for relationship tracking
  └─ area: for geographic analysis

Activities:
  ├─ dateAdded: (currently all activities counted)
  ├─ type: for activity categorization
  └─ participantIds: for connection tracking
```

## Responsive Design

- **Desktop**: Full 4-column layout with detailed charts
- **Tablet**: 2-column cards, adjusted chart sizing
- **Mobile**: Single column, compact heat map

## Performance

- ✅ All calculations memoized (runs only when data changes)
- ✅ Charts optimized with Recharts
- ✅ PDF export: 1-2 seconds
- ✅ Smooth animations and transitions
- ✅ No blocking operations

## Customization Tips

### Changing Time Periods

Click any period button to instantly update all metrics:

```
Last Week  → 7 days back
Last Month → 30 days back
Last Quarter → 90 days back
Custom → Select your own range
```

### Heat Map Color Intensity

Colors range from light (few visits) to dark (many visits):

- 0 visits: Light gray
- 1-2 visits: Light blue
- 3+ visits: Darker blue

### Insight Generation

Insights trigger automatically based on:

- Areas with zero activity
- People with no connections
- Growth percentage changes
- Learning completion totals
- Engagement distribution

## Export Workflow

```
1. Filter to desired time period
2. Review metrics and charts
3. Click "Export as PDF"
4. Wait 1-2 seconds for rendering
5. PDF downloads automatically
6. Use for reports, presentations, archives
```

## Future Enhancements

- [ ] Export to Excel with multiple sheets
- [ ] Scheduled automated reports
- [ ] Side-by-side period comparisons
- [ ] Area/category specific filtering
- [ ] Custom metric definitions
- [ ] Predictive trend analysis
- [ ] Drill-down to individual records
- [ ] Real-time dashboard updates

---

**Component**: `src/Analytics.tsx` (630 lines)  
**Styling**: Included in `src/styles.css` (400+ lines)  
**Status**: ✅ Production Ready  
**Dependencies**: Recharts, html2canvas, jsPDF
