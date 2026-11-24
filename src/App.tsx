
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleBasedRoute from "./routes/RoleBasedRoute";

import DashboardLayout from "./components/layout/DashboardLayout";
import EmployeeTypes from "./pages/EmployeeTypes";
import Departments from "./pages/Departments";
import Designations from "./pages/Designations";
import Attendance from "./pages/Attendance";
import MakerChecker from "./pages/MakerChecker";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Route */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>

            {/* Dashboard - All Roles */}
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route path="/employee-types" element={<EmployeeTypes />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/designations" element={<Designations />} />
            <Route path="/attendance" element={<Attendance />} />

            {/* Employees - All Roles */}
            <Route
              path="/employees"
              element={<Employees />}
            />

            {/* All roles may view pending requests; only Checker can review. */}
            <Route
              element={
                <RoleBasedRoute
                  allowedRoles={["MAKER", "CHECKER"]}
                />
              }
            >
              <Route
                path="/maker-checker"
                element={<MakerChecker />}
              />
            </Route>

          </Route>
        </Route>

        {/* Unauthorized Page */}
        <Route
          path="/unauthorized"
          element={<Unauthorized />}
        />

        {/* Default Route */}
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        {/* 404 Page */}
        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
