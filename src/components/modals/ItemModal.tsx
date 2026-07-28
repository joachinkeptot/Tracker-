import React, { useState, useEffect } from "react";
import { PersonModalContent } from "./PersonModalContent";
import { ActivityModalContent } from "./ActivityModalContent";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPersonId: string | null;
  editingActivityId: string | null;
  onAddFamily?: () => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  editingPersonId,
  editingActivityId,
  onAddFamily,
}) => {
  const [itemType, setItemType] = useState<"people" | "activities">("people");

  useEffect(() => {
    if (!isOpen) return;
    if (editingActivityId) setItemType("activities");
    else setItemType("people");
  }, [isOpen, editingPersonId, editingActivityId]);

  if (!isOpen) return null;

  const title = editingPersonId
    ? "Edit Person"
    : editingActivityId
      ? "Edit Activity"
      : "Add Item";

  const isEditing = !!editingPersonId || !!editingActivityId;

  return (
    <div className="modal">
      <div className="modal__content">
        <h3>{title}</h3>

        {!isEditing && (
          <div className="form-row">
            <label className="muted">Type</label>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value as "people" | "activities")}
            >
              <option value="people">Person</option>
              <option value="activities">Activity</option>
            </select>
          </div>
        )}

        {itemType === "people" ? (
          <PersonModalContent
            editingPersonId={editingPersonId}
            onClose={onClose}
            onAddFamily={onAddFamily}
          />
        ) : (
          <ActivityModalContent
            editingActivityId={editingActivityId}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
};
