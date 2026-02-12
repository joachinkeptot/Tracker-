import React, { useState, useEffect } from "react";
import { useApp } from "./AppContext";
import {
  Person,
  Activity,
  Category,
  AgeGroup,
  EmploymentStatus,
  ParticipationStatus,
  ActivityType,
  RuhiBookCompletion,
  JYTextCompletion,
} from "./types";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPersonId: string | null;
  onAddFamily?: () => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  editingPersonId,
  onAddFamily,
}) => {
  const { people, activities, families, addPerson, updatePerson, addActivity } =
    useApp();

  const [itemType, setItemType] = useState<"people" | "activities">("people");
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [notes, setNotes] = useState("");

  // Person fields
  const [categories, setCategories] = useState<Category[]>([]);
  const [connectedActivities, setConnectedActivities] = useState<string[]>([]);
  const [jyTexts, setJyTexts] = useState<JYTextCompletion[]>([]);
  const [studyCircleBooks, setStudyCircleBooks] = useState<
    RuhiBookCompletion[]
  >([]);
  const [ruhiLevel, setRuhiLevel] = useState<number>(0);
  const [familyId, setFamilyId] = useState<string>("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("adult");
  const [schoolName, setSchoolName] = useState("");
  const [employmentStatus, setEmploymentStatus] =
    useState<EmploymentStatus>("employed");
  const [participationStatus, setParticipationStatus] =
    useState<ParticipationStatus>("active");

  // Activity fields
  const [activityType, setActivityType] = useState<ActivityType | "">("");
  const [leader, setLeader] = useState("");

  useEffect(() => {
    if (editingPersonId) {
      const person = people.find((p) => p.id === editingPersonId);
      if (person) {
        setItemType("people");
        setName(person.name);
        setArea(person.area);
        setNotes(person.notes || "");
        setCategories(person.categories);
        setConnectedActivities(person.connectedActivities);
        setJyTexts(person.jyTexts || []);
        setStudyCircleBooks(person.studyCircleBooks || []);
        setRuhiLevel(person.ruhiLevel);
        setFamilyId(person.familyId || "");
        setAgeGroup(person.ageGroup);
        setSchoolName(person.schoolName || "");
        setEmploymentStatus(person.employmentStatus || "student");
        setParticipationStatus(person.participationStatus);
      }
    } else {
      resetForm();
    }
  }, [editingPersonId, people]);

  const resetForm = () => {
    setItemType("people");
    setName("");
    setArea("");
    setNotes("");
    setCategories([]);
    setConnectedActivities([]);
    setJyTexts([]);
    setStudyCircleBooks([]);
    setRuhiLevel(0);
    setFamilyId("");
    setAgeGroup("adult");
    setSchoolName("");
    setEmploymentStatus("employed");
    setParticipationStatus("active");
    setActivityType("");
    setLeader("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    if (itemType === "people") {
      const personData: Omit<Person, "id"> = {
        name: name.trim(),
        area: area.trim(),
        notes: notes.trim() || undefined,
        categories: categories.length ? categories : [],
        connectedActivities,
        jyTexts: jyTexts || [],
        studyCircleBooks: studyCircleBooks || [],
        ccGrades: [],
        ruhiLevel,
        familyId: familyId || undefined,
        ageGroup,
        schoolName: schoolName.trim() || undefined,
        employmentStatus: (employmentStatus || "student") as EmploymentStatus,
        participationStatus,
        homeVisits: [],
        conversations: [],
        connections: [],
        dateAdded: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        position: { x: Math.random() * 700, y: Math.random() * 400 },
      };

      if (editingPersonId) {
        updatePerson(editingPersonId, personData);
      } else {
        addPerson(personData);
      }
    } else {
      if (!activityType) {
        alert("Please select an activity type");
        return;
      }

      const activityData: Omit<Activity, "id"> = {
        name: name.trim(),
        type: activityType,
        leader: leader.trim() || undefined,
        facilitator: leader.trim() || undefined,
        notes: notes.trim() || undefined,
        participantIds: [],
        materials: undefined,
        dateCreated: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        position: { x: Math.random() * 700, y: Math.random() * 400 },
      };

      addActivity(activityData);
    }

    resetForm();
    onClose();
  };

  const handleCategoryToggle = (cat: Category) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const handleJyTextToggle = (bookNum: number) => {
    setJyTexts((prev) => {
      const exists = prev.some((j) => j.bookNumber === bookNum);
      if (exists) {
        return prev.filter((j) => j.bookNumber !== bookNum);
      } else {
        return [
          ...prev,
          {
            bookNumber: bookNum,
            dateCompleted: new Date().toISOString(),
          },
        ];
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal__content">
        <h3>{editingPersonId ? "Edit Person" : "Add Item"}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="muted">Type</label>
            <select
              value={itemType}
              onChange={(e) =>
                setItemType(e.target.value as "people" | "activities")
              }
              disabled={!!editingPersonId}
            >
              <option value="people">Person</option>
              <option value="activities">Activity</option>
            </select>
          </div>

          <div className="form-row">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {itemType === "people" ? (
            <>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>

              <div className="form-row">
                <label className="muted">Family</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <select
                    value={familyId}
                    onChange={(e) => setFamilyId(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="">No Family</option>
                    {families.map((family) => (
                      <option key={family.id} value={family.id}>
                        {family.familyName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn"
                    onClick={onAddFamily}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    + Add Family
                  </button>
                </div>
              </div>

              <div className="form-row">
                <label className="muted">Age Group</label>
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  {(
                    ["child", "JY", "youth", "adult", "elder"] as AgeGroup[]
                  ).map((age) => (
                    <label
                      key={age}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="ageGroup"
                        value={age}
                        checked={ageGroup === age}
                        onChange={(e) =>
                          setAgeGroup(e.target.value as AgeGroup)
                        }
                      />
                      {age === "JY"
                        ? "JY"
                        : age.charAt(0).toUpperCase() + age.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {(ageGroup === "child" ||
                ageGroup === "JY" ||
                ageGroup === "youth") && (
                <div className="form-row">
                  <label className="muted">School Name</label>
                  <input
                    type="text"
                    placeholder="School name"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
                </div>
              )}

              <div className="form-row">
                <label className="muted">Employment Status</label>
                <select
                  value={employmentStatus}
                  onChange={(e) =>
                    setEmploymentStatus(e.target.value as EmploymentStatus)
                  }
                >
                  <option value="student">Student</option>
                  <option value="employed">Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              <div className="form-row">
                <label className="muted">Participation Status</label>
                <select
                  value={participationStatus}
                  onChange={(e) =>
                    setParticipationStatus(
                      e.target.value as ParticipationStatus,
                    )
                  }
                >
                  <option value="active">Active</option>
                  <option value="occasional">Occasional</option>
                  <option value="lapsed">Lapsed</option>
                  <option value="new">New</option>
                </select>
              </div>

              <div className="chips">
                {(["JY", "CC", "Youth", "Parents"] as Category[]).map((cat) => (
                  <label key={cat}>
                    <input
                      type="checkbox"
                      checked={categories.includes(cat)}
                      onChange={() => handleCategoryToggle(cat)}
                    />
                    {cat}
                  </label>
                ))}
              </div>

              <div className="form-row">
                <label className="muted">Connected Activities</label>
                <select
                  multiple
                  size={3}
                  value={connectedActivities}
                  onChange={(e) =>
                    setConnectedActivities(
                      Array.from(e.target.selectedOptions, (opt) => opt.value),
                    )
                  }
                >
                  {activities.map((activity) => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name} ({activity.type})
                    </option>
                  ))}
                </select>
                <small className="hint">Hold Ctrl/Cmd to select multiple</small>
              </div>

              <div className="form-row">
                <label className="muted">JY Texts Completed</label>
                <div className="chips">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <label key={num}>
                      <input
                        type="checkbox"
                        checked={jyTexts.some((j) => j.bookNumber === num)}
                        onChange={() => handleJyTextToggle(num)}
                      />
                      Book {num}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <label className="muted">Study Circle Books</label>
                <div className="chips" style={{ fontSize: "0.875rem" }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <label key={num}>
                      <input
                        type="checkbox"
                        checked={studyCircleBooks.some(
                          (b) => b.bookNumber === num,
                        )}
                        onChange={() => {
                          setStudyCircleBooks((prev) => {
                            const exists = prev.some(
                              (b) => b.bookNumber === num,
                            );
                            if (exists) {
                              return prev.filter((b) => b.bookNumber !== num);
                            } else {
                              return [
                                ...prev,
                                {
                                  bookNumber: num,
                                  bookName: `Ruhi Book ${num}`,
                                  dateCompleted: new Date().toISOString(),
                                },
                              ];
                            }
                          });
                        }}
                      />
                      Book {num}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <label className="muted">Ruhi Level</label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  placeholder="0-12"
                  value={ruhiLevel}
                  onChange={(e) => setRuhiLevel(parseInt(e.target.value) || 0)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-row">
                <label className="muted">Activity Type</label>
                <select
                  value={activityType}
                  onChange={(e) =>
                    setActivityType(e.target.value as ActivityType)
                  }
                >
                  <option value="">Select type...</option>
                  <option value="JY">JY</option>
                  <option value="CC">CC</option>
                  <option value="StudyCircle">Study Circle</option>
                  <option value="Devotional">Devotional</option>
                </select>
              </div>

              {activityType && (
                <div className="form-row">
                  <input
                    type="text"
                    placeholder={
                      activityType === "JY"
                        ? "Animator name"
                        : activityType === "CC"
                          ? "Teacher name"
                          : activityType === "Study Circle"
                            ? "Tutor name"
                            : "Leader name"
                    }
                    value={leader}
                    onChange={(e) => setLeader(e.target.value)}
                  />
                </div>
              )}
            </>
          )}

          <div className="form-row">
            <input
              type="text"
              placeholder="Notes (optional)"
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
              {editingPersonId ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
