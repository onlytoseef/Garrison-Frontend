import React, { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
import { motion } from "framer-motion";
import axios from "axios";
import moment from "moment-timezone";
import { API_ENDPOINTS } from "../../config/api";
import {
  FaUsers,
  FaChalkboardTeacher,
  FaMoneyBillWave,
  FaClock,
  FaFileAlt,
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
  FaHandHoldingUsd,
  FaCalendarDay,
  FaNewspaper,
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

const SkeletonTable = () => (
  <div className="space-y-2">
    <div className="h-8 sm:h-10 bg-gray-200 rounded"></div>
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-10 sm:h-12 bg-gray-100 rounded"></div>
    ))}
  </div>
);

const Home = () => {
  const chartRef = useRef(null);
  const barChartRef = useRef(null);
  const dailyChartRef = useRef(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [presentStudents, setPresentStudents] = useState(0);
  const [totalStaff, setTotalStaff] = useState(0);
  const [monthlyPaid, setMonthlyPaid] = useState(0);
  const [monthlyPending, setMonthlyPending] = useState(0);
  const [monthlyPaidStudents, setMonthlyPaidStudents] = useState(0);
  const [monthlyPendingStudents, setMonthlyPendingStudents] = useState(0);
  const [admissionPaid, setAdmissionPaid] = useState(0);
  const [admissionPending, setAdmissionPending] = useState(0);
  const [admissionPaidStudents, setAdmissionPaidStudents] = useState(0);
  const [admissionPendingStudents, setAdmissionPendingStudents] = useState(0);
  const [paperFundPaid, setPaperFundPaid] = useState(0);
  const [paperFundPending, setPaperFundPending] = useState(0);
  const [paperFundPaidStudents, setPaperFundPaidStudents] = useState(0);
  const [paperFundPendingStudents, setPaperFundPendingStudents] = useState(0);
  const [staffSalaryPaid, setStaffSalaryPaid] = useState(0);
  const [staffSalaryPending, setStaffSalaryPending] = useState(0);
  const [paidStaffCount, setPaidStaffCount] = useState(0);
  const [pendingStaffCount, setPendingStaffCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    moment().subtract(6, "days").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(moment().format("YYYY-MM-DD"));
  const [dateError, setDateError] = useState("");

  const [feeData, setFeeData] = useState({
    labels: [],
    collected: [],
    pending: [],
  });
  const [dailyFeeData, setDailyFeeData] = useState({
    labels: [],
    monthlyFee: [],
    admissionFee: [],
    paperFund: [],
    partialPayments: [],
    total: [],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
      
  API_ENDPOINTS.DASHBOARD_SUMMARY,
        {
          params: {
            startDate,
            endDate,
          },
        }
      );
      const data = response.data;

      setTotalStudents(data.totalStudents);
      setPresentStudents(data.presentStudents);
      setTotalStaff(data.totalStaff);

      setMonthlyPaid(data.monthlyFee.paid);
      setMonthlyPending(data.monthlyFee.pending);
      setMonthlyPaidStudents(data.monthlyFee.paidStudents);
      setMonthlyPendingStudents(data.monthlyFee.pendingStudents);

      setAdmissionPaid(data.admissionFee.paid);
      setAdmissionPending(data.admissionFee.pending);
      setAdmissionPaidStudents(data.admissionFee.paidStudents);
      setAdmissionPendingStudents(data.admissionFee.pendingStudents);

      setPaperFundPaid(data.paperFund?.paid || 0);
      setPaperFundPending(data.paperFund?.pending || 0);
      setPaperFundPaidStudents(data.paperFund?.paidStudents || 0);
      setPaperFundPendingStudents(data.paperFund?.pendingStudents || 0);

      setStaffSalaryPaid(data.staffSalary.paid);
      setStaffSalaryPending(data.staffSalary.pending);
      setPaidStaffCount(data.staffSalary.paidStaffCount);
      setPendingStaffCount(data.staffSalary.pendingStaffCount);

      setFeeData({
        labels: data.monthlyFeeYearSummary.map((item) => item.monthName),
        collected: data.monthlyFeeYearSummary.map((item) => item.paidFees),
        pending: data.monthlyFeeYearSummary.map((item) => item.pendingFees),
      });

      setDailyFeeData({
        labels: data.dailyFeeSummary.map((day) =>
          moment(day.date).format("DD MMM YYYY")
        ),
        monthlyFee: data.dailyFeeSummary.map((day) => day.monthlyFee || 0),
        admissionFee: data.dailyFeeSummary.map((day) => day.admissionFee || 0),
        paperFund: data.dailyFeeSummary.map((day) => day.paperFund || 0),
        partialPayments: data.dailyFeeSummary.map((day) => day.partialPayments || 0),
        total: data.dailyFeeSummary.map((day) => day.total || 0),
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (error.response?.status === 400) {
        setDateError(error.response.data.message || "Invalid date range");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Validate date range
    if (moment(endDate).isBefore(startDate)) {
      setDateError("End date cannot be before start date");
      return;
    }
    setDateError("");
    fetchData();
  }, [startDate, endDate]);

  useEffect(() => {
    if (!chartRef.current || loading) return;

    let pieChart, barChart, dailyChart;

    const createCharts = () => {
      // Pie Chart (Attendance)
      const ctx = chartRef.current.getContext("2d");
      pieChart = new Chart(ctx, {
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

      // Bar Chart (Monthly Fees)
      if (barChartRef.current) {
        const barCtx = barChartRef.current.getContext("2d");
        barChart = new Chart(barCtx, {
          type: "bar",
          data: {
            labels: feeData.labels,
            datasets: [
              {
                label: "Collected Fees",
                data: feeData.collected,
                backgroundColor: "rgba(34, 197, 94, 0.6)",
                borderColor: "rgba(34, 197, 94, 1)",
                borderWidth: 1,
              },
              {
                label: "Pending Fees",
                data: feeData.pending,
                backgroundColor: "rgba(249, 115, 22, 0.6)",
                borderColor: "rgba(249, 115, 22, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Amount (Rs.)",
                  font: {
                    size: window.innerWidth < 1280 ? 12 : 14,
                  },
                },
                ticks: {
                  font: {
                    size: window.innerWidth < 1280 ? 10 : 12,
                  },
                },
              },
              x: {
                title: {
                  display: true,
                  text: `Months (${moment().year()})`,
                  font: {
                    size: window.innerWidth < 1280 ? 12 : 14,
                  },
                },
                ticks: {
                  font: {
                    size: window.innerWidth < 1280 ? 10 : 12,
                  },
                },
              },
            },
            plugins: {
              legend: {
                labels: {
                  font: {
                    size: window.innerWidth < 1280 ? 12 : 14,
                  },
                },
              },
            },
          },
        });
      }

      // Daily Fee Chart
      if (dailyChartRef.current) {
        const dailyCtx = dailyChartRef.current.getContext("2d");
        dailyChart = new Chart(dailyCtx, {
          type: "line",
          data: {
            labels: dailyFeeData.labels,
            datasets: [
              {
                label: "Monthly Fee",
                data: dailyFeeData.monthlyFee,
                borderColor: "rgba(36, 63, 115, 1)",
                backgroundColor: "rgba(36, 63, 115, 0.2)",
                tension: 0.3,
                fill: true,
              },
              {
                label: "Admission Fee",
                data: dailyFeeData.admissionFee,
                borderColor: "rgba(108, 139, 196, 1)",
                backgroundColor: "rgba(108, 139, 196, 0.2)",
                tension: 0.3,
                fill: true,
              },
              {
                label: "Partial Payments",
                data: dailyFeeData.partialPayments,
                borderColor: "rgba(54, 88, 150, 1)",
                backgroundColor: "rgba(54, 88, 150, 0.2)",
                tension: 0.3,
                fill: true,
              },
              {
                label: "Paper Fund",
                data: dailyFeeData.paperFund,
                borderColor: "rgba(249, 115, 22, 1)",
                backgroundColor: "rgba(249, 115, 22, 0.2)",
                tension: 0.3,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: `Fee Collection from ${moment(startDate).format(
                  "DD MMM YYYY"
                )} to ${moment(endDate).format("DD MMM YYYY")}`,
                font: {
                  size: window.innerWidth < 1280 ? 14 : 16,
                },
              },
              legend: {
                labels: {
                  font: {
                    size: window.innerWidth < 1280 ? 12 : 14,
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Amount (Rs.)",
                  font: {
                    size: window.innerWidth < 1280 ? 12 : 14,
                  },
                },
                ticks: {
                  font: {
                    size: window.innerWidth < 1280 ? 10 : 12,
                  },
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Date",
                  font: {
                    size: window.innerWidth < 1280 ? 12 : 14,
                  },
                },
                ticks: {
                  font: {
                    size: window.innerWidth < 1280 ? 10 : 12,
                  },
                },
              },
            },
          },
        });
      }
    };

    createCharts();

    return () => {
      pieChart?.destroy();
      barChart?.destroy();
      dailyChart?.destroy();
    };
  }, [
    totalStudents,
    presentStudents,
    loading,
    feeData,
    dailyFeeData,
    startDate,
    endDate,
  ]);

  const currentMonthYear = moment().tz("Asia/Karachi").format("MMM YYYY");
  const totalCollectionRate =
    Math.round(
      ((monthlyPaid + admissionPaid + paperFundPaid) /
        (monthlyPaid + monthlyPending + admissionPaid + admissionPending + paperFundPaid + paperFundPending)) *
        100
    ) || 0;

  const staffSalaryCollectionRate =
    Math.round(
      (staffSalaryPaid / (staffSalaryPaid + staffSalaryPending)) * 100
    ) || 0;

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    if (name === "startDate") {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8">
      {loading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
            {[...Array(10)].map((_, i) => (
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
            <div className="glass-card p-4 sm:p-5 md:p-6">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 md:mb-4">
                Monthly Fee Collection ({moment().year()})
              </h2>
              <div className="h-48 sm:h-56 md:h-64 lg:h-80">
                <SkeletonChart />
              </div>
            </div>
          </div>

          <div className="glass-card p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 sm:mb-3 md:mb-4 gap-2">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold">
                Fee Collection
              </h2>
              <div className="flex items-center text-gray-500 text-xs sm:text-sm md:text-base">
                <FaCalendarDay className="mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">
                  {moment(startDate).format("DD MMM")} -{" "}
                  {moment(endDate).format("DD MMM YYYY")}
                </span>
              </div>
            </div>
            <div className="h-64 sm:h-72 md:h-80 lg:h-96">
              <SkeletonChart />
            </div>
          </div>

          <div className="glass-card p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 md:mb-8">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 md:mb-4">
              Daily Fee Collection Details
            </h2>
            <SkeletonTable />
          </div>

          <div className="glass-card p-4 sm:p-5 md:p-6">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 md:mb-4">
              Financial Summary
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-medium mb-2">
                  Fee Collection Progress
                </h3>
                <div className="h-2 bg-gray-200 rounded-full mb-2 sm:mb-3 md:mb-4"></div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  <div className="h-16 sm:h-20 md:h-24 bg-gray-100 rounded-lg"></div>
                  <div className="h-16 sm:h-20 md:h-24 bg-gray-100 rounded-lg"></div>
                </div>
              </div>
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-medium mb-2">
                  Salary Payment Progress
                </h3>
                <div className="h-2 bg-gray-200 rounded-full mb-2 sm:mb-3 md:mb-4"></div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  <div className="h-16 sm:h-20 md:h-24 bg-gray-100 rounded-lg"></div>
                  <div className="h-16 sm:h-20 md:h-24 bg-gray-100 rounded-lg"></div>
                </div>
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
              className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-purple-500"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600 mr-3 sm:mr-4">
                  <FaChalkboardTeacher className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    Total Staff
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">
                    {totalStaff.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Monthly Paid Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-green-500"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-green-100 text-green-600 mr-3 sm:mr-4">
                  <FaMoneyBillWave className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    Monthly Paid ({currentMonthYear})
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">
                    Rs. {monthlyPaid.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-green-500 mt-1">
                    {monthlyPaidStudents} students paid
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Monthly Pending Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-orange-500"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-orange-100 text-orange-600 mr-3 sm:mr-4">
                  <FaClock className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    Monthly Pending ({currentMonthYear})
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">
                    Rs. {monthlyPending.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-orange-500 mt-1">
                    {monthlyPendingStudents} students pending
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Admission Paid Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-teal-500"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-teal-100 text-teal-600 mr-3 sm:mr-4">
                  <FaFileInvoiceDollar className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    Admission Paid
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-teal-600">
                    Rs. {admissionPaid.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-teal-500 mt-1">
                    {admissionPaidStudents} students paid
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Admission Pending Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-orange-500"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-orange-100 text-orange-600 mr-3 sm:mr-4">
                  <FaFileAlt className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    Admission Pending
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">
                    Rs. {admissionPending.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-orange-500 mt-1">
                    {admissionPendingStudents} students pending
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Paper Fund Paid Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-cyan-500"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-cyan-100 text-cyan-600 mr-3 sm:mr-4">
                  <FaNewspaper className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    Paper Fund Paid ({moment().year()})
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-cyan-600">
                    Rs. {paperFundPaid.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-cyan-500 mt-1">
                    {paperFundPaidStudents} students paid
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Paper Fund Pending Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-pink-500"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-pink-100 text-pink-600 mr-3 sm:mr-4">
                  <FaNewspaper className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    Paper Fund Pending ({moment().year()})
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-pink-600">
                    Rs. {paperFundPending.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-pink-500 mt-1">
                    {paperFundPendingStudents} students pending
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Staff Salary Paid Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-indigo-500"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-indigo-100 text-indigo-600 mr-3 sm:mr-4">
                  <FaMoneyCheckAlt className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    Staff Salary Paid ({currentMonthYear})
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-600">
                    Rs. {staffSalaryPaid.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-indigo-500 mt-1">
                    {paidStaffCount} staff paid
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Staff Salary Pending Card */}
            <motion.div
              whileHover={{ y: -5 }}
              className="glass-card p-4 sm:p-5 md:p-6 border-l-4 border-amber-500"
            >
              <div className="flex items-center">
                <div className="p-2 sm:p-3 rounded-full bg-amber-100 text-amber-600 mr-3 sm:mr-4">
                  <FaHandHoldingUsd className="text-xl sm:text-2xl" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm md:text-base text-gray-600 font-medium">
                    Staff Salary Pending ({currentMonthYear})
                  </h3>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-600">
                    Rs. {staffSalaryPending.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-amber-500 mt-1">
                    {pendingStaffCount} staff pending
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

            {/* Fee Collection Chart */}
            <div className="glass-card p-4 sm:p-5 md:p-6">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4">
                Monthly Fee Collection ({moment().year()})
              </h2>
              <div className="h-64 sm:h-72 md:h-80">
                <canvas ref={barChartRef}></canvas>
              </div>
            </div>
          </div>

          {/* Daily Fee Collection Chart */}
          <div className="glass-card p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2">
              <h2 className="text-base sm:text-lg md:text-xl font-semibold">
                Fee Collection
              </h2>
              <div className="flex items-center text-gray-500 text-xs sm:text-sm md:text-base mt-1 sm:mt-0">
                <FaCalendarDay className="mr-2" />
                <span>
                  {moment(startDate).format("DD MMM")} -{" "}
                  {moment(endDate).format("DD MMM YYYY")}
                </span>
              </div>
            </div>
            <div className="h-64 sm:h-72 md:h-80 lg:h-96">
              <canvas ref={dailyChartRef}></canvas>
            </div>
          </div>

          {/* Daily Fee Collection Table */}
          <div className="glass-card p-4 sm:p-5 md:p-6 mb-6 sm:mb-8 border border-gray-100">
            {/* Date Range Picker */}
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-600 mr-2">
                    Start Date:
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={startDate}
                    onChange={handleDateChange}
                    className="border border-gray-300 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-600 mr-2">
                    End Date:
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={endDate}
                    onChange={handleDateChange}
                    className="border border-gray-300 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {dateError && (
                <p className="text-red-500 text-xs mt-2">{dateError}</p>
              )}
            </div>

            {/* Table Header with Title and Summary */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-3">
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800">
                  Daily Fee Collection
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Showing data from {moment(startDate).format("DD MMM YYYY")} to{" "}
                  {moment(endDate).format("DD MMM YYYY")} (
                  {dailyFeeData.labels.length} days)
                </p>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                <span className="text-xs sm:text-sm font-medium text-blue-700">
                  Total Collected: Rs.{" "}
                  {dailyFeeData.total
                    .reduce((a, b) => a + b, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Monthly Fee (Rs.)
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Admission Fee (Rs.)
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Paper Fund (Rs.)
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Partial Payments (Rs.)
                    </th>
                    <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Total (Rs.)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50 bg-transparent">
                  {dailyFeeData.labels.map((label, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        {label}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-blue-600 font-medium">
                        {dailyFeeData.monthlyFee[index].toLocaleString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-green-600 font-medium">
                        {dailyFeeData.admissionFee[index].toLocaleString()}
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-cyan-600 font-medium">
                        {(dailyFeeData.paperFund[index] || 0).toLocaleString()}
                      </td>
                      <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap text-xs xl:text-sm text-purple-600 font-medium">
                        {dailyFeeData.partialPayments[index].toLocaleString()}
                      </td>
                      <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap text-xs xl:text-sm font-bold text-gray-900">
                        {dailyFeeData.total[index].toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="mt-2 xl:mt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs xl:text-sm text-gray-500 gap-2">
              <div>Showing {dailyFeeData.labels.length} records</div>
              <div className="flex gap-3 xl:gap-4">
                <span className="text-blue-600">
                  Monthly: Rs.{" "}
                  {dailyFeeData.monthlyFee
                    .reduce((a, b) => a + b, 0)
                    .toLocaleString()}
                </span>
                <span className="text-green-600">
                  Admission: Rs.{" "}
                  {dailyFeeData.admissionFee
                    .reduce((a, b) => a + b, 0)
                    .toLocaleString()}
                </span>
                <span className="text-cyan-600">
                  Paper Fund: Rs.{" "}
                  {dailyFeeData.paperFund
                    .reduce((a, b) => a + b, 0)
                    .toLocaleString()}
                </span>
                <span className="text-purple-600">
                  Partial: Rs.{" "}
                  {dailyFeeData.partialPayments
                    .reduce((a, b) => a + b, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="glass-card p-4 xl:p-6">
            <h2 className="text-lg xl:text-xl font-semibold mb-3 xl:mb-4">
              Financial Summary
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-6">
              <div>
                <h3 className="text-base xl:text-lg font-medium mb-2">
                  Fee Collection Progress
                </h3>
                <div className="flex justify-between mb-1">
                  <span className="text-xs xl:text-sm font-medium text-gray-600">
                    Collection Rate
                  </span>
                  <span className="text-xs xl:text-sm font-medium text-gray-600">
                    {totalCollectionRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-600 h-2.5 rounded-full"
                    style={{ width: `${totalCollectionRate}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 gap-3 xl:gap-4 mt-3 xl:mt-4">
                  <div className="bg-green-50 p-3 xl:p-4 rounded-lg border border-green-100">
                    <p className="text-xs xl:text-sm text-green-600">
                      Total Fees Paid
                    </p>
                    <p className="text-xl xl:text-2xl font-bold text-green-700">
                      Rs. {(monthlyPaid + admissionPaid + paperFundPaid).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-3 xl:p-4 rounded-lg border border-orange-100">
                    <p className="text-xs xl:text-sm text-orange-600">
                      Total Fees Pending
                    </p>
                    <p className="text-xl xl:text-2xl font-bold text-orange-700">
                      Rs. {(monthlyPending + admissionPending + paperFundPending).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base xl:text-lg font-medium mb-2">
                  Salary Payment Progress
                </h3>
                <div className="flex justify-between mb-1">
                  <span className="text-xs xl:text-sm font-medium text-gray-600">
                    Payment Rate
                  </span>
                  <span className="text-xs xl:text-sm font-medium text-gray-600">
                    {staffSalaryCollectionRate}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${staffSalaryCollectionRate}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-2 gap-3 xl:gap-4 mt-3 xl:mt-4">
                  <div className="bg-blue-50 p-3 xl:p-4 rounded-lg border border-blue-100">
                    <p className="text-xs xl:text-sm text-blue-600">
                      Total Salary Paid
                    </p>
                    <p className="text-xl xl:text-2xl font-bold text-blue-700">
                      Rs. {staffSalaryPaid.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-amber-50 p-3 xl:p-4 rounded-lg border border-amber-100">
                    <p className="text-xs xl:text-sm text-amber-600">
                      Total Salary Pending
                    </p>
                    <p className="text-xl xl:text-2xl font-bold text-amber-700">
                      Rs. {staffSalaryPending.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;

