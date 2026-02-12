import React, { useState, useEffect } from "react";
import { useApp } from "./AppContext";
import { Family } from "./types";

interface FamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingFamilyId?: string | null;
}

export const FamilyModal: React.FC<FamilyModalProps> = ({
  isOpen,
  onClose,
  editingFamilyId,
}) => {
  const { families, addFamily, updateFamily } = useApp();

  const [familyName, setFamilyName] = useState("");
  const [primaryArea, setPrimaryArea] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editingFamilyId) {
      const family = families.find((f) => f.id === editingFamilyId);
      if (family) {
        setFamilyName(family.familyName);
        setPrimaryArea(family.primaryArea);
        setPhone(family.phone || "");
        setEmail(family.email || "");
        setNotes(family.notes || "");
      }
    } else {
      resetForm();
    }
  }, [editingFamilyId, families, isOpen]);

  const resetForm = () => {
    setFamilyName("");
    setPrimaryArea("");
    setPhone("");
    setEmail("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!familyName.trim()) {
      alert("Family name is required");
      return;
    }

    const familyData: Omit<Family, "id"> = {
      familyName: familyName.trim(),
      primaryArea: primaryArea.trim(),
      phone: phone.trim() || "",
      email: email.trim() || "",
      notes: notes.trim() || undefined,
      dateAdded: new Date().toISOString(),
    };

    if (editingFamilyId) {
      updateFamily(editingFamilyId, familyData);
    } else {
      addFamily(familyData);
    }

    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal__content">
        <h3>{editingFamilyId ? "Edit Family" : "Add New Family"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="muted">Family Name *</label>
            <input
              type="text"
              placeholder="e.g., Smith Family"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label className="muted">Primary Area</label>
            <input
              type="text"
              placeholder="e.g., Downtown, Westside"
              value={primaryArea}
              onChange={(e) => setPrimaryArea(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label className="muted">Phone</label>
            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label className="muted">Email</label>
            <input
              type="email"
              placeholder="family@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label className="muted">Notes</label>
            <textarea
              rows={3}
              placeholder="Additional notes about the family"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal__actions">
            <button
              type="button"
              className="btn"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              {editingFamilyId ? "Update" : "Add Family"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
