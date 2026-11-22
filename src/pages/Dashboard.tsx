
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

import {
  Users,
  BriefcaseBusiness,
  Building2,
  Clock,
} from "lucide-react";

function Dashboard() {
  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  const cards = [
    {
      title: "Total Employees",
      value: "--",
      icon: Users,
    },
    {
      title: "Employee Types",
      value: "--",
      icon: BriefcaseBusiness,
    },
    {
      title: "Departments",
      value: "--",
      icon: Building2,
    },
    ...(user?.role !== "COMMON"
      ? [
          {
            title:
              user?.role === "MAKER"
                ? "My Pending Requests"
                : "Pending Requests",
            value: "--",
            icon: Clock,
          },
        ]
      : []),
  ];

  return (
    <div className="dashboard-home">
      <div className="dashboard-title">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.name}!</p>
      </div>

      <div className="dashboard-cards">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div className="dashboard-card" key={card.title}>
              <div className="card-info">
                <p>{card.title}</p>
                <h2>{card.value}</h2>
              </div>

              <div className="card-icon">
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Dashboard;
