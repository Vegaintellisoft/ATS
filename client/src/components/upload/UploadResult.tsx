import type { BatchUploadResponse, BatchUploadResult } from "../../types";

interface UploadResultProps {
  result: BatchUploadResponse | null;
  error: string | null;
  onReset: () => void;
  onRetry?: (fileName: string) => void;
  retryingFileName?: string | null;
}

function StatusBadge({ item }: { item: BatchUploadResult }) {
  if (item.success && item.updated)
    return <span className="status-badge status-badge--updated">🔄 Updated</span>;
  if (item.success)
    return <span className="status-badge status-badge--success">✅ Indexed</span>;
  return <span className="status-badge status-badge--error">❌ Failed</span>;
}

export function UploadResult({ result, error, onReset, onRetry, retryingFileName }: UploadResultProps) {
  if (!result && !error) return null;

  if (error) {
    return (
      <div className="upload-result error">
        <div className="upload-result-header">
          <span className="upload-result-icon">❌</span>
          <h3>Pipeline Failed</h3>
        </div>
        <p style={{ fontSize: "0.88rem", color: "var(--error)", marginBottom: 16 }}>
          {error}
        </p>
        <div className="upload-result-actions">
          <button className="btn-secondary" onClick={onReset}>
            ↩ Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const allSuccess = result.failed === 0;
  const allFailed = result.succeeded === 0;

  return (
    <div className="upload-result">
      {/* Summary header */}
      <div className="upload-result-header">
        <span className="upload-result-icon">
          {allFailed ? "❌" : allSuccess ? "✅" : "⚠️"}
        </span>
        <h3>
          {allFailed
            ? "All Uploads Failed"
            : allSuccess
            ? `${result.succeeded} Resume${result.succeeded > 1 ? "s" : ""} Processed Successfully`
            : `${result.succeeded} of ${result.total} Processed`}
        </h3>
      </div>

      {/* Summary bar */}
      <div className="upload-batch-summary">
        <div className="batch-summary-stat batch-summary-stat--success">
          <span className="batch-summary-num">{result.succeeded}</span>
          <span>Succeeded</span>
        </div>
        <div className="batch-summary-stat batch-summary-stat--error">
          <span className="batch-summary-num">{result.failed}</span>
          <span>Failed</span>
        </div>
        <div className="batch-summary-stat">
          <span className="batch-summary-num">{result.total}</span>
          <span>Total</span>
        </div>
      </div>

      {/* Per-file results table */}
      <div className="upload-batch-table-wrapper">
        <table className="upload-batch-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Status</th>
              <th>Candidate ID</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {result.results.map((item, idx) => (
              <tr key={idx} className={item.success ? "" : "row-error"}>
                <td className="col-filename" title={item.fileName}>
                  <span>{item.fileName.endsWith(".pdf") ? "📄" : "📝"}</span>
                  <span>{item.fileName}</span>
                </td>
                <td>
                  <StatusBadge item={item} />
                </td>
                <td className="col-id">
                  {item.candidateId
                    ? <span title={item.candidateId}>{item.candidateId.slice(0, 8)}…</span>
                    : <span style={{ color: "var(--text-muted)" }}>—</span>}
                </td>
                <td className="col-note">
                  {item.error ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span className="col-error-text" title={item.error}>
                        {item.error.length > 60 ? item.error.slice(0, 60) + "…" : item.error}
                      </span>
                      {onRetry && (
                        <button
                          className="btn-secondary"
                          style={{ padding: "4px 8px", fontSize: "0.75rem", minHeight: "unset" }}
                          onClick={() => onRetry(item.fileName)}
                          disabled={retryingFileName === item.fileName}
                        >
                          {retryingFileName === item.fileName ? "Retrying…" : "Retry"}
                        </button>
                      )}
                    </div>
                  ) : item.updated ? (
                    <span style={{ color: "var(--info)" }}>Profile updated</span>
                  ) : (
                    <span style={{ color: "var(--success)" }}>New candidate</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="upload-result-actions">
        <button className="btn-secondary" onClick={onReset}>
          📄 Upload More Resumes
        </button>
      </div>
    </div>
  );
}
