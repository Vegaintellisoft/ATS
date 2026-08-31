import { useState, useEffect, useCallback } from "react";
import type { ToastMessage, ToastType } from "../../types";

/* ── Hook ── */

let toastListener: ((toast: ToastMessage) => void) | null = null;

export function showToast(type: ToastType, message: string) {
  const id = crypto.randomUUID();
  toastListener?.({ id, type, message });
}

export const toast = {
  success: (message: string) => showToast("success", message),
  error: (message: string) => showToast("error", message),
  info: (message: string) => showToast("info", message),
};

/* ── Component ── */

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  useEffect(() => {
    toastListener = (toast) => {
      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setRemoving((prev) => new Set(prev).add(toast.id));
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
          setRemoving((prev) => {
            const next = new Set(prev);
            next.delete(toast.id);
            return next;
          });
        }, 300);
      }, 4000);
    };
    return () => {
      toastListener = null;
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setRemoving((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  }, []);

  const icon = (type: ToastType) => {
    switch (type) {
      case "success": return "✓";
      case "error": return "✕";
      case "info": return "ℹ";
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.type}${removing.has(t.id) ? " removing" : ""}`}
        >
          <span className="toast-icon">{icon(t.type)}</span>
          <span className="toast-message">{t.message}</span>
          <button
            className="toast-close"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
