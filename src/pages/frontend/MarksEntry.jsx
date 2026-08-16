import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { fetchExamById } from "../../store/slices/examSlice";
import {
  bulkEnterMarks,
  enterSubjectMarks,
  fetchClassResults,
} from "../../store/slices/resultSlice";
import { toast } from "react-hot-toast";
import { FaArrowLeft, FaSave } from "react-icons/fa";

const NAVY = "#2F5DAA";

const MarksEntry = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedExam } = useSelector((state) => state.exams);
  const { classResults, saving } = useSelector((state) => state.results);
  // A teacher enters marks only for the subject(s) they own in this exam's
  // class: they see only those columns and each saves independently, without
  // touching any other subject's marks. Admins keep the full-grid save.
  const { user } = useSelector((state) => state.auth);
  const isTeacher = user?.role === "teacher";

  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // { studentId: { subjectName: value } }
  const [remarks, setRemarks] = useState({}); // { studentId: string }
  const [ownedSubjects, setOwnedSubjects] = useState([]); // teacher's subject names
  // A class in-charge sees every subject and the running totals (read-only), but
  // Remarks stays office-only. A single-subject teacher sees neither.
  const [isIncharge, setIsIncharge] = useState(false);
  const [loading, setLoading] = useState(true);

  const exam = selectedExam;

  // Load exam, then its class students + existing results.
  useEffect(() => {
    dispatch(fetchExamById(examId));
    dispatch(fetchClassResults(examId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, examId]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!exam || !exam.classId?._id) return;
      try {
        setLoading(true);
        const res = await axios.get(API_ENDPOINTS.CLASS(exam.classId._id));
        const list = (res.data.students || []).sort(
          (a, b) => (a.rollNumber || 0) - (b.rollNumber || 0)
        );
        setStudents(list);
      } catch {
        toast.error("Failed to load class students");
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [exam]);

  // For a teacher, find which of this exam's subjects they own in its class.
  useEffect(() => {
    if (!isTeacher || !exam || !exam.classId?._id) return;
    const loadOwned = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.TEACHER_MY_CLASSES);
        const mine = (res.data || []).find((c) => c._id === exam.classId._id);
        setOwnedSubjects(mine?.teacherSubjects || []);
        setIsIncharge(!!mine?.isIncharge);
      } catch {
        setOwnedSubjects([]);
        setIsIncharge(false);
      }
    };
    loadOwned();
  }, [isTeacher, exam]);

  // Prefill marks from any existing results.
  useEffect(() => {
    if (!classResults || classResults.length === 0) return;
    const prefillMarks = {};
    const prefillRemarks = {};
    classResults.forEach((r) => {
      const sid = r.studentId?._id || r.studentId;
      if (!sid) return;
      prefillMarks[sid] = {};
      (r.marks || []).forEach((m) => {
        prefillMarks[sid][m.subjectName] = m.obtainedMarks;
      });
      if (r.remarks) prefillRemarks[sid] = r.remarks;
    });
    setMarks((prev) => ({ ...prefillMarks, ...prev }));
    setRemarks((prev) => ({ ...prefillRemarks, ...prev }));
  }, [classResults]);

  // The columns shown. A teacher sees only the exam subjects they own; an
  // in-charge owns them all, so they see every column. Total and % are shown to
  // an in-charge (read-only) as well as the office; Remarks stays office-only,
  // since it spans subjects and is not part of the per-subject teacher save.
  const allSubjects = exam?.subjects || [];
  const subjects = isTeacher
    ? allSubjects.filter((s) => ownedSubjects.includes(s.subjectName))
    : allSubjects;
  const showTotals = !isTeacher || isIncharge;

  const handleMarkChange = (studentId, subject, rawValue) => {
    let value = parseFloat(rawValue);
    if (isNaN(value) || value < 0) value = 0;
    if (value > subject.totalMarks) value = subject.totalMarks;
    setMarks((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [subject.subjectName]: value },
    }));
  };

  const rowTotals = useMemo(() => {
    const totals = {};
    const grandTotal = subjects.reduce((s, sub) => s + (sub.totalMarks || 0), 0);
    students.forEach((st) => {
      const sm = marks[st._id] || {};
      const obtained = subjects.reduce(
        (s, sub) => s + (Number(sm[sub.subjectName]) || 0),
        0
      );
      totals[st._id] = {
        obtained,
        grandTotal,
        pct: grandTotal > 0 ? Math.round((obtained / grandTotal) * 10000) / 100 : 0,
      };
    });
    return totals;
  }, [marks, students, subjects]);

  const handleSave = async () => {
    try {
      if (isTeacher) {
        // One targeted save per owned subject — the backend merges each into the
        // result without disturbing the other subjects' marks.
        if (subjects.length === 0) {
          toast.error("You have no subjects to enter for this exam");
          return;
        }
        for (const sub of subjects) {
          const entries = students.map((st) => ({
            studentId: st._id,
            obtainedMarks: Number((marks[st._id] || {})[sub.subjectName]) || 0,
          }));
          await dispatch(
            enterSubjectMarks({
              examId,
              subjectName: sub.subjectName,
              entries,
            })
          ).unwrap();
        }
      } else {
        const entries = students.map((st) => ({
          studentId: st._id,
          marks: subjects.map((sub) => ({
            subjectName: sub.subjectName,
            obtainedMarks: Number((marks[st._id] || {})[sub.subjectName]) || 0,
          })),
          remarks: remarks[st._id] || "",
        }));
        await dispatch(bulkEnterMarks({ examId, entries })).unwrap();
      }
      toast.success("Marks saved successfully!");
      dispatch(fetchClassResults(examId));
    } catch (err) {
      toast.error(err?.message || "Failed to save marks");
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-7xl 2xl:max-w-full mx-auto animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/exams")}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                {exam ? exam.name : "Marks Entry"}
              </h1>
              <p className="text-sm text-gray-500">
                {exam?.classId ? `${exam.classId.grade} - ${exam.classId.section}` : ""}
                {exam ? `  •  ${exam.academicYear}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading || students.length === 0}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1E3F72 100%)` }}
          >
            <FaSave /> {saving ? "Saving..." : "Save All Marks"}
          </button>
        </div>

        {loading ? (
          <div className="glass-card p-10 text-center text-gray-500">Loading students...</div>
        ) : students.length === 0 ? (
          <div className="glass-card p-10 text-center text-gray-500">
            No students found in this class.
          </div>
        ) : (
          <div className="glass-card p-4 border border-gray-100 overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr
                  className="text-white"
                  style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1E3F72 100%)` }}
                >
                  <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">Roll</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">Student</th>
                  {subjects.map((sub) => (
                    <th
                      key={sub.subjectName}
                      className="px-3 py-3 text-center text-sm font-semibold whitespace-nowrap"
                    >
                      {sub.subjectName}
                      <span className="block text-xs font-normal opacity-80">
                        /{sub.totalMarks}
                      </span>
                    </th>
                  ))}
                  {showTotals && (
                    <>
                      <th className="px-3 py-3 text-center text-sm font-semibold whitespace-nowrap">Total</th>
                      <th className="px-3 py-3 text-center text-sm font-semibold whitespace-nowrap">%</th>
                    </>
                  )}
                  {!isTeacher && (
                    <th className="px-3 py-3 text-left text-sm font-semibold whitespace-nowrap">Remarks</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {students.map((st, idx) => {
                  const t = rowTotals[st._id] || { obtained: 0, grandTotal: 0, pct: 0 };
                  return (
                    <tr
                      key={st._id}
                      className={idx % 2 === 0 ? "bg-white/40" : "bg-white/20"}
                    >
                      <td className="px-4 py-2 text-sm text-gray-700">{st.rollNumber}</td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-800 whitespace-nowrap">
                        {st.name}
                      </td>
                      {subjects.map((sub) => (
                        <td key={sub.subjectName} className="px-2 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={sub.totalMarks}
                            value={
                              (marks[st._id] && marks[st._id][sub.subjectName] !== undefined)
                                ? marks[st._id][sub.subjectName]
                                : ""
                            }
                            onChange={(e) =>
                              handleMarkChange(st._id, sub, e.target.value)
                            }
                            className="w-16 px-2 py-1.5 text-center border-2 border-gray-200 focus:border-[#2F5DAA] rounded-lg outline-none"
                          />
                        </td>
                      ))}
                      {showTotals && (
                        <>
                          <td className="px-3 py-2 text-center text-sm font-semibold text-gray-800">
                            {t.obtained}/{t.grandTotal}
                          </td>
                          <td className="px-3 py-2 text-center text-sm font-semibold" style={{ color: NAVY }}>
                            {t.pct}%
                          </td>
                        </>
                      )}
                      {!isTeacher && (
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={remarks[st._id] || ""}
                            onChange={(e) =>
                              setRemarks((prev) => ({ ...prev, [st._id]: e.target.value }))
                            }
                            placeholder="Optional"
                            className="w-32 px-2 py-1.5 border-2 border-gray-200 focus:border-[#2F5DAA] rounded-lg outline-none text-sm"
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarksEntry;
