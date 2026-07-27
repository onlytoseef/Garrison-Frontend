import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import API_BASE_URL from "../../config/api";
import { FaUserGraduate, FaCalendarCheck, FaTimesCircle, FaPercentage, FaBook, FaChartBar } from "react-icons/fa";

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
    return (
      <div className="p-6 min-h-screen">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Failed to load dashboard</p>
      </div>
    );
  }

  const { student, stats } = data;

  return (
    <div className="p-4 sm:p-6 min-h-screen">
      {/* Student Info Card */}
      <div className="glass-card overflow-hidden mb-6">
        <div className="p-6" style={{ background: "linear-gradient(135deg, #243F73 0%, #365896 100%)" }}>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-100">
              <FaCalendarCheck className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Present</p>
              <p className="text-2xl font-bold text-gray-800">{stats.presentCount}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-100">
              <FaTimesCircle className="text-red-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Absent</p>
              <p className="text-2xl font-bold text-gray-800">{stats.absentCount}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-100">
              <FaPercentage className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Attendance</p>
              <p className="text-2xl font-bold text-gray-800">{stats.attendancePercent}%</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-100">
              <FaChartBar className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Published Exams</p>
              <p className="text-2xl font-bold text-gray-800">{stats.publishedExams}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome message */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Welcome to Parent Portal</h2>
        <p className="text-gray-600 text-sm">
          View your child's exam results, attendance history, and daily homework diary from the sidebar menu.
          You will receive notifications when new results are published, homework is assigned, or if your child is marked absent.
        </p>
      </div>
    </div>
  );
};

export default ParentDashboard;
