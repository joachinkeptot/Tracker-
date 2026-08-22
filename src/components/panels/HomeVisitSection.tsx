import React, { useState } from "react";
import { useApp } from "../../context";
import { HomeVisit, VisitPurpose } from "../../types";
import { notifyWarning } from "../../utils";

interface HomeVisitSectionProps {
  personId: string;
  homeVisits: HomeVisit[];
}

export const HomeVisitSection: React.FC<HomeVisitSectionProps> = ({
  personId,
  homeVisits,
}) => {
  const { people, updatePerson } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [hvDate, setHvDate] = useState("");
  const [hvVisitors, setHvVisitors] = useState("");
  const [hvPurpose, setHvPurpose] = useState<VisitPurpose | "">("");
  const [hvNotes, setHvNotes] = useState("");
  const [hvFollowUp, setHvFollowUp] = useState("");

  const resetForm = () => {
    setHvDate("");
    setHvVisitors("");
    setHvPurpose("");
    setHvNotes("");
    setHvFollowUp("");
    setShowForm(false);
  };

  const handleAdd = () => {
    if (!hvDate) {
      notifyWarning("Date is required");
      return;
    }

    const newVisit: HomeVisit = {
      date: hvDate,
      visitors: (hvVisitors || "").split(",").map((v) => v.trim()).filter(Boolean),
      purpose: (hvPurpose as VisitPurpose) || "Social",
      notes: hvNotes.trim(),
      completed: false,
      followUp: hvFollowUp || undefined,
    };

    const person = people.find((p) => p.id === personId);
    if (person) {
      updatePerson(personId, { homeVisits: [...person.homeVisits, newVisit] });
    }

    resetForm();
  };

  return (
    <div style={{ marginTop: "1.5rem", borderTop: "1px solid #374151", paddingTop: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <h5 style={{ margin: 0 }}>Home Visits</h5>
        <button
          className="btn"
          style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Add Visit"}
        </button>
      </div>

      {showForm && (
        <div style={{ background: "#1f2937", padding: "0.75rem", borderRadius: "4px", marginBottom: "0.75rem" }}>
          <div className="form-row" style={{ marginBottom: "0.5rem" }}>
            <input type="date" value={hvDate} onChange={(e) => setHvDate(e.target.value)} required style={{ fontSize: "0.875rem" }} />
          </div>
          <div className="form-row" style={{ marginBottom: "0.5rem" }}>
            <input type="text" placeholder="Visitors (comma-separated)" value={hvVisitors} onChange={(e) => setHvVisitors(e.target.value)} style={{ fontSize: "0.875rem" }} />
          </div>
          <div className="form-row" style={{ marginBottom: "0.5rem" }}>
            <select value={hvPurpose} onChange={(e) => setHvPurpose(e.target.value as VisitPurpose | "")} style={{ fontSize: "0.875rem" }}>
              <option value="">Purpose (optional)</option>
              <option value="Introduction">Introduction</option>
              <option value="Follow-up">Follow-up</option>
              <option value="Social">Social</option>
              <option value="Teaching">Teaching</option>
            </select>
          </div>
          <div className="form-row" style={{ marginBottom: "0.5rem" }}>
            <textarea rows={2} placeholder="Notes" value={hvNotes} onChange={(e) => setHvNotes(e.target.value)} style={{ fontSize: "0.875rem" }} />
          </div>
          <div className="form-row" style={{ marginBottom: "0.5rem" }}>
            <input type="date" placeholder="Follow-up date (optional)" value={hvFollowUp} onChange={(e) => setHvFollowUp(e.target.value)} style={{ fontSize: "0.875rem" }} />
          </div>
          <button className="btn btn--primary" style={{ width: "100%", fontSize: "0.875rem" }} onClick={handleAdd}>
            Add Home Visit
          </button>
        </div>
      )}

      {homeVisits.length > 0 && (
        <div style={{ fontSize: "0.875rem" }}>
          {homeVisits
            .slice(-3)
            .reverse()
            .map((visit, idx) => (
              <div
                key={`hv-${homeVisits.length - idx - 1}-${visit.date}`}
                style={{ background: "#111827", padding: "0.5rem", borderRadius: "4px", marginBottom: "0.5rem" }}
              >
                <div style={{ fontWeight: "bold", color: "#60a5fa" }}>
                  {new Date(visit.date).toLocaleDateString()}
                </div>
                {visit.visitors.length > 0 && <div>Visitors: {visit.visitors.join(", ")}</div>}
                {visit.notes && <div style={{ marginTop: "0.25rem" }}>{visit.notes}</div>}
                {visit.followUp && (
                  <div style={{ marginTop: "0.25rem", color: "#fbbf24" }}>
                    Follow-up: {new Date(visit.followUp).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          {homeVisits.length > 3 && (
            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
              + {homeVisits.length - 3} more visits
            </div>
          )}
        </div>
      )}
    </div>
  );
};
