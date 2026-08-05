import React, { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { motion } from "framer-motion";
import axios from "axios";
import moment from "moment-timezone";
import { API_ENDPOINTS } from "../../config/api";
import {
  FaUsers,
  FaChalkboardTeacher,
  FaSchool,
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
} from "react-icons/fa";

Chart.register(...registerables);

const SkeletonCard = () => (
  <div className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-gray-300">
    <div className="flex items-center">
      <div className="p-2 sm:p-3 rounded-full bg-gray-200 text-gray-400 mr-3 sm:mr-4">
        <div className="w-5 sm:w-6 h-5 sm:h-6"></div>
      </div>
      <div className="flex-1">
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-1 sm:mb-2"></div>
        <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

const SkeletonChart = ({ height = "300px" }) => (
  <div
    className="bg-gray-200 rounded animate-pulse"
    style={{ width: "100%", height }}
  ></div>
);

const Home = () => {
  const chartRef = useRef(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [presentStudents, setPresentStudents] = useState(0);
  const [absentStudents, setAbsentStudents] = useState(0);
  const [onLeaveStudents, setOnLeaveStudents] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.DASHBOARD_SUMMARY);
      const data = response.data;

      setTotalStudents(data.totalStudents);
      setPresentStudents(data.presentStudents);
      setAbsentStudents(data.absentStudents || 0);
      setOnLeaveStudents(data.onLeaveStudents || 0);
      setTotalStaff(data.totalStaff);
      setTotalClasses(data.totalClasses || 0);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!chartRef.current || loading) return;

    const ctx = chartRef.current.getContext("2d");
    const pieChart = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Present", "Absent"],
        datasets: [
          {
            label: "Students",
            data: [presentStudents, totalStudents - presentStudents],
            backgroundColor: [
              "rgba(34, 197, 94, 0.6)",
              "rgba(220, 38, 38, 0.6)",
            ],
            borderColor: ["rgba(34, 197, 94, 1)", "rgba(220, 38, 38, 1)"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          title: {
            display: true,
            text: `Attendance for ${moment().format("DD MMM YYYY")}`,
            font: {
              size: window.innerWidth < 1280 ? 14 : 16,
            },
          },
        },
      },
    });

    return () => {
      pieChart?.destroy();
    };
  }, [totalStudents, presentStudents, loading]);

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8">
      {loading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
            <div className="glass-card p-4 sm:p-5 md:p-6">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 md:mb-4">
                Attendance Overview
              </h2>
              <div className="h-48 sm:h-56 md:h-64 lg:h-80">
                <SkeletonChart />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
            {/* Total Students Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-blue-500"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-blue-100 text-blue-600 mr-3 sm:mr-4">
                  <FaUsers className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    Total Students
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
                    {totalStudents.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Total Staff Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-blue-500"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-blue-100 text-blue-600 mr-3 sm:mr-4">
                  <FaChalkboardTeacher className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    Total Staff
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">
                    {totalStaff.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Total Classes Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-indigo-500"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-indigo-100 text-indigo-600 mr-3 sm:mr-4">
                  <FaSchool className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    Total Classes
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-600">
                    {totalClasses.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Present Today Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-green-500"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-green-100 text-green-600 mr-3 sm:mr-4">
                  <FaUserCheck className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    Present Today
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">
                    {presentStudents.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Absent Today Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-red-500"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-red-100 text-red-600 mr-3 sm:mr-4">
                  <FaUserTimes className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    Absent Today
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600">
                    {absentStudents.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* On Leave Today Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-yellow-500"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-yellow-100 text-yellow-600 mr-3 sm:mr-4">
                  <FaUserClock className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    On Leave Today
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-600">
                    {onLeaveStudents.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Attendance Chart */}
            <div className="glass-card p-4 sm:p-5 md:p-6">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4">
                Attendance Overview
              </h2>
              <div className="h-64 sm:h-72 md:h-80">
                <canvas ref={chartRef}></canvas>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
