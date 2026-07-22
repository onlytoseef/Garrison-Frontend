import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { fetchClasses } from "../../store/slices/classSlice";
import { fetchStudents } from "../../store/slices/studentSlice";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import {
  Input,
  Button,
  Modal,
  Select,
  Pagination,
  Empty,
  Tag,
} from "antd";
import {
  FaSearch,
  FaArrowRight,
  FaFileInvoiceDollar,
  FaChartBar,
  FaBook,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaInfoCircle,
} from "react-icons/fa";
import { IoIosSchool } from "react-icons/io";
import { GiGraduateCap } from "react-icons/gi";
import axios from "axios";
import toast from "react-hot-toast";

const { Option } = Select;

const StudentCard = React.memo(
  ({ student, isHovered, setIsHovered, navigate }) => {
    const feeStatus = React.useMemo(() => {
      // Use pendingVouchers and totalVouchers from backend aggregation
      const totalVouchers = student.totalVouchers || 0;
      const pendingVouchers = student.pendingVouchers || 0;
      
      if (totalVouchers === 0) {
        return { hasFees: false };
      }
      
      return {
        hasFees: true,
        totalVouchers,
        paidVouchers: totalVouchers - pendingVouchers,
        pendingVouchers,
        hasPending: pendingVouchers > 0,
        allPaid: pendingVouchers === 0,
      };
    }, [student.totalVouchers, student.pendingVouchers]);

    return (
      <div
        className="relative h-full transition-all duration-300 hover:-translate-y-2"
        onMouseEnter={() => setIsHovered(student._id)}
        onMouseLeave={() => setIsHovered(null)}
      >
        <div className="glass-card hover:shadow-xl overflow-hidden h-full flex flex-col border border-gray-100 hover:border-blue-300 transition-all duration-300">
          {feeStatus.hasFees && (
            <div className="absolute top-2 right-2 z-10">
              {feeStatus.hasPending ? (
                <Tag 
                  className="font-bold shadow-md px-3 py-1"
                  style={{ 
                    background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                >
                  {feeStatus.pendingVouchers} Pending
                </Tag>
              ) : feeStatus.allPaid ? (
                <Tag 
                  className="font-bold shadow-md px-3 py-1"
                  style={{ 
                    background: 'linear-gradient(135deg, #15803D 0%, #22C55E 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                >
                  ✓ All Paid
                </Tag>
              ) : null}
            </div>
          )}

          <div className="p-4 sm:p-6 flex-1">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="relative flex-shrink-0">
                {student.photo ? (
                  <img
                    src={`${API_BASE_URL}${student.photo}` }
                    alt={student.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 sm:border-4 border-white shadow-md"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#243F73]/10 flex items-center justify-center shadow-md">
                    <IoIosSchool className="text-xl sm:text-3xl text-blue-600" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-blue-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold shadow-md">
                  {student.rollNumber}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 truncate">
                  {student.name}
                </h2>
                <p className="text-gray-600 text-xs sm:text-sm truncate">
                  ID: {student.studentId}
                </p>
                {student.classId && (
                  <span 
                    className="inline-block mt-1 sm:mt-2 px-3 py-1 text-xs font-semibold rounded-full shadow-sm"
                    style={{
                      background: '#243F73',
                      color: 'white'
                    }}
                  >
                    {student.classId.grade} - {student.classId.section}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            className={`absolute inset-0 bg-[#243F73]/90 rounded-2xl flex items-end justify-center p-3 sm:p-4 cursor-pointer transition-opacity duration-300 ${
              isHovered === student._id ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => navigate(`/students/${student._id}`)}
          >
            <button className="flex items-center cursor-pointer text-white font-medium px-3 py-1 sm:px-4 sm:py-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all text-xs sm:text-sm">
              View Profile <FaArrowRight className="ml-1 sm:ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);

const StudentListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { students, status } = useSelector((state) => state.students);
  const { classes, status: classStatus } = useSelector(
    (state) => state.classes
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [isHovered, setIsHovered] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [amount, setAmount] = useState(2000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(16);

  // Debounced search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Responsive page size
  useEffect(() => {
    const updateSize = () => {
      setPageSize(
        window.innerWidth < 640 ? 8 : window.innerWidth < 1024 ? 12 : 16
      );
    };

    const debouncedResize = debounce(updateSize, 100);
    window.addEventListener("resize", debouncedResize);
    updateSize();

    return () => window.removeEventListener("resize", debouncedResize);
  }, []);

  // Fetch data
  useEffect(() => {
    dispatch(fetchStudents({ limit: 2000 })); // Fetch up to 2000 students
    dispatch(fetchClasses());
  }, [dispatch]);

  // Memoized filtered students
  const filteredStudents = React.useMemo(() => {
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.guardianName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.guardianPhone?.includes(searchTerm) ||
        student.rollNumber?.toString().includes(searchTerm)
    );
  }, [students, searchTerm]);

  // Memoized pagination
  const { paginatedStudents, totalPages } = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return {
      paginatedStudents: filteredStudents.slice(
        startIndex,
        startIndex + pageSize
      ),
      totalPages: Math.ceil(filteredStudents.length / pageSize),
    };
  }, [filteredStudents, currentPage, pageSize]);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleBulkGenerate = useCallback(async () => {
    if (!selectedClass) {
      toast.error("Please select a class first");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post(
  API_ENDPOINTS.GENERATE_BULK_MONTHLY,
        { classId: selectedClass, month, year, amount }
      );
      toast.success(`Generated ${response.data.count} vouchers successfully`);
      setIsBulkModalOpen(false);
      dispatch(fetchStudents({ limit: 2000 })); // Fetch up to 2000 students
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate vouchers"
      );
    } finally {
      setIsGenerating(false);
    }
  }, [selectedClass, month, year, amount, dispatch]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  if (status === "loading" || classStatus === "loading") {
    return (
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="max-w-7xl 2xl:max-w-full mx-auto">
          {/* Header Skeleton */}
          <div className="glass-card p-8 mb-6 animate-pulse">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded-xl mx-auto w-64 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded-lg mx-auto w-48"></div>
          </div>

          {/* Search Bar Skeleton */}
          <div className="glass-card p-4 mb-6 animate-pulse">
            <div className="h-12 bg-gray-200 rounded-xl w-full sm:w-1/2"></div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="glass-card p-6 h-48 animate-pulse"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-7xl 2xl:max-w-full mx-auto animate-fadeIn">

        {/* Search and Actions Bar */}
        <div className="glass-card p-4 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:max-w-md">
              <Input
                placeholder="🔍 Search students by name or ID..."
                prefix={<FaSearch className="text-gray-400" />}
                size="large"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl shadow-sm"
                allowClear
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                type="primary"
                icon={<FaFileInvoiceDollar />}
                onClick={() => setIsBulkModalOpen(true)}
                size="large"
                className="w-full sm:w-auto border-0 transition-all duration-300 hover:scale-105 shadow-md"
                style={{ background: '#243F73' }}
              >
                <span className="hidden sm:inline">Bulk Generate Fees</span>
                <span className="sm:hidden">Generate Fees</span>
              </Button>

              <Link to="/class-fee-summary" className="w-full sm:w-auto">
                <Button
                  icon={<FaChartBar />}
                  size="large"
                  className="w-full sm:w-auto flex items-center justify-center text-white border-0 transition-all duration-300 hover:scale-105 shadow-md"
                  style={{ background: '#243F73', color: 'white' }}
                >
                  <span className="hidden sm:inline">Class Summary</span>
                  <span className="sm:hidden">Summary</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="flex justify-center mb-6 animate-bounce">
              <GiGraduateCap 
                className="text-6xl sm:text-8xl" 
                style={{ 
                  background: '#243F73',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }} 
              />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Students Found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {paginatedStudents.map((student) => (
                <StudentCard
                  key={student._id}
                  student={student}
                  isHovered={isHovered}
                  setIsHovered={setIsHovered}
                  navigate={navigate}
                />
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <div className="glass-card px-6 py-4">
                <Pagination
                  current={currentPage}
                  total={filteredStudents.length}
                  pageSize={pageSize}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  responsive
                  showTotal={(total, range) => (
                    <span className="text-gray-600 mr-4">
                      {range[0]}-{range[1]} of {total} students
                    </span>
                  )}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
              <FaFileInvoiceDollar className="text-white text-lg" />
            </div>
            <span className="text-xl font-bold text-gray-800">
              Bulk Generate Monthly Fee Vouchers
            </span>
          </div>
        }
        visible={isBulkModalOpen}
        onOk={handleBulkGenerate}
        onCancel={() => setIsBulkModalOpen(false)}
        okText={isGenerating ? "Generating..." : "Generate Vouchers"}
        okButtonProps={{ 
          loading: isGenerating,
          className: "bg-gradient-to-r from-blue-500 to-indigo-600 border-0 h-10"
        }}
        cancelButtonProps={{
          className: "h-10"
        }}
        width={Math.min(window.innerWidth - 40, 600)}
        className="student-list-modal"
      >
        <div className="space-y-5 py-2">
          <div>
            <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
              <FaBook className="text-[#243F73]" /> Select Class
            </label>
            <Select
              placeholder="Choose a class..."
              className="w-full"
              size="large"
              value={selectedClass}
              onChange={setSelectedClass}
            >
              {classes.map((cls) => (
                <Option key={cls._id} value={cls._id}>
                  {cls.grade} - {cls.section}
                </Option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <FaCalendarAlt className="text-[#243F73]" /> Month
              </label>
              <Select 
                value={month} 
                onChange={setMonth} 
                className="w-full"
                size="large"
              >
                {months.map((monthName, index) => (
                  <Option key={monthName} value={index + 1}>
                    {monthName}
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                <FaCalendarAlt className="text-[#243F73]" /> Year
              </label>
              <Select 
                value={year} 
                onChange={setYear} 
                className="w-full"
                size="large"
              >
                <Option value={year - 1}>{year - 1}</Option>
                <Option value={year}>{year}</Option>
                <Option value={year + 1}>{year + 1}</Option>
              </Select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
              <FaMoneyBillWave className="text-[#243F73]" /> Amount per Student
            </label>
            <Input
              type="number"
              size="large"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              prefix="Rs."
              className="text-lg font-semibold"
            />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-l-4 border-blue-500">
            <p className="text-blue-800 text-sm sm:text-base font-medium flex items-center gap-2">
              <FaInfoCircle className="flex-shrink-0" /> This will generate monthly fee vouchers for all students in the
              selected class.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default React.memo(StudentListPage);

