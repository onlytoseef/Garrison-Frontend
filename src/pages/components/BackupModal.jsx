import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FaDatabase,
  FaTimes,
  FaDownload,
  FaUpload,
  FaExclamationTriangle,
  FaCheckCircle,
  FaShieldAlt,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";

/**
 * Database backup and restore.
 *
 * Download is ordinary. Restore is the most destructive action in the product —
 * it empties every table in every campus — so the two sit in visually separate
 * halves and the restore half asks for the word RESTORE to be typed. The typing
 * is not a security control (the role guard is); it exists so an action with no
 * undo cannot happen on a mis-click.
 */

const TABLE_LABELS = {
  campuses: "Campuses",
  classes: "Classes",
  students: "Students",
  staff: "Staff",
  users: "Logins",
  attendance: "Attendance",
  exams: "Exams",
  results: "Results",
  fee_payments: "Fee payments",
  student_dues: "Outstanding balances",
  diary: "Diary entries",
  resources: "Resources",
  activity_logs: "Activity log",
};

const BackupModal = ({ onClose }) => {
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    axios
      .get(API_ENDPOINTS.BACKUP_SUMMARY)
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null));
  }, []);

  const handleDownload = async () => {
    setBusy(true);
    try {
      const res = await axios.get(API_ENDPOINTS.BACKUP, {
        responseType: "blob",
      });
      const disposition = res.headers["content-disposition"] || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : "school-backup.json";

      const url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Saved ${filename}`);
    } catch (err) {
      // With responseType "blob" the error body arrives as a Blob too, so
      // err.response.data.message is always undefined and every failure would
      // read as a bare "Backup failed". Read the blob back to get the real
      // reason — a 401, a 403, or a server error all say different things.
      let message = "Backup failed";
      const data = err.response?.data;
      if (data instanceof Blob) {
        try {
          message = JSON.parse(await data.text()).message || message;
        } catch {
          /* not JSON — keep the default */
        }
      } else if (data?.message) {
        message = data.message;
      } else if (err.message) {
        message = err.message;
      }
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (!file) return toast.error("Choose a backup file first");
    if (confirmText !== "RESTORE") return toast.error("Type RESTORE to confirm");

    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("confirm", "RESTORE");
      const res = await axios.post(API_ENDPOINTS.BACKUP_RESTORE, form);
      setResult(res.data);
      toast.success("Restore completed");
    } catch (err) {
      // The server may send a list of validation errors alongside the message.
      const data = err.response?.data;
      const detail = data?.errors?.length ? ` ${data.errors[0]}` : "";
      toast.error((data?.message || "Restore failed") + detail);
    } finally {
      setBusy(false);
    }
  };

  const rows = summary
    ? Object.entries(summary.counts)
        .filter(([table, n]) => n > 0 && TABLE_LABELS[table])
        .sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]"
      >
        <div
          className="flex items-center justify-between px-6 py-4 text-white rounded-t-2xl shrink-0"
          style={{
            background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
          }}
        >
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FaDatabase /> Backup &amp; Restore
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {result ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
                <FaCheckCircle className="text-green-600 text-xl mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">
                    Restore completed
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {result.total.toLocaleString()} rows restored across{" "}
                    {Object.keys(result.restored).length} tables.
                  </p>
                  {result.safetyFile && (
                    <p className="text-xs text-green-700 mt-2">
                      The data that was replaced was saved on the server as{" "}
                      <span className="font-mono">{result.safetyFile}</span>
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Everyone will need to sign in again if their account changed.
                Reload the page to see the restored data.
              </p>
            </div>
          ) : (
            <>
              {/* ---------- download ---------- */}
              <section>
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FaDownload className="text-blue-600" /> Save a backup
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Downloads everything — every campus, student, staff member,
                  attendance record, exam, result and fee — as a single JSON
                  file. Keep it somewhere safe.
                </p>

                {rows.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    {rows.slice(0, 9).map(([table, n]) => (
                      <div
                        key={table}
                        className="px-3 py-2 bg-gray-50 rounded-lg text-center"
                      >
                        <p className="text-base font-bold text-gray-800 tabular-nums">
                          {n.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {TABLE_LABELS[table]}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleDownload}
                  disabled={busy}
                  className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium disabled:opacity-60"
                  style={{
                    background:
                      "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                  }}
                >
                  <FaDownload />
                  {busy ? "Preparing..." : "Download backup"}
                </button>
              </section>

              <div className="border-t border-gray-200" />

              {/* ---------- restore ---------- */}
              <section>
                <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FaUpload className="text-red-600" /> Restore from a backup
                </h3>

                <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                  <p className="text-sm text-red-800 font-semibold flex items-center gap-2 mb-1">
                    <FaExclamationTriangle /> This replaces everything
                  </p>
                  <p className="text-sm text-red-700">
                    Every campus, student, mark and payment currently in the
                    system is deleted and replaced by the file's contents.
                    Anything added since that backup was taken is lost.
                  </p>
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-4">
                  <FaShieldAlt className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    Before replacing anything, the current data is saved to the
                    server automatically — so a restore you regret can still be
                    undone by a developer.
                  </p>
                </div>

                <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-400 hover:bg-red-50/30 transition-colors mb-4">
                  <FaUpload className="text-2xl text-gray-400" />
                  <span className="text-sm text-gray-700 font-medium">
                    {file ? file.name : "Choose a backup file (.json)"}
                  </span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>

                <label className="block text-sm text-gray-700 mb-1.5">
                  Type <span className="font-mono font-bold">RESTORE</span> to
                  confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="RESTORE"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 font-mono"
                />

                <button
                  onClick={handleRestore}
                  disabled={busy || !file || confirmText !== "RESTORE"}
                  className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)",
                  }}
                >
                  <FaUpload />
                  {busy ? "Restoring..." : "Replace all data"}
                </button>
              </section>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center shrink-0">
          <p className="text-[11px] text-gray-400 max-w-sm">
            This does not replace server backups. If the server is lost, this is
            lost with it.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium"
          >
            {result ? "Done" : "Close"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BackupModal;
