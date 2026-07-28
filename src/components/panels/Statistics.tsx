import React, { useState } from "react";
import { useApp } from "../../context";
import { getAreaList } from "../../utils";

interface StatisticsProps {
  onAddFamily?: () => void;
}

export const Statistics: React.FC<StatisticsProps> = ({ onAddFamily }) => {
  const { people, activities, families, viewMode, updatePerson, updateActivity } =
    useApp();

  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const handleRenameArea = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingArea(null);
      return;
    }
    for (const p of people) {
      if (p.area?.trim() === oldName) updatePerson(p.id, { area: trimmed });
    }
    for (const a of activities) {
      if (a.area?.trim() === oldName) updateActivity(a.id, { area: trimmed });
    }
    setEditingArea(null);
  };

  if (viewMode === "people") {
    const areas = getAreaList(people);
    const areaStats: Record<string, number> = {};
    areas.forEach((area) => {
      areaStats[area] = people.filter((p) => p.area === area).length;
    });

    return (
      <div className="stats-breakdown">
        <h4>Statistics</h4>
        <div>
          <h5>People by Area</h5>
          {areas.length === 0 ? (
            <p>No areas defined</p>
          ) : (
            areas.map((area) => (
              <div key={area} style={{ marginBottom: "0.35rem" }}>
                {editingArea === area ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRenameArea(area, editDraft);
                    }}
                    style={{ display: "flex", gap: 4, alignItems: "center" }}
                  >
                    <input
                      autoFocus
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      style={{
                        flex: 1,
                        fontSize: 12,
                        padding: "2px 6px",
                        border: "1px solid #6366f1",
                        borderRadius: 4,
                        outline: "none",
                      }}
                    />
                    <button type="submit" className="btn btn--sm btn--primary" style={{ padding: "2px 7px", fontSize: 11 }}>
                      Save
                    </button>
                    <button type="button" className="btn btn--sm" style={{ padding: "2px 7px", fontSize: 11 }} onClick={() => setEditingArea(null)}>
                      ✕
                    </button>
                  </form>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ flex: 1 }}>{area}: {areaStats[area]}</span>
                    <button
                      title="Rename area"
                      onClick={() => { setEditingArea(area); setEditDraft(area); }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px", color: "#9ca3af", fontSize: 12, lineHeight: 1 }}
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (viewMode === "families") {
    const familyCounts: Record<string, number> = {};
    families.forEach((family) => {
      familyCounts[family.familyName] = people.filter(
        (p) => p.familyId === family.id || p.familyId === family.familyName,
      ).length;
    });

    const sortedFamilies = Object.keys(familyCounts).sort();

    return (
      <div className="stats-breakdown">
        <h4>Statistics</h4>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.5rem",
          }}
        >
          <h5 style={{ margin: 0 }}>Families</h5>
          <button className="btn btn--sm btn--primary" onClick={onAddFamily}>
            + Family
          </button>
        </div>
        {families.length === 0 ? (
          <p>No families defined</p>
        ) : (
          sortedFamilies.map((name) => (
            <p key={name}>
              {name}: {familyCounts[name]} members
            </p>
          ))
        )}
      </div>
    );
  }

  if (viewMode === "activities") {
    const counts: Record<string, number> = {
      JY: 0,
      CC: 0,
      "Study Circle": 0,
      Devotional: 0,
    };
    let totalParticipation = 0;

    activities.forEach((activity) => {
      if (activity.type in counts) counts[activity.type]++;

      const connectedPeople = people.filter((p) =>
        p.connectedActivities.includes(activity.id),
      ).length;
      totalParticipation += connectedPeople;
    });

    const avgParticipation =
      activities.length > 0
        ? (totalParticipation / activities.length).toFixed(1)
        : 0;

    return (
      <div className="stats-breakdown">
        <h4>Statistics</h4>
        <div>
          <h5>Activity Types</h5>
          <p>JY: {counts.JY}</p>
          <p>CC: {counts.CC}</p>
          <p>Study Circle: {counts["Study Circle"]}</p>
          <p>Devotional: {counts.Devotional}</p>
          <h5 style={{ marginTop: "1rem" }}>Participation</h5>
          <p>Total Connections: {totalParticipation}</p>
          <p>Avg per Activity: {avgParticipation}</p>
        </div>
      </div>
    );
  }

  return null;
};
