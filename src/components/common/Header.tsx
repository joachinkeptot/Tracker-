import React from "react";
import { useApp } from "../../context";
import { ViewMode } from "../../types";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddItem: () => void;
  onAddConnection?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onAddItem,
  onAddConnection,
}) => {
  const {
    viewMode,
    setViewMode,
    showConnections,
    setShowConnections,
    people,
    families,
    activities,
  } = useApp();

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  return (
    <div className="panel__section board__header">
      <div className="tabs" role="tablist">
        <button
          className={`tab ${viewMode === "people" ? "tab--active" : ""}`}
          onClick={() => handleViewChange("people")}
          role="tab"
        >
          People
        </button>
        <button
          className={`tab ${viewMode === "families" ? "tab--active" : ""}`}
          onClick={() => handleViewChange("families")}
          role="tab"
        >
          Families
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
        <button
          className={`tab ${viewMode === "circles" ? "tab--active" : ""}`}
          onClick={() => handleViewChange("circles")}
          role="tab"
        >
          Circles
        </button>
        <button
          className={`tab ${viewMode === "report" ? "tab--active" : ""}`}
          onClick={() => handleViewChange("report")}
          role="tab"
        >
          Report
        </button>
        <button
          className={`tab ${viewMode === "map" ? "tab--active" : ""}`}
          onClick={() => handleViewChange("map")}
          role="tab"
        >
          Map
        </button>
      </div>
      <div className="board__actions">
        {viewMode !== "analytics" &&
          viewMode !== "circles" &&
          viewMode !== "report" &&
          viewMode !== "map" && (
          <>
            <button className="btn btn--sm" onClick={onAddConnection}>
              + Add Connection
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
      </div>
    </div>
  );
};
