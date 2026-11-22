
import {
  LayoutDashboard,
  Users,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  CalendarCheck,
  History,
  GitPullRequest,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

function Sidebar() {
  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
      roles: ["COMMON", "MAKER", "CHECKER"],
    },
    {
      name: "Employees",
      path: "/employees",
      icon: Users,
      roles: ["COMMON", "MAKER", "CHECKER"],
    },
    {
      name: "Employee Types",
      path: "/employee-types",
      icon: BriefcaseBusiness,
      roles: ["COMMON", "MAKER", "CHECKER"],
    },
    {
      name: "Departments",
      path: "/departments",
      icon: Building2,
      roles: ["COMMON", "MAKER", "CHECKER"],
    },
    {
      name: "Designations",
      path: "/designations",
      icon: ClipboardList,
      roles: ["COMMON", "MAKER", "CHECKER"],
    },
    {
      name: "Attendance",
      path: "/attendance",
      icon: CalendarCheck,
      roles: ["COMMON", "MAKER", "CHECKER"],
    },
    {
      name: "Maker-Checker",
      path: "/maker-checker",
      icon: GitPullRequest,
      roles: ["MAKER", "CHECKER"],
    },
    {
      name: "Audit History",
      path: "/audit",
      icon: History,
      roles: ["COMMON", "MAKER", "CHECKER"],
    },
  ];

  const visibleItems = menuItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>HR Admin</h2>
      </div>

      <nav className="sidebar-menu">
        {visibleItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
