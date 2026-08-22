import React, { useMemo } from "react";
import { useApp } from "../../context";
import { CIRCLES, useCirclePeriods } from "../circles/useCirclePeriods";
import { ActivityType } from "../../types";

const PROGRAM_TYPES: ActivityType[] = ["JY", "CC", "Study Circle", "Devotional"];
const ACTING_CIRCLE_IDS = ["protagonists", "facilitating", "accompanying"];

const LSAReport: React.FC = () => {
  const { people, activities } = useApp();
  const {
    periods,
    activePId,
    setActivePId,
    activePeriod,
    setNarrative,
    setGoals,
  } = useCirclePeriods();

  const programCounts = useMemo(() => {
    const activitiesById = new Map(activities.map((a) => [a.id, a]));
    const byType = new Map<ActivityType, Set<string>>(
      PROGRAM_TYPES.map((t) => [t, new Set<string>()]),
    );
    people.forEach((p) => {
      (p.connectedActivities || []).forEach((actId) => {
        const act = activitiesById.get(actId);
        if (act && byType.has(act.type)) byType.get(act.type)!.add(p.id);
      });
    });
    const total = new Set<string>();
    byType.forEach((set) => set.forEach((id) => total.add(id)));
    return {
      byType: PROGRAM_TYPES.map((type) => ({
        type,
        count: byType.get(type)!.size,
      })),
      total: total.size,
    };
  }, [people, activities]);

  const acting = ACTING_CIRCLE_IDS.reduce(
    (sum, id) => sum + (activePeriod?.numbers[id] ?? 0),
    0,
  );

  return (
    <div className="lsa-root">
      <div className="lsa-toolbar">
        <label className="lsa-period-select">
          <span className="muted">Reporting Period</span>
          <select
            className="form-select"
            value={activePId}
            onChange={(e) => setActivePId(e.target.value)}
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="btn btn--primary btn--sm"
          onClick={() => window.print()}
        >
          Print / Export PDF
        </button>
      </div>

      <div className="lsa-report">
        <h2 className="lsa-title">Community Report — {activePeriod?.label}</h2>

        <section className="lsa-section">
          <h3>Pattern of Activity</h3>
          <textarea
            className="form-textarea lsa-textarea"
            value={activePeriod?.narrative || ""}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder="Describe the pattern of activity in the neighborhood this period..."
            rows={5}
          />
        </section>

        <section className="lsa-section">
          <h3>Numbers</h3>

          <h4 className="lsa-subhead">Concentric Circles</h4>
          <div className="lsa-stat-grid">
            {CIRCLES.map((c) => (
              <div
                key={c.id}
                className="lsa-stat"
                style={{ borderColor: c.stroke }}
              >
                <div className="lsa-stat-value" style={{ color: c.stroke }}>
                  {activePeriod?.numbers[c.id] ?? 0}
                </div>
                <div className="lsa-stat-label">{c.name}</div>
              </div>
            ))}
          </div>

          <h4 className="lsa-subhead">People Formally in Programs</h4>
          <div className="lsa-stat-grid">
            {programCounts.byType.map(({ type, count }) => (
              <div key={type} className="lsa-stat">
                <div className="lsa-stat-value">{count}</div>
                <div className="lsa-stat-label">{type}</div>
              </div>
            ))}
            <div className="lsa-stat lsa-stat--total">
              <div className="lsa-stat-value">{programCounts.total}</div>
              <div className="lsa-stat-label">Total, any program</div>
            </div>
          </div>
        </section>

        <section className="lsa-section">
          <h3>Goals</h3>
          <textarea
            className="form-textarea lsa-textarea"
            value={activePeriod?.goals || ""}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="What are the community's goals for the next period?"
            rows={4}
          />
        </section>

        <section className="lsa-section">
          <h3>People Acting</h3>
          <div className="lsa-stat lsa-stat--big">
            <div className="lsa-stat-value">{acting}</div>
            <div className="lsa-stat-label">
              Protagonists + Facilitating Education + Accompanying
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LSAReport;
