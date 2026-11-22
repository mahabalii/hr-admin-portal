
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Menu, X } from "lucide-react";

import type { RootState, AppDispatch } from "../../store/store";
import { clearUser } from "../../store/slices/authSlice";

import Sidebar from "./Sidebar";

function DashboardLayout() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  const handleLogout = () => {
    dispatch(clearUser());
    setSidebarOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-layout">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`mobile-sidebar ${
          sidebarOpen ? "mobile-sidebar-open" : ""
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <Sidebar />
      </aside>

      {/* Main Section */}
      <div className="main-section">

        {/* Header */}
        <header className="dashboard-header">

          <div className="header-left">

            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <h2>HR Admin Portal</h2>

          </div>

          <div className="user-info">

            <div>
              <p>{user?.name}</p>
              <span>{user?.role}</span>
            </div>

            <button onClick={handleLogout}>
              Logout
            </button>

          </div>

        </header>

        {/* Dynamic Page Content */}
        <main className="dashboard-content">
          <Outlet />
        </main>

      </div>
    </div>
  );
}

export default DashboardLayout;
