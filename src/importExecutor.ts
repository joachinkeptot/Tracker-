import {
  Person,
  Activity,
  Family,
  CSVParseResult,
  ParsedRow,
  ImportAction,
  ImportSummary,
  ImportBackup,
  HomeVisit,
  Category,
  VisitPurpose,
  JYTextCompletion,
  RuhiBookCompletion,
  CCGradeCompletion,
} from "./types";
import { FuzzyMatcher } from "./fuzzyMatcher";
import { CSVParser } from "./csvParser";
import { generateId } from "./utils";

export class ImportExecutor {
  private backups: Map<string, ImportBackup> = new Map();

  /**
   * Create a backup of current state
   */
  createBackup(
    id: string,
    people: Person[],
    activities: Activity[],
    families: Family[],
    actions: ImportAction[] = [],
  ): ImportBackup {
    const backup: ImportBackup = {
      id,
      timestamp: new Date().toISOString(),
      people: JSON.parse(JSON.stringify(people)),
      activities: JSON.parse(JSON.stringify(activities)),
      families: JSON.parse(JSON.stringify(families)),
      actions,
    };

    this.backups.set(id, backup);
    return backup;
  }

  /**
   * Restore from backup
   */
  restoreBackup(backupId: string): ImportBackup | null {
    return this.backups.get(backupId) || null;
  }

  /**
   * Execute import and return results
   */
  async executeImport(
    parseResult: CSVParseResult,
    people: Person[],
    activities: Activity[],
    families: Family[],
  ): Promise<ImportSummary> {
    const backupId = `backup_${Date.now()}`;
    const actions: ImportAction[] = [];
    const errors: Array<{
      rowNumber: number;
      entityName: string;
      reason: string;
    }> = [];

    let createdPeople = 0;
    let createdFamilies = 0;
    let createdActivities = 0;
    let updatedPeople = 0;
    let updatedActivities = 0;

    // Create backup first
    this.createBackup(backupId, people, activities, families);

    // Process based on import type
    for (const row of parseResult.rows) {
      // Skip rows with errors
      const hasErrors = row.errors.some((e) => e.severity === "error");
      if (hasErrors) {
        const errorMessages = row.errors.map((e) => e.message).join("; ");
        errors.push({
          rowNumber: row.rowNumber,
          entityName: "Row",
          reason: errorMessages,
        });
        continue;
      }

      try {
        switch (parseResult.importType) {
          case "person":
            const personResult = await this.processPerson(
              row,
              people,
              families,
              activities,
            );
            if (personResult.action) {
              actions.push(personResult.action);
              if (personResult.action.type === "create") {
                createdPeople++;
                if (personResult.createdFamily) {
                  createdFamilies++;
                }
              } else {
                updatedPeople++;
              }
            }
            if (personResult.error) {
              errors.push({
                rowNumber: row.rowNumber,
                entityName: personResult.error.name,
                reason: personResult.error.message,
              });
            }
            break;

          case "activity":
            const actResult = await this.processActivity(
              row,
              people,
              activities,
            );
            if (actResult.action) {
              actions.push(actResult.action);
              if (actResult.action.type === "create") {
                createdActivities++;
              } else {
                updatedActivities++;
              }
            }
            if (actResult.error) {
              errors.push({
                rowNumber: row.rowNumber,
                entityName: actResult.error.name,
                reason: actResult.error.message,
              });
            }
            break;

          case "learning":
            const learnResult = await this.processLearning(row, people);
            if (learnResult.action) {
              actions.push(learnResult.action);
              updatedPeople++;
            }
            if (learnResult.error) {
              errors.push({
                rowNumber: row.rowNumber,
                entityName: learnResult.error.name,
                reason: learnResult.error.message,
              });
            }
            break;

          case "homevisit":
            const homeResult = await this.processHomeVisit(
              row,
              people,
              families,
            );
            if (homeResult.action) {
              actions.push(homeResult.action);
              updatedPeople++;
            }
            if (homeResult.error) {
              errors.push({
                rowNumber: row.rowNumber,
                entityName: homeResult.error.name,
                reason: homeResult.error.message,
              });
            }
            break;
        }
      } catch (error) {
        errors.push({
          rowNumber: row.rowNumber,
          entityName: "Processing",
          reason: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const summary: ImportSummary = {
      successCount: parseResult.validRows,
      warningCount: parseResult.rows.filter((r) =>
        r.errors.some((e) => e.severity === "warning"),
      ).length,
      errorCount: errors.length,
      created: {
        people: createdPeople,
        families: createdFamilies,
        activities: createdActivities,
      },
      updated: {
        people: updatedPeople,
        activities: updatedActivities,
      },
      errors,
      actions,
      timestamp: new Date().toISOString(),
      backupId,
    };

    return summary;
  }

  /**
   * Process person intake row
   */
  private async processPerson(
    row: ParsedRow,
    people: Person[],
    families: Family[],
    activities: Activity[],
  ): Promise<{
    action?: ImportAction;
    createdFamily?: boolean;
    error?: { name: string; message: string };
  }> {
    const data = row.data;

    const personName = data["Person's Full Name"]?.trim();
    const familyName = data["Family Name"]?.trim();
    const area = data["Area/Street"]?.trim();

    if (!personName || !familyName || !area) {
      return {
        error: {
          name: personName || "Unknown",
          message: "Missing required fields",
        },
      };
    }

    // Check for existing person
    const existingPerson = FuzzyMatcher.findPersonExact(
      personName,
      area,
      people,
    );

    if (existingPerson) {
      // Update existing person
      const updates: Partial<Person> = {};

      if (data["Age Group"]) {
        updates.ageGroup = data["Age Group"];
      }
      if (data["Phone"]) {
        updates.position = { x: 0, y: 0 }; // This would be handled by UI
      }
      if (data["Email"]) {
        // Email not in Person type, but could be added to family
      }
      if (data["School Name"]) {
        updates.schoolName = data["School Name"];
      }
      if (data["Employment Status"]) {
        updates.employmentStatus = data["Employment Status"];
      }

      // Parse categories
      if (data["Current Categories"]) {
        const cats = CSVParser.parsePipeDelimited(
          data["Current Categories"],
        ) as unknown as Category[];
        updates.categories = cats;
      }

      // Parse connected activities
      if (data["Connected to Activities"]) {
        const actNames = CSVParser.parsePipeDelimited(
          data["Connected to Activities"],
        );
        const actIds = actNames
          .map((name) => FuzzyMatcher.findActivityExact(name, activities))
          .filter((a) => a !== null)
          .map((a) => (a as Activity).id);
        if (actIds.length > 0) {
          updates.connectedActivities = actIds;
        }
      }

      // Parse Ruhi level
      if (data["Ruhi Level"]) {
        const level = CSVParser.parseInteger(data["Ruhi Level"]);
        if (level !== null) {
          updates.ruhiLevel = level;
        }
      }

      // Parse home visit
      if (data["Home Visit Date"]) {
        const homeVisit: HomeVisit = {
          date: data["Home Visit Date"],
          visitors: [data["Your Name"]],
          purpose: (data["Purpose"] as VisitPurpose) || "Social",
          notes: data["Conversation Topics"] || "",
          followUp: data["Follow-Up Date"],
          completed: false,
        };
        updates.homeVisits = [...(existingPerson.homeVisits || []), homeVisit];
      }

      return {
        action: {
          type: "update",
          entityType: "person",
          entityId: existingPerson.id,
          data: updates,
          beforeData: { ...existingPerson },
        },
      };
    }

    // Create new person
    let familyId: string | null = null;
    let createdFamily = false;

    // Check for existing family
    let family = FuzzyMatcher.findFamilyExact(familyName, families);

    if (!family) {
      // Create new family
      family = {
        id: generateId(),
        familyName,
        primaryArea: area,
        phone: data["Phone"] || undefined,
        email: data["Email"] || undefined,
        notes: data["Notes"] || undefined,
        dateAdded: new Date().toISOString(),
      };
      families.push(family);
      createdFamily = true;
    }

    familyId = family.id;

    // Build new person
    const categories = CSVParser.parsePipeDelimited(
      data["Current Categories"],
    ) as unknown as Category[];
    const actNames = CSVParser.parsePipeDelimited(
      data["Connected to Activities"],
    );
    const actIds = actNames
      .map((name) => FuzzyMatcher.findActivityExact(name, activities))
      .filter((a) => a !== null)
      .map((a) => (a as Activity).id);

    const homeVisits: HomeVisit[] = [];
    if (data["Home Visit Date"]) {
      homeVisits.push({
        date: data["Home Visit Date"],
        visitors: [data["Your Name"]],
        purpose: (data["Purpose"] as VisitPurpose) || "Social",
        notes: data["Conversation Topics"] || "",
        followUp: data["Follow-Up Date"],
        completed: false,
      });
    }

    const newPerson: Person = {
      id: generateId(),
      name: personName,
      area,
      notes: data["Notes"] || "",
      categories,
      connectedActivities: actIds,
      jyTexts: [],
      studyCircleBooks: [],
      ccGrades: [],
      ruhiLevel: CSVParser.parseInteger(data["Ruhi Level"]) || 0,
      familyId,
      ageGroup: data["Age Group"] || "child",
      schoolName: data["School Name"] || null,
      employmentStatus: data["Employment Status"] || "student",
      participationStatus: "new",
      homeVisits,
      conversations: [],
      connections: [],
      dateAdded: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      position: undefined,
    };

    people.push(newPerson);

    return {
      action: {
        type: "create",
        entityType: "person",
        data: newPerson,
      },
      createdFamily,
    };
  }

  /**
   * Process activity attendance row
   */
  private async processActivity(
    row: ParsedRow,
    people: Person[],
    activities: Activity[],
  ): Promise<{
    action?: ImportAction;
    error?: { name: string; message: string };
  }> {
    const data = row.data;

    const activityName = data["Activity Name"]?.trim();
    const activityType = data["Activity Type"]?.trim();
    const date = data["Date"]?.trim();
    const attendeeNamesStr = data["Attendee Names"]?.trim();

    if (!activityName || !activityType || !date) {
      return {
        error: {
          name: activityName || "Unknown",
          message: "Missing required fields",
        },
      };
    }

    // Parse attendee names
    const attendeeNames = CSVParser.parseCommaSeparated(attendeeNamesStr);

    // Find or create activity
    let activity = FuzzyMatcher.findActivityExact(activityName, activities);

    if (!activity) {
      // Create new activity
      activity = {
        id: generateId(),
        name: activityName,
        type: activityType as any,
        facilitator: data["Facilitator Name"] || "",
        notes: data["Highlights/Notes"] || "",
        participantIds: [],
        materials: data["Materials Covered"] || "",
        dateCreated: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        position: undefined,
      };
      activities.push(activity);
    } else {
      // Update existing activity with latest info
      activity.facilitator = data["Facilitator Name"] || activity.facilitator;
      activity.notes = data["Highlights/Notes"] || activity.notes;
      activity.lastModified = new Date().toISOString();
    }

    // Match attendees to people and update connections
    for (const attendeeName of attendeeNames) {
      const matches = FuzzyMatcher.findSimilarPeople(attendeeName, people, 0.7);
      if (matches.length > 0) {
        const bestMatch = matches[0];
        const person = people.find((p) => p.id === bestMatch.id);
        if (person && !person.connectedActivities.includes(activity.id)) {
          person.connectedActivities.push(activity.id);
        }
      }
    }

    return {
      action: {
        type: "create",
        entityType: "activity",
        data: activity,
      },
    };
  }

  /**
   * Process learning progress row
   */
  private async processLearning(
    row: ParsedRow,
    people: Person[],
  ): Promise<{
    action?: ImportAction;
    error?: { name: string; message: string };
  }> {
    const data = row.data;

    const personName = data["Person's Name"]?.trim();
    const learningType = data["Learning Type"]?.trim();
    const bookNumber = data["Book/Text/Grade Number"]?.trim();

    if (!personName || !learningType || !bookNumber) {
      return {
        error: {
          name: personName || "Unknown",
          message: "Missing required fields",
        },
      };
    }

    // Find person by name
    const matches = FuzzyMatcher.findSimilarPeople(personName, people, 0.7);
    if (matches.length === 0) {
      return {
        error: {
          name: personName,
          message: `Person "${personName}" not found in system`,
        },
      };
    }

    const person = people.find((p) => p.id === matches[0].id);
    if (!person) {
      return {
        error: {
          name: personName,
          message: `Person "${personName}" not found in system`,
        },
      };
    }

    const updates: Partial<Person> = {};

    const dateCompleted =
      data["Date Completed"] || new Date().toISOString().split("T")[0];

    if (learningType === "Ruhi Book") {
      // Update Ruhi level and studyCircleBooks
      const bookNum = CSVParser.parseInteger(bookNumber);
      if (bookNum !== null) {
        updates.ruhiLevel = Math.max(person.ruhiLevel, bookNum);

        // Add to study circle books if not already there
        const bookName = `Ruhi Book ${bookNum}`;
        const existingBook = person.studyCircleBooks.find(
          (b) => b.bookNumber === bookNum,
        );
        if (!existingBook) {
          const newBook: RuhiBookCompletion = {
            bookNumber: bookNum,
            bookName,
            dateCompleted,
            tutor: data["Facilitator Name"],
            notes: data["Notes"],
          };
          updates.studyCircleBooks = [...person.studyCircleBooks, newBook];
        }
      }
    } else if (learningType === "JY Text") {
      // Add to JY texts
      const bookNum = CSVParser.parseInteger(bookNumber);
      if (bookNum !== null) {
        const existingBook = person.jyTexts.find(
          (b) => b.bookNumber === bookNum,
        );
        if (!existingBook) {
          const newBook: JYTextCompletion = {
            bookNumber: bookNum,
            dateCompleted,
            animator: data["Facilitator Name"],
            notes: data["Notes"],
          };
          updates.jyTexts = [...person.jyTexts, newBook];
        }
      }
    } else if (learningType === "CC Grade") {
      // Add to CC grades
      const gradeNum = CSVParser.parseInteger(bookNumber);
      if (gradeNum !== null) {
        const existingGrade = person.ccGrades.find(
          (g) => g.gradeNumber === gradeNum,
        );
        if (!existingGrade) {
          const newGrade: CCGradeCompletion = {
            gradeNumber: gradeNum,
            lessonsCompleted: 20, // Default value, could be from CSV if available
            dateCompleted,
            teacher: data["Facilitator Name"],
            notes: data["Notes"],
          };
          updates.ccGrades = [...person.ccGrades, newGrade];
        }
      }
    }

    return {
      action: {
        type: "update",
        entityType: "person",
        entityId: person.id,
        data: updates,
        beforeData: { ...person },
      },
    };
  }

  /**
   * Process home visit row
   */
  private async processHomeVisit(
    row: ParsedRow,
    people: Person[],
    families: Family[],
  ): Promise<{
    action?: ImportAction;
    error?: { name: string; message: string };
  }> {
    const data = row.data;

    const familyOrPersonName = data["Family/Person Visited"]?.trim();
    const area = data["Area"]?.trim();
    const visitDate = data["Visit Date"]?.trim();
    const conversationTopics = data["Conversation Topics"]?.trim();
    const visitors = CSVParser.parseCommaSeparated(
      data["Your Name(s)"]?.trim(),
    );
    const purpose = (data["Purpose"]?.trim() as VisitPurpose) || "Social";
    const followUpDate = data["Follow-Up Date"]?.trim();
    const followUpCompleted =
      data["Follow-Up Completed"]?.toLowerCase() === "yes";

    if (!familyOrPersonName || !area || !visitDate || !conversationTopics) {
      return {
        error: {
          name: familyOrPersonName || "Unknown",
          message: "Missing required fields",
        },
      };
    }

    const homeVisit: HomeVisit = {
      date: visitDate,
      visitors,
      purpose,
      notes: conversationTopics,
      relationshipsDiscovered: data["Relationships Discovered"],
      interestsExpressed: data["Interests Expressed"],
      followUp: data["Next Steps"],
      followUpDate,
      completed: followUpCompleted,
    };

    // Try to find person first
    let person = people.find(
      (p) =>
        p.name.toLowerCase() === familyOrPersonName.toLowerCase() &&
        p.area.toLowerCase() === area.toLowerCase(),
    );

    if (person) {
      person.homeVisits = [...(person.homeVisits || []), homeVisit];
      return {
        action: {
          type: "update",
          entityType: "person",
          entityId: person.id,
          data: { homeVisits: person.homeVisits },
          beforeData: { ...person },
        },
      };
    }

    // Try to find family
    const family = families.find(
      (f) => f.familyName.toLowerCase() === familyOrPersonName.toLowerCase(),
    );

    if (family) {
      // Find all people in this family and update them
      const familyMembers = people.filter((p) => p.familyId === family.id);
      for (const member of familyMembers) {
        member.homeVisits = [...(member.homeVisits || []), homeVisit];
      }
      return {
        action: {
          type: "update",
          entityType: "person",
          data: { homeVisits: familyMembers[0]?.homeVisits },
        },
      };
    }

    return {
      error: {
        name: familyOrPersonName,
        message: `Family or person "${familyOrPersonName}" not found in system`,
      },
    };
  }
}
