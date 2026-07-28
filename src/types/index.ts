// RoomMap Ops - TypeScript Type Definitions
// Based on official RoomMapOps_DataSchema.ts (Single Source of Truth)

// ============================================================================
// ENUMS & TYPES - From Official Schema
// ============================================================================

export type AgeGroup = "child" | "JY" | "youth" | "adult" | "parents" | "elder";

export type EmploymentStatus =
  | "student"
  | "employed"
  | "unemployed"
  | "retired";

export type ParticipationStatus = "active" | "occasional" | "lapsed" | "new";

export type Category = "JY" | "CC" | "Youth" | "Parents";

export type ActivityType = "JY" | "CC" | "Study Circle" | "Devotional";

export type FollowUpStatus = "Yes" | "No" | "Scheduled";

export type VisitPurpose = "Introduction" | "Follow-up" | "Social" | "Teaching";

// ============================================================================
// CORE DATA STRUCTURES
// ============================================================================

// Position on canvas
export interface Position {
  x: number;
  y: number;
}

// Learning Completion Records
export interface JYTextCompletion {
  bookNumber?: number; // Legacy: 1-7 (deprecated, use bookName)
  bookName: string; // Name of the JY text (e.g., "Breezes of Confirmation")
  dateCompleted: string; // ISO 8601 date
  animator?: string; // Name of animator
  notes?: string;
}

export interface RuhiBookCompletion {
  bookNumber: number; // 1-12
  bookName: string; // e.g., "Reflections on the Life of the Spirit"
  dateCompleted: string; // ISO 8601 date
  tutor?: string; // Name of tutor
  notes?: string;
}

export interface CCGradeCompletion {
  gradeNumber: number; // 1-5
  lessonsCompleted: number; // How many lessons in this grade
  dateCompleted?: string; // When grade was finished (if completed)
  teacher?: string; // Name of teacher
  notes?: string;
}

// Home visit record
export interface HomeVisit {
  date: string; // ISO 8601 date: YYYY-MM-DD
  visitors: string[]; // Array of visitor names
  purpose: VisitPurpose; // Type of visit
  notes: string; // Conversation topics and details
  relationshipsDiscovered?: string; // Connections found during visit
  interestsExpressed?: string; // What the person/family is interested in
  followUp?: string; // Next steps agreed upon
  followUpDate?: string; // ISO 8601 date for next contact
  completed: boolean; // Whether follow-up was completed
}

// Conversation record
export interface Conversation {
  date: string; // ISO 8601 date
  topic: string; // Main subject discussed
  notes: string; // Detailed notes
  nextSteps?: string; // Action items
  followUpDate?: string; // When to reconnect
}

// Person connection/relationship
export interface PersonConnection {
  personId: string; // ID of the connected person
  description?: string; // Optional details
  dateAdded: string; // When connection was recorded
}

// FAMILY ENTITY
export interface Family {
  id: string; // UUID
  familyName: string; // e.g., "Garcia Family"
  primaryArea: string; // Geographic area
  phone?: string; // Optional: (555) 123-4567
  email?: string; // Optional: family@email.com
  notes?: string; // Additional information
  dateAdded: string; // ISO 8601 timestamp
  lastContact?: string; // ISO 8601 timestamp of last interaction
  memberCount?: number; // Auto-calculated from people linking to this family
}

// PERSON ENTITY (Primary entity - enhanced version from schema)
export interface Person {
  // Basic Info
  id: string; // UUID
  name: string; // Full name: "First Last"
  area: string; // Geographic area/neighborhood
  familyId?: string; // Link to Family entity

  // Demographics
  ageGroup: AgeGroup; // child, JY, youth, adult, elder
  isParent?: boolean;
  isElder?: boolean;
  phone?: string;
  email?: string;
  schoolName?: string; // If student
  employmentStatus?: EmploymentStatus;

  // Activity Connections
  connectedActivities: string[]; // Array of Activity IDs

  // Learning Progress
  ruhiLevel: number; // 0-12 (highest book completed)
  jyTexts: JYTextCompletion[]; // Array of completed JY books with dates
  studyCircleBooks: RuhiBookCompletion[]; // Array of Ruhi books with details
  ccGrades: CCGradeCompletion[]; // Array of CC grade progress

  // Engagement Tracking
  homeVisits: HomeVisit[]; // Array of all home visits
  conversations: Conversation[]; // Array of meaningful conversations
  lastContact?: string; // ISO 8601 date of most recent interaction

  // Relationships
  connections: PersonConnection[]; // Array of relationships to other people

  // Cohorts
  cohorts?: string[]; // User-defined cohort labels

  // Metadata
  notes?: string; // General notes
  dateAdded: string; // ISO 8601 timestamp when added to system
  lastModified: string; // ISO 8601 timestamp of last update

  // Canvas Position (for visual layout)
  position?: Position;
}

// ACTIVITY ENTITY
export interface Activity {
  id: string; // UUID
  name: string; // e.g., "Northside JY Group"
  type: ActivityType; // JY, CC, Study Circle, Devotional
  facilitator?: string; // Name of animator/teacher/tutor/leader
  leader?: string; // Alternative name for facilitator (for backward compatibility)
  area?: string; // Where it happens

  // Participation Tracking
  participantIds: string[]; // Array of Person IDs (derived from Person.connectedActivities)
  averageAttendance?: number; // Auto-calculated from attendance logs
  lastSessionDate?: string; // ISO 8601 date of most recent meeting
  isActive?: boolean; // defaults to true when absent; backward compatible

  // Details
  notes?: string;
  note?: string; // Alternative name for notes (for backward compatibility)
  materials?: string; // What's being studied

  // Reflections log
  reflections?: ActivityReflection[];

  // Metadata
  dateCreated: string; // ISO 8601 timestamp
  lastModified: string;

  // Canvas Position
  position?: Position;
}

export interface ActivityReflection {
  date: string; // ISO 8601 date
  text: string;
}

// ============================================================================
// UI & APPLICATION STATE
// ============================================================================

export type ViewMode =
  | "people"
  | "families"
  | "activities"
  | "analytics"
  | "circles";

// Selected item state
export interface SelectedItem {
  type: "people" | "families" | "activities";
  id: string | null;
}

// Canvas Positions storage
export interface CanvasPositions {
  people: Record<string, Position>;
  activities: Record<string, Position>;
}

// Application state
export interface AppState {
  families: Family[];
  people: Person[];
  activities: Activity[];

  // UI State
  selected: SelectedItem;
  viewMode: ViewMode;
  showConnections: boolean;

  // Area nicknames: maps raw area string → friendly nickname
  areaNicknames: Record<string, string>;

  // Queries
  savedQueries: SavedQuery[];

  // Canvas positions
  canvasPositions?: CanvasPositions;
  groupPositions?: Map<string, Position>;
}

// Filter state
export interface FilterState {
  area: string;
  category: string;
  activityType: string;
  ruhiMin: number | null;
  ruhiMax: number | null;
  jyText: string;
}

// Advanced filter state
export interface AdvancedFilterState {
  // Basic filters
  areas: string[];
  ageGroups: AgeGroup[];

  // Family filters
  familyIds: string[];

  // Activity filters
  hasConnections: boolean | null; // null = no filter, true = has, false = none
  connectedActivityTypes: ActivityType[];

  // Learning filters
  ruhiMin: number | null;
  ruhiMax: number | null;

  // Engagement filters
  homeVisitDays: number | null; // last X days
  conversationDays: number | null; // last X days

  // Employment filters
  employmentStatuses: EmploymentStatus[];
  inSchool: boolean | null; // null = no filter
}

// Saved query
export interface SavedQuery {
  id: string;
  name: string;
  description: string;
  filters: AdvancedFilterState;
  createdAt: string;
}

// Serializable state for storage
export interface SerializableState {
  people: Person[];
  activities: Activity[];
  families: Family[];
  selected: SelectedItem;
  canvasPositions?: CanvasPositions;
  groupPositions: { [key: string]: Position };
  savedQueries: SavedQuery[];
  viewMode?: ViewMode;
  showConnections?: boolean;
  areaNicknames?: Record<string, string>;
}

// ============================================================================
// FORM SUBMISSION TYPES
// ============================================================================

export type FormType = "person" | "homevisit" | "activity";

export interface FormSubmission {
  id: string;
  formType: FormType;
  submittedBy: string;
  submittedAt: string;
  data: any;
  processed: boolean;
  processedAt?: string;
}

// Re-export analytics types for convenience
export * from "./AnalyticsTypes";
