import { useState, useCallback, useRef } from "react";

type SearchMode = "jd" | "resume";

interface SearchFormProps {
  onSearch: (jobDescription: string, limit: number, minExperience?: number, maxExperience?: number) => void;
  onResumeSearch: (file: File, limit: number, minExperience?: number, maxExperience?: number) => void;
  isSearching: boolean;
}

export function SearchForm({ onSearch, onResumeSearch, isSearching }: SearchFormProps) {
  const [mode, setMode] = useState<SearchMode>("jd");
  const [jobDescription, setJobDescription] = useState("");
  const [limit, setLimit] = useState(10);
  const [minExperience, setMinExperience] = useState<number | "">("");
  const [maxExperience, setMaxExperience] = useState<number | "">("");

  // Resume file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (isSearching) return;

      const min = minExperience === "" ? undefined : minExperience;
      const max = maxExperience === "" ? undefined : maxExperience;

      if (mode === "jd" && jobDescription.trim()) {
        onSearch(jobDescription.trim(), limit, min, max);
      } else if (mode === "resume" && selectedFile) {
        onResumeSearch(selectedFile, limit, min, max);
      }
    },
    [jobDescription, selectedFile, limit, minExperience, maxExperience, isSearching, onSearch, onResumeSearch, mode]
  );

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const canSubmit =
    mode === "jd"
      ? !!jobDescription.trim()
      : !!selectedFile;

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      {/* Mode Toggle */}
      <div className="search-mode-toggle">
        <button
          type="button"
          className={`search-mode-tab${mode === "jd" ? " active" : ""}`}
          onClick={() => setMode("jd")}
        >
          <span className="search-mode-tab-icon">📝</span>
          Job Description
        </button>
        <button
          type="button"
          className={`search-mode-tab${mode === "resume" ? " active" : ""}`}
          onClick={() => setMode("resume")}
        >
          <span className="search-mode-tab-icon">📄</span>
          Upload Resume
        </button>
      </div>

      {/* JD textarea */}
      {mode === "jd" && (
        <div className="search-textarea-wrapper">
          <textarea
            id="search-jd-input"
            className="search-textarea"
            placeholder={"Paste a job description here…\n\nExample: We are hiring a Flutter Developer to build and maintain cross-platform mobile applications using Flutter and Dart. The candidate should have experience with REST APIs, Firebase, state management, and Android application development."}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            aria-label="Job description"
          />
          <span className="search-textarea-count">
            {jobDescription.length} chars
          </span>
        </div>
      )}

      {/* Resume drop zone */}
      {mode === "resume" && (
        <div
          className={`search-dropzone${isDragging ? " dragging" : ""}${selectedFile ? " has-file" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload resume PDF"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          {selectedFile ? (
            <div className="search-dropzone-file">
              <span className="search-dropzone-file-icon">📄</span>
              <div className="search-dropzone-file-info">
                <span className="search-dropzone-file-name">{selectedFile.name}</span>
                <span className="search-dropzone-file-size">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button
                type="button"
                className="search-dropzone-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                aria-label="Remove file"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="search-dropzone-placeholder">
              <span className="search-dropzone-icon">⬆️</span>
              <p className="search-dropzone-title">
                Drop a resume PDF here or <span className="search-dropzone-link">browse</span>
              </p>
              <p className="search-dropzone-hint">
                We'll find candidates with similar profiles
              </p>
            </div>
          )}
        </div>
      )}

      <div className="search-controls">
        <div className="search-filters-group" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="search-limit-group">
            <span className="search-limit-label">Results limit</span>
            <input
              id="search-limit-slider"
              type="range"
              className="search-limit-slider"
              min={1}
              max={25}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              aria-label="Results limit"
            />
            <span className="search-limit-value">{limit}</span>
          </div>

          <div className="search-experience-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="min-exp-input" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Min Exp (yrs)</label>
              <input 
                id="min-exp-input"
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value ? Number(e.target.value) : "")}
                style={{ width: '80px', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="max-exp-input" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max Exp (yrs)</label>
              <input 
                id="max-exp-input"
                type="number"
                min="0"
                step="0.1"
                placeholder="Any"
                value={maxExperience}
                onChange={(e) => setMaxExperience(e.target.value ? Number(e.target.value) : "")}
                style={{ width: '80px', padding: '6px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
              />
            </div>
          </div>
        </div>

        <button
          id="search-submit-btn"
          type="submit"
          className="search-btn"
          disabled={!canSubmit || isSearching}
        >
          {isSearching ? (
            <>
              <span className="spinner-inline" />
              Searching…
            </>
          ) : mode === "jd" ? (
            <>🔍 Search Candidates</>
          ) : (
            <>📄 Find Similar Profiles</>
          )}
        </button>
      </div>
    </form>
  );
}
