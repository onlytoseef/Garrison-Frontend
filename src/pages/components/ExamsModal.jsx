import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FaGraduationCap,
  FaTimes,
  FaPlus,
  FaCheck,
  FaBuilding,
  FaPen,
  FaTrash,
  FaCheckCircle,
  FaRegCircle,
  FaClipboardList,
  FaChevronDown,
  FaChevronRight,
  FaSave,
  FaExclamationTriangle,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";
import { overlayFade, modalPop } from "../../utils/animations";

const NAVY = "#2F5DAA";
const GRAD = `linear-gradient(135deg, ${NAVY} 0%, #1E3F72 100%)`;
const currentYear = new Date().getFullYear();

/**
 * Cross-campus exam administration for the super admin.
 *
 * One exam is created for a grade and fanned out into a real exam for each ticked
 * section across every campus (each section keeps its OWN subjects). Marks entry
 * and publishing happen right here. A bigger modal than the others, with the tabs
 * running down a left sidebar.
 *
 * Local state + axios, like SubjectsModal — no Redux. The endpoints are unscoped
 * super-admin, so no campus needs to be "open".
 */
const ExamsModal = ({ onClose }) => {
  const [tab, setTab] = useState("create");
  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(true);

  // Bumped after a create/publish/delete so the status tab refetches.
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  // Set when "Enter marks" is clicked on a section; drives the Marks tab.
  const [marksContext, setMarksContext] = useState(null);

  useEffect(() => {
    axios
      .get(API_ENDPOINTS.SUBJECT_GRADES)
      .then((res) => setGrades(res.data))
      .catch(() => toast.error("Could not load grades"))
      .finally(() => setGradesLoading(false));
  }, []);

  const openMarks = (context) => {
    setMarksContext(context);
    setTab("marks");
  };

  const TABS = [
    { key: "create", label: "Create & Assign", icon: <FaPlus /> },
    { key: "status", label: "Exams & Results", icon: <FaClipboardList /> },
    { key: "marks", label: "Enter Marks", icon: <FaPen /> },
  ];

  return (
    <motion.div
      variants={overlayFade}
      initial="hidden"
      animate="show"
      exit="hidden"
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-3 sm:p-4"
    >
      <motion.div
        variants={modalPop}
        initial="hidden"
        animate="show"
        exit="exit"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[92rem] flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 text-white rounded-t-2xl shrink-0"
          style={{ background: GRAD }}
        >
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FaGraduationCap /> Examinations
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body: left sidebar tabs + content */}
        <div className="flex flex-row flex-1 min-h-0">
          <nav className="w-48 sm:w-56 shrink-0 border-r border-gray-100 p-3 space-y-1 overflow-y-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-[13px] font-semibold rounded-xl border-l-2 transition-colors text-left ${
                  tab === t.key
                    ? "bg-blue-50 text-[#2F5DAA] border-[#2F5DAA]"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-sm">{t.icon}</span>
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 min-w-0">
            {gradesLoading ? (
              <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ) : tab === "create" ? (
              <CreateTab
                grades={grades}
                onCreated={() => {
                  refresh();
                  setTab("status");
                }}
              />
            ) : tab === "status" ? (
              <StatusTab refreshKey={refreshKey} refresh={refresh} onEnterMarks={openMarks} />
            ) : (
              <MarksTab context={marksContext} onSaved={refresh} />
            )}
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Tab 1 — Create & Assign
// ---------------------------------------------------------------------------
const emptyMark = { totalMarks: 100, passingMarks: 33, date: "" };

const CreateTab = ({ grades, onCreated }) => {
  const [gradeKey, setGradeKey] = useState(grades[0]?.gradeKey || "");
  const grade = grades.find((g) => g.gradeKey === gradeKey);

  const [name, setName] = useState("");
  const [academicYear, setAcademicYear] = useState(currentYear);
  const [examType, setExamType] = useState("midterm");

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chosen, setChosen] = useState(new Set());
  // Per-subject-name marks: { [name]: { totalMarks, passingMarks, date } }
  const [subjectMarks, setSubjectMarks] = useState({});
  const [creating, setCreating] = useState(false);

  const load = () => {
    if (!gradeKey) return;
    setLoading(true);
    setChosen(new Set());
    axios
      .get(API_ENDPOINTS.SUBJECT_SECTIONS(gradeKey))
      .then((res) => {
        const secs = res.data || [];
        setSections(secs);
        // The union of every section's subjects — the admin sets marks per name
        // once, and each section's exam uses whichever of these it actually has.
        const union = [];
        const seen = new Set();
        secs.forEach((s) =>
          (s.subjects || []).forEach((name) => {
            if (!seen.has(name)) {
              seen.add(name);
              union.push(name);
            }
          })
        );
        setSubjectMarks((prev) => {
          const next = {};
          union.forEach((name) => {
            next[name] = prev[name] || { ...emptyMark };
          });
          return next;
        });
      })
      .catch(() => toast.error("Could not load sections"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [gradeKey]);

  const subjectNames = Object.keys(subjectMarks);

  const eligible = sections.filter((s) => s.subjectCount > 0);
  const allChosen = eligible.length > 0 && chosen.size === eligible.length;
  const toggleAll = () =>
    setChosen(allChosen ? new Set() : new Set(eligible.map((s) => s._id)));

  const toggleSection = (id) => {
    const next = new Set(chosen);
    next.has(id) ? next.delete(id) : next.add(id);
    setChosen(next);
  };

  const setMark = (name, field, value) =>
    setSubjectMarks((prev) => ({
      ...prev,
      [name]: { ...prev[name], [field]: value },
    }));

  const create = async () => {
    if (!name.trim()) return toast.error("Exam name is required");
    if (chosen.size === 0) return toast.error("Tick at least one section");

    // Only send marks for subjects that carry a value; the backend defaults the
    // rest to 100/33.
    const cleanMarks = {};
    for (const [sub, m] of Object.entries(subjectMarks)) {
      cleanMarks[sub] = {
        totalMarks: Number(m.totalMarks) || 100,
        passingMarks: Number(m.passingMarks) || 33,
        date: m.date || null,
      };
    }

    setCreating(true);
    try {
      const res = await axios.post(API_ENDPOINTS.EXAM_ADMIN_BATCH, {
        name: name.trim(),
        academicYear: Number(academicYear),
        examType,
        classIds: [...chosen],
        subjectMarks: cleanMarks,
      });
      const { created = [], skipped = [] } = res.data;
      toast.success(
        `Exam created for ${created.length} section(s)` +
          (skipped.length ? ` · ${skipped.length} skipped` : "")
      );
      setName("");
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create exam");
    } finally {
      setCreating(false);
    }
  };

  // Group sections by campus for a readable checklist.
  const byCampus = sections.reduce((acc, s) => {
    (acc[s.campusCode] ||= { name: s.campusName, items: [] }).items.push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Exam meta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Grade</label>
          <select
            value={gradeKey}
            onChange={(e) => setGradeKey(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F5DAA]"
          >
            {grades.map((g) => (
              <option key={g.gradeKey} value={g.gradeKey}>
                {g.gradeLabel} ({g.classCount} section{g.classCount === 1 ? "" : "s"})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Exam name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Midterm"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F5DAA]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Academic year</label>
          <input
            type="number"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F5DAA]"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Exam type</label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F5DAA]"
          >
            <option value="midterm">Midterm</option>
            <option value="final">Final Term</option>
            <option value="monthly-test">Monthly Test</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Subject marks map */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Marks per subject
            </p>
            {subjectNames.length === 0 ? (
              <p className="text-xs text-gray-500 border border-gray-100 rounded-xl p-4">
                No subjects are assigned to any {grade?.gradeLabel} section yet.
                Assign subjects first (Subjects panel), then create the exam.
              </p>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <span className="col-span-6">Subject</span>
                  <span className="col-span-2 text-center">Total</span>
                  <span className="col-span-2 text-center">Pass</span>
                  <span className="col-span-2 text-center">Date</span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                  {subjectNames.map((sub) => (
                    <div key={sub} className="grid grid-cols-12 gap-2 items-center px-3 py-2">
                      <span className="col-span-6 text-sm text-gray-800 truncate" title={sub}>
                        {sub}
                      </span>
                      <input
                        type="number"
                        value={subjectMarks[sub].totalMarks}
                        onChange={(e) => setMark(sub, "totalMarks", e.target.value)}
                        className="col-span-2 px-2 py-1.5 text-center border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5DAA]"
                      />
                      <input
                        type="number"
                        value={subjectMarks[sub].passingMarks}
                        onChange={(e) => setMark(sub, "passingMarks", e.target.value)}
                        className="col-span-2 px-2 py-1.5 text-center border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5DAA]"
                      />
                      <input
                        type="date"
                        value={subjectMarks[sub].date || ""}
                        onChange={(e) => setMark(sub, "date", e.target.value)}
                        className="col-span-2 px-1 py-1.5 border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-[#2F5DAA]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[11px] text-gray-400 mt-2">
              Each section's exam includes only the subjects it has assigned. A
              subject with no value entered defaults to 100 / 33.
            </p>
          </div>

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">
                Sections (all campuses)
              </p>
              {eligible.length > 0 && (
                <button
                  onClick={toggleAll}
                  className="text-[11px] text-[#2F5DAA] hover:underline"
                >
                  {allChosen ? "Clear all" : "Select all"}
                </button>
              )}
            </div>
            {sections.length === 0 ? (
              <p className="text-xs text-gray-500 border border-gray-100 rounded-xl p-4">
                No sections found for this grade.
              </p>
            ) : (
              <div className="border border-gray-100 rounded-xl max-h-72 overflow-y-auto">
                {Object.entries(byCampus).map(([code, group]) => (
                  <div key={code}>
                    <div className="px-4 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 sticky top-0">
                      <FaBuilding className="text-[9px]" /> {code}
                    </div>
                    {group.items.map((s) => {
                      const disabled = s.subjectCount === 0;
                      return (
                        <label
                          key={s._id}
                          className={`flex items-center gap-3 px-4 py-2.5 border-t border-gray-50 ${
                            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={disabled}
                            checked={chosen.has(s._id)}
                            onChange={() => toggleSection(s._id)}
                            className="w-4 h-4 accent-[#2F5DAA]"
                          />
                          <span className="flex-1 text-sm text-gray-800">
                            {s.grade} — {s.section}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {disabled ? "no subjects" : `${s.subjectCount} subj`}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-gray-500">
          {chosen.size} section(s) selected
        </p>
        <button
          onClick={create}
          disabled={creating || chosen.size === 0 || !name.trim()}
          className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium disabled:opacity-40"
          style={{ background: GRAD }}
        >
          <FaCheck />
          {creating ? "Creating..." : "Create & Assign"}
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab 2 — Exams & Results (status + publish + delete)
// ---------------------------------------------------------------------------
const StatusTab = ({ refreshKey, refresh, onEnterMarks }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState(null); // batchId or examId currently acting
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get(API_ENDPOINTS.EXAM_ADMIN_BATCHES)
      .then((res) => setBatches(res.data))
      .catch(() => toast.error("Could not load exams"))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const publishBatch = async (batch, publish) => {
    setBusy(batch.batchId);
    try {
      const res = await axios.put(
        API_ENDPOINTS.EXAM_ADMIN_BATCH_PUBLISH(batch.batchId),
        { publish }
      );
      toast.success(
        publish
          ? `Published ${res.data.changed} section(s)`
          : `Unpublished results`
      );
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const publishSection = async (exam, publish) => {
    setBusy(exam.examId);
    try {
      await axios.put(API_ENDPOINTS.EXAM_ADMIN_EXAM_PUBLISH(exam.examId), {
        publish,
      });
      toast.success(publish ? "Section published" : "Section unpublished");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const doDelete = async () => {
    const batch = deleteTarget;
    setDeleteTarget(null);
    setBusy(batch.batchId);
    try {
      await axios.delete(API_ENDPOINTS.EXAM_ADMIN_BATCH_BY_ID(batch.batchId));
      toast.success("Exam deleted");
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FaClipboardList className="text-4xl text-gray-300 mx-auto mb-3" />
        <p>No exams created yet. Use the Create &amp; Assign tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {batches.map((b) => {
        const isOpen = openId === b.batchId;
        const acting = busy === b.batchId;
        return (
          <div key={b.batchId} className="border border-gray-100 rounded-xl overflow-hidden">
            {/* Batch header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
              <button
                onClick={() => setOpenId(isOpen ? null : b.batchId)}
                className="flex items-center gap-2 flex-1 text-left min-w-0"
              >
                <span className="text-gray-400">
                  {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-gray-800 truncate">
                    {b.name}
                    <span className="ml-2 text-xs font-medium text-gray-500">
                      {b.gradeLabel} · {b.academicYear}
                    </span>
                  </span>
                  <span className="block text-[11px] text-gray-500">
                    {b.publishedCount}/{b.sectionCount} published ·{" "}
                    {b.withMarksCount}/{b.sectionCount} have marks
                  </span>
                </span>
              </button>
              <span
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white capitalize shrink-0"
                style={{ background: NAVY }}
              >
                {b.examType}
              </span>
            </div>

            {isOpen && (
              <div>
                {b.sections.map((s) => {
                  const published = s.status === "published";
                  const sActing = busy === s.examId;
                  return (
                    <div
                      key={s.examId}
                      className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-50 flex-wrap"
                    >
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase w-16 shrink-0">
                        <FaBuilding className="text-[9px]" /> {s.campusCode}
                      </span>
                      <span className="flex-1 text-sm text-gray-800 min-w-[90px]">
                        {s.grade} — {s.section}
                      </span>
                      <span className="text-[11px] text-gray-500 w-20 text-center">
                        {s.resultCount}/{s.studentCount} marks
                      </span>
                      <span
                        className={`flex items-center gap-1 text-[11px] font-semibold w-24 ${
                          published ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {published ? <FaCheckCircle /> : <FaRegCircle />}
                        {published ? "Published" : "Unpublished"}
                      </span>
                      <button
                        onClick={() =>
                          onEnterMarks({
                            examId: s.examId,
                            label: `${s.campusCode} · ${s.grade}-${s.section}`,
                            batchName: b.name,
                            sections: b.sections.map((x) => ({
                              examId: x.examId,
                              label: `${x.campusCode} · ${x.grade}-${x.section}`,
                            })),
                          })
                        }
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg text-white font-medium"
                        style={{ background: NAVY }}
                      >
                        <FaPen className="text-[10px]" /> Marks
                      </button>
                      <button
                        onClick={() => publishSection(s, !published)}
                        disabled={sActing}
                        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg font-medium disabled:opacity-50 ${
                          published
                            ? "bg-orange-50 text-orange-600"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        <FaCheckCircle className="text-[10px]" />
                        {published ? "Unpublish" : "Publish"}
                      </button>
                    </div>
                  );
                })}

                {/* Batch actions */}
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/60">
                  <button
                    onClick={() => publishBatch(b, true)}
                    disabled={acting}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg text-white font-medium disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)" }}
                  >
                    <FaCheckCircle /> Publish all
                  </button>
                  <button
                    onClick={() => publishBatch(b, false)}
                    disabled={acting}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-orange-50 text-orange-600 font-medium disabled:opacity-50"
                  >
                    Unpublish all
                  </button>
                  <button
                    onClick={() => setDeleteTarget(b)}
                    disabled={acting}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-red-50 text-red-600 font-medium disabled:opacity-50"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div
              className="px-6 py-4 text-white flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)" }}
            >
              <FaExclamationTriangle />
              <h3 className="text-lg font-bold">Delete exam</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-1">
                Delete <strong>{deleteTarget.name}</strong> across all{" "}
                {deleteTarget.sectionCount} section(s)?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This removes the exam and every entered result for it, in every
                campus. This cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-5 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={doDelete}
                  className="px-5 py-2.5 text-white rounded-xl font-medium bg-red-600 hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab 3 — Enter Marks (in-modal grid for one section)
// ---------------------------------------------------------------------------
const MarksTab = ({ context, onSaved }) => {
  const [examId, setExamId] = useState(context?.examId || "");
  const [sheet, setSheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [marks, setMarks] = useState({}); // { studentId: { subjectName: value } }
  const [remarks, setRemarks] = useState({});

  // Follow the section picked in the status tab.
  useEffect(() => {
    if (context?.examId) setExamId(context.examId);
  }, [context]);

  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    setMarks({});
    setRemarks({});
    axios
      .get(API_ENDPOINTS.EXAM_ADMIN_MARKS_SHEET(examId))
      .then((res) => {
        setSheet(res.data);
        const pm = {};
        const pr = {};
        (res.data.results || []).forEach((r) => {
          const sid = r.studentId;
          pm[sid] = {};
          (r.marks || []).forEach((m) => {
            pm[sid][m.subjectName] = m.obtainedMarks;
          });
          if (r.remarks) pr[sid] = r.remarks;
        });
        setMarks(pm);
        setRemarks(pr);
      })
      .catch(() => toast.error("Could not load the marks sheet"))
      .finally(() => setLoading(false));
  }, [examId]);

  const subjects = sheet?.exam?.subjects || [];
  const students = sheet?.students || [];

  const handleMark = (sid, subject, raw) => {
    let value = parseFloat(raw);
    if (isNaN(value) || value < 0) value = 0;
    if (value > subject.totalMarks) value = subject.totalMarks;
    setMarks((prev) => ({
      ...prev,
      [sid]: { ...(prev[sid] || {}), [subject.subjectName]: value },
    }));
  };

  const rowTotals = useMemo(() => {
    const totals = {};
    const grand = subjects.reduce((s, sub) => s + (sub.totalMarks || 0), 0);
    students.forEach((st) => {
      const sm = marks[st._id] || {};
      const obtained = subjects.reduce(
        (s, sub) => s + (Number(sm[sub.subjectName]) || 0),
        0
      );
      totals[st._id] = {
        obtained,
        grand,
        pct: grand > 0 ? Math.round((obtained / grand) * 10000) / 100 : 0,
      };
    });
    return totals;
  }, [marks, students, subjects]);

  const save = async () => {
    const entries = students.map((st) => ({
      studentId: st._id,
      marks: subjects.map((sub) => ({
        subjectName: sub.subjectName,
        obtainedMarks: Number((marks[st._id] || {})[sub.subjectName]) || 0,
      })),
      remarks: remarks[st._id] || "",
    }));
    setSaving(true);
    try {
      await axios.post(API_ENDPOINTS.EXAM_ADMIN_SAVE_MARKS(examId), { entries });
      toast.success("Marks saved");
      onSaved?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save marks");
    } finally {
      setSaving(false);
    }
  };

  if (!examId) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FaPen className="text-4xl text-gray-300 mx-auto mb-3" />
        <p>Pick a section's "Marks" button from the Exams &amp; Results tab.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section switcher + save */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="min-w-0">
          {context?.batchName && (
            <p className="text-xs text-gray-500 mb-1">
              {context.batchName}
            </p>
          )}
          {context?.sections?.length > 1 ? (
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F5DAA] max-w-full"
            >
              {context.sections.map((s) => (
                <option key={s.examId} value={s.examId}>
                  {s.label}
                </option>
              ))}
            </select>
          ) : (
            <p className="font-bold text-gray-800">{context?.label}</p>
          )}
        </div>
        <button
          onClick={save}
          disabled={saving || loading || students.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium disabled:opacity-50 shrink-0"
          style={{ background: GRAD }}
        >
          <FaSave /> {saving ? "Saving..." : "Save marks"}
        </button>
      </div>

      {loading ? (
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border border-gray-100 rounded-xl">
          No students in this section.
        </div>
      ) : (
        <div className="border border-gray-100 rounded-xl overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-white" style={{ background: GRAD }}>
                <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Roll</th>
                <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap">Student</th>
                {subjects.map((sub) => (
                  <th key={sub.subjectName} className="px-2 py-2.5 text-center font-semibold whitespace-nowrap">
                    {sub.subjectName}
                    <span className="block text-[10px] font-normal opacity-80">/{sub.totalMarks}</span>
                  </th>
                ))}
                <th className="px-2 py-2.5 text-center font-semibold whitespace-nowrap">Total</th>
                <th className="px-2 py-2.5 text-center font-semibold whitespace-nowrap">%</th>
                <th className="px-2 py-2.5 text-left font-semibold whitespace-nowrap">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((st) => {
                const t = rowTotals[st._id] || { obtained: 0, grand: 0, pct: 0 };
                return (
                  <tr key={st._id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700">{st.rollNumber}</td>
                    <td className="px-3 py-2 font-medium text-gray-800 whitespace-nowrap">{st.name}</td>
                    {subjects.map((sub) => (
                      <td key={sub.subjectName} className="px-2 py-1.5 text-center">
                        <input
                          type="number"
                          min={0}
                          max={sub.totalMarks}
                          value={
                            marks[st._id] && marks[st._id][sub.subjectName] !== undefined
                              ? marks[st._id][sub.subjectName]
                              : ""
                          }
                          onChange={(e) => handleMark(st._id, sub, e.target.value)}
                          className="w-14 px-1.5 py-1 text-center border border-gray-200 focus:border-[#2F5DAA] rounded-lg outline-none"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-2 text-center font-semibold text-gray-800 whitespace-nowrap">
                      {t.obtained}/{t.grand}
                    </td>
                    <td className="px-2 py-2 text-center font-semibold whitespace-nowrap" style={{ color: NAVY }}>
                      {t.pct}%
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={remarks[st._id] || ""}
                        onChange={(e) =>
                          setRemarks((prev) => ({ ...prev, [st._id]: e.target.value }))
                        }
                        placeholder="Optional"
                        className="w-28 px-2 py-1 border border-gray-200 focus:border-[#2F5DAA] rounded-lg outline-none text-sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExamsModal;
