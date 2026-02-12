import React, { useState, useMemo } from "react";
import { useApp } from "./AppContext";
import {
  AdvancedFilterState,
  Category,
  AgeGroup,
  ActivityType,
  EmploymentStatus,
  ParticipationStatus,
  Person,
} from "./types";
import { getAreaList } from "./utils";

interface AdvancedFiltersProps {
  filters: AdvancedFilterState;
  onFilterChange: (filters: AdvancedFilterState) => void;
  filteredPeople: Person[];
  onExport: () => void;
  onSaveQuery: () => void;
  onLoadQuery: (queryId: string) => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFilterChange,
  filteredPeople,
  onExport,
  onSaveQuery,
  onLoadQuery,
}) => {
  const { people, families, savedQueries } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["basic"]),
  );

  const areas = getAreaList(people);
  const resultCount = filteredPeople.length;

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleArrayToggle = <T,>(
    field: keyof AdvancedFilterState,
    value: T,
  ) => {
    const currentArray = filters[field] as T[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((v) => v !== value)
      : [...currentArray, value];
    onFilterChange({ ...filters, [field]: newArray });
  };

  const handleChange = (
    field: keyof AdvancedFilterState,
    value: string | number | null | string[] | boolean,
  ) => {
    onFilterChange({
      ...filters,
      [field]: value as unknown as AdvancedFilterState[typeof field],
    });
  };

  const clearAll = () => {
    onFilterChange({
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
  };

  const hasActiveFilters = useMemo(() => {
    return (
      filters.areas.length > 0 ||
      filters.categories.length > 0 ||
      filters.ageGroups.length > 0 ||
      filters.familyIds.length > 0 ||
      filters.hasConnections !== null ||
      filters.connectedActivityTypes.length > 0 ||
      filters.ruhiMin !== null ||
      filters.ruhiMax !== null ||
      filters.jyTexts.length > 0 ||
      filters.homeVisitDays !== null ||
      filters.conversationDays !== null ||
      filters.employmentStatuses.length > 0 ||
      filters.inSchool !== null ||
      filters.participationStatuses.length > 0
    );
  }, [filters]);

  return (
    <div className="panel__section advanced-filters">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "0.5rem",
        }}
      >
        <button
          className="btn btn--sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? "⏷" : "⏶"} Advanced Filters
        </button>
        {hasActiveFilters && (
          <span
            className="badge"
            style={{
              background: "#3b82f6",
              color: "white",
              padding: "0.25rem 0.5rem",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: "bold",
            }}
          >
            {resultCount} results
          </span>
        )}
        {!isCollapsed && (
          <>
            <button
              className="btn btn--sm"
              onClick={clearAll}
              style={{ marginLeft: "auto" }}
            >
              Clear All
            </button>
            <button
              className="btn btn--sm btn--primary"
              onClick={onSaveQuery}
              disabled={!hasActiveFilters}
            >
              Save Query
            </button>
            <button
              className="btn btn--sm"
              onClick={onExport}
              disabled={resultCount === 0}
            >
              Export CSV
            </button>
          </>
        )}
      </div>

      {!isCollapsed && (
        <div className="advanced-filters__content">
          {/* Saved Queries */}
          {savedQueries.length > 0 && (
            <div className="filter-section" style={{ marginBottom: "1rem" }}>
              <label className="muted">Load Saved Query</label>
              <select
                onChange={(e) => {
                  if (e.target.value) onLoadQuery(e.target.value);
                }}
                value=""
                style={{ width: "100%" }}
              >
                <option value="">Select a saved query...</option>
                {savedQueries.map((query) => (
                  <option key={query.id} value={query.id}>
                    {query.name} - {query.description}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 1. Basic Filters */}
          <div className="filter-section">
            <button
              className="filter-section__header"
              onClick={() => toggleSection("basic")}
            >
              <span>📍 Basic Filters</span>
              <span>{expandedSections.has("basic") ? "▼" : "▶"}</span>
            </button>
            {expandedSections.has("basic") && (
              <div className="filter-section__body">
                <div className="filter-group">
                  <label className="muted">Areas (multi-select)</label>
                  <div className="checkbox-grid">
                    {areas.map((area) => (
                      <label key={area} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={filters.areas.includes(area)}
                          onChange={() => handleArrayToggle("areas", area)}
                        />
                        {area}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <label className="muted">Categories</label>
                  <div className="checkbox-grid">
                    {(["JY", "CC", "Youth", "Parents"] as Category[]).map(
                      (cat) => (
                        <label key={cat} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(cat)}
                            onChange={() =>
                              handleArrayToggle("categories", cat)
                            }
                          />
                          {cat}
                        </label>
                      ),
                    )}
                  </div>
                </div>

                <div className="filter-group">
                  <label className="muted">Age Groups</label>
                  <div className="checkbox-grid">
                    {(
                      ["child", "JY", "youth", "adult", "elder"] as AgeGroup[]
                    ).map((age) => (
                      <label key={age} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={filters.ageGroups.includes(age)}
                          onChange={() => handleArrayToggle("ageGroups", age)}
                        />
                        {age === "JY"
                          ? "JY"
                          : age.charAt(0).toUpperCase() + age.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Family Filters */}
          <div className="filter-section">
            <button
              className="filter-section__header"
              onClick={() => toggleSection("family")}
            >
              <span>👨‍👩‍👧‍👦 Family Filters</span>
              <span>{expandedSections.has("family") ? "▼" : "▶"}</span>
            </button>
            {expandedSections.has("family") && (
              <div className="filter-section__body">
                <div className="filter-group">
                  <label className="muted">Families (multi-select)</label>
                  <div
                    className="checkbox-grid"
                    style={{ maxHeight: "200px", overflowY: "auto" }}
                  >
                    {families.map((family) => (
                      <label key={family.id} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={filters.familyIds.includes(family.id)}
                          onChange={() =>
                            handleArrayToggle("familyIds", family.id)
                          }
                        />
                        {family.familyName}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Activity Filters */}
          <div className="filter-section">
            <button
              className="filter-section__header"
              onClick={() => toggleSection("activities")}
            >
              <span>🎯 Activity Filters</span>
              <span>{expandedSections.has("activities") ? "▼" : "▶"}</span>
            </button>
            {expandedSections.has("activities") && (
              <div className="filter-section__body">
                <div className="filter-group">
                  <label className="muted">Has Connections</label>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <label className="checkbox-label">
                      <input
                        type="radio"
                        name="hasConnections"
                        checked={filters.hasConnections === null}
                        onChange={() => handleChange("hasConnections", null)}
                      />
                      Any
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="radio"
                        name="hasConnections"
                        checked={filters.hasConnections === true}
                        onChange={() => handleChange("hasConnections", true)}
                      />
                      Yes
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="radio"
                        name="hasConnections"
                        checked={filters.hasConnections === false}
                        onChange={() => handleChange("hasConnections", false)}
                      />
                      No
                    </label>
                  </div>
                </div>

                <div className="filter-group">
                  <label className="muted">Connected to Activity Types</label>
                  <div className="checkbox-grid">
                    {(
                      [
                        "JY",
                        "CC",
                        "StudyCircle",
                        "Devotional",
                      ] as ActivityType[]
                    ).map((type) => (
                      <label key={type} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={filters.connectedActivityTypes.includes(
                            type,
                          )}
                          onChange={() =>
                            handleArrayToggle("connectedActivityTypes", type)
                          }
                        />
                        {type === "Study Circle" ? "Study Circle" : type}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Learning Filters */}
          <div className="filter-section">
            <button
              className="filter-section__header"
              onClick={() => toggleSection("learning")}
            >
              <span>📚 Learning Progress</span>
              <span>{expandedSections.has("learning") ? "▼" : "▶"}</span>
            </button>
            {expandedSections.has("learning") && (
              <div className="filter-section__body">
                <div className="filter-group">
                  <label className="muted">Ruhi Level Range (0-12)</label>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="number"
                      min="0"
                      max="12"
                      placeholder="Min"
                      value={filters.ruhiMin ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "ruhiMin",
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                      style={{ width: "80px" }}
                    />
                    <span>to</span>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      placeholder="Max"
                      value={filters.ruhiMax ?? ""}
                      onChange={(e) =>
                        handleChange(
                          "ruhiMax",
                          e.target.value ? parseInt(e.target.value) : null,
                        )
                      }
                      style={{ width: "80px" }}
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <label className="muted">JY Texts Completed</label>
                  <div className="checkbox-grid">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <label key={num} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={filters.jyTexts.includes(`Book ${num}`)}
                          onChange={() =>
                            handleArrayToggle("jyTexts", `Book ${num}`)
                          }
                        />
                        Book {num}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Engagement Filters */}
          <div className="filter-section">
            <button
              className="filter-section__header"
              onClick={() => toggleSection("engagement")}
            >
              <span>💬 Engagement</span>
              <span>{expandedSections.has("engagement") ? "▼" : "▶"}</span>
            </button>
            {expandedSections.has("engagement") && (
              <div className="filter-section__body">
                <div className="filter-group">
                  <label className="muted">Home Visit in Last X Days</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g., 30, 90"
                    value={filters.homeVisitDays ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "homeVisitDays",
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    style={{ width: "150px" }}
                  />
                </div>

                <div className="filter-group">
                  <label className="muted">Conversation in Last X Days</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g., 30, 90"
                    value={filters.conversationDays ?? ""}
                    onChange={(e) =>
                      handleChange(
                        "conversationDays",
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    style={{ width: "150px" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 6. Employment Filters */}
          <div className="filter-section">
            <button
              className="filter-section__header"
              onClick={() => toggleSection("employment")}
            >
              <span>💼 Employment</span>
              <span>{expandedSections.has("employment") ? "▼" : "▶"}</span>
            </button>
            {expandedSections.has("employment") && (
              <div className="filter-section__body">
                <div className="filter-group">
                  <label className="muted">Employment Status</label>
                  <div className="checkbox-grid">
                    {(
                      [
                        "student",
                        "employed",
                        "unemployed",
                        "retired",
                      ] as EmploymentStatus[]
                    ).map((status) => (
                      <label key={status} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={filters.employmentStatuses.includes(status)}
                          onChange={() =>
                            handleArrayToggle("employmentStatuses", status)
                          }
                        />
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <label className="muted">In School</label>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <label className="checkbox-label">
                      <input
                        type="radio"
                        name="inSchool"
                        checked={filters.inSchool === null}
                        onChange={() => handleChange("inSchool", null)}
                      />
                      Any
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="radio"
                        name="inSchool"
                        checked={filters.inSchool === true}
                        onChange={() => handleChange("inSchool", true)}
                      />
                      Yes
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="radio"
                        name="inSchool"
                        checked={filters.inSchool === false}
                        onChange={() => handleChange("inSchool", false)}
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 7. Participation Filters */}
          <div className="filter-section">
            <button
              className="filter-section__header"
              onClick={() => toggleSection("participation")}
            >
              <span>⭐ Participation</span>
              <span>{expandedSections.has("participation") ? "▼" : "▶"}</span>
            </button>
            {expandedSections.has("participation") && (
              <div className="filter-section__body">
                <div className="filter-group">
                  <label className="muted">Participation Status</label>
                  <div className="checkbox-grid">
                    {(
                      [
                        "active",
                        "occasional",
                        "lapsed",
                        "new",
                      ] as ParticipationStatus[]
                    ).map((status) => (
                      <label key={status} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={filters.participationStatuses.includes(
                            status,
                          )}
                          onChange={() =>
                            handleArrayToggle("participationStatuses", status)
                          }
                        />
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
