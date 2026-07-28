import {
  SerializableState,
  Person,
  Activity,
  Family,
  AgeGroup,
  EmploymentStatus,
  Position,
  ActivityType,
  ActivityReflection,
  JYTextCompletion,
  RuhiBookCompletion,
  CCGradeCompletion,
  HomeVisit,
  Conversation,
  PersonConnection,
} from "../types";

const STORAGE_KEY = "roommap_ops_single_v2";

export const generateId = (): string => {
  // Use crypto for better randomness if available, otherwise fallback to Math.random()
  if (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.getRandomValues
  ) {
    const arr = new Uint8Array(8);
    window.crypto.getRandomValues(arr);
    return Array.from(arr, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }
  // Fallback for environments without crypto support
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
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
    const migratedPeople: Person[] = (data.people || []).map(
      (person: unknown) => {
        const p = person as Record<string, unknown>;

        // Helper function to map JYTextCompletion array
        const mapJYTexts = (texts: unknown): JYTextCompletion[] => {
          if (!Array.isArray(texts)) return [];
          return texts.map((t: unknown) => {
            const text = t as Record<string, unknown>;
            return {
              bookNumber:
                typeof text.bookNumber === "number"
                  ? text.bookNumber
                  : undefined,
              bookName: String(text.bookName || ""),
              dateCompleted: String(text.dateCompleted || ""),
              animator: text.animator ? String(text.animator) : undefined,
              notes: text.notes ? String(text.notes) : undefined,
            } as JYTextCompletion;
          });
        };

        // Helper function to map RuhiBookCompletion array
        const mapRuhiBooks = (books: unknown): RuhiBookCompletion[] => {
          if (!Array.isArray(books)) return [];
          return books.map((b: unknown) => {
            const book = b as Record<string, unknown>;
            return {
              bookNumber:
                typeof book.bookNumber === "number" ? book.bookNumber : 0,
              bookName: String(book.bookName || ""),
              dateCompleted: String(book.dateCompleted || ""),
              tutor: book.tutor ? String(book.tutor) : undefined,
              notes: book.notes ? String(book.notes) : undefined,
            } as RuhiBookCompletion;
          });
        };

        // Helper function to map CCGradeCompletion array
        const mapCCGrades = (grades: unknown): CCGradeCompletion[] => {
          if (!Array.isArray(grades)) return [];
          return grades.map((g: unknown) => {
            const grade = g as Record<string, unknown>;
            return {
              gradeNumber:
                typeof grade.gradeNumber === "number" ? grade.gradeNumber : 0,
              lessonsCompleted:
                typeof grade.lessonsCompleted === "number"
                  ? grade.lessonsCompleted
                  : 0,
              dateCompleted: grade.dateCompleted
                ? String(grade.dateCompleted)
                : undefined,
              teacher: grade.teacher ? String(grade.teacher) : undefined,
              notes: grade.notes ? String(grade.notes) : undefined,
            } as CCGradeCompletion;
          });
        };

        // Helper function to map HomeVisit array
        const mapHomeVisits = (visits: unknown): HomeVisit[] => {
          if (!Array.isArray(visits)) return [];
          return visits.map((v: unknown) => {
            const visit = v as Record<string, unknown>;
            return {
              date: String(visit.date || ""),
              visitors: Array.isArray(visit.visitors)
                ? (visit.visitors as string[])
                : [],
              purpose: String(visit.purpose || "Introduction") as
                | "Introduction"
                | "Follow-up"
                | "Social"
                | "Teaching",
              notes: String(visit.notes || ""),
              relationshipsDiscovered: visit.relationshipsDiscovered
                ? String(visit.relationshipsDiscovered)
                : undefined,
              interestsExpressed: visit.interestsExpressed
                ? String(visit.interestsExpressed)
                : undefined,
              followUp: visit.followUp ? String(visit.followUp) : undefined,
              followUpDate: visit.followUpDate
                ? String(visit.followUpDate)
                : undefined,
              completed: Boolean(visit.completed ?? false),
            } as HomeVisit;
          });
        };

        // Helper function to map Conversation array
        const mapConversations = (convos: unknown): Conversation[] => {
          if (!Array.isArray(convos)) return [];
          return convos.map((c: unknown) => {
            const convo = c as Record<string, unknown>;
            return {
              date: String(convo.date || ""),
              topic: String(convo.topic || ""),
              notes: String(convo.notes || ""),
              nextSteps: convo.nextSteps ? String(convo.nextSteps) : undefined,
              followUpDate: convo.followUpDate
                ? String(convo.followUpDate)
                : undefined,
            } as Conversation;
          });
        };

        // Helper function to map PersonConnection array
        const mapConnections = (conns: unknown): PersonConnection[] => {
          if (!Array.isArray(conns)) return [];
          return conns.map((conn: unknown) => {
            const connection = conn as Record<string, unknown>;
            return {
              personId: String(connection.personId || ""),
              description: connection.description
                ? String(connection.description)
                : undefined,
              dateAdded: String(
                connection.dateAdded || new Date().toISOString(),
              ),
            } as PersonConnection;
          });
        };

        const migrated: Person = {
          id: String(p.id || ""),
          name: String(p.name || ""),
          area: String(p.area || ""),
          notes: String(p.notes || p.note || ""),
          dateAdded: String(p.dateAdded || new Date().toISOString()),
          lastModified: String(p.lastModified || new Date().toISOString()),
          connectedActivities: Array.isArray(p.connectedActivities)
            ? (p.connectedActivities as string[])
            : [],
          jyTexts: mapJYTexts(p.jyTexts || p.jyTextsCompleted),
          studyCircleBooks: mapRuhiBooks(p.studyCircleBooks),
          ccGrades: mapCCGrades(p.ccGrades),
          ruhiLevel: Number(p.ruhiLevel) || 0,
          homeVisits: mapHomeVisits(p.homeVisits),
          conversations: mapConversations(p.conversations),
          connections: mapConnections(p.connections),
          familyId: p.familyId ? String(p.familyId) : undefined,
          ageGroup: String(p.ageGroup || "adult") as AgeGroup,
          isParent: Boolean(p.isParent ?? false),
          isElder: Boolean(p.isElder ?? false),
          schoolName: p.schoolName ? String(p.schoolName) : undefined,
          employmentStatus: String(
            p.employmentStatus || "employed",
          ) as EmploymentStatus,
          position: p.position as Position,
          cohorts: Array.isArray(p.cohorts) ? (p.cohorts as string[]) : [],
          lastContact: p.lastContact ? String(p.lastContact) : undefined,
          phone: p.phone ? String(p.phone) : undefined,
          email: p.email ? String(p.email) : undefined,
        };
        return migrated;
      },
    );

    const migratedActivities: Activity[] = (data.activities || []).map(
      (activity: unknown) => {
        const a = activity as Record<string, unknown>;
        const migrated: Activity = {
          id: String(a.id || ""),
          name: String(a.name || ""),
          type: String(a.type || "JY") as ActivityType,
          facilitator: String(a.facilitator || a.leader || ""),
          leader: String(a.leader || a.facilitator || ""),
          area: String(a.area || ""),
          participantIds: Array.isArray(a.participantIds)
            ? (a.participantIds as string[])
            : [],
          averageAttendance:
            typeof a.averageAttendance === "number"
              ? a.averageAttendance
              : undefined,
          lastSessionDate: a.lastSessionDate as string | undefined,
          notes: String(a.notes || a.note || ""),
          note: String(a.note || a.notes || ""),
          materials: String(a.materials || ""),
          reflections: Array.isArray(a.reflections)
            ? (a.reflections as unknown[]).map((r: unknown) => {
                const reflection = r as Record<string, unknown>;
                return {
                  date: String(reflection.date || ""),
                  text: String(reflection.text || ""),
                } as ActivityReflection;
              })
            : [],
          isActive: typeof a.isActive === "boolean" ? a.isActive : true,
          dateCreated: String(a.dateCreated || new Date().toISOString()),
          lastModified: String(a.lastModified || new Date().toISOString()),
          position: a.position
            ? {
                x:
                  typeof (a.position as Record<string, unknown>).x === "number"
                    ? ((a.position as Record<string, unknown>).x as number)
                    : 0,
                y:
                  typeof (a.position as Record<string, unknown>).y === "number"
                    ? ((a.position as Record<string, unknown>).y as number)
                    : 0,
              }
            : undefined,
        };
        return migrated;
      },
    );

    const migratedFamilies: Family[] = (data.families || []).map(
      (family: unknown) => {
        const f = family as Record<string, unknown>;
        return {
          id: String(f.id || ""),
          familyName: String(f.familyName || ""),
          primaryArea: String(f.primaryArea || ""),
          phone: f.phone ? String(f.phone) : undefined,
          email: f.email ? String(f.email) : undefined,
          notes: f.notes ? String(f.notes) : undefined,
          dateAdded: String(f.dateAdded || new Date().toISOString()),
          lastContact: f.lastContact ? String(f.lastContact) : undefined,
        } as Family;
      },
    );

    return {
      people: migratedPeople,
      activities: migratedActivities,
      families: migratedFamilies,
      savedQueries: data.savedQueries || [],
      selected: data.selected || { type: "people", id: null },
      groupPositions: data.groupPositions || {},
      canvasPositions: data.canvasPositions,
      showConnections: data.showConnections ?? false,
      viewMode: data.viewMode ?? "people",
      areaNicknames: (data.areaNicknames as Record<string, string>) || {},
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
  try {
    // Create family lookup map for O(1) access
    const familyMap = new Map<string, Family>(families.map((f) => [f.id, f]));

    // Create CSV header
    const headers = ["Name", "Area", "Family", "Phone", "Email"];
    const rows = [headers];

    // Add data rows
    people.forEach((person) => {
      const family = person.familyId ? familyMap.get(person.familyId) : null;

      const row = [
        person.name,
        person.area || "",
        family?.familyName || "",
        family?.phone || "",
        family?.email || "",
      ];

      // Escape fields that contain commas or quotes
      const escapedRow = row.map((field) => {
        if (
          field.includes(",") ||
          field.includes('"') ||
          field.includes("\n")
        ) {
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

    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export CSV:", error);
    throw new Error(
      `CSV export failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};
