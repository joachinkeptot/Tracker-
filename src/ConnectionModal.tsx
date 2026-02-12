import React, { useState, useEffect } from "react";
import { useApp } from "./AppContext";
import { Person, ConnectionType } from "./types";

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  personA?: Person;
  personB?: Person;
  onConnectionSave?: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  personA,
  personB,
  onConnectionSave,
}) => {
  const { people, updatePerson } = useApp();
  const [selectedPersonA, setSelectedPersonA] = useState<string>(
    personA?.id || "",
  );
  const [selectedPersonB, setSelectedPersonB] = useState<string>(
    personB?.id || "",
  );
  const [connectionType, setConnectionType] =
    useState<ConnectionType>("friendship");
  const [strength, setStrength] = useState<number>(5);

  useEffect(() => {
    if (personA?.id) setSelectedPersonA(personA.id);
    if (personB?.id) setSelectedPersonB(personB.id);
  }, [personA, personB, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedPersonA ||
      !selectedPersonB ||
      selectedPersonA === selectedPersonB
    ) {
      alert("Please select two different people");
      return;
    }

    const personAObj = people.find((p) => p.id === selectedPersonA);
    const personBObj = people.find((p) => p.id === selectedPersonB);

    if (!personAObj || !personBObj) {
      alert("People not found");
      return;
    }

    // Remove existing connection if it exists
    const newConnectionsA = personAObj.connections.filter(
      (c) => c.personId !== selectedPersonB,
    );
    const newConnectionsB = personBObj.connections.filter(
      (c) => c.personId !== selectedPersonA,
    );

    // Add bidirectional connection
    newConnectionsA.push({
      personId: selectedPersonB,
      connectionType,
      strength: (strength > 3 ? 3 : strength < 1 ? 1 : strength) as 1 | 2 | 3,
      dateAdded: new Date().toISOString(),
    });
    newConnectionsB.push({
      personId: selectedPersonA,
      connectionType,
      strength: (strength > 3 ? 3 : strength < 1 ? 1 : strength) as 1 | 2 | 3,
      dateAdded: new Date().toISOString(),
    });

    updatePerson(selectedPersonA, { connections: newConnectionsA });
    updatePerson(selectedPersonB, { connections: newConnectionsB });

    onConnectionSave?.();
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedPersonA(personA?.id || "");
    setSelectedPersonB(personB?.id || "");
    setConnectionType("friendship");
    setStrength(5);
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal__content">
        <h3>Add/Edit Connection</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="muted">Person A *</label>
            <select
              value={selectedPersonA}
              onChange={(e) => setSelectedPersonA(e.target.value)}
              required
            >
              <option value="">Select a person...</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label className="muted">Person B *</label>
            <select
              value={selectedPersonB}
              onChange={(e) => setSelectedPersonB(e.target.value)}
              required
            >
              <option value="">Select a person...</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label className="muted">Connection Type</label>
            <select
              value={connectionType}
              onChange={(e) =>
                setConnectionType(e.target.value as ConnectionType)
              }
            >
              <option value="family">👨‍👩‍👧‍👦 Family</option>
              <option value="school">🏫 School</option>
              <option value="work">💼 Work</option>
              <option value="neighborhood">🏘️ Neighborhood</option>
              <option value="activity">🎯 Activity</option>
              <option value="friendship">👫 Friendship</option>
            </select>
          </div>

          <div className="form-row">
            <label className="muted">
              Connection Strength: {strength}/10
              {strength === 1 && " (weak - dashed line)"}
              {strength >= 5 && strength <= 7 && " (medium)"}
              {strength >= 8 && " (strong)"}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={strength}
              onChange={(e) => setStrength(parseInt(e.target.value))}
              style={{ width: "100%" }}
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
              Save Connection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
