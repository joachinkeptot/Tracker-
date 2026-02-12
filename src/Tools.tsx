import React, { useRef } from "react";
import { useApp } from "./AppContext";

export const Tools: React.FC = () => {
  const { people, activities, families, importData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportPeopleToCsv = () => {
    const rows = [
      "name,area,note,categories,connectedActivities,jyTexts,studyCircleBooks,ruhiLevel,familyId,familyName,ageGroup,schoolName,employmentStatus,participationStatus",
    ];

    people.forEach((person) => {
      const categoriesText = person.categories.join("|");
      const activityNames = person.connectedActivities
        .map((id) => activities.find((a) => a.id === id)?.name || id)
        .join("|");
      const jyTexts = (person.jyTexts || [])
        .map((j) => (typeof j === "string" ? j : `Book ${j.bookNumber}`))
        .join("|");
      const familyName = person.familyId
        ? families.find((f) => f.id === person.familyId)?.familyName || ""
        : "";
      const studyCircles = (person.studyCircleBooks || [])
        .map((b) => b.bookName || `Book ${b.bookNumber}`)
        .join("|");

      const row = [
        person.name,
        person.area,
        person.notes || "",
        categoriesText,
        activityNames,
        jyTexts,
        studyCircles,
        person.ruhiLevel,
        person.familyId || "",
        familyName,
        person.ageGroup,
        person.schoolName || "",
        person.employmentStatus,
        person.participationStatus,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",");

      rows.push(row);
    });

    downloadFile("people.csv", rows.join("\n"), "text/csv");
  };

  const exportAllToJson = () => {
    const data = { people, activities, families };
    downloadFile(
      "roommap_ops.json",
      JSON.stringify(data, null, 2),
      "application/json",
    );
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    if (file.name.endsWith(".json")) {
      try {
        const data = JSON.parse(text);
        importData(data);
        alert("Data imported successfully!");
      } catch (error) {
        alert("Failed to import JSON file");
      }
    } else if (file.name.endsWith(".csv")) {
      alert("CSV import not yet implemented in React version");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="panel__section">
      <h2>Tools</h2>
      <div className="form-row">
        <button className="btn" onClick={exportPeopleToCsv}>
          Export People CSV
        </button>
        <button className="btn" onClick={exportAllToJson}>
          Export All JSON
        </button>
      </div>
      <div className="form-row">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv"
          onChange={handleFileImport}
        />
      </div>
      <p className="hint">
        CSV columns: name, area, note, categories, connectedActivities, jyTexts,
        studyCircleBooks, ruhiLevel, familyId, familyName, ageGroup, schoolName,
        employmentStatus, participationStatus
      </p>
    </div>
  );
};
