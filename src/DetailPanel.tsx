import React, { useState } from "react";
import { useApp } from "./AppContext";
import { HomeVisit, Conversation, VisitPurpose } from "./types";

interface DetailPanelProps {
  onEdit?: (id: string) => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ onEdit }) => {
  const {
    selected,
    people,
    activities,
    families,
    deletePerson,
    deleteActivity,
    updatePerson,
  } = useApp();

  // Home Visit form state
  const [showHomeVisitForm, setShowHomeVisitForm] = useState(false);
  const [hvDate, setHvDate] = useState("");
  const [hvVisitors, setHvVisitors] = useState("");
  const [hvPurpose, setHvPurpose] = useState<VisitPurpose | "">("");
  const [hvNotes, setHvNotes] = useState("");
  const [hvFollowUp, setHvFollowUp] = useState("");

  // Conversation form state
  const [showConversationForm, setShowConversationForm] = useState(false);
  const [convDate, setConvDate] = useState("");
  const [convTopic, setConvTopic] = useState<string>("");
  const [convNotes, setConvNotes] = useState<string>("");
  const [convNextSteps, setConvNextSteps] = useState<string>("");

  const handleAddHomeVisit = (personId: string) => {
    if (!hvDate) {
      alert("Date is required");
      return;
    }

    const newHomeVisit: HomeVisit = {
      date: hvDate || new Date().toISOString().split("T")[0],
      visitors: (hvVisitors || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
      purpose: (hvPurpose as VisitPurpose) || "Social",
      notes: hvNotes.trim(),
      completed: false,
      followUp: hvFollowUp || undefined,
    };

    const person = people.find((p) => p.id === personId);
    if (person) {
      updatePerson(personId, {
        homeVisits: [...person.homeVisits, newHomeVisit],
      });
    }

    // Reset form
    setHvDate("");
    setHvVisitors("");
    setHvPurpose("");
    setHvNotes("");
    setHvFollowUp("");
    setShowHomeVisitForm(false);
  };

  const handleAddConversation = (personId: string) => {
    if (!convDate || !convTopic) {
      alert("Date and topic are required");
      return;
    }

    const newConversation: Conversation = {
      date: convDate,
      topic: convTopic.trim(),
      notes: convNotes.trim(),
      nextSteps: convNextSteps.trim() || undefined,
    };

    const person = people.find((p) => p.id === personId);
    if (person) {
      updatePerson(personId, {
        conversations: [...person.conversations, newConversation],
      });
    }

    // Reset form
    setConvDate("");
    setConvTopic("");
    setConvNotes("");
    setConvNextSteps("");
    setShowConversationForm(false);
  };

  if (!selected.id) {
    return <div className="detail">Select a node to see details.</div>;
  }

  if (selected.type === "people") {
    const person = people.find((p) => p.id === selected.id);
    if (!person) {
      return <div className="detail">Select a node to see details.</div>;
    }

    const activityNames =
      person.connectedActivities
        .map((actId) => activities.find((a) => a.id === actId)?.name)
        .filter(Boolean)
        .join(", ") || "-";

    const familyName = person.familyId
      ? families.find((f) => f.id === person.familyId)?.familyName ||
        "Unknown Family"
      : "-";

    const connectionsCount = person.connections.length;
    const homeVisitsCount = person.homeVisits.length;
    const conversationsCount = person.conversations.length;

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
          <strong>Categories:</strong> {person.categories.join(", ") || "-"}
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
          <strong>Participation:</strong> {person.participationStatus}
        </p>
        <p>
          <strong>Connected Activities:</strong> {activityNames}
        </p>
        <p>
          <strong>Connections:</strong> {connectionsCount} person(s)
        </p>
        <p>
          <strong>Home Visits:</strong> {homeVisitsCount}
        </p>
        <p>
          <strong>Conversations:</strong> {conversationsCount}
        </p>
        <p>
          <strong>JY Texts:</strong>{" "}
          {person.jyTexts && person.jyTexts.length > 0
            ? person.jyTexts
                .map((j) =>
                  typeof j === "string" ? j : `Book ${j.bookNumber}`,
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
          <strong>Ruhi Level:</strong> {person.ruhiLevel}
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
              if (confirm("Are you sure you want to delete this person?")) {
                deletePerson(person.id);
              }
            }}
          >
            Delete
          </button>
        </div>

        {/* Home Visit Mini-Form */}
        <div
          style={{
            marginTop: "1.5rem",
            borderTop: "1px solid #374151",
            paddingTop: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <h5 style={{ margin: 0 }}>Home Visits</h5>
            <button
              className="btn"
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
              onClick={() => setShowHomeVisitForm(!showHomeVisitForm)}
            >
              {showHomeVisitForm ? "Cancel" : "+ Add Visit"}
            </button>
          </div>

          {showHomeVisitForm && (
            <div
              style={{
                background: "#1f2937",
                padding: "0.75rem",
                borderRadius: "4px",
                marginBottom: "0.75rem",
              }}
            >
              <div className="form-row" style={{ marginBottom: "0.5rem" }}>
                <input
                  type="date"
                  value={hvDate}
                  onChange={(e) => setHvDate(e.target.value)}
                  required
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
              <div className="form-row" style={{ marginBottom: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="Visitors (comma-separated)"
                  value={hvVisitors}
                  onChange={(e) => setHvVisitors(e.target.value)}
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
              <div className="form-row" style={{ marginBottom: "0.5rem" }}>
                <select
                  value={hvPurpose}
                  onChange={(e) =>
                    setHvPurpose(e.target.value as VisitPurpose | "")
                  }
                  style={{ fontSize: "0.875rem" }}
                >
                  <option value="">Purpose (optional)</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Initial Visit">Initial Visit</option>
                  <option value="Social">Social</option>
                  <option value="Teaching">Teaching</option>
                  <option value="Service">Service</option>
                </select>
              </div>
              <div className="form-row" style={{ marginBottom: "0.5rem" }}>
                <textarea
                  rows={2}
                  placeholder="Notes"
                  value={hvNotes}
                  onChange={(e) => setHvNotes(e.target.value)}
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
              <div className="form-row" style={{ marginBottom: "0.5rem" }}>
                <input
                  type="date"
                  placeholder="Follow-up date (optional)"
                  value={hvFollowUp}
                  onChange={(e) => setHvFollowUp(e.target.value)}
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
              <button
                className="btn btn--primary"
                style={{ width: "100%", fontSize: "0.875rem" }}
                onClick={() => handleAddHomeVisit(person.id)}
              >
                Add Home Visit
              </button>
            </div>
          )}

          {person.homeVisits.length > 0 && (
            <div style={{ fontSize: "0.875rem" }}>
              {person.homeVisits
                .slice(-3)
                .reverse()
                .map((visit, idx) => (
                  <div
                    key={`home-visit-${person.homeVisits.length - idx - 1}-${visit.date}`}
                    style={{
                      background: "#111827",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div style={{ fontWeight: "bold", color: "#60a5fa" }}>
                      {new Date(visit.date).toLocaleDateString()}
                    </div>
                    {visit.visitors.length > 0 && (
                      <div>Visitors: {visit.visitors.join(", ")}</div>
                    )}
                    {visit.notes && (
                      <div style={{ marginTop: "0.25rem" }}>{visit.notes}</div>
                    )}
                    {visit.followUp && (
                      <div style={{ marginTop: "0.25rem", color: "#fbbf24" }}>
                        Follow-up:{" "}
                        {new Date(visit.followUp).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              {person.homeVisits.length > 3 && (
                <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                  + {person.homeVisits.length - 3} more visits
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversation Mini-Form */}
        <div
          style={{
            marginTop: "1.5rem",
            borderTop: "1px solid #374151",
            paddingTop: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <h5 style={{ margin: 0 }}>Conversations</h5>
            <button
              className="btn"
              style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
              onClick={() => setShowConversationForm(!showConversationForm)}
            >
              {showConversationForm ? "Cancel" : "+ Log Conversation"}
            </button>
          </div>

          {showConversationForm && (
            <div
              style={{
                background: "#1f2937",
                padding: "0.75rem",
                borderRadius: "4px",
                marginBottom: "0.75rem",
              }}
            >
              <div className="form-row" style={{ marginBottom: "0.5rem" }}>
                <input
                  type="date"
                  value={convDate}
                  onChange={(e) => setConvDate(e.target.value)}
                  required
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
              <div className="form-row" style={{ marginBottom: "0.5rem" }}>
                <input
                  type="text"
                  placeholder="Topic *"
                  value={convTopic}
                  onChange={(e) => setConvTopic(e.target.value)}
                  required
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
              <div className="form-row" style={{ marginBottom: "0.5rem" }}>
                <textarea
                  rows={2}
                  placeholder="Notes"
                  value={convNotes}
                  onChange={(e) => setConvNotes(e.target.value)}
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
              <div className="form-row" style={{ marginBottom: "0.5rem" }}>
                <textarea
                  rows={2}
                  placeholder="Next Steps"
                  value={convNextSteps}
                  onChange={(e) => setConvNextSteps(e.target.value)}
                  style={{ fontSize: "0.875rem" }}
                />
              </div>
              <button
                className="btn btn--primary"
                style={{ width: "100%", fontSize: "0.875rem" }}
                onClick={() => handleAddConversation(person.id)}
              >
                Log Conversation
              </button>
            </div>
          )}

          {person.conversations.length > 0 && (
            <div style={{ fontSize: "0.875rem" }}>
              {person.conversations
                .slice(-3)
                .reverse()
                .map((conv, idx) => (
                  <div
                    key={`conversation-${person.conversations.length - idx - 1}-${conv.date}`}
                    style={{
                      background: "#111827",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div style={{ fontWeight: "bold", color: "#60a5fa" }}>
                      {new Date(conv.date).toLocaleDateString()}
                    </div>
                    <div style={{ color: "#34d399" }}>{conv.topic}</div>
                    {conv.notes && (
                      <div style={{ marginTop: "0.25rem" }}>{conv.notes}</div>
                    )}
                    {conv.nextSteps && (
                      <div style={{ marginTop: "0.25rem", color: "#fbbf24" }}>
                        Next: {conv.nextSteps}
                      </div>
                    )}
                  </div>
                ))}
              {person.conversations.length > 3 && (
                <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                  + {person.conversations.length - 3} more conversations
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  } else {
    const activity = activities.find((a) => a.id === selected.id);
    if (!activity) {
      return <div className="detail">Select a node to see details.</div>;
    }

    const typeLabel: Record<string, string> = {
      JY: "Animator",
      CC: "Teacher",
      StudyCircle: "Tutor",
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
          {activity.leader || "-"}
        </p>
        <p>
          <strong>Notes:</strong> {activity.note || "-"}
        </p>
        <button
          className="btn"
          style={{
            marginTop: "1rem",
            width: "100%",
            background: "#ef4444",
            color: "white",
          }}
          onClick={() => {
            if (confirm("Are you sure you want to delete this activity?")) {
              deleteActivity(activity.id);
            }
          }}
        >
          Delete
        </button>
      </div>
    );
  }
};
