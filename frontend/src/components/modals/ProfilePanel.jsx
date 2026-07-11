import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { users } from "../../api/index.js";
import { Toggle } from "../ui/Toggle.jsx";

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * @param {{ open, onClose }} props
 */
export function ProfilePanel({ open, onClose }) {
  const { currentUser, logout, updateCurrentUser } = useAuth();
  const { showToast } = useToast();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Keep the local draft in sync whenever the panel (re)opens with fresh data.
  useEffect(() => {
    if (open) {
      setName(currentUser?.name ?? "");
      setEditing(false);
    }
  }, [open, currentUser?.name]);

  const displayName = currentUser?.name ?? "—";
  const email = currentUser?.email ?? "—";
  const roles = currentUser?.roles ?? [];
  const isActive = currentUser?.is_active ?? true;

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Name can't be empty.", "error");
      return;
    }
    if (trimmed === currentUser?.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await users.update(currentUser.user_id, { name: trimmed });
      updateCurrentUser({ name: trimmed });
      showToast("Profile updated.", "success");
      setEditing(false);
    } catch (err) {
      showToast(err.message ?? "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(currentUser?.name ?? "");
    setEditing(false);
  };

  return (
    <div
      className={`panel-backdrop${open ? " open" : ""}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="side-panel">
        <div className="panel-header">
          <h2 className="panel-title">Profile</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <i className="bx bx-x" />
          </button>
        </div>

        <div className="panel-body">
          {/* Hero card */}
          <div className="profile-hero">
            <div className="profile-avatar-lg">{initials(displayName)}</div>
            <div style={{ flex: 1 }}>
              {editing ? (
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  autoFocus
                  disabled={saving}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                />
              ) : (
                <h3 className="profile-name">{displayName}</h3>
              )}
              <p className="profile-email">{email}</p>
              <span
                className={`status-indicator profile-status-inline ${isActive ? "status-active" : "status-inactive"}`}
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          {editing ? (
            <div style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
              <button
                className="btn btn-primary"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button className="btn btn-ghost" disabled={saving} onClick={handleCancel}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="btn btn-ghost"
              style={{ marginBottom: "1rem" }}
              onClick={() => setEditing(true)}
            >
              <i className="bx bx-edit" /> Edit name
            </button>
          )}

          {/* Roles */}
          <div className="profile-section-label">Roles</div>
          <div className="user-roles">
            {roles.map((r, i) => (
              <span key={i} className="role-tag">
                {r.role_name ?? r}
              </span>
            ))}
            {!roles.length && <span className="role-tag">No roles assigned</span>}
          </div>

          {/* Preferences */}
          <div className="profile-section-label">Preferences</div>
          <div className="preference-row">
            <span>Email Notifications</span>
            <Toggle defaultChecked />
          </div>
          <div className="preference-row">
            <span>Compact Card View</span>
            <Toggle />
          </div>

          {/* Account */}
          <div className="profile-section-label">Account</div>
          <button
            className="btn btn-ghost"
            style={{
              width: "100%",
              justifyContent: "flex-start",
              gap: "0.5rem",
            }}
            onClick={async () => {
              await logout();
              onClose();
            }}
          >
            <i className="bx bx-log-out" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
