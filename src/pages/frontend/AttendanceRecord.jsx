import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import moment from "moment";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";

const AttendanceRecord = () => {
  const [studentId, setStudentId] = useState("");
  const [studentInfo, setStudentInfo] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState("currentMonth");

  const fetchStudentData = async () => {
    if (studentId && studentId.length === 5) {
      setLoading(true);
      try {
        const studentResponse = await axios.get(
          API_ENDPOINTS.STUDENT_BY_ID(studentId)
        );
        setStudentInfo(studentResponse.data);

        const currentMonthStart = moment()
          .startOf("month")
          .format("YYYY-MM-DD");
        const currentMonthEnd = moment().endOf("month").format("YYYY-MM-DD");

        const attendanceResponse = await axios.get(
          `${API_BASE_URL}/api/attendance/student/${studentId}?startDate=${currentMonthStart}&endDate=${currentMonthEnd}`
        );

        const allDates = [];
        let currentDate = moment(currentMonthStart);
        while (currentDate.isSameOrBefore(currentMonthEnd)) {
          allDates.push(currentDate.format("YYYY-MM-DD"));
          currentDate.add(1, "day");
        }

        const attendanceMap = {};
        attendanceResponse.data.forEach((record) => {
          const recordDate = moment(record.date).format("YYYY-MM-DD");
          attendanceMap[recordDate] = record;
        });

        const history = allDates.map((date) => ({
          date,
          status: attendanceMap[date] ? "Present" : "Absent",
          time: attendanceMap[date] ? attendanceMap[date].time : null,
        }));

        setAttendanceHistory(history);
        toast.success(
          "Student data and attendance history fetched successfully!"
        );
      } catch (error) {
        console.error("Error fetching student data:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch student data."
        );
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("Please enter a valid 5-digit student ID.");
    }
  };
  const getDateRange = () => {
    switch (dateRange) {
      case "lastMonth":
        return {
          start: moment()
            .subtract(1, "month")
            .startOf("month")
            .format("YYYY-MM-DD"),
          end: moment()
            .subtract(1, "month")
            .endOf("month")
            .format("YYYY-MM-DD"),
        };
      case "lastWeek":
        return {
          start: moment()
            .subtract(1, "week")
            .startOf("week")
            .format("YYYY-MM-DD"),
          end: moment().subtract(1, "week").endOf("week").format("YYYY-MM-DD"),
        };
      default: // currentMonth
        return {
          start: moment().startOf("month").format("YYYY-MM-DD"),
          end: moment().endOf("month").format("YYYY-MM-DD"),
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] p-6">
      <Toaster position="top-center" reverseOrder={false} />
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-8xl mx-auto bg-white rounded-xl shadow-2xl p-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-6 sm:mb-8">
          Student Attendance History
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 sm:mb-8">
          <input
            type="text"
            placeholder="Enter Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full sm:flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F5DAA] focus:border-transparent"
          />
          <button
            onClick={fetchStudentData}
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#2F5DAA] to-[#1E3F72] text-white rounded-lg hover:from-[#1E3F72] hover:to-[#2F5DAA] transition-all shadow-lg cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading...
              </div>
            ) : (
              "Fetch Student Data"
            )}
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6">
          <button
            onClick={() => setDateRange("currentMonth")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
              dateRange === "currentMonth"
                ? "bg-[#2F5DAA] text-white"
                : "bg-gray-200"
            }`}
          >
            Current Month
          </button>
          <button
            onClick={() => setDateRange("lastMonth")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
              dateRange === "lastMonth"
                ? "bg-[#2F5DAA] text-white"
                : "bg-gray-200"
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => setDateRange("lastWeek")}
            className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
              dateRange === "lastWeek"
                ? "bg-[#2F5DAA] text-white"
                : "bg-gray-200"
            }`}
          >
            Last Week
          </button>
        </div>

        {studentInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-8 text-center"
          >
            {studentInfo.photo && (
              <img
                src={`${API_BASE_URL}${studentInfo.photo}`}
                alt="Student Photo"
                className="w-24 h-24 rounded-full mx-auto mb-4 shadow-lg border-4 border-[#2F5DAA]"
              />
            )}
            <h3 className="text-2xl font-bold text-gray-800">
              {studentInfo.name}
            </h3>
            <p className="text-gray-600">
              Class: {studentInfo.classId.grade} - {studentInfo.classId.section}
            </p>
            <p className="text-gray-600">
              Roll Number: {studentInfo.rollNumber}
            </p>
          </motion.div>
        )}
        {attendanceHistory.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 my-6">
            <div className="bg-green-100 p-4 rounded-lg text-center min-w-[120px]">
              <p className="text-xl sm:text-2xl font-bold text-green-800">
                {attendanceHistory.filter((r) => r.status === "Present").length}
              </p>
              <p className="text-green-600 text-sm sm:text-base">Present Days</p>
            </div>
            <div className="bg-pink-100 p-4 rounded-lg text-center min-w-[120px]">
              <p className="text-xl sm:text-2xl font-bold text-pink-800">
                {attendanceHistory.filter((r) => r.status === "Absent").length}
              </p>
              <p className="text-pink-600 text-sm sm:text-base">Absent Days</p>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg text-center min-w-[120px]">
              <p className="text-xl sm:text-2xl font-bold text-blue-800">
                {Math.round(
                  (attendanceHistory.filter((r) => r.status === "Present")
                    .length /
                    attendanceHistory.length) *
                    100
                )}
                %
              </p>
              <p className="text-blue-600 text-sm sm:text-base">Attendance Rate</p>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {attendanceHistory.map((record) => (
              <motion.div
                key={record.date}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-6 rounded-xl shadow-lg ${
                  record.status === "Present"
                    ? "bg-gradient-to-r from-green-200 to-green-100 border-2 border-green-400"
                    : "bg-gradient-to-r from-pink-200 to-pink-100 border-2 border-pink-400"
                }`}
              >
                <p className="text-lg font-bold text-gray-800 text-center">
                  {moment(record.date).format("DD MMM YYYY")}
                </p>
                <div className="text-center mt-4">
                  {record.status === "Present" ? (
                    <>
                      <FaCheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                      <p className="text-green-600 font-semibold mt-2">
                        Present
                      </p>
                      <p className="text-gray-600 text-sm">{record.time}</p>
                    </>
                  ) : (
                    <>
                      <FaTimesCircle className="h-8 w-8 text-pink-600 mx-auto" />
                      <p className="text-pink-600 font-semibold mt-2">Absent</p>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AttendanceRecord;

