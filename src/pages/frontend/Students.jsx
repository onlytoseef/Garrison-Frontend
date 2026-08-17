import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStudents,
  deleteStudent,
  updateStudent,
  addStudent,
  updateStudentStatus,
  resetParentPassword,
} from "../../store/slices/studentSlice";
import { fetchClasses } from "../../store/slices/classSlice";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import axios from "axios";
import { FaTrash, FaEdit, FaPlus,  FaUser, FaUserTie, FaPhone, FaHome, FaMale, FaFemale, FaUserPlus, FaSearch,  FaCamera, FaImage, FaEye, FaPrint, FaKey, FaBan, FaCheckCircle, FaRedo, FaCopy, FaFileExcel, FaDownload, FaIdCard } from "react-icons/fa";
import { MdSchool, MdDelete, MdNumbers } from "react-icons/md";
import { BiSolidUserDetail } from "react-icons/bi";
import { toast } from "react-hot-toast";
import StudentCard from "../components/StudentCard";
import ImportStudentsModal from "../components/ImportStudentsModal";
import ExportStudentsModal from "../components/ExportStudentsModal";
import { isReadOnlyRole } from "../../utils/permissions";


const SkeletonCard = () => (
  <div className="glass-card p-4">
    <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
  </div>
);


const SkeletonTable = () => (
  <div className="overflow-x-auto rounded-lg shadow-md">
    <table className="min-w-full bg-transparent">
      <thead className="bg-gradient-to-r from-[#2F5DAA] to-[#1E3F72] text-white">
        <tr>
          <th className="px-6 py-3 text-left text-sm font-semibold">Photo</th>
          <th className="px-6 py-3 text-left text-sm font-semibold">
            Roll Number
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
          <th className="px-6 py-3 text-left text-sm font-semibold">
            Guardian
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold">Gender</th>
          <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
          <th className="px-6 py-3 text-left text-sm font-semibold">Parent Login</th>
          <th className="px-6 py-3 text-left text-sm font-semibold">
            Class &amp; Section
          </th>
          <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
        </tr>
      </thead>
      <tbody>
        {[...Array(5)].map((_, index) => (
          <tr
            key={index}
            className={index % 2 === 0 ? "bg-white/40" : "bg-white/20"}
          >
            <td className="px-6 py-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-28"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-20"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-36"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-24"></div>
            </td>
            <td className="px-6 py-4">
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Students = () => {
  const dispatch = useDispatch();
  const { students, totalStudents, status, pagination } = useSelector(
    (state) => state.students
  );
  const { classes } = useSelector((state) => state.classes);

  // The campus-level administrators may block or unblock a student. 'admin' (a
  // campus admin) has the same rights as 'principal' here. The backend enforces
  // this too (requireRole on the route) — this just hides a control that would
  // otherwise 403.
  const { user } = useSelector((state) => state.auth);
  // A principal is read-only: they read the roster (with parent credentials) but
  // cannot add, edit, delete, block, reset or import. The backend enforces it;
  // this hides the controls. 'admin' (campus admin) keeps every write.
  const isReadOnly = isReadOnlyRole(user?.role);
  const canChangeStatus =
    !isReadOnly && ["super_admin", "principal", "admin"].includes(user?.role);
  // Teachers get a read-only roster of their own classes: the API refuses these
  // actions and strips parent credentials from the payload, so the controls are
  // hidden rather than left to fail on click.
  const isTeacher = user?.role === "teacher";
  // A principal, a teacher and an academic head all get a read-only roster. Add /
  // Edit / Delete hang off this.
  const canWrite = !isTeacher && !isReadOnly;
  // Bulk import is restricted to the office roles on the backend (an academic
  // head may add students one by one within their band, but not import). Match
  // that allowlist so the button is not offered when it would only 403.
  const canImport =
    !isReadOnly && ["super_admin", "principal", "admin"].includes(user?.role);
  // Parent portal credentials are stripped from the payload for an academic head
  // (like a teacher), and resetting them is an office action, so the credential
  // controls are hidden for both. A principal may still SEE them (read), but not
  // reset (write) — the reset button carries its own !isReadOnly check.
  const canSeeParentCreds = !isTeacher && user?.role !== "academic_head";

  const [statusTarget, setStatusTarget] = useState(null); // student pending confirm
  const [statusSaving, setStatusSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [cardStudent, setCardStudent] = useState(null); // student whose ID card modal is open
  const [credStudent, setCredStudent] = useState(null); // student whose parent credentials modal is open
  const [resettingCreds, setResettingCreds] = useState(false);
  // Two-step confirm inside the modal: the old password stops working the moment
  // this runs, so it should not be one stray click away.
  const [confirmReset, setConfirmReset] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [filterClass, setFilterClass] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [lastFetchKey, setLastFetchKey] = useState(""); // Track last fetch to avoid duplicate calls
  const [formData, setFormData] = useState({
    studentId: "",
    name: "",
    guardianName: "",
    classId: "",
    gender: "",
    guardianPhone: "",
    guardianCnic: "",
    address: "",
  });

  // --- Student photo (upload OR live camera capture) ---
  const [photoFile, setPhotoFile] = useState(null); // File/Blob to upload
  const [photoPreview, setPhotoPreview] = useState(null); // preview URL (object URL or existing photo)
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera not available on this device/connection. Please use Upload.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraOn(true);
      // srcObject is assigned after the <video> mounts (see useEffect below).
    } catch (err) {
      toast.error("Could not access the camera. Please allow permission or use Upload.");
    }
  };

  // Attach the live stream to the <video> once it is rendered.
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn]);

  // Release the camera if the component unmounts while it's on.
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setPhotoFile(blob);
          setPhotoPreview(URL.createObjectURL(blob));
        }
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  const clearPhoto = () => {
    stopCamera();
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  // Search only on Enter key press
  const handleSearch = () => {
    if (searchTerm !== debouncedSearchTerm) {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
      setLastFetchKey(""); // Force refetch
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Fetch students when debounced search term or filter changes
  useEffect(() => {
    // Create a unique key for current query
    const fetchKey = `${currentPage}-${debouncedSearchTerm}-${filterClass || ''}`;
    
    // Skip if same query was already fetched and we have data
    if (fetchKey === lastFetchKey && students.length > 0) {
      return;
    }
    
    dispatch(fetchStudents({ 
      page: currentPage, 
      limit: 50, // 50 students per page for better performance
      search: debouncedSearchTerm,
      classId: filterClass 
    }));
    setLastFetchKey(fetchKey);
  }, [dispatch, currentPage, debouncedSearchTerm, filterClass]);

  // Fetch classes only once on mount
  useEffect(() => {
    if (classes.length === 0) {
      dispatch(fetchClasses());
    }
  }, [dispatch, classes.length]);

  const filteredStudents = students; // Already filtered by backend
  const filteredStudentsCount = pagination.total || students.length;

  const handleDelete = async () => {
    try {
      await dispatch(deleteStudent(studentToDelete)).unwrap();
      toast.success("Student deleted successfully!");
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error("Failed to delete student.");
    }
  };

  const handleStatusChange = async () => {
    if (!statusTarget) return;
    // Whatever it is now, flip it.
    const nextStatus =
      statusTarget.status === "blocked" ? "active" : "blocked";

    try {
      setStatusSaving(true);
      const res = await dispatch(
        updateStudentStatus({
          studentId: statusTarget.studentId,
          status: nextStatus,
        })
      ).unwrap();
      toast.success(res.message);
      setStatusTarget(null);
    } catch (error) {
      toast.error(error?.message || "Failed to update status");
    } finally {
      setStatusSaving(false);
    }
  };

  /**
   * Issues a new parent password. The backend updates the bcrypt hash used for
   * login and the AES copy shown here in one transaction, so what appears in the
   * modal afterwards is genuinely what the parent must type.
   */
  const handleResetParentPassword = async () => {
    if (!credStudent) return;
    try {
      setResettingCreds(true);
      const res = await dispatch(
        resetParentPassword(credStudent.studentId)
      ).unwrap();

      // Reflect the new credentials in the open modal immediately; the slice
      // has already patched the row behind it.
      setCredStudent((prev) => ({
        ...prev,
        parentEmail: res.parentCredentials.email,
        parentPassword: res.parentCredentials.password,
      }));
      setConfirmReset(false);
      toast.success("Parent password reset");
    } catch (error) {
      toast.error(error?.message || "Failed to reset password");
    } finally {
      setResettingCreds(false);
    }
  };

  const copyCredentials = () => {
    if (!credStudent?.parentEmail) return;
    navigator.clipboard.writeText(
      `Email: ${credStudent.parentEmail}\nPassword: ${credStudent.parentPassword}`
    );
    toast.success("Copied");
  };

  const closeCredModal = () => {
    setCredStudent(null);
    setConfirmReset(false);
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      studentId: student.studentId || "",
      name: student.name,
      guardianName: student.guardianName,
      classId: student.classId._id,
      gender: student.gender,
      guardianPhone: student.guardianPhone,
      guardianCnic: student.guardianCnic || "",
      address: student.address,
    });
    // Show the existing photo (if any) as the preview; no new file selected yet.
    setPhotoFile(null);
    setPhotoPreview(student.photo ? `${API_BASE_URL}${student.photo}` : null);
    setCameraOn(false);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("name", formData.name);
    fd.append("guardianName", formData.guardianName);
    fd.append("classId", formData.classId);
    fd.append("gender", formData.gender);
    fd.append("guardianPhone", formData.guardianPhone);
    fd.append("guardianCnic", formData.guardianCnic);
    fd.append("address", formData.address);
    // Only send a photo if the user picked/captured a new one; else backend keeps the old.
    if (photoFile) {
      fd.append("photo", photoFile, "photo.jpg");
    }

    try {
      await dispatch(
        updateStudent({
          id: editingStudent.studentId,
          studentData: fd,
        })
      ).unwrap();
      stopCamera();
      setPhotoFile(null);
      setPhotoPreview(null);
      setIsEditModalOpen(false);
      toast.success("Student updated successfully!");
    } catch (error) {
      toast.error("Failed to update student.");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append("studentId", formData.studentId.trim());
    fd.append("name", formData.name);
    fd.append("guardianName", formData.guardianName);
    fd.append("classId", formData.classId);
    fd.append("gender", formData.gender);
    fd.append("guardianPhone", formData.guardianPhone);
    fd.append("guardianCnic", formData.guardianCnic);
    fd.append("address", formData.address);
    if (photoFile) {
      fd.append("photo", photoFile, "photo.jpg");
    }

    try {
      await dispatch(addStudent(fd)).unwrap();

      // Manually refetch students after adding
      dispatch(fetchStudents({
        page: currentPage,
        limit: 50,
        search: debouncedSearchTerm,
        classId: filterClass
      }));
      setLastFetchKey(""); // Reset so it refetches

      stopCamera();
      setPhotoFile(null);
      setPhotoPreview(null);
      setIsAddModalOpen(false);
      setFormData({
        studentId: "",
        name: "",
        guardianName: "",
        classId: "",
        gender: "",
        guardianPhone: "",
        guardianCnic: "",
        address: "",
      });
      toast.success("Student added successfully!");
    } catch (error) {
      toast.error(
        error?.message || "Failed to add student."
      );
    }
  };

  const openAddModal = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setCameraOn(false);
    // Start from a clean form — otherwise fields left over from an Edit (which
    // reuses formData) would pre-fill the new student, including the ID.
    setFormData({
      studentId: "",
      name: "",
      guardianName: "",
      classId: "",
      gender: "",
      guardianPhone: "",
      guardianCnic: "",
      address: "",
    });
    setIsAddModalOpen(true);
  };

  const closeEditModal = () => {
    stopCamera();
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsEditModalOpen(false);
  };

  const openDeleteModal = (id) => {
    setStudentToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
  };


  // Print the currently open student ID card.
  const handlePrintCard = () => {
    const cardHtml = document.getElementById("printable-student-card")?.outerHTML;
    if (!cardHtml) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Card</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 8mm; display: flex; justify-content: center; font-family: 'Poppins', sans-serif; }
            @page { size: auto; margin: 6mm; }
          </style>
        </head>
        <body>${cardHtml}
          <script>window.onload=function(){setTimeout(()=>{window.print();window.close();},400);};</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Reusable photo picker (upload OR live camera) used by both Add and Edit modals.
  const photoBlock = (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <FaCamera className="text-blue-600" />
        Photo <span className="text-xs font-normal text-gray-400">(optional)</span>
      </label>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full border-2 border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50 shrink-0">
          {photoPreview ? (
            <img src={photoPreview} alt="Student" className="w-full h-full object-cover" />
          ) : (
            <FaUser className="text-gray-300 text-3xl" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
            >
              <FaImage /> Upload
            </button>
            <button
              type="button"
              onClick={() => (cameraOn ? stopCamera() : startCamera())}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
            >
              <FaCamera /> {cameraOn ? "Stop" : "Use Camera"}
            </button>
            {photoPreview && (
              <button
                type="button"
                onClick={clearPhoto}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
              >
                <FaTrash /> Remove
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
      {cameraOn && (
        <div className="mt-3 flex flex-col items-center gap-2">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-w-xs rounded-xl border-2 border-gray-200 bg-black"
          />
          <button
            type="button"
            onClick={capturePhoto}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#2F5DAA] hover:bg-[#1E3F72] rounded-lg transition-all"
          >
            <FaCamera /> Capture
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      
      <div className="max-w-7xl 2xl:max-w-full mx-auto animate-fadeIn">
        {status === "loading" ? (
          <>
            <div className="glass-card p-4 mb-5 animate-pulse">
              <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
            </div>
            <SkeletonTable />
          </>
        ) : (
          <>
            {/* Stats and Actions Bar */}
            <div className="glass-card p-4 mb-5 border border-gray-100">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Total Students Card */}
                <div 
                  className="px-6 py-3 rounded-xl shadow-sm transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
                  }}
                >
                  <p className="text-lg font-bold text-white">
                    📚 {filterClass
                      ? `Students: ${pagination.total || filteredStudentsCount}`
                      : `Total Students: ${pagination.total || totalStudents}`}
                  </p>
                </div>

                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer" onClick={handleSearch} />
                    <input
                      type="text"
                      placeholder="Search by name, ID, or phone... (Press Enter)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
                    />
                  </div>
                  <select
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm bg-white"
                  >
                    <option value="">Filter by Class</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.grade} - {cls.section}
                      </option>
                    ))}
                  </select>
                  {/* Outside the !isTeacher guard: a teacher can already read
                      their own classes' roster on screen, and the export is
                      scoped to exactly those, so it hands them nothing new. */}
                  <button
                    onClick={() => setIsExportOpen(true)}
                    className="flex items-center justify-center bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-300"
                    title="Export students to Excel, CSV or PDF"
                  >
                    <FaDownload className="mr-2 text-blue-600" />
                    Export
                  </button>
                  {canWrite && (
                    <>
                      {canImport && (
                        <button
                          onClick={() => setIsImportOpen(true)}
                          className="flex items-center justify-center bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-300"
                          title="Import students from an Excel or CSV file"
                        >
                          <FaFileExcel className="mr-2 text-green-600" />
                          Import
                        </button>
                      )}
                      <button
                        onClick={openAddModal}
                        className="flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border-0"
                      >
                        <FaPlus className="mr-2" />
                        Add Student
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Table Card */}
            <div className="glass-card overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
              <table className="min-w-full bg-transparent">
                <thead 
                  style={{
                    background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
                  }}
                  className="text-white"
                >
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Photo
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Roll Number
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Guardian
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Parent Login
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Class & Section
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Student Card
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr
                      key={student.studentId}
                      className={`${
                        index % 2 === 0 ? "bg-white/40" : "bg-white/20"
                      } hover:bg-blue-100/40 transition-all duration-200`}
                    >
                      <td className="px-6 py-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                          {student.photo ? (
                            <img
                              src={`${API_BASE_URL}${student.photo}`}
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FaUser className="text-gray-300" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <span
                          className="px-3 py-1.5 rounded-full font-semibold"
                          style={{
                            background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)',
                            color: 'white'
                          }}
                        >
                          {student.rollNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-semibold">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {student.guardianName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <span
                          className="px-3 py-1.5 rounded-full font-medium"
                          style={{
                            background: student.gender === "Male"
                              ? 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
                              : 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)',
                            color: 'white'
                          }}
                        >
                          {student.gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {student.guardianPhone}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex justify-center">
                          {!canSeeParentCreds ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            <button
                              onClick={() => setCredStudent(student)}
                              title="View Parent Login"
                              className="p-2.5 rounded-lg transition-all duration-300 hover:scale-110 shadow-sm"
                              style={{
                                background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)'
                              }}
                            >
                              <FaKey className="text-white" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {student.classId ? (
                          <span 
                            className="px-3 py-1.5 rounded-full font-semibold"
                            style={{
                              background: 'linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)',
                              color: 'white'
                            }}
                          >
                            {student.classId.grade} - {student.classId.section}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex justify-center">
                          <button
                            onClick={() => setCardStudent(student)}
                            title="View Student Card"
                            className="p-2.5 rounded-lg transition-all duration-300 hover:scale-110 shadow-sm"
                            style={{
                              background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
                            }}
                          >
                            <FaEye className="text-white" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {student.status === "blocked" ? (
                          <span className="px-3 py-1.5 rounded-full font-semibold bg-red-100 text-red-700 border border-red-200">
                            Blocked
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-full font-semibold bg-green-100 text-green-700 border border-green-200">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {canChangeStatus && (
                            <button
                              className="p-2.5 rounded-lg transition-all duration-300 hover:scale-110 shadow-sm"
                              style={{
                                background:
                                  student.status === "blocked"
                                    ? "linear-gradient(135deg, #16A34A 0%, #22C55E 100%)"
                                    : "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
                              }}
                              title={
                                student.status === "blocked"
                                  ? "Unblock student"
                                  : "Block student"
                              }
                              onClick={() => setStatusTarget(student)}
                            >
                              {student.status === "blocked" ? (
                                <FaCheckCircle className="text-white" />
                              ) : (
                                <FaBan className="text-white" />
                              )}
                            </button>
                          )}
                          {canWrite && (
                            <>
                              <button
                                className="p-2.5 rounded-lg transition-all duration-300 hover:scale-110 shadow-sm"
                                style={{
                                  background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
                                }}
                                onClick={() => handleEdit(student)}
                              >
                                <FaEdit className="text-white" />
                              </button>
                              <button
                                className="p-2.5 rounded-lg transition-all duration-300 hover:scale-110 shadow-sm"
                                style={{
                                  background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
                                }}
                                onClick={() => openDeleteModal(student.studentId)}
                              >
                                <FaTrash className="text-white" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="glass-card px-6 py-4 mt-5 flex justify-center items-center gap-4">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300 disabled:hover:shadow-none font-medium"
                >
                  Previous
                </button>
                
                <div className="flex gap-2">
                  {[...Array(pagination.pages)].map((_, index) => {
                    const pageNum = index + 1;
                    // Show first, last, current, and adjacent pages
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.pages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                            currentPage === pageNum
                              ? 'text-white shadow-lg'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                          style={currentPage === pageNum ? {
                            background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
                          } : {}}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={currentPage === pagination.pages}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-300 disabled:hover:shadow-none font-medium"
                >
                  Next
                </button>

                <span className="text-gray-600 ml-4 font-medium">
                  Page {currentPage} of {pagination.pages} ({pagination.total} students)
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div
              className="p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
              }}
            >
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FaUserPlus className="text-2xl" />
                Add New Student
              </h2>
            </div>
            <form onSubmit={handleAdd} className="p-6">
              {/* Two-column field grid; wide inputs (help text, photo) can span
                  both via sm:col-span-2. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
              <div className="mb-4 sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MdNumbers className="text-blue-600" />
                  Student ID
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData({ ...formData, studentId: e.target.value })
                  }
                  required
                  placeholder="e.g. 10234 or LHR-10234"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                />
                <p className="mt-1 text-xs text-gray-400">
                  The student's admission number. Must be unique — it also becomes
                  their parent login.
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaUser className="text-blue-600" />
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaUserTie className="text-blue-600" />
                  Guardian Name
                </label>
                <input
                  type="text"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={(e) =>
                    setFormData({ ...formData, guardianName: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MdSchool className="text-blue-600" />
                  Class
                </label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={(e) =>
                    setFormData({ ...formData, classId: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.grade} - {cls.section}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <BiSolidUserDetail className="text-blue-600" />
                  Gender
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={formData.gender === "Male"}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      required
                      className="mr-2 w-4 h-4 text-blue-600"
                    />
                    <FaMale className="mr-1 text-blue-600" />
                    <span className="text-gray-700">Male</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={formData.gender === "Female"}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      required
                      className="mr-2 w-4 h-4 text-blue-600"
                    />
                    <FaFemale className="mr-1 text-pink-600" />
                    <span className="text-gray-700">Female</span>
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaPhone className="text-blue-600" />
                  Guardian Phone
                </label>
                <input
                  type="text"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      guardianPhone: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaIdCard className="text-blue-600" />
                  Guardian CNIC
                </label>
                <input
                  type="text"
                  name="guardianCnic"
                  inputMode="numeric"
                  maxLength={15}
                  value={formData.guardianCnic}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      guardianCnic: e.target.value.replace(/[^0-9-]/g, ""),
                    })
                  }
                  placeholder="e.g. 3310402314266 or 33104-2314266-7"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                />
              </div>
              <div className="mb-4 sm:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaHome className="text-blue-600" />
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                />
              </div>
              </div>
              {photoBlock}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)'
                  }}
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div 
              className="p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
              }}
            >
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FaEdit className="text-2xl" />
                Edit Student
              </h2>
            </div>
            <form onSubmit={handleUpdate} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaUser className="text-blue-600" />
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaUserTie className="text-blue-600" />
                  Guardian Name
                </label>
                <input
                  type="text"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={(e) =>
                    setFormData({ ...formData, guardianName: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <MdSchool className="text-blue-600" />
                  Class
                </label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={(e) =>
                    setFormData({ ...formData, classId: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.grade} - {cls.section}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <BiSolidUserDetail className="text-blue-600" />
                  Gender
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={formData.gender === "Male"}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      required
                      className="mr-2 w-4 h-4 text-blue-600"
                    />
                    <FaMale className="mr-1 text-blue-600" />
                    <span className="text-gray-700">Male</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={formData.gender === "Female"}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      required
                      className="mr-2 w-4 h-4 text-blue-600"
                    />
                    <FaFemale className="mr-1 text-pink-600" />
                    <span className="text-gray-700">Female</span>
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaPhone className="text-blue-600" />
                  Guardian Phone
                </label>
                <input
                  type="text"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      guardianPhone: e.target.value,
                    })
                  }
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaIdCard className="text-blue-600" />
                  Guardian CNIC
                </label>
                <input
                  type="text"
                  name="guardianCnic"
                  inputMode="numeric"
                  maxLength={15}
                  value={formData.guardianCnic}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      guardianCnic: e.target.value.replace(/[^0-9-]/g, ""),
                    })
                  }
                  placeholder="e.g. 3310402314266 or 33104-2314266-7"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FaHome className="text-blue-600" />
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                />
              </div>
              {photoBlock}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-6 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
                  }}
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Block / unblock confirmation. Blocking cuts off the parent's portal
          access, so it is worth a confirm step rather than a bare toggle. */}
      {statusTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fadeIn">
            <div
              className="p-6 rounded-t-2xl"
              style={{
                background:
                  statusTarget.status === "blocked"
                    ? "linear-gradient(135deg, #16A34A 0%, #22C55E 100%)"
                    : "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
              }}
            >
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {statusTarget.status === "blocked" ? (
                  <>
                    <FaCheckCircle /> Unblock Student
                  </>
                ) : (
                  <>
                    <FaBan /> Block Student
                  </>
                )}
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-2">
                <strong>{statusTarget.name}</strong> ({statusTarget.studentId})
              </p>
              <p className="text-gray-600 mb-6">
                {statusTarget.status === "blocked"
                  ? "Their parent will be able to log in to the portal again."
                  : "Their parent will no longer be able to log in to the portal. All records are kept."}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStatusTarget(null)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStatusChange}
                  disabled={statusSaving}
                  className="px-6 py-2.5 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:opacity-60"
                  style={{
                    background:
                      statusTarget.status === "blocked"
                        ? "linear-gradient(135deg, #16A34A 0%, #22C55E 100%)"
                        : "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
                  }}
                >
                  {statusSaving
                    ? "Saving..."
                    : statusTarget.status === "blocked"
                    ? "Unblock"
                    : "Block"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fadeIn">
            <div
              className="p-6 rounded-t-2xl"
              style={{
                background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
              }}
            >
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <MdDelete className="text-2xl" />
                Delete Student
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 text-lg mb-6 flex items-start gap-2">
                <span className="text-red-500 text-2xl">⚠</span>
                <span>Are you sure you want to delete this student? This action cannot be undone.</span>
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-6 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-6 py-2.5 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parent Credentials Modal */}
      {credStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fadeIn overflow-hidden">
            <div
              className="flex items-center justify-between px-6 py-4 text-white"
              style={{ background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)' }}
            >
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FaKey /> Parent Login Credentials
              </h2>
              <button onClick={closeCredModal} className="text-white/80 hover:text-white text-xl font-bold">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <FaUser className="text-[#2F5DAA] text-lg" />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Student Name</p>
                  <p className="text-gray-800 font-semibold">{credStudent.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <span className="text-[#2F5DAA] text-lg font-bold">@</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <p className="text-gray-800 font-semibold break-all">{credStudent.parentEmail || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                <FaKey className="text-amber-600 text-lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Password</p>
                  <p className="text-gray-800 font-semibold tracking-widest">{credStudent.parentPassword || "N/A"}</p>
                </div>
              </div>
              {(!credStudent.parentEmail || !credStudent.parentPassword) && (
                <p className="text-xs text-red-500 text-center">Parent account was not created for this student. This may be an older record.</p>
              )}

              {/* Reset is a two-step action: the current password stops working
                  the instant it runs, so the parent must be told the new one. */}
              {confirmReset ? (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl space-y-3">
                  <p className="text-sm text-red-700">
                    The current password will stop working immediately. Make sure
                    you can pass the new one to the parent.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setConfirmReset(false)}
                      disabled={resettingCreds}
                      className="px-4 py-2 text-sm text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleResetParentPassword}
                      disabled={resettingCreds}
                      className="px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)" }}
                    >
                      {resettingCreds ? "Resetting..." : "Yes, reset it"}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-between items-center gap-2 pt-2">
                <div className="flex gap-2">
                  {credStudent.parentEmail && !confirmReset && (
                    <>
                      {!isReadOnly && (
                        <button
                          onClick={() => setConfirmReset(true)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl font-medium transition-colors"
                        >
                          <FaRedo /> Reset Password
                        </button>
                      )}
                      <button
                        onClick={copyCredentials}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                      >
                        <FaCopy /> Copy
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={closeCredModal}
                  className="px-6 py-2.5 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student ID Card Modal */}
      {cardStudent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm animate-fadeIn overflow-hidden">
            <div
              className="flex items-center justify-between px-6 py-4 text-white"
              style={{ background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)' }}
            >
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FaEye /> Student Card
              </h2>
              <button onClick={() => setCardStudent(null)}>
                <MdDelete className="text-xl" />
              </button>
            </div>
            <div className="p-6 flex flex-col items-center gap-4 bg-gray-50">
              <StudentCard student={cardStudent} />
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setCardStudent(null)}
                  className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-all"
                >
                  Close
                </button>
                <button
                  onClick={handlePrintCard}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl font-medium transition-all"
                  style={{ background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)' }}
                >
                  <FaPrint /> Print Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isImportOpen && (
        <ImportStudentsModal
          onClose={() => setIsImportOpen(false)}
          onImported={() => {
            // An import can add students and create classes, so both lists are
            // refetched rather than patched in place.
            dispatch(
              fetchStudents({
                page: currentPage,
                limit: 50,
                search: debouncedSearchTerm,
                classId: filterClass,
              })
            );
            dispatch(fetchClasses());
          }}
        />
      )}
      {isExportOpen && (
        <ExportStudentsModal
          classes={classes}
          // Whatever class the page is already filtered to is the one the user
          // is looking at, so it is the sensible default to export.
          initialClassId={filterClass}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  );
};

export default Students;
