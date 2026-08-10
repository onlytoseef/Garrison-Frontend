import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaClock, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ParentAttendance = () => {
  const [records, setRecords] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const token = JSON.parse(localStorage.getItem("authState"))?.token;

  const fetchAttendance = async (month, year) => {
    setLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.PARENT_ATTENDANCE, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month, year },
      });
      setRecords(res.data.records || []);
      setStudentName(res.data.studentName || "");
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const presentCount = records.filter((r) => r.status === "Present").length;
  const absentCount = records.filter((r) => r.status === "Absent").length;
  const leaveCount = records.filter((r) => r.status === "Leave").length;

  const statusMap = {};
  records.forEach((r) => {
    const day = parseInt(r.date.split("-")[2], 10);
    statusMap[day] = r.status;
  });

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === selectedMonth && today.getFullYear() === selectedYear;

  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getCellStyle = (day) => {
    if (!day) return {};
    const status = statusMap[day];
    if (status === "Present") return { background: "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)", color: "white" };
    if (status === "Absent") return { background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)", color: "white" };
    if (status === "Leave") return { background: "linear-gradient(135deg, #D97706 0%, #FBBF24 100%)", color: "white" };
    return {};
  };

  const getCellClass = (day) => {
    if (!day) return "";
    const status = statusMap[day];
    if (status) return "shadow-md";
    if (isCurrentMonth && day === today.getDate()) return "ring-2 ring-[#2F5DAA]";
    return "";
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl" style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}>
          <FaCalendarAlt className="text-white text-xl" />
        </div>
        Attendance History {studentName && `— ${studentName}`}
      </h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="glass-card p-3 text-center border-l-4 border-green-500">
          <p className="text-xs text-gray-500 font-medium">Present</p>
          <p className="text-2xl font-bold text-green-600">{presentCount}</p>
        </div>
        <div className="glass-card p-3 text-center border-l-4 border-red-500">
          <p className="text-xs text-gray-500 font-medium">Absent</p>
          <p className="text-2xl font-bold text-red-600">{absentCount}</p>
        </div>
        <div className="glass-card p-3 text-center border-l-4 border-yellow-500">
          <p className="text-xs text-gray-500 font-medium">Leave</p>
          <p className="text-2xl font-bold text-yellow-600">{leaveCount}</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="glass-card overflow-hidden">
        {/* Calendar Header */}
        <div className="px-5 sm:px-6 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}>
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white">
            <FaChevronLeft />
          </button>
          <h3 className="text-white font-bold text-lg">
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </h3>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white">
            <FaChevronRight />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="grid grid-cols-7 gap-2">
                  {[...Array(7)].map((_, j) => (
                    <div key={j} className="h-12 bg-gray-200 rounded-xl"></div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarCells.map((day, idx) => (
                  <div
                    key={idx}
                    className={`relative flex flex-col items-center justify-center rounded-xl transition-all duration-200 ${
                      day ? "min-h-[48px] sm:min-h-[60px] cursor-default" : ""
                    } ${getCellClass(day)} ${!day ? "" : !statusMap[day] ? "bg-gray-50 hover:bg-gray-100" : "hover:scale-105"}`}
                    style={getCellStyle(day)}
                  >
                    {day && (
                      <>
                        <span className={`text-sm sm:text-base font-bold ${statusMap[day] ? "" : "text-gray-700"}`}>
                          {day}
                        </span>
                        {statusMap[day] && (
                          <span className="text-[10px] font-medium mt-0.5 opacity-90">
                            {statusMap[day] === "Present" ? "P" : statusMap[day] === "Absent" ? "A" : "L"}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md" style={{ background: "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)" }}></div>
                  <span className="text-xs font-medium text-gray-600">Present</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md" style={{ background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)" }}></div>
                  <span className="text-xs font-medium text-gray-600">Absent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md" style={{ background: "linear-gradient(135deg, #D97706 0%, #FBBF24 100%)" }}></div>
                  <span className="text-xs font-medium text-gray-600">Leave</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-md bg-gray-50 border border-gray-200"></div>
                  <span className="text-xs font-medium text-gray-600">No Record</span>
                </div>
              </div>

              {/* No records message */}
              {records.length === 0 && (
                <div className="text-center text-gray-400 mt-6 py-4">
                  <FaCalendarAlt className="text-4xl mx-auto mb-2 text-gray-300" />
                  <p>No attendance records for this month.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentAttendance;
