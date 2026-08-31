import { useState, useCallback } from "react";
import { PageHeader } from "../components/layout/PageHeader";
import { ResumeUploader } from "../components/upload/ResumeUploader";
import { UploadResult } from "../components/upload/UploadResult";
import { uploadResumes } from "../api/client";
import { showToast } from "../components/common/Toast";
import type { BatchUploadResponse } from "../types";

export function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<BatchUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [retryingFileName, setRetryingFileName] = useState<string | null>(null);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setIsUploading(true);
    setResult(null);
    setError(null);
    setUploadedFiles(files);

    try {
      const response = await uploadResumes(files);
      setResult(response);

      if (response.failed === 0) {
        showToast(
          "success",
          `${response.succeeded} resume${response.succeeded > 1 ? "s" : ""} processed and indexed successfully`
        );
      } else if (response.succeeded === 0) {
        showToast("error", `All ${response.total} resumes failed to process`);
      } else {
        showToast(
          "info",
          `${response.succeeded} of ${response.total} resumes processed — ${response.failed} failed`
        );
      }
    } catch (err: any) {
      const msg = err.message || "Something went wrong";
      setError(msg);
      showToast("error", msg);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
    setUploadedFiles([]);
  }, []);

  const handleRetryFile = useCallback(async (fileName: string) => {
    if (!result) return;
    const fileToRetry = uploadedFiles.find((f) => f.name === fileName);
    if (!fileToRetry) return;

    setRetryingFileName(fileName);
    try {
      const response = await uploadResumes([fileToRetry]);
      const newResultItem = response.results[0];

      setResult((prev) => {
        if (!prev) return prev;
        const newResults = prev.results.map((item) =>
          item.fileName === fileName ? newResultItem : item
        );
        const succeeded = newResults.filter((r) => r.success).length;
        const failed = newResults.filter((r) => !r.success).length;
        return {
          ...prev,
          results: newResults,
          succeeded,
          failed,
        };
      });

      if (newResultItem.success) {
        showToast("success", `Successfully processed ${fileName}`);
      } else {
        showToast("error", `Failed to process ${fileName}`);
      }
    } catch (err: any) {
      showToast("error", err.message || "Failed to retry upload");
    } finally {
      setRetryingFileName(null);
    }
  }, [uploadedFiles, result]);

  return (
    <>
      <PageHeader
        icon="📄"
        title="Upload Resumes"
        description="Upload up to 10 candidate resumes at once to process through the AI pipeline"
      />
      <div className="page-body">
        {!result && !error && (
          <ResumeUploader
            onFilesSelected={handleFilesSelected}
            isUploading={isUploading}
          />
        )}

        {isUploading && (
          <div className="upload-progress">
            <div className="upload-progress-bar-track">
              <div className="upload-progress-bar-fill" />
            </div>
            <div className="upload-progress-label">
              <span className="spinner-inline" />
              Processing resumes through AI pipeline…
            </div>
          </div>
        )}

        <UploadResult 
          result={result} 
          error={error} 
          onReset={handleReset} 
          onRetry={handleRetryFile}
          retryingFileName={retryingFileName}
        />
      </div>
    </>
  );
}
