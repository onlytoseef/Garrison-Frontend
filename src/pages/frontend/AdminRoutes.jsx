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
import StudentListPage from "./StudentListPage";
import StudentFeePage from "./StudentFeePage";
import ClassFeeSummaryPage from "./ClassFeeSummaryPage";
import AlfalahAI from "./AlfalahAI";
import Exams from "./Exams";
import MarksEntry from "./MarksEntry";
import ClassResultSheet from "./ClassResultSheet";
import ResultCard from "./ResultCard";
import ManualAttendance from "./ManualAttendance";
import Diary from "./Diary";
import Resources from "./Resources";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={["user", "admin"]} />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/staff/:id" element={<StaffDetails />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentFeePage />} />
          <Route path="/student-list" element={<StudentListPage />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users" element={<Users />} />
          <Route path="/student-attendance" element={<AttendancePage />} />
          <Route path="/attendance-record" element={<AttendanceRecord />} />
          <Route path="/manual-attendance" element={<ManualAttendance />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/class-fee-summary" element={<ClassFeeSummaryPage />} />
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

