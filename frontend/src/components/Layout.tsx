import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import "./Layout.css";

const Layout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  return (
    <div className="layout">

      <aside className="sidebar">

        <div className="logo">
          <h2>Deep Trace</h2>
          <p>Cybernetics</p>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className={isActive("/dashboard")}>
            <span className="nav-icon">▦</span>
            Dashboard
          </Link>

          <Link to="/users" className={isActive("/users")}>
            <span className="nav-icon">◉</span>
            Users
          </Link>

          <Link to="/campaigns" className={isActive("/campaigns")}>
            <span className="nav-icon">◈</span>
            Campaigns
          </Link>

          <Link to="/events" className={isActive("/events")}>
            <span className="nav-icon">⚠</span>
            Events
          </Link>

          {user?.role === "ADMIN" && (
            <Link to="/audit-logs" className={isActive("/audit-logs")}>
              <span className="nav-icon">☰</span>
              Audit Logs
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className="sidebar-user-role">{user?.role}</span>
            </div>
          </div>

          <button
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

      </aside>

      <main className="main-content">
        {children}
      </main>

    </div>
  );
};

export default Layout;