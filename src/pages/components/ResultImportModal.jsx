import React, { useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFileExcel,
  FaTimes,
  FaUpload,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSpinner,
  FaInfoCircle,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";

const NAVY = "#1E3F72";

/**
 * Import exam results from a spreadsheet.
 *
 * The sheet needs a Student ID column and one column per subject. Nothing else:
 * totals, passing marks, grades, percentage, pass/fail and position are all
 * computed by the server, so a column for any of them would be ignored.
 *
 * Flow: pick the exam -> pick the file -> preview -> commit.
 *
 * The preview is the point of this screen. It reports, before anything is written:
 * IDs that are not students, students whose class has no exam in this batch,
 * subject columns the exam does not have, marks above the paper total, subjects the
 * sheet does not cover, and marks that already exist. The last one is what the
 * override choice is for.
 */
const ResultImportModal = ({ exams = [], onClose, onImported }) => {
  const [batchKey, setBatchKey] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [askOverwrite, setAskOverwrite] = useState(false);

  /**
   * One entry per logical exam, not per class.
   *
   * Exams are stored per class, so "Midterm" across five sections is five rows.
   * They are grouped by name + type + year because that triple is what identifies
   * the exam, and the same name can exist with a different type — this database has
   * a "Midterm" of type `midterm` and another of type `final`.
   */
  const batches = useMemo(() => {
    const map = new Map();
    for (const e of exams) {
      const key = `${e.name}|||${e.examType}|||${e.academicYear}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          examName: e.name,
          examType: e.examType,
          academicYear: e.academicYear,
          classes: 0,
        });
      }
      map.get(key).classes += 1;
    }
    return [...map.values()].sort(
      (a, b) =>
        b.academicYear - a.academicYear || a.examName.localeCompare(b.examName)
    );
  }, [exams]);

  const batch = batches.find((b) => b.key === batchKey);

  const buildForm = (extra = {}) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("examName", batch.examName);
    fd.append("examType", batch.examType);
    fd.append("academicYear", String(batch.academicYear));
    Object.entries(extra).forEach(([k, v]) => fd.append(k, String(v)));
    return fd;
  };

  const runPreview = async (picked) => {
    const chosen = picked || file;
    if (!chosen || !batch) return;
    setFile(chosen);
    setLoading(true);
    setPreview(null);
    try {
      const fd = new FormData();
      fd.append("file", chosen);
      fd.append("examName", batch.examName);
      fd.append("examType", batch.examType);
      fd.append("academicYear", String(batch.academicYear));
      const { data } = await axios.post(API_ENDPOINTS.RESULT_IMPORT_PREVIEW, fd);
      setPreview(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not read that file");
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const commit = async (overwrite) => {
    setAskOverwrite(false);
    setCommitting(true);
    try {
      const { data } = await axios.post(
        API_ENDPOINTS.RESULT_IMPORT_COMMIT,
        buildForm({ overwrite })
      );
      toast.success(data.message);
      if (data.skipped > 0 && !overwrite) {
        toast(`${data.skipped} mark(s) already existed and were kept`, {
          icon: "ℹ️",
        });
      }
      onImported?.(data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed");
    } finally {
      setCommitting(false);
    }
  };

  const handleImport = () => {
    // Only ask when there is actually something to overwrite.
    if (preview?.conflicts?.length) return setAskOverwrite(true);
    commit(false);
  };

  const c = preview?.counts;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 10 }}
          transition={{ duration: 0.18 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <FaFileExcel className="text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold text-gray-900">
                Import results
              </h3>
              <p className="text-[12px] text-gray-500">
                Student ID + one column per subject
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={committing}
              className="text-gray-400 hover:text-gray-600 p-1 disabled:opacity-40"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>

          <div className="overflow-y-auto px-5 py-4 space-y-4">
            {/* 1. which exam */}
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                Which exam?
              </label>
              <select
                value={batchKey}
                onChange={(e) => {
                  setBatchKey(e.target.value);
                  setPreview(null);
                }}
                disabled={committing}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select an exam…</option>
                {batches.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.examName} · {b.examType} · {b.academicYear} (
                    {b.classes} {b.classes === 1 ? "class" : "classes"})
                  </option>
                ))}
              </select>
              {batches.length === 0 && (
                <p className="text-[12px] text-amber-600 mt-1.5">
                  No exams exist yet. Create one first.
                </p>
              )}
            </div>

            {/* 2. the file */}
            {batch && (
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
                  Spreadsheet
                </label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 cursor-pointer transition-colors">
                  <FaUpload className="text-gray-400" />
                  <span className="text-[13px] text-gray-600 truncate">
                    {file ? file.name : "Choose an .xlsx, .xls or .csv file"}
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    disabled={committing}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) runPreview(f);
                    }}
                  />
                </label>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  Subject names are matched loosely — “Math”, “math” and “Maths”
                  are the same subject. Empty cells are left alone, not scored 0.
                </p>
              </div>
            )}

            {loading && (
              <div className="flex items-center gap-2 text-[13px] text-gray-500 py-4">
                <FaSpinner className="animate-spin" /> Reading the sheet…
              </div>
            )}

            {/* 3. preview */}
            {preview && (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Rows", value: c.sheetRows, tone: "text-gray-900" },
                    { label: "Students", value: c.willImport, tone: "text-green-600" },
                    { label: "Marks", value: c.marksToWrite, tone: "text-blue-600" },
                    { label: "Problems", value: c.errors, tone: c.errors ? "text-red-600" : "text-gray-400" },
                  ].map((t) => (
                    <div
                      key={t.label}
                      className="rounded-xl bg-gray-50 py-2.5 text-center"
                    >
                      <p className={`text-[18px] font-bold tabular-nums leading-none ${t.tone}`}>
                        {t.value}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-1">
                        {t.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* already-entered marks */}
                {preview.conflicts?.length > 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3.5">
                    <p className="text-[12px] font-bold text-amber-800 flex items-center gap-1.5">
                      <FaExclamationTriangle className="text-[11px]" />
                      Marks already entered
                    </p>
                    <ul className="mt-2 space-y-1">
                      {preview.conflicts.map((cf, i) => (
                        <li key={i} className="text-[12px] text-amber-700">
                          {cf.className} · <b>{cf.subjectName}</b> — {cf.students}{" "}
                          student(s)
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-amber-600 mt-2">
                      You will be asked whether to overwrite these.
                    </p>
                  </div>
                )}

                {/* subjects the sheet does not cover */}
                {preview.missingInSheet?.length > 0 && (
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-3.5">
                    <p className="text-[12px] font-bold text-blue-800 flex items-center gap-1.5">
                      <FaInfoCircle className="text-[11px]" />
                      Not in this sheet — will be left as they are
                    </p>
                    <ul className="mt-2 space-y-1">
                      {preview.missingInSheet.map((m, i) => (
                        <li key={i} className="text-[12px] text-blue-700">
                          {m.className} · <b>{m.subjectName}</b>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* columns that match no subject on the exam */}
                {preview.unknownSubjects?.length > 0 && (
                  <div className="rounded-xl bg-orange-50 border border-orange-100 p-3.5">
                    <p className="text-[12px] font-bold text-orange-800 flex items-center gap-1.5">
                      <FaExclamationTriangle className="text-[11px]" />
                      Columns this exam has no subject for — ignored
                    </p>
                    <p className="text-[12px] text-orange-700 mt-1.5">
                      {preview.unknownSubjects.map((u) => u.column).join(", ")}
                    </p>
                    <p className="text-[11px] text-orange-600 mt-1.5">
                      Check the spelling if one of these should have matched.
                    </p>
                  </div>
                )}

                {c.overflows > 0 && (
                  <div className="rounded-xl bg-orange-50 border border-orange-100 p-3.5">
                    <p className="text-[12px] text-orange-800">
                      <b>{c.overflows}</b> mark(s) are above the paper total and
                      will be capped.
                    </p>
                  </div>
                )}

                {/* rows that cannot be imported */}
                {preview.errors?.length > 0 && (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-3.5">
                    <p className="text-[12px] font-bold text-red-800 flex items-center gap-1.5">
                      <FaExclamationTriangle className="text-[11px]" />
                      {c.errors} row(s) will be skipped
                    </p>
                    <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {preview.errors.map((e, i) => (
                        <li key={i} className="text-[12px] text-red-700">
                          <span className="font-mono text-[11px] text-red-400">
                            row {e.line}
                          </span>{" "}
                          {e.message}
                        </li>
                      ))}
                    </ul>
                    {preview.errorsTruncated > 0 && (
                      <p className="text-[11px] text-red-500 mt-1.5">
                        …and {preview.errorsTruncated} more
                      </p>
                    )}
                  </div>
                )}

                {preview.sample?.length > 0 && (
                  <div>
                    <p className="text-[12px] font-semibold text-gray-700 mb-1.5">
                      First few rows
                    </p>
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      {preview.sample.map((s, i) => (
                        <div
                          key={i}
                          className={`px-3.5 py-2 text-[12px] ${
                            i > 0 ? "border-t border-gray-100" : ""
                          }`}
                        >
                          <span className="font-semibold text-gray-800">
                            {s.name}
                          </span>
                          <span className="text-gray-400"> · {s.className} · </span>
                          <span className="text-gray-600">
                            {s.marks
                              .map(
                                (m) =>
                                  `${m.subjectName} ${
                                    m.absent ? "ABS" : m.obtainedMarks
                                  }/${m.totalMarks}`
                              )
                              .join(", ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* footer */}
          <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
            <button
              onClick={onClose}
              disabled={committing}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!preview?.canImport || committing || loading}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: NAVY }}
            >
              {committing ? (
                <>
                  <FaSpinner className="animate-spin" /> Importing…
                </>
              ) : (
                <>
                  <FaCheckCircle />
                  {c ? `Import ${c.marksToWrite} mark(s)` : "Import"}
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* The override question. A separate layer so the preview stays readable
            behind it — the decision needs the conflict list still on screen. */}
        <AnimatePresence>
          {askOverwrite && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[80] flex items-center justify-center bg-black/40 p-4"
            >
              <motion.div
                initial={{ scale: 0.96, y: 8 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <FaExclamationTriangle className="text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-gray-900">
                      Some marks are already entered
                    </h4>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      {preview.conflicts
                        .map((cf) => `${cf.className} ${cf.subjectName}`)
                        .join(", ")}
                    </p>
                  </div>
                </div>

                <p className="text-[12px] text-gray-600 mt-3 leading-relaxed">
                  Overwrite them with the values from this sheet, or keep what is
                  already saved and import only the rest?
                </p>

                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={() => commit(true)}
                    className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
                  >
                    Overwrite existing marks
                  </button>
                  <button
                    onClick={() => commit(false)}
                    className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: NAVY }}
                  >
                    Keep existing, import the rest
                  </button>
                  <button
                    onClick={() => setAskOverwrite(false)}
                    className="w-full py-2 rounded-xl text-[13px] font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default ResultImportModal;
