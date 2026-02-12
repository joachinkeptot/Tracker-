import React, { useState, useRef } from "react";
import { ImportType, CSVParseResult } from "./types";
import { CSVParser } from "./csvParser";
import { ImportExecutor } from "./importExecutor";
import { useApp } from "./AppContext";

type Step = "type" | "upload" | "preview" | "mapping" | "execute" | "review";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { people, activities, families } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [step, setStep] = useState<Step>("type");
  const [importType, setImportType] = useState<ImportType>("person");
  const [csvContent, setCsvContent] = useState<string>("");
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Step 1: Select Import Type
  const handleSelectType = (type: ImportType) => {
    setImportType(type);
    setStep("upload");
  };

  // Step 2: Upload & Parse CSV
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const content = await file.text();
      setCsvContent(content);

      // Parse CSV
      const result = await CSVParser.structureCSV(content, importType);
      setParseResult(result);

      if (result.errorRows > 0) {
        setError(
          `Found ${result.errorRows} rows with validation errors. Review them in the next step.`,
        );
      }

      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse CSV file");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Preview & Validate
  const handleConfirmPreview = () => {
    if (parseResult && parseResult.validRows > 0) {
      setStep("execute");
    } else {
      setError("No valid rows to import");
    }
  };

  // Step 4: Mapping & Matching (simplified - could be expanded)
  const handleConfirmMapping = () => {
    setStep("execute");
  };

  // Step 5: Execute Import
  const handleExecuteImport = async () => {
    if (!parseResult) return;

    setLoading(true);
    setError(null);

    try {
      const executor = new ImportExecutor();
      const result = await executor.executeImport(
        parseResult,
        people,
        activities,
        families,
      );

      setSummary(result);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Review & Undo
  const handleUndo = async () => {
    if (!summary) return;

    setLoading(true);
    try {
      const executor = new ImportExecutor();
      const backup = executor.restoreBackup(summary.backupId);

      if (backup) {
        // Reload data from backup
        // This would require additional context methods
        setError("Undo completed. Please refresh the application.");
        setTimeout(onClose, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Undo failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadErrors = () => {
    if (!summary || summary.errors.length === 0) return;

    const csv = [
      ["Row Number", "Entity Name", "Reason"].join(","),
      ...summary.errors.map((e: any) =>
        [e.rowNumber, e.entityName, `"${e.reason}"`].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import_errors_${Date.now()}.csv`;
    a.click();
  };

  // Render steps
  const renderTypeSelection = () => (
    <div className="import-step">
      <h2>Step 1: Select Import Type</h2>
      <div className="import-type-grid">
        <button
          className={`type-button ${importType === "person" ? "selected" : ""}`}
          onClick={() => handleSelectType("person")}
        >
          <div className="type-icon">👥</div>
          <div className="type-title">Person & Family Intake</div>
          <div className="type-desc">Import people and family information</div>
        </button>

        <button
          className={`type-button ${importType === "activity" ? "selected" : ""}`}
          onClick={() => handleSelectType("activity")}
        >
          <div className="type-icon">📅</div>
          <div className="type-title">Activity Attendance</div>
          <div className="type-desc">Log activity sessions and attendees</div>
        </button>

        <button
          className={`type-button ${importType === "learning" ? "selected" : ""}`}
          onClick={() => handleSelectType("learning")}
        >
          <div className="type-icon">📚</div>
          <div className="type-title">Learning Progress</div>
          <div className="type-desc">
            Track book completions and Ruhi levels
          </div>
        </button>

        <button
          className={`type-button ${importType === "homevisit" ? "selected" : ""}`}
          onClick={() => handleSelectType("homevisit")}
        >
          <div className="type-icon">🏠</div>
          <div className="type-title">Home Visits & Conversations</div>
          <div className="type-desc">Record visits and interactions</div>
        </button>
      </div>
    </div>
  );

  const renderFileUpload = () => (
    <div className="import-step">
      <h2>Step 2: Upload CSV File</h2>

      <div className="file-upload-area">
        <div
          className="dropzone"
          onDragOver={(e: React.DragEvent) => {
            e.preventDefault();
            e.currentTarget.classList.add("dragover");
          }}
          onDragLeave={() => {
            document.querySelector(".dropzone")?.classList.remove("dragover");
          }}
          onDrop={(e: React.DragEvent) => {
            e.preventDefault();
            document.querySelector(".dropzone")?.classList.remove("dragover");
            const files = e.dataTransfer.files;
            if (files.length > 0) {
              const file = files[0];
              const mockEvent = {
                target: { files: [file] },
              } as unknown as React.ChangeEvent<HTMLInputElement>;
              handleFileUpload(mockEvent);
            }
          }}
        >
          <div className="dropzone-content">
            <div className="dropzone-icon">📁</div>
            <div className="dropzone-text">
              <strong>Drag and drop your CSV file here</strong>
              <br />
              or click to browse
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="file-input"
          />
        </div>
      </div>

      <button
        className="button-secondary"
        onClick={() => fileInputRef.current?.click()}
      >
        Browse Files
      </button>

      {csvContent && (
        <div className="file-selected">
          <div className="checkmark">✓</div>
          <div>File uploaded successfully</div>
        </div>
      )}
    </div>
  );

  const renderPreview = () => {
    if (!parseResult) return null;

    const validRows = parseResult.rows.filter(
      (r) => !r.errors.some((e) => e.severity === "error"),
    );
    const previewRows = validRows.slice(0, 10);

    return (
      <div className="import-step">
        <h2>Step 3: Preview & Validate</h2>

        <div className="preview-stats">
          <div className="stat">
            <div className="stat-number">{parseResult.totalRows}</div>
            <div className="stat-label">Total Rows</div>
          </div>
          <div className="stat">
            <div className="stat-number valid">{parseResult.validRows}</div>
            <div className="stat-label">Valid</div>
          </div>
          <div className="stat">
            <div className="stat-number error">{parseResult.errorRows}</div>
            <div className="stat-label">Errors</div>
          </div>
        </div>

        <div className="preview-table">
          <table>
            <thead>
              <tr>
                {parseResult.headerRow.slice(0, 6).map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => (
                <tr
                  key={idx}
                  className={row.errors.length > 0 ? "error-row" : ""}
                >
                  {parseResult.headerRow.slice(0, 6).map((header) => (
                    <td key={header}>{row.data[header]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {parseResult.errorRows > 0 && (
          <div className="error-section">
            <h3>Validation Issues Found</h3>
            <div className="error-list">
              {parseResult.rows
                .filter((r) => r.errors.length > 0)
                .slice(0, 5)
                .map((row, idx) => (
                  <div key={idx} className="error-item">
                    <div className="error-row">Row {row.rowNumber}</div>
                    <div className="error-details">
                      {row.errors.map((err, eidx) => (
                        <div
                          key={eidx}
                          className={`error-message ${err.severity}`}
                        >
                          {err.columnName}: {err.message}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMapping = () => (
    <div className="import-step">
      <h2>Step 4: Mapping & Matching</h2>
      <p>CSV columns are mapped to RoomMap fields automatically.</p>
      <p>Review has been completed. Ready to execute import.</p>
    </div>
  );

  const renderExecute = () => (
    <div className="import-step">
      <h2>Step 5: Import Execution</h2>

      {!summary ? (
        <div className="execute-content">
          <p>Ready to import {parseResult?.validRows} valid rows.</p>
          <div className="progress-info">
            <div className="spinner"></div>
            <div>Preparing import...</div>
          </div>
        </div>
      ) : (
        <div className="import-summary">
          <div className="summary-header">
            <h3>✓ Import Complete!</h3>
          </div>

          <div className="summary-grid">
            <div className="summary-card created">
              <div className="summary-title">Created</div>
              <div className="summary-items">
                {summary.created.people > 0 && (
                  <div>{summary.created.people} people</div>
                )}
                {summary.created.families > 0 && (
                  <div>{summary.created.families} families</div>
                )}
                {summary.created.activities > 0 && (
                  <div>{summary.created.activities} activities</div>
                )}
              </div>
            </div>

            <div className="summary-card updated">
              <div className="summary-title">Updated</div>
              <div className="summary-items">
                {summary.updated.people > 0 && (
                  <div>{summary.updated.people} people</div>
                )}
                {summary.updated.activities > 0 && (
                  <div>{summary.updated.activities} activities</div>
                )}
              </div>
            </div>

            <div
              className={`summary-card ${summary.errorCount > 0 ? "errors" : "success"}`}
            >
              <div className="summary-title">
                {summary.errorCount > 0 ? "Errors" : "Success"}
              </div>
              <div className="summary-items">
                {summary.errorCount > 0 ? (
                  <div>{summary.errorCount} failed rows</div>
                ) : (
                  <div>All rows processed</div>
                )}
              </div>
            </div>
          </div>

          {summary.errors.length > 0 && (
            <div className="error-section">
              <h4>Failed Rows</h4>
              <div className="error-list">
                {summary.errors.slice(0, 5).map((e: any) => (
                  <div key={e.rowNumber} className="error-item">
                    <span className="error-row">Row {e.rowNumber}</span>
                    <span className="error-text">{e.reason}</span>
                  </div>
                ))}
                {summary.errors.length > 5 && (
                  <div className="error-more">
                    +{summary.errors.length - 5} more errors
                  </div>
                )}
              </div>
              <button
                className="button-secondary"
                onClick={handleDownloadErrors}
              >
                📥 Download Error Report (CSV)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderReview = () => (
    <div className="import-step">
      <h2>Step 6: Review & Undo</h2>

      {summary && (
        <div className="review-content">
          <div className="review-item">
            <strong>Import Timestamp:</strong>
            <span>{new Date(summary.timestamp).toLocaleString()}</span>
          </div>
          <div className="review-item">
            <strong>Total Processed:</strong>
            <span>{summary.successCount + summary.errorCount} rows</span>
          </div>
          <div className="review-item">
            <strong>Success Rate:</strong>
            <span>
              {Math.round(
                (summary.successCount /
                  (summary.successCount + summary.errorCount)) *
                  100,
              )}
              %
            </span>
          </div>

          <div className="undo-section">
            <h3>Undo Changes</h3>
            <p>
              If you need to revert this import, click the button below. All
              changes will be rolled back.
            </p>
            <button
              className="button-danger"
              onClick={handleUndo}
              disabled={loading}
            >
              ↶ Undo Import
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Navigation
  const stepOrder: Step[] = [
    "type",
    "upload",
    "preview",
    "mapping",
    "execute",
    "review",
  ];
  const currentStepIndex = stepOrder.indexOf(step);

  return (
    <div className="modal-overlay">
      <div className="import-modal">
        <div className="modal-header">
          <h1>CSV Import Wizard</h1>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-content">
          {error && <div className="alert alert-error">{error}</div>}

          {step === "type" && renderTypeSelection()}
          {step === "upload" && renderFileUpload()}
          {step === "preview" && renderPreview()}
          {step === "mapping" && renderMapping()}
          {step === "execute" && renderExecute()}
          {step === "review" && renderReview()}
        </div>

        <div className="modal-footer">
          <button
            className="button-secondary"
            onClick={() => {
              if (currentStepIndex > 0) {
                setStep(stepOrder[currentStepIndex - 1]);
                setError(null);
              } else {
                onClose();
              }
            }}
            disabled={loading}
          >
            {currentStepIndex === 0 ? "Cancel" : "← Back"}
          </button>

          <button
            className="button-primary"
            onClick={() => {
              if (step === "type") handleSelectType(importType);
              else if (step === "preview") handleConfirmPreview();
              else if (step === "mapping") handleConfirmMapping();
              else if (step === "execute") handleExecuteImport();
              else if (step === "review") onClose();
            }}
            disabled={loading}
          >
            {loading ? "Processing..." : step === "review" ? "Close" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
};
