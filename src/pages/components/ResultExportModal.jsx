import React, { useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFileExcel,
  FaFilePdf,
  FaTimes,
  FaSpinner,
  FaDownload,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";

const NAVY = "#1E3F72";

/**
 * Export one class's result sheet for one exam.
 *
 * Class first, then exam: an exam row belongs to a single class, so picking the
 * class narrows the list to the handful of exams that class actually has. Picking
 * the exam first would mean scrolling every section's copy of "Midterm".
 *
 * Excel and CSV are streamed by the server. PDF is the browser's own print-to-PDF,
 * rendered from `format=json` off the SAME endpoint — so the printed sheet cannot
 * drift from the spreadsheet. There is no PDF library on the server, and adding a
 * headless browser to render one table would be a poor trade.
 */
const ResultExportModal = ({ exams = [], classes = [], onClose }) => {
  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");
  const [busy, setBusy] = useState(null);

  /** Only classes that actually have an exam — the rest have nothing to export. */
  const classesWithExams = useMemo(() => {
    const withExams = new Set(
      exams.map((e) => (typeof e.classId === "string" ? e.classId : e.classId?._id))
    );
    return classes.filter((c) => withExams.has(c._id));
  }, [exams, classes]);

  const examsForClass = useMemo(
    () =>
      exams
        .filter(
          (e) =>
            (typeof e.classId === "string" ? e.classId : e.classId?._id) === classId
        )
        .sort((a, b) => b.academicYear - a.academicYear),
    [exams, classId]
  );

  const exam = examsForClass.find((e) => e._id === examId);

  const downloadFile = async (format) => {
    setBusy(format);
    try {
      const res = await axios.get(API_ENDPOINTS.RESULT_EXPORT(examId, format), {
        responseType: "blob",
      });

      // The server names the file in Content-Disposition; fall back only if the
      // header is missing (a proxy that strips it, for instance).
      const disposition = res.headers["content-disposition"] || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const name = match?.[1] || `results.${format}`;

      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (err) {
      toast.error(
        err.response?.data?.message || `Could not export the ${format.toUpperCase()}`
      );
    } finally {
      setBusy(null);
    }
  };

  const esc = (v) =>
    String(v ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  const printPdf = async () => {
    setBusy("pdf");
    try {
      const { data } = await axios.get(API_ENDPOINTS.RESULT_EXPORT(examId, "json"));

      const subjectHeads = data.subjects
        .map((s) => `<th>${esc(s.subjectName)}<br><small>${s.totalMarks}</small></th>`)
        .join("");

      const body = data.rows
        .map((r) => {
          const bySubject = new Map(r.marks.map((m) => [m.subjectName, m]));
          const cells = data.subjects
            .map((s) => {
              const m = bySubject.get(s.subjectName);
              // Blank rather than 0 — an unmarked paper is not a zero.
              if (!m) return `<td class="c">—</td>`;
              const failed = Number(m.obtainedMarks) < Number(s.passingMarks);
              return `<td class="c${failed ? " fail" : ""}">${Number(m.obtainedMarks)}</td>`;
            })
            .join("");

          return `<tr${r.hasResult ? "" : ' class="pending"'}>
            <td class="c">${esc(r.rollNumber ?? "")}</td>
            <td>${esc(r.name)}</td>
            <td class="mono">${esc(r.studentId)}</td>
            ${cells}
            <td class="c">${r.hasResult ? `${Number(r.obtainedMarks)}/${Number(r.totalMarks)}` : "—"}</td>
            <td class="c">${r.hasResult ? `${Number(r.percentage)}%` : "—"}</td>
            <td class="c">${esc(r.grade ?? "—")}</td>
            <td class="c ${r.hasResult ? (r.isPass ? "pass" : "fail") : ""}">${
              r.hasResult ? (r.isPass ? "PASS" : "FAIL") : "Not marked"
            }</td>
            <td class="c">${esc(r.position ?? "—")}</td>
          </tr>`;
        })
        .join("");

      const win = window.open("", "_blank");
      if (!win) {
        toast.error("Allow pop-ups for this site to print");
        return;
      }

      win.document.write(`<!doctype html><html><head>
<title>${esc(data.exam.name)} — ${esc(data.className)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; padding: 18px; color: #111; }
  h1 { font-size: 17px; margin: 0; text-align: center; color: ${NAVY}; letter-spacing: .3px; }
  .sub { text-align: center; font-size: 12px; color: #555; margin: 3px 0 2px; }
  .meta { text-align: center; font-size: 11px; color: #777; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #c9d3e0; padding: 4px 5px; font-size: 10px; }
  th { background: ${NAVY}; color: #fff; font-weight: 600; text-align: center; }
  th small { font-weight: 400; opacity: .75; font-size: 9px; }
  td.c { text-align: center; }
  td.mono { font-family: ui-monospace, monospace; font-size: 9px; color: #555; }
  .fail { color: #c1121f; font-weight: 600; }
  .pass { color: #0a8f4f; font-weight: 600; }
  tr.pending td { background: #fafafa; color: #999; }
  .summary { margin-top: 12px; display: flex; gap: 16px; font-size: 11px; color: #333; }
  .summary b { color: ${NAVY}; }
  /* Repeat the header on every printed page and never split a pupil's row. */
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  @page { size: A4 landscape; margin: 10mm; }
</style></head><body>
  <h1>${esc(data.campus.name)}</h1>
  <p class="sub">${esc(data.exam.name)} — Class ${esc(data.className)}</p>
  <p class="meta">${esc(data.exam.examType)} · ${esc(data.exam.academicYear)} · ${esc(data.exam.status)}</p>
  <table>
    <thead><tr>
      <th>Roll</th><th>Name</th><th>Student ID</th>${subjectHeads}
      <th>Total</th><th>%</th><th>Grade</th><th>Result</th><th>Pos</th>
    </tr></thead>
    <tbody>${body}</tbody>
  </table>
  <div class="summary">
    <span>Students <b>${data.summary.totalStudents}</b></span>
    <span>Marked <b>${data.summary.marked}</b></span>
    <span>Not marked <b>${data.summary.unmarked}</b></span>
    <span>Pass <b>${data.summary.passCount}</b></span>
    <span>Fail <b>${data.summary.failCount}</b></span>
    <span>Class average <b>${data.summary.classAverage}%</b></span>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print();},300);};</script>
</body></html>`);
      win.document.close();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not build the PDF");
    } finally {
      setBusy(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={busy ? undefined : onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.18 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <FaDownload style={{ color: NAVY }} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold text-gray-900">
                Export results
              </h3>
              <p className="text-[12px] text-gray-500">
                Pick a class, then the exam
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={!!busy}
              className="text-gray-400 hover:text-gray-600 p-1 disabled:opacity-40"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                Class
              </label>
              <select
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setExamId("");
                }}
                disabled={!!busy}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select a class…</option>
                {classesWithExams.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.grade} - {c.section}
                  </option>
                ))}
              </select>
              {classesWithExams.length === 0 && (
                <p className="text-[12px] text-amber-600 mt-1.5">
                  No class has an exam yet.
                </p>
              )}
            </div>

            {classId && (
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                  Exam
                </label>
                <select
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  disabled={!!busy}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select an exam…</option>
                  {examsForClass.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name} · {e.examType} · {e.academicYear}
                      {e.status === "published" ? " · published" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {exam && (
              <p className="text-[11px] text-gray-400">
                {exam.subjects?.length || 0} subject(s). Students with no marks yet
                are included, with blanks.
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 px-5 py-4 border-t border-gray-100">
            <button
              onClick={() => downloadFile("xlsx")}
              disabled={!examId || !!busy}
              className="py-2.5 rounded-xl text-[12px] font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {busy === "xlsx" ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaFileExcel />
              )}
              Excel
            </button>
            <button
              onClick={() => downloadFile("csv")}
              disabled={!examId || !!busy}
              className="py-2.5 rounded-xl text-[12px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {busy === "csv" ? <FaSpinner className="animate-spin" /> : <FaDownload />}
              CSV
            </button>
            <button
              onClick={printPdf}
              disabled={!examId || !!busy}
              className="py-2.5 rounded-xl text-[12px] font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {busy === "pdf" ? <FaSpinner className="animate-spin" /> : <FaFilePdf />}
              PDF
            </button>
          </div>

          <p className="px-5 pb-4 text-[11px] text-gray-400 text-center">
            PDF opens the print dialog — choose “Save as PDF” as the destination.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ResultExportModal;
