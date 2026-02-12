import React, { useState, useMemo } from "react";
import { AppProvider, useApp } from "./AppContext";
import { Header } from "./Header";
import { FilterBar } from "./FilterBar";
import { AdvancedFilters } from "./AdvancedFilters";
import { Canvas } from "./Canvas";
import { DetailPanel } from "./DetailPanel";
import { Statistics } from "./Statistics";
import { Tools } from "./Tools";
import { ItemModal } from "./ItemModal";
import { FamilyModal } from "./FamilyModal";
import { ImportModal } from "./ImportModal";
import Analytics from "./Analytics";
import {
  FilterState,
  AdvancedFilterState,
  Person,
  Activity,
  ActivityType,
  Category,
  EmploymentStatus,
} from "./types";
import { exportToCSV } from "./utils";
import "./styles.css";

const AppContent: React.FC = () => {
  const {
    people,
    activities,
    families,
    viewMode,
    savedQueries,
    addSavedQuery,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    area: "",
    category: "",
    activityType: "",
    ruhiMin: null,
    ruhiMax: null,
    jyText: "",
  });
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>({
    areas: [],
    categories: [],
    ageGroups: [],
    familyIds: [],
    hasConnections: null,
    connectedActivityTypes: [],
    ruhiMin: null,
    ruhiMax: null,
    jyTexts: [],
    homeVisitDays: null,
    conversationDays: null,
    employmentStatuses: [],
    inSchool: null,
    participationStatuses: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [useAdvancedFilters, setUseAdvancedFilters] = useState(false);

  // Get active items based on view mode
  const activeItems = useMemo(() => {
    return viewMode === "activities" ? activities : people;
  }, [viewMode, people, activities]);

  // Apply advanced filters with AND logic
  const filteredPeople = useMemo(() => {
    let filtered = [...people];

    // Areas filter
    if (advancedFilters.areas.length > 0) {
      filtered = filtered.filter((p) => advancedFilters.areas.includes(p.area));
    }

    // Categories filter
    if (advancedFilters.categories.length > 0) {
      filtered = filtered.filter((p) =>
        advancedFilters.categories.some((cat) => p.categories.includes(cat)),
      );
    }

    // Age groups filter
    if (advancedFilters.ageGroups.length > 0) {
      filtered = filtered.filter((p) =>
        advancedFilters.ageGroups.includes(p.ageGroup),
      );
    }

    // Family filter
    if (advancedFilters.familyIds.length > 0) {
      filtered = filtered.filter(
        (p) => p.familyId && advancedFilters.familyIds.includes(p.familyId),
      );
    }

    // Has connections filter
    if (advancedFilters.hasConnections !== null) {
      filtered = filtered.filter((p) =>
        advancedFilters.hasConnections
          ? p.connectedActivities.length > 0
          : p.connectedActivities.length === 0,
      );
    }

    // Connected activity types filter
    if (advancedFilters.connectedActivityTypes.length > 0) {
      filtered = filtered.filter((p) => {
        const personActivities = p.connectedActivities
          .map((actId) => activities.find((a) => a.id === actId))
          .filter(Boolean) as Activity[];

        return personActivities.some((act) =>
          advancedFilters.connectedActivityTypes.includes(
            act.type as ActivityType,
          ),
        );
      });
    }

    // Ruhi level range filter
    if (advancedFilters.ruhiMin !== null) {
      filtered = filtered.filter(
        (p) => p.ruhiLevel >= advancedFilters.ruhiMin!,
      );
    }
    if (advancedFilters.ruhiMax !== null) {
      filtered = filtered.filter(
        (p) => p.ruhiLevel <= advancedFilters.ruhiMax!,
      );
    }

    // JY texts filter
    if (advancedFilters.jyTexts.length > 0) {
      filtered = filtered.filter((p) =>
        advancedFilters.jyTexts.every((text) =>
          (p.jyTexts || []).some((jy) => {
            // Handle both string format and object format
            if (typeof jy === "string") {
              return jy === text;
            }
            // If it's an object, check by book number or name
            return jy.bookNumber === parseInt(text) || text.includes("Book");
          }),
        ),
      );
    }

    // Home visit engagement filter
    if (advancedFilters.homeVisitDays !== null) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - advancedFilters.homeVisitDays);

      filtered = filtered.filter((p) =>
        p.homeVisits.some((visit) => new Date(visit.date) >= cutoffDate),
      );
    }

    // Conversation engagement filter
    if (advancedFilters.conversationDays !== null) {
      const cutoffDate = new Date();
      cutoffDate.setDate(
        cutoffDate.getDate() - advancedFilters.conversationDays,
      );

      filtered = filtered.filter((p) =>
        p.conversations.some((conv) => new Date(conv.date) >= cutoffDate),
      );
    }

    // Employment status filter
    if (advancedFilters.employmentStatuses.length > 0) {
      filtered = filtered.filter(
        (p) =>
          p.employmentStatus &&
          advancedFilters.employmentStatuses.includes(
            p.employmentStatus as EmploymentStatus,
          ),
      );
    }

    // In school filter
    if (advancedFilters.inSchool !== null) {
      filtered = filtered.filter((p) =>
        advancedFilters.inSchool
          ? p.schoolName !== undefined && p.schoolName.trim() !== ""
          : !p.schoolName || p.schoolName.trim() === "",
      );
    }

    // Participation status filter
    if (advancedFilters.participationStatuses.length > 0) {
      filtered = filtered.filter((p) =>
        advancedFilters.participationStatuses.includes(p.participationStatus),
      );
    }

    return filtered;
  }, [people, activities, advancedFilters]);

  // Apply basic filters and search (legacy support)
  const filteredItems = useMemo(() => {
    let items: (Person | Activity)[] = activeItems;

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) => {
        const name = item.name.toLowerCase();

        if ("ageGroup" in item) {
          const person = item as Person;
          const notes = (person.notes || "").toLowerCase();
          const area = person.area.toLowerCase();
          const categories = person.categories.join(" ").toLowerCase();
          const jyTexts = item.jyTexts
            ? item.jyTexts
                .map((j) =>
                  typeof j === "string" ? j : `Book ${j.bookNumber}`,
                )
                .join(" ")
                .toLowerCase()
            : "";
          return (
            name.includes(query) ||
            area.includes(query) ||
            categories.includes(query) ||
            jyTexts.includes(query) ||
            notes.includes(query)
          );
        } else {
          const activity = item as Activity;
          const type = activity.type.toLowerCase();
          const leader = (
            activity.leader ||
            activity.facilitator ||
            ""
          ).toLowerCase();
          const activityNotes = (activity.notes || "").toLowerCase();
          return (
            name.includes(query) ||
            type.includes(query) ||
            leader.includes(query) ||
            activityNotes.includes(query)
          );
        }
      });
    }

    // Structured filters
    if (viewMode !== "activities") {
      items = items.filter((item) => {
        if (!("ageGroup" in item)) return true;
        const person = item as Person;

        if (filters.area && person.area !== filters.area) return false;
        if (
          filters.category &&
          !person.categories.includes(filters.category as Category)
        )
          return false;
        if (filters.ruhiMin !== null && person.ruhiLevel < filters.ruhiMin)
          return false;
        if (filters.ruhiMax !== null && person.ruhiLevel > filters.ruhiMax)
          return false;
        if (
          filters.jyText &&
          !(person.jyTexts || []).some((jy) => {
            if (typeof jy === "string") return jy === filters.jyText;
            return false;
          })
        )
          return false;

        return true;
      });
    } else {
      items = items.filter((item) => {
        if ("ageGroup" in item) return true;
        const activity = item as Activity;
        if (filters.activityType && activity.type !== filters.activityType)
          return false;
        return true;
      });
    }

    return items;
  }, [activeItems, searchQuery, filters, viewMode]);

  const handleAddItem = () => {
    setEditingPersonId(null);
    setIsModalOpen(true);
  };

  const handleEditPerson = (id: string) => {
    setEditingPersonId(id);
    setIsModalOpen(true);
  };

  const handleAddFamily = () => {
    setIsFamilyModalOpen(true);
  };

  const handleSaveQuery = () => {
    const name = prompt("Enter a name for this query:");
    if (!name) return;

    const description = prompt("Enter a description (optional):") || "";

    addSavedQuery({
      name: name.trim(),
      description: description.trim(),
      filters: advancedFilters,
      createdAt: new Date().toISOString(),
    });
  };

  const handleLoadQuery = (queryId: string) => {
    const query = savedQueries.find((q) => q.id === queryId);
    if (query) {
      setAdvancedFilters(query.filters);
      setUseAdvancedFilters(true);
    }
  };

  const handleExport = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    exportToCSV(filteredPeople, families, `roommap-export-${timestamp}.csv`);
  };

  // Get highlighted IDs for canvas
  const highlightedIds = useMemo(() => {
    if (
      filteredPeople.length === 0 ||
      filteredPeople.length === people.length
    ) {
      return undefined;
    }
    return new Set(filteredPeople.map((p) => p.id));
  }, [filteredPeople, people]);

  return (
    <div className="app">
      <main className="layout">
        <section className="panel panel--full">
          <Header
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddItem={handleAddItem}
            onImport={() => setIsImportModalOpen(true)}
          />

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              padding: "0 1rem",
              marginBottom: "0.5rem",
            }}
          >
            <button
              className={`btn btn--sm ${!useAdvancedFilters ? "btn--primary" : ""}`}
              onClick={() => setUseAdvancedFilters(false)}
            >
              Basic Filters
            </button>
            <button
              className={`btn btn--sm ${useAdvancedFilters ? "btn--primary" : ""}`}
              onClick={() => setUseAdvancedFilters(true)}
            >
              Advanced Filters
            </button>
          </div>

          {!useAdvancedFilters && (
            <FilterBar filters={filters} onFilterChange={setFilters} />
          )}

          {useAdvancedFilters && (
            <AdvancedFilters
              filters={advancedFilters}
              onFilterChange={setAdvancedFilters}
              filteredPeople={filteredPeople}
              onExport={handleExport}
              onSaveQuery={handleSaveQuery}
              onLoadQuery={handleLoadQuery}
            />
          )}

          {viewMode === "analytics" ? (
            <div className="panel__section">
              <Analytics />
            </div>
          ) : (
            <>
              <div className="panel__section">
                <Canvas
                  filteredItems={
                    useAdvancedFilters
                      ? (filteredPeople as (Person | Activity)[])
                      : (filteredItems as (Person | Activity)[])
                  }
                  highlightedIds={
                    useAdvancedFilters ? highlightedIds : undefined
                  }
                />
              </div>

              <div className="panel__section">
                <h2>Details</h2>
                <DetailPanel onEdit={handleEditPerson} />
                <Statistics />
                <div className="legend">
                  <span className="legend__title">Categories</span>
                  <span className="legend__item legend__item--jy">JY</span>
                  <span className="legend__item legend__item--cc">CC</span>
                  <span className="legend__item legend__item--youth">
                    Youth
                  </span>
                  <span className="legend__item legend__item--parents">
                    Parents
                  </span>
                </div>
              </div>
            </>
          )}

          <Tools />
        </section>
      </main>

      <ItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPersonId(null);
        }}
        editingPersonId={editingPersonId}
        onAddFamily={handleAddFamily}
      />

      <FamilyModal
        isOpen={isFamilyModalOpen}
        onClose={() => setIsFamilyModalOpen(false)}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
