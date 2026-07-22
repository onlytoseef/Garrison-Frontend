import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import moment from "moment-timezone";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";

const AttendancePage = () => {
  const [scannedData, setScannedData] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAlreadyMarkedModalVisible, setIsAlreadyMarkedModalVisible] =
    useState(false);
  const [isInvalidStudentModalVisible, setIsInvalidStudentModalVisible] =
    useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [scannedStudents, setScannedStudents] = useState([]);
  const inputRef = useRef(null);

  const handleScan = async (data) => {
    if (data && data.length === 5) {
      setScannedData(data);
      try {
        const markAttendanceResponse = await axios.post(
          API_ENDPOINTS.MARK_ATTENDANCE.replace('/mark', '/mark'),
          { studentId: String(data) }
        );

        const studentResponse = await axios.get(
          API_ENDPOINTS.STUDENT_BY_ID(data)
        );
        setStudentInfo(studentResponse.data);

        const newScannedStudent = {
          key: scannedStudents.length + 1,
          name: studentResponse.data.name,
          class: `${studentResponse.data.classId.grade} - ${studentResponse.data.classId.section}`,
          rollNumber: studentResponse.data.rollNumber,
          time: moment().format("HH:mm:ss"),
        };

        setScannedStudents((prevStudents) => [
          newScannedStudent,
          ...prevStudents,
        ]);

        setIsModalVisible(true);
        setTimeout(() => setIsModalVisible(false), 2000);
      } catch (error) {
        if (error.response && error.response.status === 400) {
          setIsAlreadyMarkedModalVisible(true);
          setTimeout(() => setIsAlreadyMarkedModalVisible(false), 2000);
        } else if (error.response && error.response.status === 404) {
          setIsInvalidStudentModalVisible(true);
          setTimeout(() => setIsInvalidStudentModalVisible(false), 2000);
        }
      } finally {
        setScannedData("");
        inputRef.current.focus();
      }
    } else {
      setIsInvalidStudentModalVisible(true);
      setTimeout(() => setIsInvalidStudentModalVisible(false), 2000);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }

    const fetchTodayScannedStudents = async () => {
      try {
        const today = moment().tz("Asia/Karachi").format("YYYY-MM-DD");
        const response = await axios.get(
          `${API_BASE_URL}/api/attendance/scanned-students?date=${today}`
        );
        const formattedStudents = response.data.map((student, index) => ({
          key: index + 1,
          name: student.studentName,
          class: student.className,
          rollNumber: student.rollNumber,
          time: student.time,
        }));
        setScannedStudents(formattedStudents);
      } catch (error) {
        console.error("Error fetching today's scanned students:", error);
      }
    };

    fetchTodayScannedStudents();
  }, []);

  const handleModalClose = () => {
    setIsModalVisible(false);
    setIsAlreadyMarkedModalVisible(false);
    setIsInvalidStudentModalVisible(false);
    setScannedData("");
    inputRef.current.focus();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#F3F4F6] p-3 sm:p-4 md:p-6"
    >
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">Mark Attendance</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
          Scan student QR codes to mark attendance.
        </p>
      </div>

      <div className="max-w-md mx-auto glass-card p-4 sm:p-6 mb-6 sm:mb-8">
        <input
          ref={inputRef}
          type="text"
          placeholder="Scan QR Code"
          value={scannedData}
          onChange={(e) => {
            const value = e.target.value;
            setScannedData(value);
            if (value.length === 5) {
              handleScan(value.trim());
            }
          }}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#243F73]"
        />
        <p className="mt-2 text-xs sm:text-sm text-gray-600">
          Scanned Student ID: {scannedData}
        </p>
      </div>

      {isModalVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="glass-card p-6 sm:p-8 text-center max-w-md mx-4"
          >
            {studentInfo && (
              <>
                {studentInfo.photo && (
                  <img
                    src={`${API_BASE_URL}${studentInfo.photo}`}
                    alt="Student"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mb-3 sm:mb-4"
                  />
                )}
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  {studentInfo.name}
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Class: {studentInfo.classId.grade} -{" "}
                  {studentInfo.classId.section}
                </p>
                <p className="text-sm sm:text-base text-gray-600">
                  Roll Number: {studentInfo.rollNumber}
                </p>
                <p className="text-sm sm:text-base text-gray-600">Time: {formatTime(new Date())}</p>
                <div className="mt-3 sm:mt-4">
                  <span className="text-green-500 text-xl sm:text-2xl">✔</span>
                  <p className="text-green-500 text-sm sm:text-base font-bold">Attendance Marked</p>
                </div>
              </>
            )}
            <button
              onClick={handleModalClose}
              className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-[#243F73] to-[#1B315D] text-white rounded-lg hover:from-[#1B315D] hover:to-[#243F73] transition-all"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}

      {isAlreadyMarkedModalVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="glass-card p-6 sm:p-8 text-center max-w-md mx-4"
          >
            <span className="text-yellow-500 text-xl sm:text-2xl">⚠️</span>
            <p className="text-yellow-500 text-sm sm:text-base font-bold">
              Attendance already marked for this student today.
            </p>
            <button
              onClick={handleModalClose}
              className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-[#243F73] to-[#1B315D] text-white rounded-lg hover:from-[#1B315D] hover:to-[#243F73] transition-all"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}

      {isInvalidStudentModalVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            className="glass-card p-6 sm:p-8 text-center max-w-md mx-4"
          >
            <span className="text-red-500 text-xl sm:text-2xl">❌</span>
            <p className="text-red-500 text-sm sm:text-base font-bold">
              Student ID is invalid or doesn't exist.
            </p>
            <button
              onClick={handleModalClose}
              className="mt-4 sm:mt-6 px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-gradient-to-r from-[#243F73] to-[#1B315D] text-white rounded-lg hover:from-[#1B315D] hover:to-[#243F73] transition-all"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}

      <div className="glass-card p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
          Today's Scanned Students
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-transparent">
            <thead className="bg-gradient-to-r from-[#243F73] to-[#1B315D] text-white">
              <tr>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm">Name</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm">Class & Section</th>
                <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm">Scan Time</th>
              </tr>
            </thead>
            <tbody>
              {scannedStudents.map((student, index) => (
                <tr
                  key={student.key}
                  className={`${
                    index % 2 === 0 ? "bg-white/40" : "bg-white/20"
                  } hover:bg-gray-100 transition-all`}
                >
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{student.name}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{student.class}</td>
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">{student.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default AttendancePage;

