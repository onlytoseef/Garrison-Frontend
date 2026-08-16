import React, { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { motion } from "framer-motion";
import axios from "axios";
import moment from "moment-timezone";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../../config/api";
import {
  FaUsers,
  FaChalkboardTeacher,
  FaSchool,
  FaUserCheck,
  FaUserTimes,
  FaUserClock,
  FaExclamationCircle,
  FaCalendarCheck,
  FaBook,
  FaPen,
  FaCheckCircle,
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
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isTeacher = user?.role === "teacher";
  // The Needs Attention feed is shown to teachers (their assigned classes) and to
  // the office (principal/admin/super-admin-in-campus), who see every class in
  // the campus. Parents have their own portal.
  const showAttention = ["teacher", "principal", "admin", "super_admin"].includes(
    user?.role
  );

  const [totalStudents, setTotalStudents] = useState(0);
  const [presentStudents, setPresentStudents] = useState(0);
  const [absentStudents, setAbsentStudents] = useState(0);
  const [onLeaveStudents, setOnLeaveStudents] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [loading, setLoading] = useState(true);

  // Teacher "Needs Attention" feed — what is still outstanding today.
  const [attention, setAttention] = useState(null); // { date, classes: [] }
  const [attentionLoading, setAttentionLoading] = useState(false);

  useEffect(() => {
    if (!showAttention) return;
    let alive = true;
    setAttentionLoading(true);
    axios
      .get(API_ENDPOINTS.TEACHER_ATTENTION)
      .then((res) => {
        if (alive) setAttention(res.data);
      })
      .catch(() => {
        if (alive) setAttention({ classes: [] });
      })
      .finally(() => {
        if (alive) setAttentionLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [showAttention]);

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
      {showAttention && (
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div
              className="p-2 rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
            >
              <FaExclamationCircle className="text-lg sm:text-xl" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                Needs Attention
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {isTeacher
                  ? "Outstanding for today"
                  : "Outstanding across your campus today"}
                {attention?.date
                  ? ` — ${moment(attention.date).format("ddd, DD MMM YYYY")}`
                  : ""}
              </p>
            </div>
          </div>

          {attentionLoading ? (
            <div className="glass-card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-8 bg-gray-200 rounded w-2/3" />
            </div>
          ) : (attention?.classes?.length ?? 0) === 0 ? (
            <div className="glass-card p-6 flex items-center gap-3 border-l-4 border-green-500">
              <FaCheckCircle className="text-green-500 text-2xl flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">You're all caught up.</p>
                <p className="text-sm text-gray-500">
                  Nothing pending for your classes today.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {attention.classes.map((c) => (
                <div
                  key={c._id}
                  className="glass-card p-4 sm:p-5 border-l-4 border-amber-400"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">
                        Class {c.grade} - {c.section}
                      </h3>
                      <p className="text-xs mt-0.5 flex items-center gap-1.5">
                        <FaChalkboardTeacher className="text-gray-400" />
                        {c.inchargeName ? (
                          <span className="text-gray-500">
                            In-charge:{" "}
                            <span className="font-medium text-gray-700">
                              {c.inchargeName}
                            </span>
                          </span>
                        ) : (
                          <span className="text-amber-600 font-medium">
                            No in-charge assigned
                          </span>
                        )}
                      </p>
                    </div>
                    {c.isIncharge && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        In-charge
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.attendancePending && (
                      <button
                        onClick={() => navigate("/manual-attendance")}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-medium transition-colors"
                      >
                        <FaCalendarCheck /> Attendance not marked
                      </button>
                    )}
                    {c.diaryPendingSubjects?.length > 0 && (
                      <button
                        onClick={() => navigate("/diary")}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium transition-colors"
                        title={c.diaryPendingSubjects.join(", ")}
                      >
                        <FaBook /> Diary pending
                        <span className="text-xs font-normal opacity-80">
                          ({c.diaryPendingSubjects.length}
                          {c.isIncharge ? `/${c.ownedSubjectCount}` : ""})
                        </span>
                      </button>
                    )}
                    {(c.examsPending || []).map((ex) => (
                      <button
                        key={ex.examId}
                        onClick={() => navigate(`/exams/${ex.examId}/marks`)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors"
                        title={ex.pendingSubjects.join(", ")}
                      >
                        <FaPen /> {ex.name}
                        <span className="text-xs font-normal opacity-80">
                          ({ex.pendingSubjects.length} subject
                          {ex.pendingSubjects.length === 1 ? "" : "s"})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
