import React, { useEffect, useState } from "react";
import { useApp } from "../../context";

interface ConnectedActivitiesSectionProps {
  personId: string;
  connectedActivities: string[];
}

export const ConnectedActivitiesSection: React.FC<
  ConnectedActivitiesSectionProps
> = ({ personId, connectedActivities }) => {
  const { people, activities, updatePerson } = useApp();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(
    new Set(connectedActivities),
  );

  useEffect(() => {
    setSelectedActivityIds(new Set(connectedActivities));
    setIsEditMode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  const person = people.find((p) => p.id === personId);
  if (!person) return null;

  const connectedActivityObjects = activities.filter((a) =>
    connectedActivities.includes(a.id),
  );

  const handleToggleActivity = (activityId: string) => {
    const next = new Set(selectedActivityIds);
    if (next.has(activityId)) {
      next.delete(activityId);
    } else {
      next.add(activityId);
    }
    setSelectedActivityIds(next);
  };

  const handleSaveConnections = () => {
    const nextConnected = Array.from(selectedActivityIds);
    updatePerson(personId, {
      connectedActivities: nextConnected,
    });
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setSelectedActivityIds(new Set(connectedActivities));
    setIsEditMode(false);
  };

  return (
    <div
      style={{
        marginTop: "1.5rem",
        paddingTop: "1rem",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "0.95rem" }}>Connected Activities</h3>
        {!isEditMode && (
          <button className="btn btn--sm" onClick={() => setIsEditMode(true)}>
            {connectedActivityObjects.length > 0 ? "Edit" : "Add"}
          </button>
        )}
      </div>

      {isEditMode ? (
        <div>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            <div className="form-row">
              {activities.map((activity) => (
                <label
                  key={activity.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.5rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedActivityIds.has(activity.id)}
                    onChange={() => handleToggleActivity(activity.id)}
                  />
                  <span style={{ fontSize: "0.875rem" }}>
                    {activity.name} ({activity.type})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button
              className="btn btn--sm btn--primary"
              onClick={handleSaveConnections}
            >
              Save
            </button>
            <button className="btn btn--sm" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : connectedActivityObjects.length > 0 ? (
        <div className="chip-row">
          {connectedActivityObjects.map((activity) => (
            <span key={activity.id} className="chip chip--muted">
              {activity.name}
              <span style={{ opacity: 0.7, marginLeft: "0.25rem" }}>
                ({activity.type})
              </span>
            </span>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, color: "#888", fontSize: "0.875rem" }}>
          No connected activities
        </p>
      )}
    </div>
  );
};
