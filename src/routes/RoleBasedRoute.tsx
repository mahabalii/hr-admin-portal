
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import type { UserRole } from "../types/auth";

interface RoleBasedRouteProps {
  allowedRoles: UserRole[];
}

function RoleBasedRoute({ allowedRoles }: RoleBasedRouteProps) {
  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export default RoleBasedRoute;
