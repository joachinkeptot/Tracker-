import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useApp } from "./AppContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type TimePeriod = "week" | "month" | "quarter" | "custom";

interface DateRange {
  start: Date;
  end: Date;
}

const Analytics: React.FC = () => {
  const { people, activities } = useApp();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("month");
  const [customRange, setCustomRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });
  const [showCustomRange, setShowCustomRange] = useState(false);

  // Calculate date ranges
  const getDateRange = (period: TimePeriod): DateRange => {
    const end = new Date();
    let start = new Date();

    switch (period) {
      case "week":
        start.setDate(end.getDate() - 7);
        break;
      case "month":
        start.setMonth(end.getMonth() - 1);
        break;
      case "quarter":
        start.setMonth(end.getMonth() - 3);
        break;
      case "custom":
        return customRange;
    }

    return { start, end };
  };

  const getPreviousRange = (range: DateRange): DateRange => {
    const duration = range.end.getTime() - range.start.getTime();
    return {
      start: new Date(range.start.getTime() - duration),
      end: new Date(range.start.getTime()),
    };
  };

  const currentRange =
    timePeriod === "custom" ? customRange : getDateRange(timePeriod);
  const previousRange = getPreviousRange(currentRange);

  // Metrics calculations
  const metrics = useMemo(() => {
    // Filter people by date
    const peopleInPeriod = people.filter((p) => {
      const dateAdded = p.dateAdded ? new Date(p.dateAdded) : new Date(0);
      return dateAdded >= currentRange.start && dateAdded <= currentRange.end;
    });

    const peopleInPreviousPeriod = people.filter((p) => {
      const dateAdded = p.dateAdded ? new Date(p.dateAdded) : new Date(0);
      return dateAdded >= previousRange.start && dateAdded <= previousRange.end;
    });

    // Filter activities by date
    const activitiesInPeriod = activities.filter(() => {
      // Activities don't have dateAdded, so count all activities
      return true;
    });

    // Count home visits and conversations in period
    const homeVisits = people.flatMap((p) =>
      (p.homeVisits || []).filter((hv) => {
        const hvDate = new Date(hv.date);
        return hvDate >= currentRange.start && hvDate <= currentRange.end;
      }),
    );

    const conversations = people.flatMap((p) =>
      (p.conversations || []).filter((c) => {
        const convDate = new Date(c.date);
        return convDate >= currentRange.start && convDate <= currentRange.end;
      }),
    );

    // Count Ruhi completions
    const ruhiCompletions = people.filter((p) =>
      (p.studyCircleBooks || []).some((rb: any) => {
        const completeDate = rb.dateCompleted
          ? new Date(rb.dateCompleted)
          : null;
        return (
          completeDate &&
          completeDate >= currentRange.start &&
          completeDate <= currentRange.end
        );
      }),
    ).length;

    // Count JY completions
    const jyCompletions = people.filter((p) =>
      (p.jyTexts || []).some((jy: any) => {
        const completeDate =
          typeof jy === "string"
            ? null
            : typeof jy.dateCompleted === "string"
              ? new Date(jy.dateCompleted)
              : jy.dateCompleted;
        return (
          completeDate &&
          completeDate >= currentRange.start &&
          completeDate <= currentRange.end
        );
      }),
    ).length;

    // Count total connections
    const totalConnections = people.filter(
      (p) => p.connections && p.connections.length > 0,
    ).length;

    // Count families contacted
    const familiesContacted = new Set(people.map((p) => p.familyId)).size;

    // Calculate percent change
    const totalPeoplePrevious = peopleInPreviousPeriod.length;
    const totalPeopleCurrent = people.length;
    const peoplePercentChange =
      totalPeoplePrevious > 0
        ? (
            ((totalPeopleCurrent - totalPeoplePrevious) / totalPeoplePrevious) *
            100
          ).toFixed(1)
        : peopleInPeriod.length > 0
          ? "100"
          : "0";

    return {
      totalPeople: people.length,
      newPeopleThisPeriod: peopleInPeriod.length,
      peoplePercentChange: parseFloat(peoplePercentChange),
      totalActivities: activities.length,
      newActivitiesThisPeriod: activitiesInPeriod.length,
      totalConnections,
      ruhiCompletions,
      jyCompletions,
      homeVisitsCount: homeVisits.length,
      conversationsCount: conversations.length,
      familiesContactedCount: familiesContacted,
    };
  }, [people, activities, currentRange, previousRange]);

  // Chart data: People added over time
  const peopleByWeek = useMemo(() => {
    const weeks: Map<string, number> = new Map();
    const startDate = new Date(currentRange.start);

    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      if (weekStart > currentRange.end) break;

      const weekKey = `Week ${i + 1}`;
      const count = people.filter((p) => {
        const dateAdded = p.dateAdded ? new Date(p.dateAdded) : new Date(0);
        return dateAdded >= weekStart && dateAdded < weekEnd;
      }).length;

      weeks.set(weekKey, count);
    }

    return Array.from(weeks, ([name, value]) => ({ name, value }));
  }, [people, currentRange]);

  // Chart data: Activity attendance by type
  const activityByType = useMemo(() => {
    const types: Map<string, number> = new Map();

    activities.forEach((a) => {
      const count = types.get(a.type) || 0;
      types.set(a.type, count + 1);
    });

    return Array.from(types, ([name, value]) => ({ name, value }));
  }, [activities]);

  // Chart data: Participation status breakdown
  const participationByWeek = useMemo(() => {
    const weeks: Map<
      string,
      { active: number; inactive: number; new: number }
    > = new Map();
    const startDate = new Date(currentRange.start);

    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      if (weekStart > currentRange.end) break;

      const weekKey = `W${i + 1}`;
      const active = people.filter((p) => {
        const hasRecentActivity = (p.homeVisits || []).some((hv) => {
          const hvDate = new Date(hv.date);
          return hvDate >= weekStart && hvDate < weekEnd;
        });
        return hasRecentActivity;
      }).length;

      const newPeople = people.filter((p) => {
        const dateAdded = p.dateAdded ? new Date(p.dateAdded) : new Date(0);
        return dateAdded >= weekStart && dateAdded < weekEnd;
      }).length;

      const inactive = people.length - active - newPeople;

      weeks.set(weekKey, { active, inactive, new: newPeople });
    }

    return Array.from(weeks, ([name, data]) => ({ name, ...data }));
  }, [people, currentRange]);

  // Chart data: Learning completions by week
  const learningByWeek = useMemo(() => {
    const weeks: Map<string, { ruhi: number; jy: number }> = new Map();
    const startDate = new Date(currentRange.start);

    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      if (weekStart > currentRange.end) break;

      const weekKey = `W${i + 1}`;

      const ruhi = people.filter((p) =>
        (p.studyCircleBooks || []).some((rb: any) => {
          const completeDate = rb.dateCompleted
            ? new Date(rb.dateCompleted)
            : null;
          return (
            completeDate && completeDate >= weekStart && completeDate < weekEnd
          );
        }),
      ).length;

      const jy = people.filter((p) =>
        (p.jyTexts || []).some((jy: any) => {
          const completeDate =
            typeof jy === "string"
              ? null
              : typeof jy.dateCompleted === "string"
                ? new Date(jy.dateCompleted)
                : jy.dateCompleted;
          return (
            completeDate && completeDate >= weekStart && completeDate < weekEnd
          );
        }),
      ).length;

      weeks.set(weekKey, { ruhi, jy });
    }

    return Array.from(weeks, ([name, data]) => ({ name, ...data }));
  }, [people, currentRange]);

  // Heat map data: Home visits by area
  const heatmapData = useMemo(() => {
    const areas: Map<string, Map<number, number>> = new Map();
    const startDate = new Date(currentRange.start);

    people.forEach((p) => {
      if (!areas.has(p.area)) {
        areas.set(p.area, new Map());
      }

      (p.homeVisits || []).forEach((hv) => {
        const hvDate = new Date(hv.date);
        if (hvDate >= currentRange.start && hvDate <= currentRange.end) {
          const weekNum = Math.floor(
            (hvDate.getTime() - startDate.getTime()) /
              (7 * 24 * 60 * 60 * 1000),
          );
          const areaMap = areas.get(p.area)!;
          areaMap.set(weekNum, (areaMap.get(weekNum) || 0) + 1);
        }
      });
    });

    return Array.from(areas, ([area, weeks]) => ({
      area,
      weeks: Array.from(weeks, ([week, count]) => ({ week, count })),
    }));
  }, [people, currentRange]);

  // Generate insights
  const insights = useMemo(() => {
    const insightsList: string[] = [];

    // Insight 1: Areas with no recent activities
    const areaActivityMap = new Map<string, number>();
    people.forEach((p) => {
      areaActivityMap.set(
        p.area,
        (areaActivityMap.get(p.area) || 0) +
          ((p.homeVisits || []).length + (p.conversations || []).length),
      );
    });

    const inactiveAreas = Array.from(areaActivityMap)
      .filter(([_, count]) => count === 0)
      .map(([area]) => area);

    if (inactiveAreas.length > 0) {
      insightsList.push(
        `Area${inactiveAreas.length > 1 ? "s" : ""} ${inactiveAreas.join(", ")} ${inactiveAreas.length > 1 ? "have" : "has"} no recorded activities.`,
      );
    }

    // Insight 2: Families with no connections
    const familiesWithNoConnections = people.filter(
      (p) => !p.connections || p.connections.length === 0,
    ).length;

    if (familiesWithNoConnections > 0) {
      insightsList.push(
        `${familiesWithNoConnections} ${familiesWithNoConnections === 1 ? "person" : "people"} ${familiesWithNoConnections === 1 ? "has" : "have"} no activity connections.`,
      );
    }

    // Insight 3: Growth trends
    if (metrics.peoplePercentChange > 0) {
      insightsList.push(
        `Community grew by ${metrics.peoplePercentChange}% this period with ${metrics.newPeopleThisPeriod} new ${metrics.newPeopleThisPeriod === 1 ? "person" : "people"}.`,
      );
    }

    // Insight 4: Learning progress
    const totalLearning = metrics.ruhiCompletions + metrics.jyCompletions;
    if (totalLearning > 0) {
      insightsList.push(
        `${totalLearning} learning courses completed this period (${metrics.ruhiCompletions} Ruhi, ${metrics.jyCompletions} JY).`,
      );
    }

    // Insight 5: Engagement
    if (metrics.homeVisitsCount > 0 || metrics.conversationsCount > 0) {
      insightsList.push(
        `${metrics.homeVisitsCount + metrics.conversationsCount} total engagements logged (${metrics.homeVisitsCount} visits, ${metrics.conversationsCount} conversations).`,
      );
    }

    return insightsList.slice(0, 5);
  }, [metrics, people]);

  // Export to PDF
  const handleExportPDF = async () => {
    const element = document.getElementById("analytics-report");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save("analytics-report.pdf");
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF");
    }
  };

  return (
    <div id="analytics-report" className="analytics">
      {/* Time Period Selector */}
      <div className="analytics__header">
        <div className="analytics__period-selector">
          <button
            className={`btn ${timePeriod === "week" ? "btn--active" : ""}`}
            onClick={() => {
              setTimePeriod("week");
              setShowCustomRange(false);
            }}
          >
            Last Week
          </button>
          <button
            className={`btn ${timePeriod === "month" ? "btn--active" : ""}`}
            onClick={() => {
              setTimePeriod("month");
              setShowCustomRange(false);
            }}
          >
            Last Month
          </button>
          <button
            className={`btn ${timePeriod === "quarter" ? "btn--active" : ""}`}
            onClick={() => {
              setTimePeriod("quarter");
              setShowCustomRange(false);
            }}
          >
            Last Quarter
          </button>
          <button
            className={`btn ${timePeriod === "custom" ? "btn--active" : ""}`}
            onClick={() => setShowCustomRange(!showCustomRange)}
          >
            Custom Range
          </button>
        </div>

        {/* Custom Range Picker */}
        {showCustomRange && (
          <div className="analytics__custom-range">
            <input
              type="date"
              value={customRange.start.toISOString().split("T")[0]}
              onChange={(e) =>
                setCustomRange({
                  ...customRange,
                  start: new Date(e.target.value),
                })
              }
            />
            <span>to</span>
            <input
              type="date"
              value={customRange.end.toISOString().split("T")[0]}
              onChange={(e) =>
                setCustomRange({
                  ...customRange,
                  end: new Date(e.target.value),
                })
              }
            />
            <button
              className="btn"
              onClick={() => {
                setTimePeriod("custom");
                setShowCustomRange(false);
              }}
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="analytics__metrics">
        <div className="metrics-card">
          <h3>People</h3>
          <div className="metrics-card__value">{metrics.totalPeople}</div>
          <div className="metrics-card__detail">
            <span className="metrics-card__label">New this period:</span>
            <span className="metrics-card__number">
              {metrics.newPeopleThisPeriod}
            </span>
          </div>
          <div
            className={`metrics-card__change ${metrics.peoplePercentChange >= 0 ? "positive" : "negative"}`}
          >
            {metrics.peoplePercentChange >= 0 ? "+" : ""}
            {metrics.peoplePercentChange}% vs previous
          </div>
        </div>

        <div className="metrics-card">
          <h3>Activities</h3>
          <div className="metrics-card__value">{metrics.totalActivities}</div>
          <div className="metrics-card__detail">
            <span className="metrics-card__label">New this period:</span>
            <span className="metrics-card__number">
              {metrics.newActivitiesThisPeriod}
            </span>
          </div>
          <div className="metrics-card__detail">
            <span className="metrics-card__label">Total connections:</span>
            <span className="metrics-card__number">
              {metrics.totalConnections}
            </span>
          </div>
        </div>

        <div className="metrics-card">
          <h3>Learning</h3>
          <div className="metrics-card__detail">
            <span className="metrics-card__label">Ruhi completions:</span>
            <span className="metrics-card__number">
              {metrics.ruhiCompletions}
            </span>
          </div>
          <div className="metrics-card__detail">
            <span className="metrics-card__label">JY completions:</span>
            <span className="metrics-card__number">
              {metrics.jyCompletions}
            </span>
          </div>
          <div className="metrics-card__total">
            {metrics.ruhiCompletions + metrics.jyCompletions} total
          </div>
        </div>

        <div className="metrics-card">
          <h3>Engagement</h3>
          <div className="metrics-card__detail">
            <span className="metrics-card__label">Home visits:</span>
            <span className="metrics-card__number">
              {metrics.homeVisitsCount}
            </span>
          </div>
          <div className="metrics-card__detail">
            <span className="metrics-card__label">Conversations:</span>
            <span className="metrics-card__number">
              {metrics.conversationsCount}
            </span>
          </div>
          <div className="metrics-card__detail">
            <span className="metrics-card__label">Families contacted:</span>
            <span className="metrics-card__number">
              {metrics.familiesContactedCount}
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="analytics__charts">
        <div className="analytics__chart-group">
          <div className="analytics__chart">
            <h3>People Added Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={peopleByWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#4cc9f0"
                  name="New People"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="analytics__chart">
            <h3>Activity Attendance by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#72ddf7" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="analytics__chart-group">
          <div className="analytics__chart">
            <h3>Participation Status Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={participationByWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="active"
                  stackId="1"
                  fill="#90e0ef"
                  name="Active"
                />
                <Area
                  type="monotone"
                  dataKey="inactive"
                  stackId="1"
                  fill="#cad2c5"
                  name="Inactive"
                />
                <Area
                  type="monotone"
                  dataKey="new"
                  stackId="1"
                  fill="#00b4d8"
                  name="New"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="analytics__chart">
            <h3>Learning Completions by Week</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={learningByWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="ruhi" fill="#4cc9f0" name="Ruhi" />
                <Bar dataKey="jy" fill="#72ddf7" name="JY" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Heat Map */}
      <div className="analytics__heatmap">
        <h3>Home Visits by Area Over Time</h3>
        <div className="heatmap-container">
          {heatmapData.length > 0 ? (
            <table className="heatmap-table">
              <tbody>
                {heatmapData.map((row) => (
                  <tr key={row.area}>
                    <td className="heatmap-label">{row.area}</td>
                    {Array.from({ length: 12 }).map((_, weekIdx) => {
                      const visitCount =
                        row.weeks.find((w) => w.week === weekIdx)?.count || 0;
                      const intensity = Math.min(visitCount / 3, 1);
                      const color = `rgba(76, 201, 240, ${intensity})`;
                      return (
                        <td
                          key={`${row.area}-${weekIdx}`}
                          className="heatmap-cell"
                          style={{ backgroundColor: color }}
                          title={`${row.area} - Week ${weekIdx + 1}: ${visitCount} visits`}
                        >
                          {visitCount > 0 && visitCount}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="heatmap-empty">
              No home visit data available for selected period
            </p>
          )}
        </div>
      </div>

      {/* Insights */}
      <div className="analytics__insights">
        <h3>Key Insights</h3>
        <ul className="insights-list">
          {insights.map((insight, idx) => (
            <li key={idx} className="insight-item">
              {insight}
            </li>
          ))}
        </ul>
      </div>

      {/* Export Button */}
      <div className="analytics__actions">
        <button className="btn btn--primary" onClick={handleExportPDF}>
          📊 Export as PDF
        </button>
      </div>
    </div>
  );
};

export default Analytics;
