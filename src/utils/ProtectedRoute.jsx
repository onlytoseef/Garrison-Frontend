import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loginUser } from "../store/slices/authSlice";

const ProtectedRoute = ({ allowedRoles }) => {
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
    const redirectTo = user?.role === "parent" ? "/parent" : "/";
    if (location.pathname !== redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
