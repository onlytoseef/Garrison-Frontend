import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import ParentLayout from "./ParentLayout";
import ProtectedRoute from "../../utils/ProtectedRoute";
import RouteLoader from "../components/RouteLoader";

/**
 * Parent pages are code-split for the same reason as the admin ones, and the
 * gain is larger here: a parent on a phone has no use for the admin bundle, and
 * before this they downloaded all of it to see their child's attendance.
 */
const ParentDashboard = lazy(() => import("./ParentDashboard"));
const ParentResults = lazy(() => import("./ParentResults"));
const ParentAttendance = lazy(() => import("./ParentAttendance"));
const ParentDiary = lazy(() => import("./ParentDiary"));
const ParentResources = lazy(() => import("./ParentResources"));
const ParentFees = lazy(() => import("./ParentFees"));

export default function ParentRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={["parent"]} />}>
          <Route element={<ParentLayout />}>
            <Route path="/" element={<ParentDashboard />} />
            <Route path="/results" element={<ParentResults />} />
            <Route path="/attendance" element={<ParentAttendance />} />
            <Route path="/diary" element={<ParentDiary />} />
            <Route path="/resources" element={<ParentResources />} />
            <Route path="/fees" element={<ParentFees />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
