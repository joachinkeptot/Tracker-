import { SerializableState, Person, Activity, Family } from "./types";

const STORAGE_KEY = "roommap_ops_single_v2";

export const generateId = (): string => {
  return Math.random().toString(36).slice(2, 10);
};

export const saveToLocalStorage = (state: SerializableState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
};

export const loadFromLocalStorage = (): SerializableState | null => {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem("roommap_ops_v1");
    if (!raw) return null;

    const data = JSON.parse(raw) as SerializableState;

    // Migrate old data to new structure
    const migratedPeople: Person[] = (data.people || []).map((person: any) => ({
      id: person.id,
      name: person.name || "",
      area: person.area || "",
      notes: person.notes || person.note || "",
      dateAdded: person.dateAdded || new Date().toISOString(),
      lastModified: person.lastModified || new Date().toISOString(),
      categories: person.categories || ["Unassigned"],
      connectedActivities: person.connectedActivities || [],
      jyTexts: person.jyTexts || person.jyTextsCompleted || [],
      studyCircleBooks: person.studyCircleBooks || [],
      ccGrades: person.ccGrades || [],
      ruhiLevel: person.ruhiLevel || 0,
      homeVisits: person.homeVisits || [],
      conversations: person.conversations || [],
      connections: person.connections || [],
      participationStatus: person.participationStatus || "active",
      // New fields with defaults
      familyId: person.familyId ?? undefined,
      ageGroup: person.ageGroup || "adult",
      schoolName: person.schoolName || undefined,
      employmentStatus: person.employmentStatus || "employed",
      position: person.position,
    }));

    const migratedActivities: Activity[] = (data.activities || []).map(
      (activity) => ({
        ...activity,
        leader: activity.leader || activity.facilitator || "",
        notes: activity.notes || activity.note || "",
      }),
    );

    const migratedFamilies: Family[] = data.families || [];

    return {
      people: migratedPeople,
      activities: migratedActivities,
      families: migratedFamilies,
      savedQueries: data.savedQueries || [],
      selected: data.selected || { type: "people", id: null },
      groupPositions: data.groupPositions || {},
    };
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    return null;
  }
};

export const getAreaList = (people: Person[]): string[] => {
  const areas = new Set<string>();
  people.forEach((person) => {
    if (person.area && person.area.trim()) {
      areas.add(person.area.trim());
    }
  });
  return Array.from(areas).sort();
};

export const exportToCSV = (
  people: Person[],
  families: Family[],
  filename: string = "roommap-export.csv",
): void => {
  // Create CSV header
  const headers = ["Name", "Area", "Family", "Phone", "Email"];
  const rows = [headers];

  // Add data rows
  people.forEach((person) => {
    const family = person.familyId
      ? families.find((f) => f.id === person.familyId)
      : null;

    const row = [
      person.name,
      person.area || "",
      family?.familyName || "",
      family?.phone || "",
      family?.email || "",
    ];

    // Escape fields that contain commas or quotes
    const escapedRow = row.map((field) => {
      if (field.includes(",") || field.includes('"') || field.includes("\n")) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    });

    rows.push(escapedRow);
  });

  // Convert to CSV string
  const csvContent = rows.map((row) => row.join(",")).join("\n");

  // Create download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
