import { useEffect, useState } from "react";
import { users, roles as rolesApi } from "../api/index.js";
import { LoadingState, ErrorState } from "../components/ui/EmptyState.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export function TeamView() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [teamList, setTeamList] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyUserId, setBusyUserId] = useState(null);
  const [pendingRoleByUser, setPendingRoleByUser] = useState({});

  const isSuperuser = (currentUser?.roles ?? []).some(
    (r) => (r?.role_name ?? r) === "SUPER_USER",
  );

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      users.list({ limit: 100 }),
      // Role assignment needs the full role catalogue — only superusers can
      // list users anyway, so only fetch roles when it'll actually be used.
      isSuperuser ? rolesApi.list({ limit: 100 }) : Promise.resolve({ data: [] }),
    ])
      .then(([uRes, rRes]) => {
        setTeamList(uRes.data ?? []);
        setAllRoles(rRes.data ?? []);
      })
      .catch((err) => setError(err.message ?? "Failed to load team."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [isSuperuser]);

  const handleAssign = async (userId) => {
    const roleId = pendingRoleByUser[userId];
    if (!roleId) {
      showToast("Pick a role first.", "error");
      return;
    }
    setBusyUserId(userId);
    try {
      await rolesApi.assignToUser(userId, roleId);
      showToast("Role assigned.", "success");
      setPendingRoleByUser((prev) => ({ ...prev, [userId]: "" }));
      load();
    } catch (err) {
      showToast(err.message ?? "Failed to assign role.", "error");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRemove = async (userId, roleId) => {
    setBusyUserId(userId);
    try {
      await rolesApi.removeFromUser(userId, roleId);
      showToast("Role removed.", "success");
      load();
    } catch (err) {
      showToast(err.message ?? "Failed to remove role.", "error");
    } finally {
      setBusyUserId(null);
    }
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!teamList.length)
    return (
      <p style={{ color: "var(--colors-secondary)" }}>No team members found.</p>
    );

  return (
    <div className="team-grid">
      {teamList.map((member) => {
        const initials = (member.name ?? "?")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        const assignedRoleIds = new Set((member.roles ?? []).map((r) => r.role_id));
        const availableRoles = allRoles.filter((r) => !assignedRoleIds.has(r.role_id));
        const busy = busyUserId === member.user_id;

        return (
          <div key={member.user_id} className="user-card">
            <span
              className={`status-indicator ${member.is_active ? "status-active" : "status-inactive"}`}
            >
              {member.is_active ? "Active" : "Inactive"}
            </span>
            <div className="user-header">
              <div className="user-avatar">{initials}</div>
              <div className="user-identity">
                <h3>{member.name ?? "—"}</h3>
                <p>{member.email ?? "—"}</p>
              </div>
            </div>
            <div className="user-roles">
              {(member.roles ?? []).map((r, i) => (
                <span key={i} className="role-tag">
                  {r.role_name ?? r}
                  {isSuperuser && (
                    <button
                      type="button"
                      className="role-tag-remove"
                      title="Remove role"
                      disabled={busy}
                      onClick={() => handleRemove(member.user_id, r.role_id)}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {!member.roles?.length && (
                <span className="role-tag">No roles assigned</span>
              )}
            </div>

            {isSuperuser && (
              <div className="role-assign-row">
                <select
                  className="form-select"
                  value={pendingRoleByUser[member.user_id] ?? ""}
                  disabled={busy || !availableRoles.length}
                  onChange={(e) =>
                    setPendingRoleByUser((prev) => ({
                      ...prev,
                      [member.user_id]: e.target.value,
                    }))
                  }
                >
                  <option value="">
                    {availableRoles.length ? "Assign a role…" : "All roles assigned"}
                  </option>
                  {availableRoles.map((r) => (
                    <option key={r.role_id} value={r.role_id}>
                      {r.role_name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={busy || !pendingRoleByUser[member.user_id]}
                  onClick={() => handleAssign(member.user_id)}
                >
                  Add
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
