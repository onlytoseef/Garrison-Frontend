import React, { useEffect, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchClasses,
  addClass,
  deleteClass,
  updateClass,
  fetchClassById,
} from "../../store/slices/classSlice";
import { FaPlus, FaTrash, FaEdit, FaEye, FaPrint, FaBook, FaDoorOpen, FaUserTie, FaGraduationCap, FaUsers, FaUserGraduate, FaArrowRight, FaCheckCircle, FaTimesCircle, FaWhatsapp, FaChalkboardTeacher } from "react-icons/fa";
import { MdDelete, MdClass, MdSchool } from "react-icons/md";
import ClassPrint from "../components/ClassPrint";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import toast from "react-hot-toast";

// What the bulk importer writes into room number and in-charge, since a
// spreadsheet of students does not carry either. Kept in sync with
// backend/controllers/studentImportController.js.
const PLACEHOLDER = "—";

const Classess = () => {
  const dispatch = useDispatch();
  const { classes, selectedClass, loading } = useSelector(
    (state) => state.classes
  );
  // Teachers get a read-only view: they may open a class to see its students and
  // data, but every mutating control (add / edit / delete / promote / WhatsApp)
  // is hidden. The API refuses them regardless; this keeps the screen honest.
  const { user } = useSelector((state) => state.auth);
  const isTeacher = user?.role === "teacher";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [classDetailsModal, setClassDetailsModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  // Class being edited. Imported classes arrive with placeholder room and
  // in-charge values, and this is where they get filled in.
  const [editClass, setEditClass] = useState(null);
  const [editForm, setEditForm] = useState({ grade: "", section: "", roomNumber: "", inCharge: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [whatsappModal, setWhatsappModal] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [whatsappTarget, setWhatsappTarget] = useState(null);
  const [whatsappSending, setWhatsappSending] = useState(false);
  // Teachers-schedule modal: which class, its data, and the in-flight flag.
  const [scheduleModal, setScheduleModal] = useState(null);
  const [scheduleData, setScheduleData] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [formData, setFormData] = useState({
    grade: "",
    section: "",
    roomNumber: "",
    inCharge: "",
  });

  // Promote state
  const [promoteModal, setPromoteModal] = useState(false);
  const [sourceClassId, setSourceClassId] = useState("");
  const [destClassId, setDestClassId] = useState("");
  const [promoteStudents, setPromoteStudents] = useState([]);
  const [excludedIds, setExcludedIds] = useState([]);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchClasses());
  }, [dispatch]);

  const openAddModal = async () => {
    setIsModalOpen(true);
    try {
      const res = await axios.get(API_ENDPOINTS.STAFF);
      setTeachers((res.data.staff || res.data || []).filter((s) => s.role === "teacher"));
    } catch {
      setTeachers([]);
    }
  };

  const handleAddClass = () => {
    dispatch(addClass(formData));
    setIsModalOpen(false);
    setFormData({
      grade: "",
      section: "",
      roomNumber: "",
      inCharge: "",
    });
  };

  const handleDeleteClass = () => {
    dispatch(deleteClass(deleteId));
    setDeleteModal(false);
  };

  const openEditModal = async (cls) => {
    setEditClass(cls);
    setEditForm({
      grade: cls.grade || "",
      section: cls.section || "",
      // Imported classes carry a placeholder here rather than a real value.
      // Showing it in the input would make the user delete it before typing.
      roomNumber: cls.roomNumber === PLACEHOLDER ? "" : cls.roomNumber || "",
      inCharge: cls.inCharge === PLACEHOLDER ? "" : cls.inCharge || "",
    });
    try {
      const res = await axios.get(API_ENDPOINTS.STAFF);
      setTeachers((res.data.staff || res.data || []).filter((s) => s.role === "teacher"));
    } catch {
      setTeachers([]);
    }
  };

  const handleUpdateClass = async () => {
    if (!editForm.grade.trim() || !editForm.section.trim()) {
      toast.error("Class and section are required");
      return;
    }

    setEditSaving(true);
    try {
      await dispatch(
        updateClass({
          id: editClass._id,
          data: {
            grade: editForm.grade.trim(),
            section: editForm.section.trim(),
            roomNumber: editForm.roomNumber.trim(),
            inCharge: editForm.inCharge.trim(),
          },
        })
      ).unwrap();
      toast.success("Class updated");
      setEditClass(null);
    } catch (err) {
      toast.error(err?.message || "Failed to update class");
    } finally {
      setEditSaving(false);
    }
  };

  const handleViewClass = (id) => {
    dispatch(fetchClassById(id)).then(() => {
      setClassDetailsModal(true);
    });
  };

  // Open the teachers-schedule modal for a class and load its subject→teacher
  // mapping. The modal opens immediately with a spinner; a load failure closes
  // it with a toast rather than leaving an empty shell.
  const openScheduleModal = async (cls) => {
    setScheduleModal(cls);
    setScheduleData(null);
    setScheduleLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.CLASS_SCHEDULE(cls._id));
      setScheduleData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load schedule");
      setScheduleModal(null);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleOpenWhatsAppModal = (cls) => {
    setWhatsappTarget(cls);
    setWhatsappMessage("");
    setWhatsappModal(true);
  };

  const handleSendWhatsApp = async () => {
    if (!whatsappTarget?._id) return;
    if (!whatsappMessage.trim()) {
      toast.error("Please enter an announcement message");
      return;
    }

    setWhatsappSending(true);
    try {
      const res = await axios.post(API_ENDPOINTS.WHATSAPP_CLASS_MESSAGE, {
        classId: whatsappTarget._id,
        message: whatsappMessage.trim(),
        delayMs: 3000,
      });

      toast.success(`Sent ${res.data.sent}/${res.data.total} messages`);
      setWhatsappModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send WhatsApp message");
    } finally {
      setWhatsappSending(false);
    }
  };

  // Load students preview when source class changes
  const handleSourceClassChange = async (classId) => {
    setSourceClassId(classId);
    setExcludedIds([]);
    setPromoteStudents([]);
    if (!classId) return;

    setPreviewLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.CLASS(classId));
      setPromoteStudents(res.data.students || []);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleStudentExclusion = (studentId) => {
    setExcludedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handlePromote = async () => {
    if (!sourceClassId || !destClassId) {
      toast.error("Select both source and destination class");
      return;
    }
    if (sourceClassId === destClassId) {
      toast.error("Source and destination class cannot be the same");
      return;
    }
    const eligibleCount = promoteStudents.length - excludedIds.length;
    if (eligibleCount === 0) {
      toast.error("No students selected to promote");
      return;
    }

    setPromoteLoading(true);
    try {
      const res = await axios.post(API_ENDPOINTS.PROMOTE_STUDENTS, {
        sourceClassId,
        destinationClassId: destClassId,
        keepRollNumbers: true,
        excludeStudents: excludedIds,
      });
      toast.success(res.data.message);
      setPromoteModal(false);
      setSourceClassId("");
      setDestClassId("");
      setPromoteStudents([]);
      setExcludedIds([]);
      dispatch(fetchClasses());
    } catch (err) {
      toast.error(err.response?.data?.message || "Promotion failed");
    } finally {
      setPromoteLoading(false);
    }
  };
  const handlePrint = () => {
    if (!selectedClass) {
      console.error("No selected class data to print");
      return;
    }

    // Create a hidden div for printing
    const printContainer = document.createElement("div");
    printContainer.style.position = "fixed";
    printContainer.style.left = "-1000px";
    printContainer.style.top = "0";
    printContainer.id = "print-container";
    document.body.appendChild(printContainer);

    // Render the component to the hidden div
    const root = createRoot(printContainer);
    root.render(<ClassPrint classData={selectedClass} />);

    // Wait for content to render
    setTimeout(() => {
      // Get the HTML content
      const printContent = document.getElementById("print-container").innerHTML;

      // Remove the temporary container
      document.body.removeChild(printContainer);

      // Create print styles
      const printStyles = `
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            width: 210mm;
            height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
            font-family: Arial, sans-serif;
          }
          table {
            width: 100% !important;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #000;
            padding: 5px;
          }
        </style>
      `;

      // Open print dialog directly
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Class Details - ${selectedClass.grade} ${selectedClass.section}</title>
            ${printStyles}
          </head>
          <body>
            ${printContent}
            <script>
              // Automatically trigger print when content loads
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 200);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }, 200);
  };

  const groupedClasses = useMemo(() => {
    const map = {};
    classes.forEach((cls) => {
      const g = cls.grade ?? "Other";
      if (!map[g]) map[g] = [];
      map[g].push(cls);
    });
    // sort sections within each grade
    Object.values(map).forEach((arr) =>
      arr.sort((x, y) => String(x.section ?? "").localeCompare(String(y.section ?? "")))
    );
    // sort grades ascending (numeric-aware, e.g. 1, 2, 10)
    return Object.entries(map).sort(([a], [b]) => {
      const na = parseFloat(a), nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      if (!isNaN(na)) return -1;
      if (!isNaN(nb)) return 1;
      return String(a).localeCompare(String(b));
    });
  }, [classes]);

  return (
    <div className="min-h-screen bg-white p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl 2xl:max-w-full mx-auto animate-fadeIn">
        {/* Header */}
        <div className="glass-card p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 sm:p-3 rounded-xl">
                <MdClass className="text-2xl sm:text-3xl text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Classes Management</h2>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">Manage all school classes</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {isTeacher ? (
                <span className="text-xs sm:text-sm text-gray-400 self-center">
                  View only
                </span>
              ) : (
                <>
                  <button
                    onClick={() => setPromoteModal(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)'
                    }}
                  >
                    <FaArrowRight className="text-base sm:text-lg" />
                    Promote Students
                  </button>
                  <button
                    onClick={() => openAddModal()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 text-white px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl font-medium transition-all duration-300 hover:scale-105 shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
                    }}
                  >
                    <FaPlus className="text-base sm:text-lg" />
                    Add New Class
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="glass-card p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div 
              className="p-3 sm:p-4 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
              }}
            >
              <MdSchool className="text-2xl sm:text-3xl text-white" />
            </div>
            <div>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Total Classes</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">{classes.length}</p>
            </div>
          </div>
        </div>

        {/* Classes grouped by grade */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
          </div>
        ) : classes.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="inline-block p-6 bg-blue-100 rounded-full mb-4">
              <MdClass className="text-6xl text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No Classes Found</h3>
            <p className="text-gray-600 mb-6">
              {isTeacher
                ? "You have not been assigned to any classes yet."
                : "Get started by adding your first class"}
            </p>
            {!isTeacher && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)' }}
              >
                <FaPlus />
                Add Your First Class
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {groupedClasses.map(([grade, sections]) => (
              <div key={grade}>
                {/* Grade heading */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)' }}>
                    <FaGraduationCap className="text-white text-lg" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Grade {grade}</h3>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {sections.length} {sections.length === 1 ? "section" : "sections"}
                  </span>
                  <div className="flex-1 h-px bg-gray-200 ml-2" />
                </div>

                {/* Sections grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                  {sections.map((cls, index) => (
                    <div
                      key={cls._id}
                      className="glass-card hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:-translate-y-1"
                    >
                      <div
                        className="p-4"
                        style={{
                          background: index % 4 === 3
                            ? 'linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)'
                            : index % 4 === 2
                            ? 'linear-gradient(135deg, #1E3F72 0%, #6C8BC4 100%)'
                            : 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
                        }}
                      >
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-2">
                            <FaGraduationCap className="text-2xl" />
                            <h3 className="text-xl font-bold">
                              {cls.grade} - {cls.section}
                            </h3>
                          </div>
                          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                            <span className="text-sm font-semibold">{cls.studentCount || 0} Students</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-3 text-gray-700">
                          <FaDoorOpen className="text-blue-600" />
                          <span className="text-sm"><strong>Room:</strong> {cls.roomNumber}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                          <FaUserTie className="text-blue-600" />
                          <span className="text-sm"><strong>In-charge:</strong> {cls.inCharge}</span>
                        </div>

                        {/* Teachers schedule — who teaches which subject in this
                            class. Open to every role that can see the card. */}
                        <button
                          onClick={() => openScheduleModal(cls)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium text-sm border-2 border-blue-100 text-blue-700 hover:bg-blue-50 transition-all duration-300"
                        >
                          <FaChalkboardTeacher />
                          Teachers Schedule
                        </button>

                        <div className="flex gap-2 pt-3 border-t border-gray-100">
                          <button
                            onClick={() => handleViewClass(cls._id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-105 text-white"
                            style={{ background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)' }}
                          >
                            <FaEye />
                            View
                          </button>
                          {!isTeacher && (
                            <>
                              <button
                                onClick={() => openEditModal(cls)}
                                title="Edit room and in-charge"
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-110 text-white"
                                style={{ background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)' }}
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => { setDeleteId(cls._id); setDeleteModal(true); }}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-110 text-white"
                                style={{ background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)' }}
                              >
                                <FaTrash />
                              </button>
                              <button
                                onClick={() => handleOpenWhatsAppModal(cls)}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 hover:scale-110 text-white"
                                style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
                              >
                                <FaWhatsapp />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Class Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fadeIn">
              <div 
                className="p-6 rounded-t-2xl"
                style={{
                  background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
                }}
              >
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FaPlus className="text-2xl" />
                  Add New Class
                </h2>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddClass();
                }}
                className="p-6"
              >
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaBook className="text-blue-600" />
                    Grade
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Grade (e.g., 1st, 2nd, KG)"
                    value={formData.grade}
                    onChange={(e) =>
                      setFormData({ ...formData, grade: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaGraduationCap className="text-blue-600" />
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Section (e.g., A, B, C)"
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaDoorOpen className="text-blue-600" />
                    Room Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Room Number"
                    value={formData.roomNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, roomNumber: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaUserTie className="text-blue-600" />
                    In-charge Name
                  </label>
                  <select
                    value={formData.inCharge}
                    onChange={(e) =>
                      setFormData({ ...formData, inCharge: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all duration-300"
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((t) => (
                      <option key={t._id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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
                    Add Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Class Modal — the way a room number and in-charge get filled in
            on classes the bulk importer created with placeholders. */}
        {editClass && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fadeIn">
              <div
                className="p-6 rounded-t-2xl"
                style={{
                  background: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)'
                }}
              >
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FaEdit className="text-2xl" />
                  Edit Class
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  {editClass.grade} - {editClass.section}
                </p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateClass();
                }}
                className="p-6"
              >
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaBook className="text-amber-600" />
                    Grade
                  </label>
                  <input
                    type="text"
                    value={editForm.grade}
                    onChange={(e) =>
                      setEditForm({ ...editForm, grade: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-amber-500 rounded-xl outline-none transition-all duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaGraduationCap className="text-amber-600" />
                    Section
                  </label>
                  <input
                    type="text"
                    value={editForm.section}
                    onChange={(e) =>
                      setEditForm({ ...editForm, section: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-amber-500 rounded-xl outline-none transition-all duration-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaDoorOpen className="text-amber-600" />
                    Room Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Room Number"
                    value={editForm.roomNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, roomNumber: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-amber-500 rounded-xl outline-none transition-all duration-300"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FaUserTie className="text-amber-600" />
                    In-charge Name
                  </label>
                  <select
                    value={editForm.inCharge}
                    onChange={(e) =>
                      setEditForm({ ...editForm, inCharge: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-amber-500 rounded-xl outline-none transition-all duration-300"
                  >
                    <option value="">Select Teacher</option>
                    {/* A class imported before its teacher was added to staff can
                        hold a name that is not in the dropdown. Without this the
                        select would silently blank it out on save. */}
                    {editForm.inCharge &&
                      !teachers.some((t) => t.name === editForm.inCharge) && (
                        <option value={editForm.inCharge}>
                          {editForm.inCharge}
                        </option>
                      )}
                    {teachers.map((t) => (
                      <option key={t._id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditClass(null)}
                    disabled={editSaving}
                    className="px-6 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="px-6 py-2.5 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)'
                    }}
                  >
                    {editSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Class Details Modal */}
        {classDetailsModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
              <div
                className="p-6 rounded-t-2xl flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
                }}
              >
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FaEye className="text-2xl" />
                  Class Details
                </h2>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                  </div>
                ) : selectedClass ? (
                  <>
                    {/* Class Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-500 p-3 rounded-lg">
                            <FaBook className="text-white text-xl" />
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm font-medium">Grade</p>
                            <p className="text-2xl font-bold text-gray-800">{selectedClass.grade}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-pink-50 to-red-50 p-4 rounded-xl border-2 border-pink-200">
                        <div className="flex items-center gap-3">
                          <div className="bg-pink-500 p-3 rounded-lg">
                            <FaGraduationCap className="text-white text-xl" />
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm font-medium">Section</p>
                            <p className="text-2xl font-bold text-gray-800">{selectedClass.section}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border-2 border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-500 p-3 rounded-lg">
                            <FaDoorOpen className="text-white text-xl" />
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm font-medium">Room</p>
                            <p className="text-2xl font-bold text-gray-800">{selectedClass.roomNumber}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="bg-green-500 p-3 rounded-lg">
                            <FaUserTie className="text-white text-xl" />
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm font-medium">In-charge</p>
                            <p className="text-xl font-bold text-gray-800">{selectedClass.inCharge}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border-2 border-orange-200 md:col-span-2">
                        <div className="flex items-center gap-3">
                          <div className="bg-orange-500 p-3 rounded-lg">
                            <FaUsers className="text-white text-xl" />
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm font-medium">Total Students</p>
                            <p className="text-2xl font-bold text-gray-800">{selectedClass.students?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Students Table */}
                    <div className="glass-card border-2 border-white/50 overflow-hidden">
                      <div 
                        className="px-6 py-4"
                        style={{
                          background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
                        }}
                      >
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <FaUserGraduate className="text-xl" />
                          Students List
                        </h3>
                      </div>

                      <div className="max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Roll No
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Student ID
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Gender
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200/50 bg-transparent">
                            {selectedClass.students && selectedClass.students.length > 0 ? (
                              selectedClass.students.map((student, index) => (
                                <tr key={student._id} className={index % 2 === 0 ? "bg-white/40" : "bg-white/20"}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-3 py-1 text-sm font-semibold text-white rounded-lg"
                                      style={{
                                        background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)'
                                      }}
                                    >
                                      {student.rollNumber || "N/A"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {student.studentId}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                    {student.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                                      student.gender === 'Male' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-pink-100 text-pink-800'
                                    }`}>
                                      {student.gender}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="4" className="px-6 py-12 text-center">
                                  <div className="flex flex-col items-center gap-3">
                                    <FaUserGraduate className="text-6xl text-gray-300" />
                                    <p className="text-gray-500 font-medium">No students found in this class</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-700 text-center py-8">No class details available.</p>
                )}
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-2.5 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #1E3F72 0%, #6C8BC4 100%)'
                    }}
                  >
                    <FaPrint />
                    Print
                  </button>
                  <button
                    onClick={() => setClassDetailsModal(false)}
                    className="px-6 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Teachers Schedule Modal */}
        {scheduleModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
              <div
                className="p-6 rounded-t-2xl flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)' }}
              >
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FaChalkboardTeacher className="text-2xl" />
                  Teachers Schedule
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  Class {scheduleModal.grade} - {scheduleModal.section}
                </p>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                {scheduleLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                  </div>
                ) : scheduleData ? (
                  <>
                    {/* In-charge — the whole-class owner, shown on its own. */}
                    <div className="mb-5 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-500 p-2.5 rounded-lg shrink-0">
                          <FaUserTie className="text-white text-lg" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Class In-charge
                          </p>
                          {scheduleData.incharges && scheduleData.incharges.length > 0 ? (
                            <p className="text-base font-bold text-gray-800">
                              {scheduleData.incharges.join(", ")}
                            </p>
                          ) : (
                            <p className="text-sm font-medium text-amber-600">
                              No in-charge assigned
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Subject -> teacher list. Every subject the class offers is
                        listed; an empty one reads "Teacher not assigned". */}
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Subjects
                    </p>
                    {scheduleData.subjects && scheduleData.subjects.length > 0 ? (
                      <div className="space-y-2">
                        {scheduleData.subjects.map((s) => {
                          const assigned = s.teachers && s.teachers.length > 0;
                          return (
                            <div
                              key={s.subjectName}
                              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 bg-white"
                            >
                              <span className="flex items-center gap-2 text-sm font-semibold text-gray-800 min-w-0">
                                <FaBook className="text-blue-600 shrink-0" />
                                <span className="truncate">{s.subjectName}</span>
                              </span>
                              {assigned ? (
                                <span className="flex items-center gap-1.5 text-sm text-gray-700 text-right">
                                  <FaChalkboardTeacher className="text-green-600 shrink-0" />
                                  {s.teachers.join(", ")}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-red-500 shrink-0">
                                  <FaTimesCircle />
                                  Teacher not assigned
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FaBook className="text-4xl mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No subjects set for this class yet.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-700 text-center py-8">No schedule available.</p>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 flex justify-end flex-shrink-0">
                <button
                  onClick={() => setScheduleModal(null)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
            <div className="glass-card w-full max-w-md animate-fadeIn">
              <div
                className="p-6 rounded-t-2xl"
                style={{
                  background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
                }}
              >
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <MdDelete className="text-2xl" />
                  Confirm Delete
                </h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700 text-lg mb-6 flex items-start gap-2">
                  <span className="text-red-500 text-2xl">⚠</span>
                  <span>Are you sure you want to delete this class? This action cannot be undone.</span>
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteModal(false)}
                    className="px-6 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteClass}
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

        {/* WhatsApp Announcement Modal */}
        {whatsappModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeIn">
              <div
                className="p-6 rounded-t-2xl"
                style={{
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)'
                }}
              >
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FaWhatsapp className="text-2xl" />
                  WhatsApp Announcement
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  Class {whatsappTarget?.grade}-{whatsappTarget?.section}
                </p>
              </div>

              <div className="p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-emerald-500 rounded-xl outline-none transition-all duration-300"
                  placeholder="Type your announcement message here"
                />

                <div className="mt-3 text-xs text-gray-500">
                  Make sure WhatsApp Web is already logged in on this machine.
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setWhatsappModal(false)}
                    className="px-6 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                    disabled={whatsappSending}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendWhatsApp}
                    disabled={whatsappSending}
                    className="px-6 py-2.5 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)'
                    }}
                  >
                    {whatsappSending ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Promote Students Modal */}
        {promoteModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
              <div
                className="p-6 rounded-t-2xl"
                style={{
                  background: 'linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)'
                }}
              >
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FaArrowRight className="text-2xl" />
                  Promote Students
                </h2>
                <p className="text-white/80 text-sm mt-1">Move an entire class to the next grade</p>
              </div>

              <div className="p-6">
                {/* Source & Destination Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Source Class (From)
                    </label>
                    <select
                      value={sourceClassId}
                      onChange={(e) => handleSourceClassChange(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-emerald-500 rounded-xl outline-none transition-all duration-300"
                    >
                      <option value="">Select Source Class</option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.grade} - {cls.section} ({cls.studentCount || 0} students)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Destination Class (To)
                    </label>
                    <select
                      value={destClassId}
                      onChange={(e) => setDestClassId(e.target.value)}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-emerald-500 rounded-xl outline-none transition-all duration-300"
                    >
                      <option value="">Select Destination Class</option>
                      {classes
                        .filter((cls) => cls._id !== sourceClassId)
                        .map((cls) => (
                          <option key={cls._id} value={cls._id}>
                            {cls.grade} - {cls.section}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Preview Summary */}
                {sourceClassId && destClassId && promoteStudents.length > 0 && (
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 mb-4">
                    <p className="text-emerald-800 font-semibold text-sm">
                      <FaCheckCircle className="inline mr-1" />
                      {promoteStudents.length - excludedIds.length} of {promoteStudents.length} students will be promoted
                      {excludedIds.length > 0 && (
                        <span className="text-orange-600 ml-2">
                          ({excludedIds.length} excluded)
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Students Preview Table */}
                {previewLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-200 border-t-emerald-600"></div>
                  </div>
                ) : promoteStudents.length > 0 ? (
                  <div className="border-2 border-gray-100 rounded-xl overflow-hidden mb-6">
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-700 text-sm">Students Preview</h3>
                      <span className="text-xs text-gray-500">Uncheck to exclude (fail students)</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase w-12">
                              <input
                                type="checkbox"
                                checked={excludedIds.length === 0}
                                onChange={() => {
                                  if (excludedIds.length === 0) {
                                    setExcludedIds(promoteStudents.map(s => s._id));
                                  } else {
                                    setExcludedIds([]);
                                  }
                                }}
                                className="w-4 h-4 accent-emerald-600"
                              />
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Roll#</th>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">ID</th>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-600 uppercase">Name</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {promoteStudents.map((student) => {
                            const isExcluded = excludedIds.includes(student._id);
                            return (
                              <tr
                                key={student._id}
                                className={`cursor-pointer transition-colors ${isExcluded ? 'bg-red-50 opacity-60' : 'hover:bg-emerald-50'}`}
                                onClick={() => toggleStudentExclusion(student._id)}
                              >
                                <td className="px-4 py-2">
                                  <input
                                    type="checkbox"
                                    checked={!isExcluded}
                                    readOnly
                                    className="w-4 h-4 accent-emerald-600"
                                  />
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-700">
                                  {student.rollNumber || "—"}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-600">
                                  {student.studentId}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-800 font-medium">
                                  {student.name}
                                  {isExcluded && (
                                    <span className="ml-2 text-xs text-red-500 font-semibold">(Excluded)</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : sourceClassId ? (
                  <div className="text-center py-8 text-gray-500">
                    <FaUsers className="text-4xl mx-auto mb-2 text-gray-300" />
                    <p>No students in this class</p>
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setPromoteModal(false);
                      setSourceClassId("");
                      setDestClassId("");
                      setPromoteStudents([]);
                      setExcludedIds([]);
                    }}
                    className="px-6 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePromote}
                    disabled={!sourceClassId || !destClassId || promoteLoading || promoteStudents.length === 0}
                    className="px-6 py-2.5 text-white rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)'
                    }}
                  >
                    {promoteLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Promoting...
                      </>
                    ) : (
                      <>
                        <FaArrowRight />
                        Promote {promoteStudents.length - excludedIds.length} Students
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Classess;

