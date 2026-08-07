import React from "react";
import { Route, Routes } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import Home from "./Home";
import Staff from "./Staff";
import Students from "./Students";
import Classes from "./Classess";
import ProtectedRoute from "../../utils/ProtectedRoute";
import Users from "./Users";
import StaffDetails from "./StaffDetails";
import AttendancePage from "./AttendancePage";
import AttendanceRecord from "./AttendanceRecord";
import Profile from "./Profile";
import AlfalahAI from "./AlfalahAI";
import Exams from "./Exams";
import MarksEntry from "./MarksEntry";
import ClassResultSheet from "./ClassResultSheet";
import ResultCard from "./ResultCard";
import ManualAttendance from "./ManualAttendance";
import Diary from "./Diary";
import Resources from "./Resources";
import Campuses from "./Campuses";
import Logs from "./Logs";
import Fees from "./Fees";

// Roles that may work inside a campus. 'principal' is the campus owner;
// 'super_admin' gets here too, but only after opening a campus (requireCampus
// on the guard below sends them to the picker otherwise).
const CAMPUS_ROLES = ["super_admin", "principal", "admin", "teacher", "user"];

// Everyone in a campus except teachers. Teachers are limited to their assigned
// classes: the roster, the diary and resources. Attendance, exams, results,
// staff and user management were not granted to them, and the API refuses those
// routes — so the pages are gated here too, otherwise typing the URL renders a
// screen that only produces 403s.
const OFFICE_ROLES = CAMPUS_ROLES.filter((role) => role !== "teacher");

export default function AdminRoutes() {
  return (
    <Routes>
      {/* Campus picker — super admin only, and deliberately outside
          AdminLayout: there is no campus context to render a sidebar for. */}
      <Route element={<ProtectedRoute allowedRoles={["super_admin"]} />}>
        <Route path="/campuses" element={<Campuses />} />
      </Route>

      {/* Audit trail. Outside the campus guard because a super admin reads it
          across every campus without opening one; a principal is pinned to
          their own campus by the API. Teachers are excluded.
          (Own-password changes are NOT here: the super admin gets a modal on
          the campus picker, so they never leave that screen.) */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={["super_admin", "principal", "admin"]}
          />
        }
      >
        <Route element={<AdminLayout />}>
          <Route path="/logs" element={<Logs />} />
        </Route>
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={CAMPUS_ROLES} requireCampus />
        }
      >
        <Route element={<AdminLayout />}>
          {/* Open to teachers */}
          <Route path="/" element={<Home />} />
          <Route path="/students" element={<Students />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/resources" element={<Resources />} />
          {/* Marking a register is class-scoped, so teachers get it. The page
              lists only their assigned classes and the API refuses any other.
              Attendance Records and the QR scanner remain office-only below. */}
          <Route path="/manual-attendance" element={<ManualAttendance />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Office-only pages: same layout, stricter guard. */}
      <Route
        element={
          <ProtectedRoute allowedRoles={OFFICE_ROLES} requireCampus />
        }
      >
        <Route element={<AdminLayout />}>
          <Route path="/staff/:id" element={<StaffDetails />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/users" element={<Users />} />
          {/* Fees are office work: the money is the office's business, and the
              API refuses teachers outright. */}
          <Route path="/fees" element={<Fees />} />
          <Route path="/student-attendance" element={<AttendancePage />} />
          <Route path="/attendance-record" element={<AttendanceRecord />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/exams/:examId/marks" element={<MarksEntry />} />
          <Route path="/exams/:examId/results" element={<ClassResultSheet />} />
          <Route path="/exams/:examId/result/:studentId" element={<ResultCard />} />
          <Route path="/chatbot" element={<AlfalahAI />} />
        </Route>
      </Route>
    </Routes>
  );
}
