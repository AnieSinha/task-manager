import { useEffect, useState } from "react";
import { projects, backlogs, features, stories, tasks, users } from "../api/index.js";

const COLUMNS = ["to-do", "in-progress", "completed"];

function countByStatus(arr) {
  return {
    total: arr.length,
    inProgress: arr.filter((r) => r.status === "in-progress").length,
    completed: arr.filter((r) => r.status === "completed").length,
    byStatus: Object.fromEntries(
      COLUMNS.map((s) => [s, arr.filter((r) => r.status === s).length]),
    ),
  };
}

/**
 * Fetches all six resources in parallel and derives metric counts.
 */
export function useMetrics() {
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      projects.list({ limit: 1000 }),
      backlogs.list({ limit: 1000 }),
      features.list({ limit: 1000 }),
      stories.list({ limit: 1000 }),
      tasks.list({ limit: 1000 }),
      users.list({ limit: 1000 }),
    ])
      .then(([pRes, bRes, fRes, sRes, tRes, uRes]) => {
        const pr = pRes.data ?? [];
        const bl = bRes.data ?? [];
        const fe = fRes.data ?? [];
        const st = sRes.data ?? [];
        const tk = tRes.data ?? [];
        const us = uRes.data ?? [];
        setCounts({
          projects: countByStatus(pr),
          backlogs: countByStatus(bl),
          features: countByStatus(fe),
          stories: countByStatus(st),
          tasks: countByStatus(tk),
          team: {
            total: us.length,
            active: us.filter((u) => u.is_active).length,
          },
          highPriority: [...bl, ...tk].filter((r) => r.priority === "high")
            .length,
        });
      })
      .catch((err) => setError(err.message ?? "Failed to load metrics."))
      .finally(() => setLoading(false));
  }, []);

  return { counts, loading, error };
}
