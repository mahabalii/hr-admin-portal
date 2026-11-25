
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

import {
  Users,
  BriefcaseBusiness,
  Building2,
  Clock,
} from "lucide-react";

import { getEmployees } from "../services/employeeService";
import { getEmployeeTypes } from "../services/employeeTypeService";
import { getDepartments } from "../services/departmentService";
import { getRequests, type MakerRequest } from "../services/requestService";

function Dashboard() {
  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalEmployeeTypes, setTotalEmployeeTypes] = useState(0);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await getEmployees();
        setTotalEmployees(response.data.length);
      } catch (error) {
        console.error("Dashboard Employee API Error:", error);
      }

      try {
        const response = await getEmployeeTypes();
        setTotalEmployeeTypes(response.data.length);
      } catch (error) {
        console.error("Dashboard Employee Types API Error:", error);
      }

      try {
        const response = await getDepartments();
        setTotalDepartments(response.data.length);
      } catch (error) {
        console.error("Dashboard Departments API Error:", error);
      }

      try {
        const response = await getRequests();

        const saved = localStorage.getItem("hr_maker_checker_requests");
        const localRequests: MakerRequest[] = saved ? JSON.parse(saved) : [];
        const apiRequests: MakerRequest[] = response.data || [];

        const allRequests = [
          ...localRequests,
          ...apiRequests.filter(
            (apiRequest) =>
              !localRequests.some(
                (localRequest) => localRequest.id === apiRequest.id
              )
          ),
        ];

        const myPendingRequests = allRequests.filter(
          (request) =>
            request.status === "PENDING" &&
            request.requestedBy === user?.username
        );

        const allPendingRequests = allRequests.filter(
          (request) => request.status === "PENDING"
        );

        setPendingRequests(
          user?.role === "CHECKER"
            ? allPendingRequests.length
            : myPendingRequests.length
        );
      } catch (error) {
        console.error("Dashboard Requests API Error:", error);
      }
    };

    fetchDashboardData();
  }, [user]);

  const cards = [
    {
      title: "Total Employees",
      value: totalEmployees,
      icon: Users,
    },
    {
      title: "Employee Types",
      value: totalEmployeeTypes,
      icon: BriefcaseBusiness,
    },
    {
      title: "Departments",
      value: totalDepartments,
      icon: Building2,
    },
    {
      title:
        user?.role === "CHECKER"
          ? "Pending Requests"
          : "My Pending Requests",
      value: pendingRequests,
      icon: Clock,
    },
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
