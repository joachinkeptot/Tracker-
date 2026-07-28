import React, { useMemo } from "react";
import { Person, Family } from "../../types";

interface PeopleTableProps {
  people: Person[];
  families: Family[];
  onSelectPerson: (id: string) => void;
}

/**
 * Helper function to format age group text
 */
const formatAgeGroup = (ageGroup: string): string => {
  if (ageGroup === "JY") return "JY";
  return ageGroup.charAt(0).toUpperCase() + ageGroup.slice(1);
};

/**
 * People table component
 * Displays a list of people with their details
 */
export const PeopleTable: React.FC<PeopleTableProps> = ({
  people,
  families,
  onSelectPerson,
}) => {
  // Create a map for O(1) lookups instead of O(n) array searches
  const familyMap = useMemo(
    () => new Map<string, Family>(families.map((f) => [f.id, f])),
    [families],
  );

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Area</th>
            <th>Age Group</th>
            <th>Tags</th>
            <th>Connections</th>
          </tr>
        </thead>
        <tbody>
          {people.map((person) => {
            const family = person.familyId
              ? familyMap.get(person.familyId)
              : null;
            return (
              <tr key={person.id} onClick={() => onSelectPerson(person.id)}>
                <td>
                  <div className="table-title">{person.name}</div>
                  <div className="table-subtitle">
                    {family?.familyName || "No family"}
                  </div>
                </td>
                <td>{person.area || "-"}</td>
                <td>
                  <span className={`chip chip--age-${person.ageGroup}`}>
                    {formatAgeGroup(person.ageGroup)}
                  </span>
                </td>
                <td>
                  <div className="chip-row">
                    {(person.cohorts || []).map((cohort: string) => (
                      <span key={cohort} className="chip chip--activity">
                        {cohort}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="chip-row">
                    <span className="chip">
                      Activities: {person.connectedActivities.length}
                    </span>
                    <span className="chip chip--muted">
                      Links: {person.connections.length}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
