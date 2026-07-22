import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { loginUser } from "../store/slices/authSlice";

const ProtectedRoute = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Check localStorage for authentication data on component mount
  useEffect(() => {
    const authState = JSON.parse(localStorage.getItem("authState"));
    if (authState?.isAuthenticated) {
      dispatch(loginUser.fulfilled(authState)); // Restore state from localStorage
    }
  }, [dispatch]);

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export default ProtectedRoute;
