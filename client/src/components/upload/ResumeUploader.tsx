import { useState, useRef, useCallback } from "react";

const MAX_FILES = 10;
const ALLOWED_TYPES = ["application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ALLOWED_EXT = /\.(pdf|doc|docx)$/i;

interface ResumeUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isUploading: boolean;
}

export function ResumeUploader({
  onFilesSelected,
  isUploading,
}: ResumeUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (incoming: FileList | File[]) => {
      setValidationError(null);
      const list = Array.from(incoming);

      // Filter out invalid types
      const invalid = list.filter(
        (f) => !ALLOWED_TYPES.includes(f.type) && !ALLOWED_EXT.test(f.name)
      );
      if (invalid.length > 0) {
        setValidationError(
          `${invalid.length} file(s) rejected — only PDF and Word docs are allowed.`
        );
      }

      const valid = list.filter(
        (f) => ALLOWED_TYPES.includes(f.type) || ALLOWED_EXT.test(f.name)
      );

      // Merge with existing, deduplicate by name, cap at MAX_FILES
      const merged = [...selectedFiles, ...valid].reduce<File[]>((acc, f) => {
        if (!acc.find((x) => x.name === f.name)) acc.push(f);
        return acc;
      }, []);

      if (merged.length > MAX_FILES) {
        setValidationError(`Maximum ${MAX_FILES} files allowed. Extra files were ignored.`);
        merged.splice(MAX_FILES);
      }

      setSelectedFiles(merged);
    },
    [selectedFiles]
  );

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setValidationError(null);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      // Reset input so same file can be re-selected after removal
      e.target.value = "";
    },
    [handleFiles]
  );

  const openPicker = useCallback(() => {
    if (!isUploading) inputRef.current?.click();
  }, [isUploading]);

  const handleUpload = useCallback(() => {
    if (selectedFiles.length > 0 && !isUploading) {
      onFilesSelected(selectedFiles);
    }
  }, [selectedFiles, isUploading, onFilesSelected]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const hasFiles = selectedFiles.length > 0;

  return (
    <div className="resume-uploader-wrapper">
      {/* Drop zone */}
      <div
        id="upload-zone"
        className={`upload-zone${isDragOver ? " drag-over" : ""}${isUploading ? " uploading" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={!hasFiles ? openPicker : undefined}
        role="button"
        tabIndex={0}
        aria-label="Upload resume files"
      >
        <span className="upload-zone-icon">📋</span>
        <h3>{hasFiles ? "Files Ready to Upload" : "Drop your resumes here"}</h3>
        <p>{hasFiles ? `${selectedFiles.length} / ${MAX_FILES} files selected` : "or click to browse files"}</p>
        {!hasFiles && (
          <p style={{ marginTop: 6, fontSize: "0.75rem" }}>PDF or Word — up to {MAX_FILES} files</p>
        )}

        <div className="upload-zone-actions">
          <button
            className="upload-zone-cta"
            type="button"
            disabled={isUploading}
            onClick={(e) => {
              e.stopPropagation();
              openPicker();
            }}
          >
            📁 {hasFiles ? "Add More Files" : "Choose Files"}
          </button>

          {hasFiles && (
            <button
              className="upload-zone-cta upload-zone-cta--primary"
              type="button"
              disabled={isUploading}
              onClick={(e) => {
                e.stopPropagation();
                handleUpload();
              }}
            >
              {isUploading
                ? "⏳ Uploading…"
                : `🚀 Upload ${selectedFiles.length} Resume${selectedFiles.length > 1 ? "s" : ""}`}
            </button>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple
          onChange={onInputChange}
          aria-hidden="true"
        />
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="upload-validation-error">
          ⚠️ {validationError}
        </div>
      )}

      {/* File list */}
      {hasFiles && (
        <div className="upload-file-list">
          <div className="upload-file-list-header">
            <span>Selected Files</span>
            <span className="upload-file-count">
              {selectedFiles.length} / {MAX_FILES}
            </span>
          </div>
          {selectedFiles.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="upload-file-item">
              <span className="upload-file-icon">
                {file.name.endsWith(".pdf") ? "📄" : "📝"}
              </span>
              <span className="upload-file-name" title={file.name}>
                {file.name}
              </span>
              <span className="upload-file-size">{formatSize(file.size)}</span>
              {!isUploading && (
                <button
                  className="upload-file-remove"
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => removeFile(idx)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
