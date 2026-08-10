import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaFileExcel,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCopy,
  FaUpload,
  FaArrowLeft,
  FaSchool,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";

/**
 * Bulk student import from a spreadsheet.
 *
 * Two steps, matching the two endpoints: preview reads the file and reports what
 * would happen without writing, then confirm actually imports. The file is sent
 * twice — once per step — so the server validates the exact bytes it imports
 * rather than trusting something cached from an earlier request.
 *
 * The whole file is refused if any row is wrong. A partial import would leave
 * the user working out which rows landed and which did not.
 */
const ImportStudentsModal = ({ onClose, onImported }) => {
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
      const res = await axios.post(API_ENDPOINTS.IMPORT_PREVIEW, form);
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
      const res = await send(API_ENDPOINTS.IMPORT_COMMIT);
      setResult(res.data);
      toast.success(
        `Imported ${res.data.created} student${res.data.created === 1 ? "" : "s"}`
      );
      onImported?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!result?.credentials?.length) return;
    const text = result.credentials
      .map((c) => `${c.studentId}\t${c.name}\t${c.email}\t${c.password}`)
      .join("\n");
    navigator.clipboard.writeText(
      `Student ID\tName\tParent Email\tPassword\n${text}`
    );
    toast.success("Credentials copied — paste into a spreadsheet");
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
            <FaFileExcel /> Import Students
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
                    {result.created} student{result.created === 1 ? "" : "s"}{" "}
                    added
                    {result.updated > 0 && `, ${result.updated} updated`}
                    {result.createdClasses?.length > 0 &&
                      `, ${result.createdClasses.length} class${
                        result.createdClasses.length === 1 ? "" : "es"
                      } created`}
                    .
                  </p>
                </div>
              </div>

              {result.createdClasses?.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-sm text-amber-800 font-medium mb-1">
                    New classes need a room and teacher
                  </p>
                  <p className="text-xs text-amber-700 mb-2">
                    The spreadsheet does not carry those, so they were left
                    blank. Set them from the Classes page.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.createdClasses.map((c) => (
                      <span
                        key={c.id}
                        className="text-xs bg-white/70 px-2 py-1 rounded"
                      >
                        {c.grade} - {c.section}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.credentials?.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <span className="text-sm font-semibold text-gray-700">
                      Parent logins ({result.credentials.length})
                    </span>
                    <button
                      onClick={copyCredentials}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <FaCopy /> Copy all
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                    {result.credentials.map((c) => (
                      <div key={c.studentId} className="px-4 py-2 text-xs">
                        <div className="font-medium text-gray-800">
                          {c.name}{" "}
                          <span className="text-gray-400">({c.studentId})</span>
                        </div>
                        <div className="text-gray-500 break-all">
                          {c.email} · {c.password}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-100">
                    These are also available any time from the key icon on each
                    student.
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
                  Choose an Excel or CSV file
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
                  Student Name · Father Name · Sem/Class · Section · Gender ·
                  Student Cell No · Permanent Address
                </p>
                <p className="text-xs text-gray-500">
                  <strong>Student ID</strong> is optional — leave it out and IDs
                  are generated. Classes that do not exist yet are created
                  automatically.
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
                <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
              ) : preview ? (
                <>
                  {/* Which campus this lands in. Importing into the wrong one
                      is indistinguishable from a failed import afterwards:
                      the Students page just looks empty. */}
                  {preview.campus && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <FaSchool className="text-blue-600 shrink-0" />
                      <p className="text-sm text-blue-800">
                        Importing into{" "}
                        <strong>{preview.campus.name}</strong>
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

                  {/* Casing conflicts are the one problem the user must fix in
                      the file itself, so they are called out separately. */}
                  {preview.casingConflicts?.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                      <p className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                        <FaExclamationTriangle /> Same class written two ways
                      </p>
                      <ul className="space-y-1.5">
                        {preview.casingConflicts.map((c) => (
                          <li key={c.key} className="text-sm text-red-700">
                            {c.message}
                          </li>
                        ))}
                      </ul>
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

                  {preview.newClasses?.length > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <p className="text-sm font-semibold text-blue-800 mb-2">
                        {preview.newClasses.length} new class
                        {preview.newClasses.length === 1 ? "" : "es"} will be
                        created
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {preview.newClasses.map((c) => (
                          <span
                            key={`${c.grade}-${c.section}`}
                            className="text-xs bg-white/70 px-2 py-1 rounded"
                          >
                            {c.grade} - {c.section}
                            <span className="text-blue-500 ml-1">
                              ({c.studentCount})
                            </span>
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        Room number and teacher are set later from the Classes
                        page.
                      </p>
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
                              <th className="px-3 py-2 text-left">Name</th>
                              <th className="px-3 py-2 text-left">Class</th>
                              <th className="px-3 py-2 text-left">Guardian</th>
                              <th className="px-3 py-2 text-left">Phone</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {preview.sample.map((r) => (
                              <tr key={r.rowNumber}>
                                <td className="px-3 py-2">{r.name}</td>
                                <td className="px-3 py-2">
                                  {r.grade} - {r.section}
                                </td>
                                <td className="px-3 py-2">{r.guardianName}</td>
                                <td className="px-3 py-2">{r.guardianPhone}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {preview.canImport && preview.counts.toCreate > 0 && (
                    <p className="text-xs text-gray-500">
                      A parent login is created for each new student. This takes
                      a few seconds for a large file.
                    </p>
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
                  ? `Import ${preview.counts.total} student${
                      preview.counts.total === 1 ? "" : "s"
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

export default ImportStudentsModal;
