import React from "react";
import { Route, Routes } from "react-router-dom";
import ParentLayout from "./ParentLayout";
import ParentDashboard from "./ParentDashboard";
import ParentResults from "./ParentResults";
import ParentAttendance from "./ParentAttendance";
import ParentDiary from "./ParentDiary";
import ParentResources from "./ParentResources";
import ProtectedRoute from "../../utils/ProtectedRoute";

export default function ParentRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={["parent"]} />}>
        <Route element={<ParentLayout />}>
          <Route path="/" element={<ParentDashboard />} />
          <Route path="/results" element={<ParentResults />} />
          <Route path="/attendance" element={<ParentAttendance />} />
          <Route path="/diary" element={<ParentDiary />} />
          <Route path="/resources" element={<ParentResources />} />
        </Route>
      </Route>
    </Routes>
  );
}
