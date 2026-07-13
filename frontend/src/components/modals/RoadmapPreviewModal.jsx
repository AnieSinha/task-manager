import { useEffect, useState } from "react";
import { ai } from "../../api/index.js";
import { useToast } from "../../context/ToastContext.jsx";

function countTree(tree) {
  let backlogs = 0,
    features = 0,
    stories = 0,
    tasks = 0;
  for (const b of tree.backlogs ?? []) {
    backlogs++;
    for (const f of b.features ?? []) {
      features++;
      for (const s of f.stories ?? []) {
        stories++;
        tasks += (s.tasks ?? []).length;
      }
    }
  }
  return { backlogs, features, stories, tasks };
}

/**
 * @param {{ open, projectId, initialTree, aiGenerated, onClose, onCommitted }} props
 */
export function RoadmapPreviewModal({
  open,
  projectId,
  initialTree,
  aiGenerated,
  onClose,
  onCommitted,
}) {
  const { showToast } = useToast();
  const [tree, setTree] = useState(initialTree ?? { backlogs: [] });
  const [committing, setCommitting] = useState(false);

  useEffect(() => {
    if (open) setTree(initialTree ?? { backlogs: [] });
  }, [open, initialTree]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && open && !committing) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, committing, onClose]);

  if (!open) return null;

  const counts = countTree(tree);

  const updateBacklogTitle = (bi, value) => {
    setTree((t) => {
      const next = structuredClone(t);
      next.backlogs[bi].title = value;
      return next;
    });
  };
  const updateFeatureTitle = (bi, fi, value) => {
    setTree((t) => {
      const next = structuredClone(t);
      next.backlogs[bi].features[fi].title = value;
      return next;
    });
  };
  const updateStoryTitle = (bi, fi, si, value) => {
    setTree((t) => {
      const next = structuredClone(t);
      next.backlogs[bi].features[fi].stories[si].title = value;
      return next;
    });
  };
  const updateTaskTitle = (bi, fi, si, ti, value) => {
    setTree((t) => {
      const next = structuredClone(t);
      next.backlogs[bi].features[fi].stories[si].tasks[ti].title = value;
      return next;
    });
  };

  const removeBacklog = (bi) =>
    setTree((t) => {
      const next = structuredClone(t);
      next.backlogs.splice(bi, 1);
      return next;
    });
  const removeFeature = (bi, fi) =>
    setTree((t) => {
      const next = structuredClone(t);
      next.backlogs[bi].features.splice(fi, 1);
      return next;
    });
  const removeStory = (bi, fi, si) =>
    setTree((t) => {
      const next = structuredClone(t);
      next.backlogs[bi].features[fi].stories.splice(si, 1);
      return next;
    });
  const removeTask = (bi, fi, si, ti) =>
    setTree((t) => {
      const next = structuredClone(t);
      next.backlogs[bi].features[fi].stories[si].tasks.splice(ti, 1);
      return next;
    });

  const handleCommit = async () => {
    if (!counts.backlogs) {
      showToast("Nothing to create — the roadmap is empty.", "error");
      return;
    }
    setCommitting(true);
    try {
      const res = await ai.commitRoadmap(projectId, tree);
      showToast(
        `Created ${res.backlogs_created} backlogs, ${res.features_created} features, ${res.stories_created} stories, ${res.tasks_created} tasks.`,
        "success",
      );
      onCommitted?.();
      onClose();
    } catch (err) {
      showToast(err.message ?? "Failed to create roadmap.", "error");
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => e.target === e.currentTarget && !committing && onClose()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        style={{
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
          overflow: "hidden",
          maxWidth: "640px",
        }}
      >
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h2 className="modal-title">
            ✨ Roadmap Preview
            {!aiGenerated && (
              <span className="role-tag" style={{ marginLeft: 8 }}>
                Template (no AI configured)
              </span>
            )}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <i className="bx bx-x" />
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, overflowY: "auto" }}>
          <p style={{ color: "var(--colors-secondary)", marginBottom: "1rem" }}>
            Review and edit titles below, or remove anything you don't want.
            Nothing is created until you click Commit.
          </p>

          <div className="roadmap-tree">
            {tree.backlogs?.map((b, bi) => (
              <div key={bi} className="roadmap-node roadmap-backlog">
                <div className="roadmap-node-row">
                  <i className="bx bx-archive" />
                  <input
                    className="form-input roadmap-input"
                    value={b.title}
                    onChange={(e) => updateBacklogTitle(bi, e.target.value)}
                  />
                  <button
                    className="roadmap-remove"
                    title="Remove backlog"
                    onClick={() => removeBacklog(bi)}
                  >
                    <i className="bx bx-trash" />
                  </button>
                </div>

                {b.features?.map((f, fi) => (
                  <div key={fi} className="roadmap-node roadmap-feature">
                    <div className="roadmap-node-row">
                      <i className="bx bx-rocket" />
                      <input
                        className="form-input roadmap-input"
                        value={f.title}
                        onChange={(e) => updateFeatureTitle(bi, fi, e.target.value)}
                      />
                      <button
                        className="roadmap-remove"
                        title="Remove feature"
                        onClick={() => removeFeature(bi, fi)}
                      >
                        <i className="bx bx-trash" />
                      </button>
                    </div>

                    {f.stories?.map((s, si) => (
                      <div key={si} className="roadmap-node roadmap-story">
                        <div className="roadmap-node-row">
                          <i className="bx bx-book-bookmark" />
                          <input
                            className="form-input roadmap-input"
                            value={s.title}
                            onChange={(e) =>
                              updateStoryTitle(bi, fi, si, e.target.value)
                            }
                          />
                          <button
                            className="roadmap-remove"
                            title="Remove story"
                            onClick={() => removeStory(bi, fi, si)}
                          >
                            <i className="bx bx-trash" />
                          </button>
                        </div>

                        {s.tasks?.map((tk, ti) => (
                          <div key={ti} className="roadmap-node roadmap-task">
                            <div className="roadmap-node-row">
                              <i className="bx bx-check-square" />
                              <input
                                className="form-input roadmap-input"
                                value={tk.title}
                                onChange={(e) =>
                                  updateTaskTitle(bi, fi, si, ti, e.target.value)
                                }
                              />
                              <button
                                className="roadmap-remove"
                                title="Remove task"
                                onClick={() => removeTask(bi, fi, si, ti)}
                              >
                                <i className="bx bx-trash" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
            {!tree.backlogs?.length && (
              <p style={{ color: "var(--colors-secondary)" }}>
                Nothing left in this roadmap — remove some items above, or
                cancel and try a different prompt.
              </p>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ flexShrink: 0 }}>
          <span style={{ color: "var(--colors-secondary)", fontSize: 13 }}>
            {counts.backlogs} backlogs · {counts.features} features ·{" "}
            {counts.stories} stories · {counts.tasks} tasks
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" disabled={committing} onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={committing || !counts.backlogs}
              onClick={handleCommit}
            >
              {committing ? "Creating…" : `Commit ${counts.backlogs + counts.features + counts.stories + counts.tasks} items`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
