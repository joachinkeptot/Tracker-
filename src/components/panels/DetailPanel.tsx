import React from "react";
import { useApp } from "../../context";
import { HomeVisitSection } from "./HomeVisitSection";
import { ConversationSection } from "./ConversationSection";
import { ActivityReflections } from "./ActivityReflections";
import { ConnectedActivitiesSection } from "./ConnectedActivitiesSection";

interface DetailPanelProps {
  onEdit?: (id: string) => void;
  onEditActivity?: (id: string) => void;
  onEditFamily?: (id: string) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  onEdit,
  onEditActivity,
  onEditFamily,
}) => {
  const {
    selected,
    people,
    activities,
    families,
    deletePerson,
    deleteFamily,
    deleteActivity,
  } = useApp();

  if (!selected.id) {
    return <div className="detail">Select a node to see details.</div>;
  }

  if (selected.type === "families") {
    const family = families.find((f) => f.id === selected.id);
    if (!family)
      return <div className="detail">Select a node to see details.</div>;

    const members = people.filter((p) => p.familyId === family.id);

    return (
      <div className="detail">
        <h4>{family.familyName}</h4>
        <p>
          <strong>Primary Area:</strong> {family.primaryArea || "-"}
        </p>
        <p>
          <strong>Phone:</strong> {family.phone || "-"}
        </p>
        <p>
          <strong>Email:</strong> {family.email || "-"}
        </p>
        <p>
          <strong>Members:</strong> {members.length}
        </p>
        {family.notes && (
          <p>
            <strong>Notes:</strong> {family.notes}
          </p>
        )}
        {members.length > 0 && (
          <div style={{ marginTop: "0.75rem" }}>
            <strong>Member List:</strong>
            <div className="chip-row" style={{ marginTop: "0.5rem" }}>
              {members.map((member) => (
                <span key={member.id} className="chip chip--muted">
                  {member.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button
            className="btn btn--primary"
            style={{ flex: 1 }}
            onClick={() => onEditFamily?.(family.id)}
          >
            Edit
          </button>
          <button
            className="btn"
            style={{ flex: 1, background: "#ef4444", color: "white" }}
            onClick={() => {
              if (confirm("Are you sure you want to delete this family?"))
                deleteFamily(family.id);
            }}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  if (selected.type === "people") {
    const person = people.find((p) => p.id === selected.id);
    if (!person)
      return <div className="detail">Select a node to see details.</div>;

    const activityNames =
      person.connectedActivities
        .map((actId) => activities.find((a) => a.id === actId)?.name)
        .filter(Boolean)
        .join(", ") || "-";

    const familyName = person.familyId
      ? families.find((f) => f.id === person.familyId)?.familyName ||
        "Unknown Family"
      : "-";

    return (
      <div className="detail">
        <h4>{person.name}</h4>
        <p>
          <strong>Family:</strong> {familyName}
        </p>
        <p>
          <strong>Area:</strong> {person.area || "-"}
        </p>
        <p>
          <strong>Age Group:</strong> {person.ageGroup}
        </p>
        <p>
          <strong>Employment:</strong> {person.employmentStatus}
        </p>
        {person.schoolName && (
          <p>
            <strong>School:</strong> {person.schoolName}
          </p>
        )}
        <p>
          <strong>Parent / Elder:</strong>{" "}
          {person.isParent || person.isElder
            ? [
                person.isParent ? "Parent" : null,
                person.isElder ? "Elder" : null,
              ]
                .filter(Boolean)
                .join(", ")
            : "-"}
        </p>
        <p>
          <strong>Connected Activities:</strong> {activityNames}
        </p>
        <p>
          <strong>Connections:</strong> {person.connections.length} person(s)
        </p>
        <p>
          <strong>Home Visits:</strong> {person.homeVisits.length}
        </p>
        <p>
          <strong>Conversations:</strong> {person.conversations.length}
        </p>
        <p>
          <strong>JY Texts:</strong>{" "}
          {person.jyTexts && person.jyTexts.length > 0
            ? person.jyTexts
                .map((j) =>
                  j.bookName
                    ? j.bookName
                    : typeof j === "string"
                      ? j
                      : `Book ${j.bookNumber}`,
                )
                .join(", ")
            : "-"}
        </p>
        <p>
          <strong>Study Circles:</strong>{" "}
          {person.studyCircleBooks && person.studyCircleBooks.length > 0
            ? person.studyCircleBooks
                .map((b) => b.bookName || `Book ${b.bookNumber}`)
                .join(", ")
            : "-"}
        </p>
        <p>
          <strong>Notes:</strong> {person.notes || "-"}
        </p>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button
            className="btn btn--primary"
            style={{ flex: 1 }}
            onClick={() => onEdit?.(person.id)}
          >
            Edit
          </button>
          <button
            className="btn"
            style={{ flex: 1, background: "#ef4444", color: "white" }}
            onClick={() => {
              if (confirm("Are you sure you want to delete this person?"))
                deletePerson(person.id);
            }}
          >
            Delete
          </button>
        </div>

        <HomeVisitSection personId={person.id} homeVisits={person.homeVisits} />
        <ConversationSection
          personId={person.id}
          conversations={person.conversations}
        />
        <ConnectedActivitiesSection
          personId={person.id}
          connectedActivities={person.connectedActivities || []}
        />
      </div>
    );
  }

  const activity = activities.find((a) => a.id === selected.id);
  if (!activity)
    return <div className="detail">Select a node to see details.</div>;

  const typeLabel: Record<string, string> = {
    JY: "Animator",
    CC: "Teacher",
    "Study Circle": "Tutor",
    Devotional: "Leader",
  };

  return (
    <div className="detail">
      <h4>{activity.name}</h4>
      <p>
        <strong>Type:</strong> {activity.type}
      </p>
      <p>
        <strong>{typeLabel[activity.type] || "Contact"}:</strong>{" "}
        {activity.facilitator || activity.leader || "-"}
      </p>
      <p>
        <strong>Notes:</strong> {activity.notes || "-"}
      </p>

      <ActivityReflections
        activityId={activity.id}
        reflections={activity.reflections || []}
      />

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <button
          className="btn btn--primary"
          style={{ flex: 1 }}
          onClick={() => onEditActivity?.(activity.id)}
        >
          Edit
        </button>
        <button
          className="btn"
          style={{ flex: 1, background: "#ef4444", color: "white" }}
          onClick={() => {
            if (confirm("Are you sure you want to delete this activity?"))
              deleteActivity(activity.id);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
