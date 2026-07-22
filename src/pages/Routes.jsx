import React from "react";
import { Routes, Route } from "react-router-dom";
import AdminRoutes from "./frontend/AdminRoutes";
import Auth from "./auth";

export default function Index() {
  return (
    <Routes>
      <Route path="/*" element={<AdminRoutes />} />

      <Route path="/auth/*" element={<Auth />} />
    </Routes>
  );
}
