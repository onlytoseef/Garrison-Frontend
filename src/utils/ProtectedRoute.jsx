import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loginUser } from "../store/slices/authSlice";
import { getActiveCampusId } from "../config/axiosSetup";

/**
 * Route guard.
 *
 * `allowedRoles` gates by role. `requireCampus` additionally sends a super admin
 * who has not opened a campus yet to the campus picker — the campus-scoped pages
 * cannot render without one, and the API would reject their requests anyway.
 */
const ProtectedRoute = ({ allowedRoles, requireCampus = false }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  useEffect(() => {
    const authState = JSON.parse(localStorage.getItem("authState"));
    if (authState?.isAuthenticated) {
      dispatch(loginUser.fulfilled(authState));
    }
  }, [dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Each role has one home: parents to their portal, super admins and academic
    // heads to the campus list, everyone else to the dashboard.
    let redirectTo = "/";
    if (user?.role === "parent") redirectTo = "/parent";
    else if (user?.role === "super_admin" || user?.role === "academic_head")
      redirectTo = "/campuses";

    if (location.pathname !== redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  // A principal always has a campus (enforced by the schema); only the
  // campus-less roles (super_admin, academic_head) can be without one, and only
  // until they pick one from the campus list.
  if (
    requireCampus &&
    (user?.role === "super_admin" || user?.role === "academic_head") &&
    !getActiveCampusId() &&
    location.pathname !== "/campuses"
  ) {
    return <Navigate to="/campuses" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
