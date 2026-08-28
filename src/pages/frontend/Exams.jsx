import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchExams,
  addExam,
  publishExam,
  deleteExam,
} from "../../store/slices/examSlice";
import { fetchClasses } from "../../store/slices/classSlice";
import { toast } from "react-hot-toast";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaPen,
  FaListOl,
  FaCheckCircle,
  FaTimes,
  FaBook,
  FaFileExcel,
  FaDownload,
} from "react-icons/fa";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { isReadOnlyRole } from "../../utils/permissions";
import ResultImportModal from "../components/ResultImportModal";
import ResultExportModal from "../components/ResultExportModal";

const NAVY = "#2F5DAA";
const currentYear = new Date().getFullYear();

const emptySubject = () => ({
  subjectName: "",
  totalMarks: 100,
  passingMarks: 33,
});

const Exams = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { exams, loading } = useSelector((state) => state.exams);
  const { classes } = useSelector((state) => state.classes);
  // Teachers reach this page to enter marks for their own subject and view
  // results. Creating, publishing and deleting exams stay with the office, so
  // those controls are hidden (and the API refuses them anyway).
  const { user } = useSelector((state) => state.auth);
  const isTeacher = user?.role === "teacher";
  // A principal is read-only: they may open exams, enter-marks views and results
  // (reads), but Create / Publish / Delete are hidden. Teachers already are.
  const readOnly = isTeacher || isReadOnlyRole(user?.role);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterClass, setFilterClass] = useState("");
  const [filterYear, setFilterYear] = useState("");

  const [form, setForm] = useState({
    name: "",
    academicYear: currentYear,
    classId: "",
    examType: "midterm",
    subjects: [emptySubject()],
  });
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchExams());
    if (classes.length === 0) dispatch(fetchClasses());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleClassChange = async (classId) => {
    setForm((f) => ({ ...f, classId, subjects: [emptySubject()] }));
    if (!classId) return;
    setSubjectsLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.CLASS_SUBJECTS(classId));
      const classSubjects = res.data.subjects || [];
      if (classSubjects.length > 0) {
        setForm((f) => ({
          ...f,
          subjects: classSubjects.map((name) => ({
            subjectName: name,
            totalMarks: 100,
            passingMarks: 33,
          })),
        }));
      }
    } catch {
      // keep empty subjects row if fetch fails
    } finally {
      setSubjectsLoading(false);
    }
  };

  const applyFilters = () => {
    const params = {};
    if (filterClass) params.classId = filterClass;
    if (filterYear) params.academicYear = filterYear;
    dispatch(fetchExams(params));
  };

  const resetForm = () => {
    setForm({
      name: "",
      academicYear: currentYear,
      classId: "",
      examType: "midterm",
      subjects: [emptySubject()],
    });
  };

  const openAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const addSubjectRow = () =>
    setForm((f) => ({ ...f, subjects: [...f.subjects, emptySubject()] }));

  const removeSubjectRow = (idx) =>
    setForm((f) => ({
      ...f,
      subjects: f.subjects.filter((_, i) => i !== idx),
    }));

  const updateSubject = (idx, field, value) =>
    setForm((f) => ({
      ...f,
      subjects: f.subjects.map((s, i) =>
        i === idx ? { ...s, [field]: value } : s
      ),
    }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Exam name is required");
    if (!form.classId) return toast.error("Please select a class");
    const validSubjects = form.subjects.filter((s) => s.subjectName.trim());
    if (validSubjects.length === 0)
      return toast.error("Add at least one subject");

    try {
      await dispatch(
        addExam({
          name: form.name.trim(),
          academicYear: Number(form.academicYear),
          classId: form.classId,
          examType: form.examType,
          subjects: validSubjects.map((s) => ({
            subjectName: s.subjectName.trim(),
            totalMarks: Number(s.totalMarks) || 100,
            passingMarks: Number(s.passingMarks) || 33,
          })),
        })
      ).unwrap();
      toast.success("Exam created successfully!");
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err?.message || "Failed to create exam");
    }
  };

  const handlePublish = async (exam) => {
    try {
      await dispatch(
        publishExam({ id: exam._id, publish: exam.status !== "published" })
      ).unwrap();
      toast.success(
        exam.status === "published" ? "Results unpublished" : "Results published"
      );
    } catch {
      toast.error("Failed to update publish status");
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteExam(deleteTarget._id)).unwrap();
      toast.success("Exam deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete exam");
    }
  };

  const statusBadge = (status) => {
    const map = {
      scheduled: { bg: "bg-gray-100", text: "text-gray-600", label: "Scheduled" },
      ongoing: { bg: "bg-orange-100", text: "text-orange-600", label: "Ongoing" },
      published: { bg: "bg-green-100", text: "text-green-700", label: "Published" },
    };
    const s = map[status] || map.scheduled;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  const years = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-7xl 2xl:max-w-full mx-auto animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FaBook style={{ color: NAVY }} /> Examinations
          </h1>
          <div className="flex items-center gap-2">
            {/* Export is a READ, so it is outside the !readOnly guard — a principal
                or academic head can pull a sheet even though they cannot create or
                publish an exam. The API agrees: GET is never blocked for them. */}
            <button
              onClick={() => setIsExportOpen(true)}
              disabled={exams.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                exams.length === 0 ? "No exams yet" : "Export a class result sheet"
              }
            >
              <FaDownload style={{ color: NAVY }} /> Export Results
            </button>

            {!readOnly && (
              <>
                {/* Import sits beside Create rather than on each exam card: one
                    sheet can cover every section of a grade, so the action belongs
                    to the page, not to one class's exam. */}
                <button
                  onClick={() => setIsImportOpen(true)}
                  disabled={exams.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={
                    exams.length === 0
                      ? "Create an exam first"
                      : "Import results from a spreadsheet"
                  }
                >
                  <FaFileExcel className="text-green-600" /> Import Results
                </button>
                <button
                  onClick={openAdd}
                  className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
                  style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1E3F72 100%)` }}
                >
                  <FaPlus /> Create Exam
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 mb-5 border border-gray-100 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Class</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-[#2F5DAA]"
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.grade} - {c.section}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Year</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg outline-none focus:border-[#2F5DAA]"
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={applyFilters}
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ background: NAVY }}
          >
            Apply
          </button>
          {(filterClass || filterYear) && (
            <button
              onClick={() => {
                setFilterClass("");
                setFilterYear("");
                dispatch(fetchExams());
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card p-6 animate-pulse h-48" />
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="glass-card p-10 text-center text-gray-500">
            <FaBook className="mx-auto text-4xl mb-3 text-gray-300" />
            No exams found. Click &quot;Create Exam&quot; to add one.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((exam) => (
              <div key={exam._id} className="glass-card p-5 border border-gray-100 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{exam.name}</h3>
                    <p className="text-sm text-gray-500">
                      {exam.classId ? `${exam.classId.grade} - ${exam.classId.section}` : "—"}
                      {"  •  "}
                      {exam.academicYear}
                    </p>
                  </div>
                  {statusBadge(exam.status)}
                </div>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white capitalize"
                    style={{ background: NAVY }}
                  >
                    {exam.examType}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                    {exam.subjects?.length || 0} subjects
                  </span>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-2">
                  <button
                    onClick={() => navigate(`/exams/${exam._id}/marks`)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg text-white font-medium"
                    style={{ background: NAVY }}
                  >
                    <FaPen /> Enter Marks
                  </button>
                  <button
                    onClick={() => navigate(`/exams/${exam._id}/results`)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-[#1E3F72] text-white font-medium"
                  >
                    <FaListOl /> Results
                  </button>
                  {!readOnly && (
                    <>
                      <button
                        onClick={() => handlePublish(exam)}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg font-medium ${
                          exam.status === "published"
                            ? "bg-orange-50 text-orange-600"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        <FaCheckCircle />
                        {exam.status === "published" ? "Unpublish" : "Publish"}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(exam)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-red-50 text-red-600 font-medium"
                      >
                        <FaTrash /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Exam Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div
              className="flex items-center justify-between px-6 py-4 rounded-t-2xl text-white"
              style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1E3F72 100%)` }}
            >
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FaPlus /> Create Exam
              </h2>
              <button onClick={() => setIsAddOpen(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Midterm"
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-[#2F5DAA] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Academic Year</label>
                  <input
                    type="number"
                    value={form.academicYear}
                    onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-[#2F5DAA] rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                  <select
                    value={form.classId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-[#2F5DAA] rounded-xl outline-none"
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.grade} - {c.section}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Type</label>
                  <select
                    value={form.examType}
                    onChange={(e) => setForm({ ...form, examType: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-[#2F5DAA] rounded-xl outline-none"
                  >
                    <option value="midterm">Midterm</option>
                    <option value="final">Final Term</option>
                    <option value="monthly-test">Monthly Test</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Subjects */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Subjects</label>
                  {subjectsLoading ? (
                    <span className="text-sm text-gray-500 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#2F5DAA] border-t-transparent"></div>
                      Loading subjects...
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={addSubjectRow}
                      className="flex items-center gap-1 text-sm text-white px-3 py-1.5 rounded-lg"
                      style={{ background: NAVY }}
                    >
                      <FaPlus /> Add Subject
                    </button>
                  )}
                </div>
                {form.classId && !subjectsLoading && form.subjects.length > 0 && form.subjects[0].subjectName && (
                  <p className="text-xs text-green-600 mb-2">
                    Subjects auto-loaded from class. You can adjust marks.
                  </p>
                )}
                <div className="space-y-2">
                  <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 px-1">
                    <span className="col-span-6">Subject Name</span>
                    <span className="col-span-3">Total Marks</span>
                    <span className="col-span-2">Passing</span>
                    <span className="col-span-1"></span>
                  </div>
                  {form.subjects.map((s, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        value={s.subjectName}
                        onChange={(e) => updateSubject(idx, "subjectName", e.target.value)}
                        placeholder="e.g. Mathematics"
                        className="col-span-12 sm:col-span-6 px-3 py-2 border-2 border-gray-200 focus:border-[#2F5DAA] rounded-lg outline-none"
                      />
                      <input
                        type="number"
                        value={s.totalMarks}
                        onChange={(e) => updateSubject(idx, "totalMarks", e.target.value)}
                        placeholder="Total"
                        className="col-span-6 sm:col-span-3 px-3 py-2 border-2 border-gray-200 focus:border-[#2F5DAA] rounded-lg outline-none"
                      />
                      <input
                        type="number"
                        value={s.passingMarks}
                        onChange={(e) => updateSubject(idx, "passingMarks", e.target.value)}
                        placeholder="Pass"
                        className="col-span-5 sm:col-span-2 px-3 py-2 border-2 border-gray-200 focus:border-[#2F5DAA] rounded-lg outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeSubjectRow(idx)}
                        disabled={form.subjects.length === 1}
                        className="col-span-1 flex items-center justify-center text-red-500 disabled:text-gray-300"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-white rounded-xl font-medium"
                  style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1E3F72 100%)` }}
                >
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fadeIn overflow-hidden">
            <div className="px-6 py-4 text-white" style={{ background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)" }}>
              <h2 className="text-lg font-bold">Delete Exam</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-1">
                Delete <strong>{deleteTarget.name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This will also delete all entered results for this exam. This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-6 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2.5 text-white rounded-xl font-medium bg-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isExportOpen && (
        <ResultExportModal
          exams={exams}
          classes={classes}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {isImportOpen && (
        <ResultImportModal
          exams={exams}
          onClose={() => setIsImportOpen(false)}
          // Refetched rather than patched locally: an import touches results
          // across several exams, and the cards show subject counts and publish
          // state that the server is the only source of truth for.
          onImported={() => dispatch(fetchExams())}
        />
      )}
    </div>
  );
};

export default Exams;
