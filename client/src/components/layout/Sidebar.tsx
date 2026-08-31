import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  ClipboardList,
  Briefcase,
  Users,
  Upload,
  Search,
  TrendingUp,
  Building2,
  Network,
  User,
  Shield,
  Building
} from "lucide-react";

export function Sidebar() {
  const { user, logout, hasPermission } = useAuth();

  if (!user) return null;

  // Build nav items dynamically based on permissions
  const navItems = [];
  
  if (hasPermission("dashboard:view")) {
    navItems.push({ id: "dashboard", icon: LayoutDashboard, label: "Dashboard" });
  }

  if (hasPermission("requirement:view")) {
    navItems.push({ id: "requirements", icon: ClipboardList, label: "Requirements" });
  }

  if (hasPermission("application:view")) {
    navItems.push({ id: "applications", icon: Briefcase, label: "Applications" });
  }

  if (hasPermission("candidate:view")) {
    navItems.push({ id: "list", icon: Users, label: "Candidates" });
  }

  if (hasPermission("resume:upload")) {
    navItems.push({ id: "upload", icon: Upload, label: "Upload Resumes" });
  }

  if (hasPermission("candidate:view")) { // Or search specific permission
    navItems.push({ id: "search", icon: Search, label: "Search" });
  }

  if (hasPermission("report:view")) {
    navItems.push({ id: "reports", icon: TrendingUp, label: "Reports" });
  }

  if (hasPermission("account:view")) {
    navItems.push({ id: "accounts", icon: Building2, label: "Accounts" });
  }

  if (hasPermission("team:view")) {
    navItems.push({ id: "teams", icon: Network, label: "Teams" });
  }

  if (hasPermission("user:view")) {
    navItems.push({ id: "users", icon: User, label: "Users" });
  }
  
  if (hasPermission("role:manage")) {
    navItems.push({ id: "roles", icon: Shield, label: "Role Master" });
  }

  // Organizations is Admin only
  if (!user.organizationId && hasPermission("organization:view")) {
    navItems.push({ id: "organizations", icon: Building, label: "Organizations" });
  }

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">A</div>
          <div className="sidebar-logo-text">
            <h1>ATS</h1>
            <span>Applicant Tracking</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.id === "dashboard" ? "/" : `/${item.id}`}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
              end={item.id === "dashboard"}
            >
              <span className="nav-icon">
                <Icon size={16} strokeWidth={2.5} />
              </span>
              <span className="nav-text">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User profile section */}
      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-avatar">
              {(user.name || user.email)[0].toUpperCase()}
            </div>
            <div className="sidebar-user-details">
              <span className="sidebar-user-email" title={user.email}>
                {user.name || user.email}
              </span>
              <span className={`role-badge ${user.role?.name ? `role-badge--${user.role.name.toLowerCase()}` : ""}`}>
                {user.role?.name ? user.role.name.replace("_", " ") : "Unknown Role"}
              </span>
            </div>
          </div>
          <button
            id="btn-logout"
            className="sidebar-logout-btn"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      )}

      <div className="sidebar-footer">
        <p className="sidebar-footer-text">
          Powered by <span>AI</span>
          <br />
          Semantic Candidate Matching
        </p>
      </div>
    </aside>
  );
}
