import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../../config/api";
import API_BASE_URL from "../../config/api";
import Loader from "../components/Loader";
import {
  FaUserGraduate,
  FaCalendarCheck,
  FaTimesCircle,
  FaPercentage,
  FaChartBar,
  FaCheckCircle,
  FaClock,
  FaBook,
  FaFolderOpen,
  FaBell,
  FaArrowRight,
  FaTrophy,
} from "react-icons/fa";

const categoryColor = (cat) => {
  const map = {
    Notes: "bg-blue-100 text-blue-700",
    Assignment: "bg-purple-100 text-purple-700",
    Syllabus: "bg-green-100 text-green-700",
    "Date Sheet": "bg-orange-100 text-orange-700",
    Book: "bg-teal-100 text-teal-700",
    "Past Paper": "bg-pink-100 text-pink-700",
    Circular: "bg-red-100 text-red-700",
    Other: "bg-gray-100 text-gray-700",
  };
  return map[cat] || "bg-gray-100 text-gray-700";
};

const notifIcon = (type) => {
  if (type === "result") return "📊";
  if (type === "diary") return "📖";
  if (type === "attendance") return "⚠️";
  if (type === "resource") return "📁";
  return "🔔";
};

// Today's attendance status → color + label + icon
const statusStyle = (status) => {
  switch (status) {
    case "Present":
      return { bg: "from-green-500 to-emerald-500", label: "Present", icon: <FaCheckCircle /> };
    case "Absent":
      return { bg: "from-red-500 to-rose-500", label: "Absent", icon: <FaTimesCircle /> };
    case "Leave":
      return { bg: "from-yellow-500 to-amber-500", label: "On Leave", icon: <FaClock /> };
    default:
      return { bg: "from-gray-400 to-gray-500", label: "Not marked yet", icon: <FaClock /> };
  }
};

const SectionHeader = ({ icon, title, to }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="font-bold text-gray-800 flex items-center gap-2">
      {icon} {title}
    </h2>
    {to && (
      <Link to={to} className="text-xs text-[#2F5DAA] font-medium flex items-center gap-1 hover:underline">
        View all <FaArrowRight className="text-[10px]" />
      </Link>
    )}
  </div>
);

const ParentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = JSON.parse(localStorage.getItem("authState"))?.token;

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.PARENT_DASHBOARD, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch {
        // handled
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return <Loader fullscreen={false} />;
  }

  if (!data) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Failed to load dashboard</p>
      </div>
    );
  }

  const { student, stats, today, thisMonth, latestResult, todayDiary, recentResources, recentNotifications } = data;
  const ts = statusStyle(today?.attendanceStatus);

  return (
    <div className="p-4 sm:p-6 min-h-screen">
      {/* Student Info Card */}
      <div className="glass-card overflow-hidden mb-6">
        <div className="p-6" style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}>
          <div className="flex items-center gap-4">
            {student.photo ? (
              <img src={`${API_BASE_URL}${student.photo}`} alt={student.name} className="w-16 h-16 rounded-full object-cover border-3 border-white/30" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <FaUserGraduate className="text-white text-2xl" />
              </div>
            )}
            <div className="text-white">
              <h1 className="text-xl sm:text-2xl font-bold">{student.name}</h1>
              <p className="text-white/70 text-sm">
                {student.className} | Roll #{student.rollNumber} | ID: {student.studentId}
              </p>
              <p className="text-white/60 text-xs mt-1">Guardian: {student.guardianName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's attendance status banner */}
      <div className={`rounded-2xl p-5 mb-6 text-white bg-gradient-to-r ${ts.bg} shadow-md`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{ts.icon}</div>
            <div>
              <p className="text-white/80 text-sm font-medium">Today's Attendance</p>
              <p className="text-2xl font-bold">{ts.label}</p>
            </div>
          </div>
          <Link to="/parent/attendance" className="text-white/90 text-sm font-medium flex items-center gap-1 hover:underline">
            History <FaArrowRight className="text-xs" />
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-100"><FaCalendarCheck className="text-green-600 text-xl" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Present (Total)</p>
              <p className="text-2xl font-bold text-gray-800">{stats.presentCount}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-100"><FaTimesCircle className="text-red-600 text-xl" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Absent (Total)</p>
              <p className="text-2xl font-bold text-gray-800">{stats.absentCount}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100"><FaPercentage className="text-blue-600 text-xl" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Attendance</p>
              <p className="text-2xl font-bold text-gray-800">{stats.attendancePercent}%</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100"><FaChartBar className="text-blue-600 text-xl" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Published Exams</p>
              <p className="text-2xl font-bold text-gray-800">{stats.publishedExams}</p>
            </div>
          </div>
        </div>
      </div>

      {/* This month attendance breakdown */}
      <div className="glass-card p-4 mb-6">
        <h2 className="font-bold text-gray-800 mb-3">This Month</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-xl bg-green-50 border border-green-100">
            <p className="text-2xl font-bold text-green-600">{thisMonth?.present ?? 0}</p>
            <p className="text-xs text-gray-500 font-medium">Present</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-2xl font-bold text-red-600">{thisMonth?.absent ?? 0}</p>
            <p className="text-xs text-gray-500 font-medium">Absent</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-yellow-50 border border-yellow-100">
            <p className="text-2xl font-bold text-yellow-600">{thisMonth?.leave ?? 0}</p>
            <p className="text-xs text-gray-500 font-medium">Leave</p>
          </div>
        </div>
      </div>

      {/* Overview widgets grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Latest Result */}
        <div className="glass-card p-5">
          <SectionHeader icon={<FaTrophy className="text-[#2F5DAA]" />} title="Latest Result" to="/parent/results" />
          {latestResult ? (
            <div>
              <p className="font-semibold text-gray-800">
                {latestResult.examName}
                <span className="text-xs text-gray-400 font-normal ml-2">
                  {latestResult.examType} · {latestResult.academicYear}
                </span>
              </p>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="text-center p-3 rounded-xl bg-blue-50">
                  <p className="text-xl font-bold text-[#2F5DAA]">{latestResult.percentage}%</p>
                  <p className="text-xs text-gray-500">Percentage</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50">
                  <p className="text-xl font-bold text-gray-800">{latestResult.grade}</p>
                  <p className="text-xs text-gray-500">Grade</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50">
                  <p className={`text-sm font-bold px-2 py-1 rounded-full inline-block ${latestResult.isPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {latestResult.isPass ? "PASS" : "FAIL"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Result</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Marks: {latestResult.obtainedMarks}/{latestResult.totalMarks}
                {latestResult.position ? ` · Position: ${latestResult.position}` : ""}
              </p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-6 text-center">No results published yet.</p>
          )}
        </div>

        {/* Today's Homework */}
        <div className="glass-card p-5">
          <SectionHeader icon={<FaBook className="text-[#2F5DAA]" />} title="Today's Homework" to="/parent/diary" />
          {todayDiary && todayDiary.length > 0 ? (
            <div className="space-y-2">
              {todayDiary.map((d, i) => (
                <div key={i} className="flex gap-2 p-2.5 rounded-lg bg-gray-50">
                  <span className="font-semibold text-sm text-[#2F5DAA] min-w-[80px]">{d.subject}</span>
                  <span className="text-sm text-gray-700 line-clamp-2">{d.description}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-6 text-center">No homework for today.</p>
          )}
        </div>

        {/* Recent Resources */}
        <div className="glass-card p-5">
          <SectionHeader icon={<FaFolderOpen className="text-[#2F5DAA]" />} title="Recent Resources" to="/parent/resources" />
          {recentResources && recentResources.length > 0 ? (
            <div className="space-y-2">
              {recentResources.map((r) => (
                <Link key={r._id} to="/parent/resources" className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors">
                  <FaFolderOpen className="text-[#2F5DAA]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400">{r.fileCount} file{r.fileCount !== 1 ? "s" : ""}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${categoryColor(r.category)}`}>
                    {r.category}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-6 text-center">No resources uploaded yet.</p>
          )}
        </div>

        {/* Recent Alerts */}
        <div className="glass-card p-5">
          <SectionHeader icon={<FaBell className="text-[#2F5DAA]" />} title="Recent Alerts" />
          {recentNotifications && recentNotifications.length > 0 ? (
            <div className="space-y-2">
              {recentNotifications.map((n) => (
                <div key={n._id} className={`flex items-start gap-2 p-2.5 rounded-lg ${!n.read ? "bg-blue-50/60" : "bg-gray-50"}`}>
                  <span className="text-lg">{notifIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-6 text-center">No notifications yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
