import React, { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import AdminLayout from "./AdminLayout";
import ProtectedRoute from "../../utils/ProtectedRoute";
import RouteLoader from "../components/RouteLoader";
// Eager, unlike every other page here. Campuses is the super admin's landing
// route, so lazy-loading it bought nothing — they always need it — while
// costing a visible chunk wait. Worse, that wait rendered the generic route
// spinner, which then handed over to the page's own crest loader: two loaders
// for one arrival. Importing it directly leaves exactly one.
import Campuses from "./Campuses";
// The academic head's landing route, eager for the same reason as Campuses.
import AcademicHeadCampuses from "./AcademicHeadCampuses";

/**
 * Every page here is code-split.
 *
 * The layout and the guard stay eager: they render on every route, so deferring
 * them would only add a round trip before anything appears. The pages are the
 * weight, and a principal who never opens the exam module should never download
 * it — before this, one bundle carried the whole admin surface, the parent
 * portal and the chatbot to every user on first load.
 */
const Home = lazy(() => import("./Home"));
const Staff = lazy(() => import("./Staff"));
const Students = lazy(() => import("./Students"));
const Classes = lazy(() => import("./Classess"));
const Users = lazy(() => import("./Users"));
const StaffDetails = lazy(() => import("./StaffDetails"));
const AttendancePage = lazy(() => import("./AttendancePage"));
const AttendanceRecord = lazy(() => import("./AttendanceRecord"));
const Profile = lazy(() => import("./Profile"));
const AlfalahAI = lazy(() => import("./AlfalahAI"));
const Exams = lazy(() => import("./Exams"));
const MarksEntry = lazy(() => import("./MarksEntry"));
const ClassResultSheet = lazy(() => import("./ClassResultSheet"));
const ResultCard = lazy(() => import("./ResultCard"));
const ManualAttendance = lazy(() => import("./ManualAttendance"));
const Diary = lazy(() => import("./Diary"));
const Resources = lazy(() => import("./Resources"));
const Logs = lazy(() => import("./Logs"));
const Fees = lazy(() => import("./Fees"));

// Roles that may work inside a campus. 'principal' is the campus owner;
// 'super_admin' gets here too, but only after opening a campus (requireCampus
// on the guard below sends them to the picker otherwise).
const CAMPUS_ROLES = ["super_admin", "principal", "admin", "teacher", "user"];

// Everyone in a campus except teachers. Teachers are limited to their assigned
// classes and subjects: a read-only class view, the diary and resources,
// entering marks for their own subject, and — if they are a class in-charge —
// marking that class's register. The student roster, fees, attendance records,
// staff and user management were not granted to them, and the API refuses those
// routes — so the pages are gated here too, otherwise typing the URL renders a
// screen that only produces 403s.
const OFFICE_ROLES = CAMPUS_ROLES.filter((role) => role !== "teacher");

// An academic head works inside a campus like the office, but scoped to a grade
// band and without money/audit. They reach the same teacher-open pages plus the
// student roster and a read-only staff directory — but NOT fees, users,
// attendance records or the QR feed. So they join the class-scoped group and a
// dedicated students/staff group, and are absent from the office-only group.
const CAMPUS_ROLES_WITH_HEAD = [...CAMPUS_ROLES, "academic_head"];
const STUDENT_STAFF_ROLES = [...OFFICE_ROLES, "academic_head"];

// The campus picker differs by role: the super admin gets the full network
// dashboard, the academic head a plain campus chooser (no network figures,
// which the overview API refuses them anyway).
const CampusPicker = () => {
  const role = useSelector((state) => state.auth.user?.role);
  return role === "academic_head" ? <AcademicHeadCampuses /> : <Campuses />;
};

export default function AdminRoutes() {
  return (
    // One Suspense around the whole tree rather than one per route: the
    // fallback renders inside AdminLayout for the nested routes, so the sidebar
    // stays put and only the content area shows the loader.
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Campus picker — the two campus-less roles land here and choose a
            campus before entering AdminLayout. Deliberately outside the layout:
            there is no campus context to render a sidebar for. The element
            branches on role. */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["super_admin", "academic_head"]} />
          }
        >
          <Route path="/campuses" element={<CampusPicker />} />
        </Route>

        {/* Audit trail. Outside the campus guard because a super admin reads it
            across every campus without opening one; a principal is pinned to
            their own campus by the API. Teachers and academic heads are excluded.
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
            <ProtectedRoute
              allowedRoles={CAMPUS_ROLES_WITH_HEAD}
              requireCampus
            />
          }
        >
          <Route element={<AdminLayout />}>
            {/* Open to teachers and academic heads. The class page is read-only
                for teachers; the exam pages let them enter marks and view
                results — all scoped by the API (teachers to their assigned
                classes, academic heads to their band). */}
            <Route path="/" element={<Home />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/exams/:examId/marks" element={<MarksEntry />} />
            <Route path="/exams/:examId/results" element={<ClassResultSheet />} />
            <Route
              path="/exams/:examId/result/:studentId"
              element={<ResultCard />}
            />
            {/* Marking a class register. Open to teachers (a class in-charge
                marks their own class) and academic heads (their band). The API
                refuses any class outside the caller's scope. */}
            <Route path="/manual-attendance" element={<ManualAttendance />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Student roster + read-only staff directory: the office, plus academic
            heads (band-scoped by the API). */}
        <Route
          element={
            <ProtectedRoute allowedRoles={STUDENT_STAFF_ROLES} requireCampus />
          }
        >
          <Route element={<AdminLayout />}>
            <Route path="/staff" element={<Staff />} />
            <Route path="/students" element={<Students />} />
          </Route>
        </Route>

        {/* Office-only pages: same layout, stricter guard — no academic heads.
            Fees and user management are off-limits to them, and staff details,
            attendance records and the QR feed have no band-scoped view. */}
        <Route
          element={
            <ProtectedRoute allowedRoles={OFFICE_ROLES} requireCampus />
          }
        >
          <Route element={<AdminLayout />}>
            <Route path="/staff/:id" element={<StaffDetails />} />
            <Route path="/users" element={<Users />} />
            {/* Fees are office work: the money is the office's business, and the
                API refuses teachers outright. */}
            <Route path="/fees" element={<Fees />} />
            <Route path="/student-attendance" element={<AttendancePage />} />
            <Route path="/attendance-record" element={<AttendanceRecord />} />
            <Route path="/chatbot" element={<AlfalahAI />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
