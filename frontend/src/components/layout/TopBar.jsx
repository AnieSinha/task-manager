import { useAuth } from '../../context/AuthContext.jsx';
import { SearchBar } from '../search/SearchBar.jsx';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * @param {{
 *   currentView:     string,
 *   onNavigate:      (view: string) => void,
 *   onQuickCreate:   () => void,
 *   unreadCount:     number,
 *   onNotifications: () => void,
 *   onProfile:       () => void,
 * }} props
 */
export function TopBar({ currentView, onNavigate, onQuickCreate, unreadCount, onNotifications, onProfile }) {
  const { currentUser } = useAuth();
  const avatar = initials(currentUser?.name);

  // Developers are not permitted to create backlog items (RBAC restriction).
  const isDeveloper = (currentUser?.roles ?? []).some(
    (r) => (r?.role_name ?? r) === "Developer",
  );
  const backlogCreateDisabled = currentView === "backlogs" && isDeveloper;
  
  // DEBUG
  if (currentView === "backlogs") {
    console.log("TopBar Debug:", {
      user: currentUser?.name,
      roles: currentUser?.roles,
      isDeveloper,
      backlogCreateDisabled,
    });
  }

  return (
    <header className="top-bar">
      {/* SearchBar is fully self-contained — owns input, dropdown, keyboard nav */}
      <SearchBar onNavigate={onNavigate} />

      <div className="top-bar-actions">
        <button 
          className="btn btn-primary" 
          onClick={onQuickCreate} 
          disabled={backlogCreateDisabled}
          title={backlogCreateDisabled ? "Developers cannot create backlog items" : "Quick Create Item"}
        >
          <i className="bx bx-plus" /><span>Quick Create</span>
        </button>

        <button className="icon-btn" onClick={onNotifications} title="Notifications">
          <i className="bx bx-bell" />
          <span className={`notif-badge${unreadCount === 0 ? ' hidden' : ''}`} />
        </button>

        <div className="profile-avatar" onClick={onProfile} title="Profile">
          {avatar}
        </div>
      </div>
    </header>
  );
}