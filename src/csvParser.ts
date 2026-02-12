import Papa from "papaparse";
import {
  CSVParseResult,
  ParsedRow,
  ValidationError,
  ImportType,
  AgeGroup,
  EmploymentStatus,
  Category,
  ActivityType,
} from "./types";

// Define expected columns for each import type
// Used by detectImportType and validateHeaders
// @ts-ignore - Used for maintenance and type checking
const EXPECTED_COLUMNS: Record<ImportType, string[]> = {
  person: [
    "Timestamp",
    "Your Name",
    "Person's Full Name",
    "Family Name",
    "Area/Street",
    "Age Group",
    "Phone",
    "Email",
    "School Name",
    "Employment Status",
    "Current Categories",
    "Connected to Activities",
    "Ruhi Level",
    "Home Visit Date",
    "Conversation Topics",
    "Follow-Up Needed",
    "Follow-Up Date",
    "Notes",
  ],
  activity: [
    "Timestamp",
    "Your Name",
    "Activity Name",
    "Activity Type",
    "Date",
    "Facilitator Name",
    "Attendee Names",
    "Total Attendance",
    "New Attendees",
    "Highlights/Notes",
    "Materials Covered",
  ],
  learning: [
    "Timestamp",
    "Your Name",
    "Person's Name",
    "Learning Type",
    "Book/Text/Grade Number",
    "Date Completed",
    "Facilitator Name",
    "Next Steps",
    "Notes",
  ],
  homevisit: [
    "Timestamp",
    "Your Name(s)",
    "Family/Person Visited",
    "Area",
    "Visit Date",
    "Purpose",
    "Conversation Topics",
    "Relationships Discovered",
    "Interests Expressed",
    "Next Steps",
    "Follow-Up Date",
    "Follow-Up Completed",
  ],
};

// Mapping from CSV columns to data fields
const COLUMN_MAPPING: Record<ImportType, Record<string, string>> = {
  person: {
    Timestamp: "timestamp",
    "Your Name": "yourName",
    "Person's Full Name": "personName",
    "Family Name": "familyName",
    "Area/Street": "area",
    "Age Group": "ageGroup",
    Phone: "phone",
    Email: "email",
    "School Name": "schoolName",
    "Employment Status": "employmentStatus",
    "Current Categories": "categories",
    "Connected to Activities": "connectedActivities",
    "Ruhi Level": "ruhiLevel",
    "Home Visit Date": "homeVisitDate",
    "Conversation Topics": "conversationTopics",
    "Follow-Up Needed": "followUpNeeded",
    "Follow-Up Date": "followUpDate",
    Notes: "notes",
  },
  activity: {
    Timestamp: "timestamp",
    "Your Name": "yourName",
    "Activity Name": "activityName",
    "Activity Type": "activityType",
    Date: "date",
    "Facilitator Name": "facilitator",
    "Attendee Names": "attendeeNames",
    "Total Attendance": "totalAttendance",
    "New Attendees": "newAttendees",
    "Highlights/Notes": "highlights",
    "Materials Covered": "materialsCovered",
  },
  learning: {
    Timestamp: "timestamp",
    "Your Name": "yourName",
    "Person's Name": "personName",
    "Learning Type": "learningType",
    "Book/Text/Grade Number": "bookNumber",
    "Date Completed": "dateCompleted",
    "Facilitator Name": "facilitator",
    "Next Steps": "nextSteps",
    Notes: "notes",
  },
  homevisit: {
    Timestamp: "timestamp",
    "Your Name(s)": "visitors",
    "Family/Person Visited": "familyOrPersonName",
    Area: "area",
    "Visit Date": "visitDate",
    Purpose: "purpose",
    "Conversation Topics": "conversationTopics",
    "Relationships Discovered": "relationshipsDiscovered",
    "Interests Expressed": "interestsExpressed",
    "Next Steps": "nextSteps",
    "Follow-Up Date": "followUpDate",
    "Follow-Up Completed": "followUpCompleted",
  },
};

// Required columns for each type
const REQUIRED_COLUMNS: Record<ImportType, string[]> = {
  person: [
    "Person's Full Name",
    "Family Name",
    "Area/Street",
    "Age Group",
    "Your Name",
  ],
  activity: [
    "Activity Name",
    "Activity Type",
    "Date",
    "Attendee Names",
    "Your Name",
  ],
  learning: [
    "Person's Name",
    "Learning Type",
    "Book/Text/Grade Number",
    "Date Completed",
    "Your Name",
  ],
  homevisit: [
    "Family/Person Visited",
    "Area",
    "Visit Date",
    "Purpose",
    "Conversation Topics",
    "Your Name(s)",
  ],
};

const VALID_AGE_GROUPS: AgeGroup[] = ["child", "JY", "youth", "adult", "elder"];
const VALID_EMPLOYMENT_STATUSES: EmploymentStatus[] = [
  "student",
  "employed",
  "unemployed",
  "retired",
];
const VALID_CATEGORIES: Category[] = ["JY", "CC", "Youth", "Parents"];
const VALID_ACTIVITY_TYPES: ActivityType[] = [
  "JY",
  "CC",
  "Study Circle",
  "Devotional",
];
const VALID_LEARNING_TYPES = ["Ruhi Book", "JY Text", "CC Grade"];
const VALID_PURPOSES = ["Introduction", "Follow-up", "Social", "Teaching"];
// @ts-ignore - Used for validation and maintenance
const VALID_BOOLEANS = ["Yes", "No", "TRUE", "FALSE", "1", "0"];

export class CSVParser {
  /**
   * Parse CSV file content
   */
  static parseCSV(csvContent: string): Promise<{
    headers: string[];
    rows: Record<string, any>[];
  }> {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results: any) => {
          resolve({
            headers: results.meta.fields || [],
            rows: results.data as Record<string, any>[],
          });
        },
        error: (error: any) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        },
      });
    });
  }

  /**
   * Detect import type based on headers
   */
  static detectImportType(headers: string[]): ImportType {
    const headerSet = new Set(headers.map((h) => h.trim()));

    // Check for distinctive columns
    if (
      headerSet.has("Person's Full Name") &&
      headerSet.has("Family Name") &&
      headerSet.has("Current Categories")
    ) {
      return "person";
    }
    if (
      headerSet.has("Activity Name") &&
      headerSet.has("Attendee Names") &&
      headerSet.has("Activity Type")
    ) {
      return "activity";
    }
    if (
      headerSet.has("Learning Type") &&
      headerSet.has("Book/Text/Grade Number")
    ) {
      return "learning";
    }
    if (
      headerSet.has("Family/Person Visited") &&
      headerSet.has("Visit Date") &&
      headerSet.has("Purpose")
    ) {
      return "homevisit";
    }

    // Default to person if unclear
    return "person";
  }

  /**
   * Validate column headers
   */
  static validateHeaders(
    headers: string[],
    importType: ImportType,
  ): { valid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    const required = REQUIRED_COLUMNS[importType];

    for (const col of required) {
      if (!headers.includes(col)) {
        errors.push({
          rowNumber: 0,
          columnName: col,
          value: null,
          severity: "error",
          message: `Required column "${col}" not found in CSV`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate data types and values for a row
   */
  static validateRow(
    row: Record<string, any>,
    rowNumber: number,
    importType: ImportType,
    headers: string[],
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const column of headers) {
      const value = row[column];
      const fieldName = COLUMN_MAPPING[importType][column];

      if (!fieldName) continue; // Skip unmapped columns

      // Check for required fields
      if (REQUIRED_COLUMNS[importType].includes(column)) {
        if (!value || value.toString().trim() === "") {
          errors.push({
            rowNumber,
            columnName: column,
            value,
            severity: "error",
            message: `Required field "${column}" is empty`,
          });
          continue;
        }
      }

      // Validate specific field types
      if (importType === "person") {
        if (column === "Age Group" && value) {
          if (!VALID_AGE_GROUPS.includes(value)) {
            errors.push({
              rowNumber,
              columnName: column,
              value,
              severity: "error",
              message: `Invalid age group "${value}". Must be one of: ${VALID_AGE_GROUPS.join(", ")}`,
            });
          }
        }

        if (column === "Employment Status" && value) {
          if (!VALID_EMPLOYMENT_STATUSES.includes(value)) {
            errors.push({
              rowNumber,
              columnName: column,
              value,
              severity: "error",
              message: `Invalid employment status "${value}". Must be one of: ${VALID_EMPLOYMENT_STATUSES.join(", ")}`,
            });
          }
        }

        if (column === "Ruhi Level" && value) {
          const num = parseInt(value);
          if (isNaN(num) || num < 0 || num > 12) {
            errors.push({
              rowNumber,
              columnName: column,
              value,
              severity: "error",
              message: `Invalid Ruhi level "${value}". Must be a number between 0 and 12`,
            });
          }
        }

        if (column === "Current Categories" && value) {
          const cats = value.split("|").map((c: string) => c.trim());
          for (const cat of cats) {
            if (!VALID_CATEGORIES.includes(cat)) {
              errors.push({
                rowNumber,
                columnName: column,
                value: cat,
                severity: "error",
                message: `Invalid category "${cat}". Must be one of: ${VALID_CATEGORIES.join(", ")}`,
              });
            }
          }
        }

        // Validate date formats
        if (column === "Home Visit Date" && value) {
          if (!this.isValidDate(value)) {
            errors.push({
              rowNumber,
              columnName: column,
              value,
              severity: "error",
              message: `Invalid date format "${value}". Use YYYY-MM-DD`,
            });
          }
        }

        if (column === "Follow-Up Date" && value) {
          if (!this.isValidDate(value)) {
            errors.push({
              rowNumber,
              columnName: column,
              value,
              severity: "error",
              message: `Invalid date format "${value}". Use YYYY-MM-DD`,
            });
          }
        }

        // Validate email
        if (column === "Email" && value) {
          if (!this.isValidEmail(value)) {
            errors.push({
              rowNumber,
              columnName: column,
              value,
              severity: "warning",
              message: `Email "${value}" appears to be invalid`,
            });
          }
        }
      }

      if (importType === "activity") {
        if (column === "Activity Type" && value) {
          if (!VALID_ACTIVITY_TYPES.includes(value)) {
            errors.push({
              rowNumber,
              columnName: column,
              value,
              severity: "error",
              message: `Invalid activity type "${value}". Must be one of: ${VALID_ACTIVITY_TYPES.join(", ")}`,
            });
          }
        }

        if (column === "Date" && value) {
          if (!this.isValidDate(value)) {
            errors.push({
              rowNumber,
              columnName: column,
              value,
              severity: "error",
              message: `Invalid date format "${value}". Use YYYY-MM-DD`,
            });
          }
        }

        if (column === "Total Attendance" && value) {
          const num = parseInt(value);
          if (isNaN(num) || num < 0) {
            errors.push({
              rowNumber,
              columnName: column,
              value,
              severity: "error",
              message: `Invalid attendance number "${value}". Must be a positive number`,
            });
          }
        }
      }

      if (importType === "learning") {
        if (column === "Learning Type" && value) {
          if (!VALID_LEARNING_TYPES.includes(value)) {
            errors.push({
              rowNumber,
              columnName: column,
              value,
              severity: "error",
              message: `Invalid learning type "${value}". Must be one of: ${VALID_LEARNING_TYPES.join(", ")}`,
            });
          }
        }

        if (column === "Date Completed" && value) {
          if (!this.isValidDate(value)) {
            errors.push({
              rowNumber,
              columnName: column,
              value,
              severity: "error",
              message: `Invalid date format "${value}". Use YYYY-MM-DD`,
            });
          }
        }
      }

      if (importType === "homevisit") {
        if (column === "Purpose" && value) {
          if (!VALID_PURPOSES.includes(value)) {
            errors.push({
              rowNumber,
              columnName: column,
              value,
              severity: "error",
              message: `Invalid purpose "${value}". Must be one of: ${VALID_PURPOSES.join(", ")}`,
            });
          }
        }

        if (column === "Visit Date" && value) {
          if (!this.isValidDate(value)) {
            errors.push({
              rowNumber,
              columnName: column,
              value,
              severity: "error",
              message: `Invalid date format "${value}". Use YYYY-MM-DD`,
            });
          }
        }

        if (column === "Follow-Up Date" && value) {
          if (!this.isValidDate(value)) {
            errors.push({
              rowNumber,
              columnName: column,
              value,
              severity: "error",
              message: `Invalid date format "${value}". Use YYYY-MM-DD`,
            });
          }
        }

        if (column === "Follow-Up Completed" && value) {
          const str = value.toString().trim().toLowerCase();
          if (!["yes", "no", "true", "false", "1", "0"].includes(str)) {
            errors.push({
              rowNumber,
              columnName: column,
              value,
              severity: "error",
              message: `Invalid boolean "${value}". Must be Yes/No or TRUE/FALSE`,
            });
          }
        }
      }
    }

    return errors;
  }

  /**
   * Parse and structure CSV data
   */
  static async structureCSV(
    csvContent: string,
    importType: ImportType,
  ): Promise<CSVParseResult> {
    const { headers, rows } = await this.parseCSV(csvContent);

    // Validate headers
    const headerValidation = this.validateHeaders(headers, importType);
    if (!headerValidation.valid) {
      return {
        importType,
        rows: [],
        columnMapping: {},
        headerRow: headers,
        totalRows: 0,
        validRows: 0,
        errorRows: 0,
      };
    }

    // Build column mapping
    const columnMapping: Record<string, number> = {};
    headers.forEach((header, index) => {
      columnMapping[header] = index;
    });

    // Validate and structure rows
    const parsedRows: ParsedRow[] = [];
    let validCount = 0;
    let errorCount = 0;

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 for header and 1-based indexing
      const errors = this.validateRow(row, rowNumber, importType, headers);

      const hasErrors = errors.some((e) => e.severity === "error");
      if (hasErrors) {
        errorCount++;
      } else {
        validCount++;
      }

      parsedRows.push({
        rowNumber,
        data: row,
        errors,
      });
    });

    return {
      importType,
      rows: parsedRows,
      columnMapping,
      headerRow: headers,
      totalRows: rows.length,
      validRows: validCount,
      errorRows: errorCount,
    };
  }

  /**
   * Helper: Check if date is valid
   */
  private static isValidDate(dateString: string): boolean {
    // Accept YYYY-MM-DD or common formats
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
    if (iso) {
      const date = new Date(dateString);
      return date instanceof Date && !isNaN(date.getTime());
    }

    // Try parsing other formats
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Helper: Check if email is valid
   */
  private static isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Parse pipe-delimited field
   */
  static parsePipeDelimited(value: string | null | undefined): string[] {
    if (!value) return [];
    return value
      .split("|")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }

  /**
   * Parse comma-separated field
   */
  static parseCommaSeparated(value: string | null | undefined): string[] {
    if (!value) return [];
    return value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }

  /**
   * Parse boolean field
   */
  static parseBoolean(value: string | null | undefined): boolean {
    if (!value) return false;
    const str = value.toString().toLowerCase();
    return ["yes", "true", "1"].includes(str);
  }

  /**
   * Parse integer field
   */
  static parseInteger(value: string | null | undefined): number | null {
    if (!value) return null;
    const num = parseInt(value);
    return isNaN(num) ? null : num;
  }
}
