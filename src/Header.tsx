import React from "react";
import { useApp } from "./AppContext";
import { ViewMode } from "./types";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddItem: () => void;
  onImport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onAddItem,
  onImport,
}) => {
  const {
    viewMode,
    setViewMode,
    cohortViewMode,
    setCohortViewMode,
    showConnections,
    setShowConnections,
    people,
    families,
    activities,
  } = useApp();

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const toggleCohortView = () => {
    setCohortViewMode(
      cohortViewMode === "categories" ? "families" : "categories",
    );
  };

  return (
    <div className="panel__section board__header">
      <div className="tabs" role="tablist">
        <button
          className={`tab ${viewMode === "areas" ? "tab--active" : ""}`}
          onClick={() => handleViewChange("areas")}
          role="tab"
        >
          Areas
        </button>
        <button
          className={`tab ${viewMode === "cohorts" ? "tab--active" : ""}`}
          onClick={() => handleViewChange("cohorts")}
          role="tab"
        >
          Cohorts
        </button>
        <button
          className={`tab ${viewMode === "activities" ? "tab--active" : ""}`}
          onClick={() => handleViewChange("activities")}
          role="tab"
        >
          Activities
        </button>
        <button
          className={`tab ${viewMode === "analytics" ? "tab--active" : ""}`}
          onClick={() => handleViewChange("analytics")}
          role="tab"
        >
          Analytics
        </button>
      </div>
      <div className="board__actions">
        {viewMode === "cohorts" && (
          <>
            <button className="btn btn--sm" onClick={toggleCohortView}>
              View:{" "}
              {cohortViewMode === "categories" ? "Categories" : "Families"}
            </button>
            <button
              className={`btn btn--sm ${showConnections ? "btn--active" : ""}`}
              onClick={() => setShowConnections(!showConnections)}
            >
              {showConnections ? "Hide" : "Show"} Connections
            </button>
          </>
        )}
        <input
          type="text"
          placeholder="Search..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="stats">
          People: {people.length} | Families: {families.length} | Activities:{" "}
          {activities.length}
        </div>
        <button className="fab" aria-label="Add" onClick={onAddItem}>
          +
        </button>
        <button
          className="btn btn--sm"
          aria-label="Import CSV"
          onClick={onImport}
          title="Import data from CSV"
        >
          📥 Import
        </button>
      </div>
    </div>
  );
};
