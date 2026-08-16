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
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";

/**
 * Bulk staff import from a spreadsheet.
 *
 * Two steps, matching the two endpoints: preview reads the file and reports what
 * would happen without writing, then confirm actually imports. The file is sent
 * twice — once per step — so the server validates the exact bytes it imports.
 *
 * The whole file is refused if any row is wrong. A partial import would leave the
 * user working out which rows landed and which did not.
 */
const ImportStaffModal = ({ onClose, onImported }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const send = async (endpoint) => {
    const form = new FormData();
    form.append("file", file);
    return axios.post(endpoint, form);
  };

  const handleFile = async (chosen) => {
    if (!chosen) return;
    setFile(chosen);
    setPreview(null);
    setResult(null);

    try {
      setLoading(true);
      const form = new FormData();
      form.append("file", chosen);
      const res = await axios.post(API_ENDPOINTS.STAFF_IMPORT_PREVIEW, form);
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
      const res = await send(API_ENDPOINTS.STAFF_IMPORT_COMMIT);
      setResult(res.data);
      toast.success(
        `Imported ${res.data.created} staff member${
          res.data.created === 1 ? "" : "s"
        }`
      );
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
          style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
        >
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FaFileExcel /> Import Staff
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
                  <p className="font-semibold text-green-800">Import completed</p>
                  <p className="text-sm text-green-700 mt-1">
                    {result.created} staff member
                    {result.created === 1 ? "" : "s"} added
                    {result.updated > 0 && `, ${result.updated} updated`}.
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Portal logins are not created by an import. Give a teacher,
                principal or admin their login from the <strong>Access</strong>{" "}
                button on the staff list.
              </p>
            </div>
          ) : !file ? (
            /* ---------- step 1: choose a file ---------- */
            <div>
              <label className="flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#2F5DAA] hover:bg-blue-50/40 transition-colors">
                <FaUpload className="text-3xl text-gray-400" />
                <span className="text-gray-700 font-medium">
                  Choose an Excel or CSV file
                </span>
                <span className="text-xs text-gray-500">.xlsx, .xls or .csv</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </label>

              <div className="mt-5 text-sm text-gray-600 space-y-2">
                <p className="font-medium text-gray-700">
                  Required columns: <span className="font-semibold">Employee ID · Name · CNIC · Role</span>
                </p>
                <p className="text-xs bg-gray-50 p-3 rounded-lg font-mono">
                  Employee ID · Name · CNIC · Role · Phone · Address · Education ·
                  Salary
                </p>
                <p className="text-xs text-gray-500">
                  <strong>Role</strong> must be one of: admin, principal, teacher,
                  security guard, peon, others. <strong>CNIC</strong> accepts
                  digits or the dashed form (33104-2314266-7). Phone, Address,
                  Education and Salary are optional. A row whose Employee ID
                  already exists in this campus updates that staff member.
                </p>
              </div>
            </div>
          ) : (
            /* ---------- step 2: preview ---------- */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FaFileExcel className="text-[#2F5DAA]" />
                <span className="font-medium">{file.name}</span>
                <button
                  onClick={reset}
                  className="ml-auto text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <FaArrowLeft /> Choose another
                </button>
              </div>

              {loading && !preview ? (
                <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
              ) : preview ? (
                <>
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
                      { label: "To add", value: preview.counts.toCreate },
                      { label: "To update", value: preview.counts.toUpdate },
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

                  {preview.errors?.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                      <p className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                        <FaExclamationTriangle /> {preview.errors.length} problem
                        {preview.errors.length === 1 ? "" : "s"} — nothing will be
                        imported
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
                              <th className="px-3 py-2 text-left">Emp ID</th>
                              <th className="px-3 py-2 text-left">Name</th>
                              <th className="px-3 py-2 text-left">CNIC</th>
                              <th className="px-3 py-2 text-left">Role</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {preview.sample.map((r) => (
                              <tr key={r.rowNumber}>
                                <td className="px-3 py-2">{r.employeeId}</td>
                                <td className="px-3 py-2">{r.name}</td>
                                <td className="px-3 py-2">{r.cnic}</td>
                                <td className="px-3 py-2">{r.role || "—"}</td>
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
              style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
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
                style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
              >
                {loading
                  ? "Importing..."
                  : preview
                  ? `Import ${preview.counts.total} staff`
                  : "Import"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportStaffModal;
