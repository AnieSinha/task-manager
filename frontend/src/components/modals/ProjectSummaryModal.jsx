import { useEffect } from "react";

/**
 * @param {{ open, loading, summary, aiGenerated, onClose }} props
 */
export function ProjectSummaryModal({ open, loading, summary, aiGenerated, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: "480px" }}
      >
        <div className="modal-header">
          <h2 className="modal-title">✨ Project Summary</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <i className="bx bx-x" />
          </button>
        </div>
        <div className="modal-body">
          {loading ? (
            <p style={{ color: "var(--colors-secondary)" }}>Generating summary…</p>
          ) : (
            <>
              {!aiGenerated && (
                <span className="role-tag" style={{ marginBottom: 8, display: "inline-block" }}>
                  Rule-based (no AI configured)
                </span>
              )}
              <p style={{ lineHeight: 1.6 }}>{summary}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
