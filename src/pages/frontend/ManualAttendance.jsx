import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaCheck,
  FaTimes,
  FaCalendarAlt,
  FaUsers,
  FaChalkboardTeacher,
  FaDoorOpen,
  FaUserGraduate,
} from "react-icons/fa";
import { MdHowToReg } from "react-icons/md";
import Loader from "../components/Loader";

const ManualAttendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [classLoading, setClassLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setClassLoading(true);
      const res = await axios.get(API_ENDPOINTS.CLASSES);
      setClasses(res.data);
    } catch (err) {
      toast.error("Failed to load classes");
    } finally {
      setClassLoading(false);
    }
  };

  const selectClass = async (cls) => {
    setSelectedClass(cls);
    setLoading(true);
    try {
      const classRes = await axios.get(API_ENDPOINTS.CLASS(cls._id));
      const studentList = classRes.data.students || [];
      setStudents(studentList);

      let existingAttendance = {};
      try {
        const attendanceRes = await axios.get(API_ENDPOINTS.CLASS_ATTENDANCE, {
          params: { classId: cls._id, date: selectedDate },
        });
        (attendanceRes.data || []).forEach((record) => {
          existingAttendance[record.studentId] = record.status;
        });
      } catch {
        // No existing attendance for this date — that's fine
      }

      const initialData = {};
      studentList.forEach((s) => {
        initialData[s.studentId] = existingAttendance[s.studentId] || "Absent";
      });
      setAttendanceData(initialData);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);

    if (selectedClass) {
      setLoading(true);
      try {
        const attendanceRes = await axios.get(API_ENDPOINTS.CLASS_ATTENDANCE, {
          params: { classId: selectedClass._id, date: newDate },
        });

        const existingAttendance = {};
        (attendanceRes.data || []).forEach((record) => {
          existingAttendance[record.studentId] = record.status;
        });

        const updatedData = {};
        students.forEach((s) => {
          updatedData[s.studentId] =
            existingAttendance[s.studentId] || "Absent";
        });
        setAttendanceData(updatedData);
      } catch (err) {
        toast.error("Failed to load attendance for this date");
      } finally {
        setLoading(false);
      }
    }
  };

  const setStatus = (studentId, status) => {
    setAttendanceData((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s.studentId] = status;
    });
    setAttendanceData(updated);
  };

  const handleSubmit = async () => {
    if (!selectedClass || students.length === 0) return;

    setSubmitting(true);
    try {
      const attendance = Object.entries(attendanceData).map(
        ([studentId, status]) => ({
          studentId,
          status,
        })
      );

      await axios.post(API_ENDPOINTS.MARK_CLASS_ATTENDANCE, {
        classId: selectedClass._id,
        date: selectedDate,
        attendance,
      });

      toast.success(
        `Attendance saved for ${selectedClass.grade}-${selectedClass.section}`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    setSelectedClass(null);
    setStudents([]);
    setAttendanceData({});
  };

  const presentCount = Object.values(attendanceData).filter(
    (s) => s === "Present"
  ).length;
  const absentCount = Object.values(attendanceData).filter(
    (s) => s === "Absent"
  ).length;
  const leaveCount = Object.values(attendanceData).filter(
    (s) => s === "Leave"
  ).length;

  // Class selection view
  if (!selectedClass) {
    return (
      <div className="p-4 sm:p-6 min-h-screen">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <div
                  className="p-2 rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                  }}
                >
                  <MdHowToReg className="text-white text-xl sm:text-2xl" />
                </div>
                Manual Attendance
              </h1>
              <p className="text-gray-500 mt-1 ml-12 sm:ml-14">
                Select a class to mark attendance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-[#2F5DAA]" />
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="px-4 py-2.5 border-2 border-gray-200 focus:border-[#2F5DAA] rounded-xl outline-none transition-all duration-300 text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Class Cards Grid */}
        {classLoading ? (
          <Loader fullscreen={false} />
        ) : classes.length === 0 ? (
          <div className="text-center py-16">
            <FaChalkboardTeacher className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No classes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {classes.map((cls, index) => (
              <div
                key={cls._id}
                onClick={() => selectClass(cls)}
                className="glass-card hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:-translate-y-1 cursor-pointer"
              >
                <div
                  className="p-4 sm:p-5"
                  style={{
                    background:
                      "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Class {cls.grade} - {cls.section}
                    </h3>
                    <div className="bg-white/20 rounded-full p-2">
                      <FaUsers className="text-white text-lg" />
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaDoorOpen className="text-[#2F5DAA]" />
                    <span className="text-sm">
                      Room: {cls.roomNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaChalkboardTeacher className="text-[#2F5DAA]" />
                    <span className="text-sm">{cls.inCharge}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaUserGraduate className="text-[#2F5DAA]" />
                    <span className="text-sm">
                      {cls.studentCount || 0} Students
                    </span>
                  </div>
                </div>
                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <button
                    className="w-full py-2.5 rounded-xl text-white font-semibold transition-all duration-300 hover:shadow-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                    }}
                  >
                    Mark Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Student attendance view
  return (
    <div className="p-4 sm:p-6 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="p-2.5 rounded-xl text-white hover:shadow-lg transition-all duration-300"
              style={{
                background:
                  "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
              }}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                Class {selectedClass.grade} - {selectedClass.section}
              </h1>
              <p className="text-gray-500 text-sm">
                {selectedClass.inCharge} | Room {selectedClass.roomNumber}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-[#2F5DAA]" />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="px-4 py-2.5 border-2 border-gray-200 focus:border-[#2F5DAA] rounded-xl outline-none transition-all duration-300 text-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="glass-card p-3 sm:p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Present</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">
                {presentCount}
              </p>
            </div>
            <FaCheck className="text-green-500 text-xl sm:text-2xl opacity-50" />
          </div>
        </div>
        <div className="glass-card p-3 sm:p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Absent</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">
                {absentCount}
              </p>
            </div>
            <FaTimes className="text-red-500 text-xl sm:text-2xl opacity-50" />
          </div>
        </div>
        <div className="glass-card p-3 sm:p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Leave</p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                {leaveCount}
              </p>
            </div>
            <FaCalendarAlt className="text-yellow-500 text-xl sm:text-2xl opacity-50" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
        <button
          onClick={() => markAll("Present")}
          className="px-4 py-2 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)",
          }}
        >
          <FaCheck className="inline mr-2" />
          Mark All Present
        </button>
        <button
          onClick={() => markAll("Absent")}
          className="px-4 py-2 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
          }}
        >
          <FaTimes className="inline mr-2" />
          Mark All Absent
        </button>
        <button
          onClick={() => markAll("Leave")}
          className="px-4 py-2 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #CA8A04 0%, #EAB308 100%)",
          }}
        >
          <FaCalendarAlt className="inline mr-2" />
          Mark All Leave
        </button>
      </div>

      {/* Student Table */}
      {loading ? (
        <Loader fullscreen={false} />
      ) : students.length === 0 ? (
        <div className="text-center py-16 glass-card">
          <FaUserGraduate className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            No students found in this class
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    background:
                      "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                  }}
                >
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">
                    #
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">
                    Roll No
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-white">
                    Student Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-white">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {students
                  .sort((a, b) => (a.rollNumber || 0) - (b.rollNumber || 0))
                  .map((student, index) => (
                    <tr
                      key={student.studentId}
                      className={`border-b border-gray-100 transition-colors duration-200 ${
                        index % 2 === 0 ? "bg-white/40" : "bg-white/20"
                      } hover:bg-blue-50/50`}
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-600">
                        {index + 1}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-700">
                        {student.rollNumber || "-"}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium text-gray-800">
                        {student.name}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <button
                            onClick={() =>
                              setStatus(student.studentId, "Present")
                            }
                            className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                              attendanceData[student.studentId] === "Present"
                                ? "text-white shadow-md scale-105"
                                : "text-green-700 bg-green-50 hover:bg-green-100 border border-green-200"
                            }`}
                            style={
                              attendanceData[student.studentId] === "Present"
                                ? {
                                    background:
                                      "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)",
                                  }
                                : {}
                            }
                          >
                            Present
                          </button>
                          <button
                            onClick={() =>
                              setStatus(student.studentId, "Absent")
                            }
                            className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                              attendanceData[student.studentId] === "Absent"
                                ? "text-white shadow-md scale-105"
                                : "text-red-700 bg-red-50 hover:bg-red-100 border border-red-200"
                            }`}
                            style={
                              attendanceData[student.studentId] === "Absent"
                                ? {
                                    background:
                                      "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
                                  }
                                : {}
                            }
                          >
                            Absent
                          </button>
                          <button
                            onClick={() =>
                              setStatus(student.studentId, "Leave")
                            }
                            className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                              attendanceData[student.studentId] === "Leave"
                                ? "text-white shadow-md scale-105"
                                : "text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200"
                            }`}
                            style={
                              attendanceData[student.studentId] === "Leave"
                                ? {
                                    background:
                                      "linear-gradient(135deg, #CA8A04 0%, #EAB308 100%)",
                                  }
                                : {}
                            }
                          >
                            Leave
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Submit Button */}
          <div className="p-4 sm:p-6 border-t border-gray-100">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3 rounded-xl text-white font-semibold text-base transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background:
                  "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
              }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <MdHowToReg className="text-xl" />
                  Save Attendance
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualAttendance;
