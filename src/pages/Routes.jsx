import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminRoutes from "./frontend/AdminRoutes";
import ParentRoutes from "./parent/ParentRoutes";
import Auth from "./auth";

export default function Index() {
  return (
    <Routes>
      <Route path="/parent/*" element={<ParentRoutes />} />
      <Route path="/auth/*" element={<Auth />} />
      <Route path="/*" element={<AdminRoutes />} />
    </Routes>
  );
}
