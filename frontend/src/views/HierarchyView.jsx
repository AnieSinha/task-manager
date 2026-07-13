import { useEffect, useState } from "react";
import { projects, backlogs, features, stories, tasks } from "../api/index.js";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/EmptyState.jsx";

const STATUS_DOT_CLASS = {
  "to-do": "tree-dot-todo",
  "in-progress": "tree-dot-inprogress",
  completed: "tree-dot-completed",
};

function StatusDot({ status }) {
  return (
    <span
      className={`tree-dot ${STATUS_DOT_CLASS[status] ?? "tree-dot-todo"}`}
      title={status}
    />
  );
}

function TreeNode({ icon, title, status, count, defaultOpen, onNavigate, children }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;

  return (
    <div className="tree-node">
      <div className="tree-node-row">
        {hasChildren ? (
          <button
            type="button"
            className="tree-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Collapse" : "Expand"}
          >
            <i className={`bx ${open ? "bx-chevron-down" : "bx-chevron-right"}`} />
          </button>
        ) : (
          <span className="tree-toggle-spacer" />
        )}
        <StatusDot status={status} />
        <i className={`bx ${icon} tree-node-icon`} />
        <span
          className="tree-node-title"
          onClick={onNavigate}
          title={onNavigate ? "Open in board" : undefined}
        >
          {title}
        </span>
        {count != null && <span className="tree-node-count">{count}</span>}
      </div>
      {open && hasChildren && <div className="tree-children">{children}</div>}
    </div>
  );
}

export function HierarchyView({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      projects.list({ limit: 1000 }),
      backlogs.list({ limit: 1000 }),
      features.list({ limit: 1000 }),
      stories.list({ limit: 1000 }),
      tasks.list({ limit: 1000 }),
    ])
      .then(([prRes, bRes, fRes, sRes, tRes]) => {
        setData({
          projects: prRes.data ?? [],
          backlogs: bRes.data ?? [],
          features: fRes.data ?? [],
          stories: sRes.data ?? [],
          tasks: tRes.data ?? [],
        });
      })
      .catch((err) => setError(err.message ?? "Failed to load hierarchy."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!data?.projects?.length)
    return (
      <EmptyState
        icon="bx-sitemap"
        title="No projects yet"
        body="Create a project to see the full hierarchy here."
      />
    );

  const backlogsByProject = groupBy(data.backlogs, "project_id");
  const featuresByBacklog = groupBy(data.features, "backlog_item_id");
  const storiesByFeature = groupBy(data.stories, "feature_id");
  const tasksByStory = groupBy(data.tasks, "story_id");

  return (
    <div className="hierarchy-tree">
      {data.projects.map((p) => {
        const projectBacklogs = backlogsByProject[p.project_id] ?? [];
        return (
          <TreeNode
            key={p.project_id}
            icon="bx-folder"
            title={p.title}
            status={p.status}
            count={projectBacklogs.length}
            defaultOpen
            onNavigate={() => onNavigate?.("projects")}
          >
            {projectBacklogs.map((b) => {
              const backlogFeatures = featuresByBacklog[b.backlog_item_id] ?? [];
              return (
                <TreeNode
                  key={b.backlog_item_id}
                  icon="bx-archive"
                  title={b.title}
                  status={b.status}
                  count={backlogFeatures.length}
                  onNavigate={() => onNavigate?.("backlogs")}
                >
                  {backlogFeatures.map((f) => {
                    const featureStories = storiesByFeature[f.feature_id] ?? [];
                    return (
                      <TreeNode
                        key={f.feature_id}
                        icon="bx-rocket"
                        title={f.title}
                        status={f.status}
                        count={featureStories.length}
                        onNavigate={() => onNavigate?.("features")}
                      >
                        {featureStories.map((s) => {
                          const storyTasks = tasksByStory[s.story_id] ?? [];
                          return (
                            <TreeNode
                              key={s.story_id}
                              icon="bx-book-bookmark"
                              title={s.title}
                              status={s.status}
                              count={storyTasks.length}
                              onNavigate={() => onNavigate?.("stories")}
                            >
                              {storyTasks.map((t) => (
                                <TreeNode
                                  key={t.task_id}
                                  icon="bx-check-square"
                                  title={t.title}
                                  status={t.status}
                                  onNavigate={() => onNavigate?.("tasks")}
                                />
                              ))}
                            </TreeNode>
                          );
                        })}
                      </TreeNode>
                    );
                  })}
                </TreeNode>
              );
            })}
          </TreeNode>
        );
      })}
    </div>
  );
}

function groupBy(arr, key) {
  const out = {};
  for (const item of arr) {
    const k = item[key];
    if (!out[k]) out[k] = [];
    out[k].push(item);
  }
  return out;
}
