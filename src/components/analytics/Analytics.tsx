import React, { memo } from "react";
import { useApp } from "../../context";
import { AnalyticsErrorBoundary } from "../errors";
import { MetricsCard } from "./MetricsCard";
import { AgeGroupBreakdown } from "./AgeGroupBreakdown";
import { ActivityBreakdown } from "./ActivityBreakdown";
import { ConnectionStats } from "./ConnectionStats";
import { LearningProgress } from "./LearningProgress";
import { AreaBreakdown } from "./AreaBreakdown";
import { GrowthOverTime } from "./GrowthOverTime";
import { useAnalyticsMetrics } from "../../hooks";

/**
 * Main Analytics Dashboard Component
 *
 * This is the entry point for the analytics feature. It:
 * - Fetches data from context
 * - Calculates metrics using custom hook
 * - Renders sub-components with memoization for performance
 * - Wraps everything in error boundaries for safety
 */
const AnalyticsContent: React.FC = memo(() => {
  const { people, activities, families } = useApp();

  // Use custom hook for all metric calculations with data validation
  const metrics = useAnalyticsMetrics(people, activities, families);

  return (
    <div className="analytics">
      <GrowthOverTime people={people} activities={activities} />
      <h2>Community Overview</h2>

      <div className="analytics__summary">
        {/* Totals Card */}
        <MetricsCard title="Totals" icon="📊">
          <div className="summary-grid">
            <div>
              <strong>{metrics.totalPeople}</strong> People
            </div>
            <div>
              <strong>{metrics.totalFamilies}</strong> Families
            </div>
            <div>
              <strong>{metrics.totalActivities}</strong> Activities
            </div>
          </div>
        </MetricsCard>

        {/* Age Groups Card */}
        <MetricsCard title="Age Groups" icon="👥">
          <AgeGroupBreakdown
            ageGroups={metrics.ageGroups}
            ageGroupCounts={metrics.ageGroupCounts}
            total={metrics.totalPeople}
          />
        </MetricsCard>

        {/* Activities Card */}
        <MetricsCard title="Activities" icon="🎯">
          <ActivityBreakdown
            activityCounts={metrics.activityCounts}
            total={metrics.totalActivities}
          />
        </MetricsCard>

        {/* Connections Card */}
        <MetricsCard title="Connections" icon="🔗">
          <ConnectionStats
            connectedPeople={metrics.connectedPeople}
            disconnectedPeople={metrics.disconnectedPeople}
            total={metrics.totalPeople}
          />
        </MetricsCard>
      </div>

      {/* Learning Progress Section */}
      <div className="analytics__section">
        <h3>📚 Learning Progress</h3>
        <LearningProgress
          peopleWithRuhi={metrics.peopleWithRuhi}
          peopleWithJY={metrics.peopleWithJY}
        />
      </div>

      {/* Area Breakdown Section */}
      <div className="analytics__section">
        <h3>📍 By Area</h3>
        <AreaBreakdown
          areaCounts={metrics.areaCounts}
          total={metrics.totalPeople}
        />
      </div>
    </div>
  );
});

AnalyticsContent.displayName = "AnalyticsContent";

/**
 * Analytics Component with Error Boundary
 * Wraps the analytics content in error boundary for safety
 */
const Analytics: React.FC = () => {
  return (
    <AnalyticsErrorBoundary>
      <AnalyticsContent />
    </AnalyticsErrorBoundary>
  );
};

export default Analytics;
