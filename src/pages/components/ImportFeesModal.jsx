import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaFileExcel,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaUpload,
  FaArrowLeft,
  FaSchool,
  FaUserSlash,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";
import Loader from "./Loader";

/**
 * Bulk fee import from the client's Excel exports.
 *
 * Same two-step contract as the student importer: preview reports what would
 * happen without writing, then confirm actually imports. The file is uploaded
 * twice — once per step — so the server validates the exact bytes it imports.
 *
 * `kind` is "payments" or "dues". They are separate uploads because they are
 * separate files on separate schedules, and importing one must never disturb
 * the other.
 */

const LABELS = {
  payments: {
    title: "Import Payments",
    file: "Payment Detail",
    columns: "Student ID · Payment History (Date, Amount)",
    note: "Each student's existing payments are replaced by what this file says.",
  },
  dues: {
    title: "Import Dues",
    file: "Dues List",
    columns: "Student ID · Voucher Number · Due Amount · Total Outstanding",
    note: "Each student's outstanding balance is replaced by what this file says.",
  },
};

const money = (n) => Number(n || 0).toLocaleString();

const ImportFeesModal = ({ kind = "payments", onClose, onImported }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const label = LABELS[kind] || LABELS.payments;

  const handleFile = async (chosen) => {
    if (!chosen) return;
    setFile(chosen);
    setPreview(null);
    setResult(null);

    try {
      setLoading(true);
      const form = new FormData();
      form.append("file", chosen);
      const res = await axios.post(
        API_ENDPOINTS.FEES_IMPORT_PREVIEW(kind),
        form
      );
      setPreview(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not read the file");
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const form = new FormData();
      form.append("file", file);
      const res = await axios.post(
        API_ENDPOINTS.FEES_IMPORT_COMMIT(kind),
        form
      );
      setResult(res.data);
      toast.success(`Imported ${res.data.inserted} record(s)`);
      onImported?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[92vh]">
        <div
          className="flex items-center justify-between px-6 py-4 text-white rounded-t-2xl shrink-0"
          style={{
            background: "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)",
          }}
        >
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FaFileExcel /> {label.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* ---------- step 3: done ---------- */}
          {result ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
                <FaCheckCircle className="text-green-600 text-xl mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-green-800">
                    Import completed
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {result.inserted} record
                    {result.inserted === 1 ? "" : "s"} for {result.students}{" "}
                    student{result.students === 1 ? "" : "s"}
                    {result.replaced > 0 &&
                      `, replacing ${result.replaced} previous record${
                        result.replaced === 1 ? "" : "s"
                      }`}
                    .
                  </p>
                </div>
              </div>

              {result.unmatched?.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-sm text-amber-800 font-medium mb-1">
                    {result.unmatched.length} row
                    {result.unmatched.length === 1 ? "" : "s"} skipped
                  </p>
                  <p className="text-xs text-amber-700">
                    No student in this campus has these IDs, so they were left
                    out.
                  </p>
                </div>
              )}
            </div>
          ) : !file ? (
            /* ---------- step 1: choose a file ---------- */
            <div>
              <label className="flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50/40 transition-colors">
                <FaUpload className="text-3xl text-gray-400" />
                <span className="text-gray-700 font-medium">
                  Choose the {label.file} file
                </span>
                <span className="text-xs text-gray-500">
                  .xlsx, .xls or .csv
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>

              <div className="mt-5 text-sm text-gray-600 space-y-2">
                <p className="font-medium text-gray-700">
                  The file needs these columns:
                </p>
                <p className="text-xs bg-gray-50 p-3 rounded-lg font-mono">
                  {label.columns}
                </p>
                <p className="text-xs text-gray-500">
                  Students are matched on <strong>Student ID</strong>. Rows with
                  an ID this campus does not have are reported, not imported.
                </p>
              </div>
            </div>
          ) : (
            /* ---------- step 2: preview ---------- */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaFileExcel className="text-green-600" />
                <span className="font-medium">{file.name}</span>
                <button
                  onClick={reset}
                  className="ml-auto text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <FaArrowLeft /> Choose another
                </button>
              </div>

              {loading && !preview ? (
                <Loader fullscreen={false} size={92} />
              ) : preview ? (
                <>
                  {/* Which campus this lands in. Importing into the wrong one
                      is indistinguishable from a failed import afterwards. */}
                  {preview.campus && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <FaSchool className="text-blue-600 shrink-0" />
                      <p className="text-sm text-blue-800">
                        Importing into <strong>{preview.campus.name}</strong>
                        {preview.campus.code && ` (${preview.campus.code})`}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Rows", value: preview.counts.total },
                      { label: "Matched", value: preview.counts.matched },
                      {
                        label: kind === "payments" ? "Payments" : "Balances",
                        value:
                          kind === "payments"
                            ? preview.counts.payments
                            : preview.counts.matched,
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="p-3 bg-gray-50 rounded-xl text-center"
                      >
                        <p className="text-2xl font-bold text-gray-800">
                          {s.value}
                        </p>
                        <p className="text-xs text-gray-500">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl text-center">
                    <p className="text-xs text-gray-500">
                      {kind === "payments"
                        ? "Total in this file"
                        : "Total outstanding in this file"}
                    </p>
                    <p className="text-xl font-bold text-gray-800">
                      Rs{" "}
                      {money(
                        kind === "payments"
                          ? preview.counts.totalAmount
                          : preview.counts.totalOutstanding
                      )}
                    </p>
                  </div>

                  {/* How much of the campus this overwrites. A wrong file is
                      far cheaper to catch here than afterwards. */}
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
                    {label.note}{" "}
                    {preview.existingRecords > 0 && (
                      <>
                        This campus currently has{" "}
                        <strong>{preview.existingRecords}</strong> record
                        {preview.existingRecords === 1 ? "" : "s"} on file.
                      </>
                    )}{" "}
                    Students not named in this file are left untouched.
                  </div>

                  {preview.unmatched?.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                      <p className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
                        <FaUserSlash /> {preview.unmatched.length} row
                        {preview.unmatched.length === 1 ? "" : "s"} match no
                        student here
                      </p>
                      <p className="text-xs text-amber-700 mb-2">
                        These will be skipped. Check you opened the right
                        campus, or add the students first.
                      </p>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {preview.unmatched.slice(0, 30).map((u) => (
                          <span
                            key={`${u.row}-${u.studentId}`}
                            className="text-xs bg-white/70 px-2 py-1 rounded"
                          >
                            {u.studentId}
                          </span>
                        ))}
                        {preview.unmatched.length > 30 && (
                          <span className="text-xs text-amber-700">
                            +{preview.unmatched.length - 30} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {preview.errors?.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                      <p className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                        <FaExclamationTriangle /> {preview.errors.length} problem
                        {preview.errors.length === 1 ? "" : "s"} — nothing will
                        be imported
                      </p>
                      <ul className="space-y-1 max-h-40 overflow-y-auto">
                        {preview.errors.slice(0, 20).map((e, i) => (
                          <li key={i} className="text-sm text-red-700">
                            {e.row ? `Row ${e.row}: ` : ""}
                            {e.message}
                          </li>
                        ))}
                      </ul>
                      {preview.errors.length > 20 && (
                        <p className="text-xs text-red-600 mt-2">
                          ... and {preview.errors.length - 20} more
                        </p>
                      )}
                    </div>
                  )}

                  {preview.sample?.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <p className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-100">
                        First few rows, as read
                      </p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-50 text-gray-500">
                            <tr>
                              <th className="px-3 py-2 text-left">Student</th>
                              <th className="px-3 py-2 text-left">ID</th>
                              {kind === "payments" ? (
                                <>
                                  <th className="px-3 py-2 text-left">Date</th>
                                  <th className="px-3 py-2 text-right">
                                    Amount
                                  </th>
                                </>
                              ) : (
                                <>
                                  <th className="px-3 py-2 text-left">
                                    Voucher
                                  </th>
                                  <th className="px-3 py-2 text-right">
                                    Outstanding
                                  </th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {preview.sample.map((r) => (
                              <tr key={r.rowNumber}>
                                <td className="px-3 py-2">{r.studentName}</td>
                                <td className="px-3 py-2">{r.studentId}</td>
                                {kind === "payments" ? (
                                  <>
                                    <td className="px-3 py-2">
                                      {r.payments?.[0]?.date || "—"}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {r.payments?.length
                                        ? money(
                                            r.payments.reduce(
                                              (s, p) => s + p.amount,
                                              0
                                            )
                                          )
                                        : "—"}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-3 py-2">
                                      {r.voucherNumber || "—"}
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      {money(r.totalOutstanding)}
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0">
          {result ? (
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-white rounded-xl font-medium"
              style={{
                background: "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)",
              }}
            >
              Done
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!preview?.canImport || loading}
                className="px-5 py-2.5 text-white rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background:
                    "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)",
                }}
              >
                {loading
                  ? "Importing..."
                  : preview
                  ? `Import ${preview.counts.matched} student${
                      preview.counts.matched === 1 ? "" : "s"
                    }`
                  : "Import"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportFeesModal;
