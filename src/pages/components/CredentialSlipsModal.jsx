import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFileExcel,
  FaTimes,
  FaSpinner,
  FaDownload,
  FaPrint,
  FaKey,
  FaClipboardList,
  FaExclamationTriangle,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";

const NAVY = "#1E3F72";

/**
 * Print one class's parent login slips.
 *
 * The office used to open each pupil's credentials modal one at a time to read a
 * password. This does the whole class in one pass: pick the class, print, cut, and
 * the slips go home in the diary.
 *
 * The slips are the browser's own print-to-PDF, rendered from `format=json` off the
 * same endpoint that streams the spreadsheet — so the paper a parent receives and
 * the file the office keeps cannot drift apart. Same trade as the result export:
 * no PDF library on the server.
 *
 * A pupil whose stored password cannot be decrypted gets no slip. Printing an empty
 * password box would send a parent home with a credential that cannot work, so they
 * are listed at the end of the sheet as needing a reset instead.
 */
const CredentialSlipsModal = ({ classes = [], initialClassId = null, onClose }) => {
  const [classId, setClassId] = useState(initialClassId || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(null);

  /* Load the class once on pick: the summary below the selector and both printed
     sheets all read from this, so choosing a class costs one request, not three. */
  useEffect(() => {
    if (!classId) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setData(null);

    axios
      .get(API_ENDPOINTS.STUDENT_CREDENTIALS_EXPORT(classId, "json"))
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(
          err.response?.data?.message || "Could not load this class's logins"
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [classId]);

  const downloadFile = async (format) => {
    setBusy(format);
    try {
      const res = await axios.get(
        API_ENDPOINTS.STUDENT_CREDENTIALS_EXPORT(classId, format),
        { responseType: "blob" }
      );

      const disposition = res.headers["content-disposition"] || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const name = match?.[1] || `logins.${format}`;

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
        err.response?.data?.message ||
          `Could not export the ${format.toUpperCase()}`
      );
    } finally {
      setBusy(null);
    }
  };

  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])
    );

  const openPrintWindow = (title, bodyHtml, extraCss = "") => {
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Allow pop-ups for this site to print");
      return false;
    }

    win.document.write(`<!doctype html><html><head>
<title>${esc(title)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; color: #111; margin: 0; }
  @page { size: A4; margin: 8mm; }
  ${extraCss}
</style></head><body>${bodyHtml}
<script>window.onload=function(){setTimeout(function(){window.print();},300);};</script>
</body></html>`);
    win.document.close();
    return true;
  };

  /* 2 columns x 4 rows on A4 portrait. The slip is sized in mm so the cut lines
     land in the same place on every page and a guillotine can take the whole
     stack in two passes. */
  const SLIP_CSS = `
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; }
  .slip {
    height: 66mm; padding: 4mm 4.5mm;
    border: 1px dashed #9aa8bb; border-radius: 2mm;
    page-break-inside: avoid; display: flex; flex-direction: column;
  }
  .head { display: flex; justify-content: space-between; align-items: baseline;
          border-bottom: 1.5px solid ${NAVY}; padding-bottom: 1.5mm; }
  .campus { font-size: 10px; font-weight: 700; color: ${NAVY}; letter-spacing: .2px; }
  .klass  { font-size: 9px; color: #555; white-space: nowrap; }
  .who { margin-top: 2.5mm; font-size: 10px; line-height: 1.5; }
  .who b { font-size: 11.5px; }
  .who span { color: #666; }
  .creds { margin-top: auto; background: #f4f7fb; border-radius: 1.5mm;
           padding: 2.5mm 3mm; }
  .row { display: flex; gap: 2mm; font-size: 9px; line-height: 1.6; }
  .row .k { color: #667; width: 15mm; flex-shrink: 0; }
  .row .v { font-family: ui-monospace, "Courier New", monospace;
            font-weight: 700; word-break: break-all; }
  .pw { font-size: 13px !important; letter-spacing: .6px; color: ${NAVY}; }
  .foot { margin-top: 2mm; font-size: 7.5px; color: #777; line-height: 1.45; }
  .reset { margin-top: 8mm; page-break-before: auto; }
  .reset h2 { font-size: 12px; color: #b45309; margin: 0 0 2mm; }
  .reset table { width: 100%; border-collapse: collapse; }
  .reset th, .reset td { border: 1px solid #e2c89a; padding: 3px 5px;
                         font-size: 10px; text-align: left; }
  .reset th { background: #fef3c7; }
`;

  const printSlips = () => {
    if (!data) return;
    const printable = data.students.filter((s) => !s.needsReset);
    if (printable.length === 0) {
      toast.error("No pupil in this class has a usable password yet");
      return;
    }

    const slips = printable
      .map(
        (s) => `<div class="slip">
      <div class="head">
        <span class="campus">${esc(data.campus.name)}</span>
        <span class="klass">Class ${esc(data.className)}</span>
      </div>
      <div class="who">
        <b>${esc(s.name)}</b>${
          s.rollNumber ? ` <span>&nbsp;Roll ${esc(s.rollNumber)}</span>` : ""
        }<br>
        <span>Father / Guardian:</span> ${esc(s.guardianName ?? "—")}
      </div>
      <div class="creds">
        <div class="row"><span class="k">Login ID</span><span class="v">${esc(
          s.loginId
        )}</span></div>
        <div class="row"><span class="k">Password</span><span class="v pw">${esc(
          s.password
        )}</span></div>
      </div>
      <div class="foot">
        Install the <b>The QGSC</b> app and sign in with the details above.
        Change this password from <b>Profile</b> in the app after your first
        login, and keep this slip private.
      </div>
    </div>`
      )
      .join("");

    // Pad the last page so a lone slip is not stretched by the grid.
    const pad = (2 - (printable.length % 2)) % 2;
    const padding = '<div class="slip" style="border:none"></div>'.repeat(pad);

    const needsReset = data.students.filter((s) => s.needsReset);
    const resetBlock = needsReset.length
      ? `<div class="reset">
      <h2>No slip printed — password reset required (${needsReset.length})</h2>
      <table><thead><tr><th>Roll</th><th>Student ID</th><th>Name</th><th>Guardian</th></tr></thead>
      <tbody>${needsReset
        .map(
          (s) => `<tr><td>${esc(s.rollNumber ?? "")}</td><td>${esc(
            s.studentId
          )}</td><td>${esc(s.name)}</td><td>${esc(
            s.guardianName ?? ""
          )}</td></tr>`
        )
        .join("")}</tbody></table>
    </div>`
      : "";

    openPrintWindow(
      `Login slips — ${data.className}`,
      `<div class="grid">${slips}${padding}</div>${resetBlock}`,
      SLIP_CSS
    );
  };

  const REGISTER_CSS = `
  body { padding: 4mm; }
  h1 { font-size: 15px; margin: 0; text-align: center; color: ${NAVY}; }
  .sub { text-align: center; font-size: 11px; color: #555; margin: 3px 0 10px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #c9d3e0; padding: 5px 6px; font-size: 10px; }
  th { background: ${NAVY}; color: #fff; font-weight: 600; text-align: left; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  td.sig { height: 11mm; }
`;

  /* The paper half of the job. Slips leave the office with no record of who got
     one; this is the sheet the clerk collects signatures on, so "we never
     received it" has an answer. */
  const printRegister = () => {
    if (!data) return;
    const rows = data.students
      .map(
        (s, i) => `<tr>
      <td>${i + 1}</td>
      <td>${esc(s.rollNumber ?? "")}</td>
      <td>${esc(s.studentId)}</td>
      <td>${esc(s.name)}</td>
      <td>${esc(s.guardianName ?? "")}</td>
      <td>${esc(s.guardianPhone ?? "")}</td>
      <td>${s.needsReset ? "reset required" : ""}</td>
      <td class="sig"></td>
    </tr>`
      )
      .join("");

    openPrintWindow(
      `Distribution register — ${data.className}`,
      `<h1>${esc(data.campus.name)}</h1>
     <p class="sub">Login slip distribution register &mdash; Class ${esc(
       data.className
     )}</p>
     <table><thead><tr>
       <th>#</th><th>Roll</th><th>Student ID</th><th>Name</th>
       <th>Guardian</th><th>Phone</th><th>Note</th><th>Received by (signature)</th>
     </tr></thead><tbody>${rows}</tbody></table>`,
      REGISTER_CSS
    );
  };

  const anyBusy = !!busy || loading;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={anyBusy ? undefined : onClose}
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
              <FaKey style={{ color: NAVY }} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold text-gray-900">
                Parent login slips
              </h3>
              <p className="text-[12px] text-gray-500">
                Print a whole class at once, then cut and send home
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={anyBusy}
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
                onChange={(e) => setClassId(e.target.value)}
                disabled={!!busy}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select a class…</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.grade} - {c.section}
                  </option>
                ))}
              </select>
            </div>

            {loading && (
              <p className="flex items-center gap-2 text-[12px] text-gray-500">
                <FaSpinner className="animate-spin" /> Reading the class…
              </p>
            )}

            {data && (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-600">Active pupils</span>
                  <span className="font-semibold text-gray-900">
                    {data.summary.totalActive}
                  </span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-gray-600">Slips to print</span>
                  <span className="font-semibold text-green-700">
                    {data.summary.ready}
                  </span>
                </div>
                {data.summary.needsReset > 0 && (
                  <div className="flex items-start gap-1.5 text-[11px] text-amber-700 pt-1">
                    <FaExclamationTriangle className="mt-0.5 shrink-0" />
                    <span>
                      {data.summary.needsReset} pupil(s) have no readable
                      password. They get no slip — reset them from the roster,
                      then print again.
                    </span>
                  </div>
                )}
                {data.summary.blockedSkipped > 0 && (
                  <p className="text-[11px] text-gray-500 pt-1">
                    {data.summary.blockedSkipped} blocked pupil(s) skipped.
                  </p>
                )}
              </div>
            )}

            {data && data.summary.totalActive === 0 && (
              <p className="text-[12px] text-amber-600">
                This class has no active pupils.
              </p>
            )}
          </div>

          <div className="px-5 pb-2">
            <button
              onClick={printSlips}
              disabled={!data || data.summary.ready === 0 || anyBusy}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: NAVY }}
            >
              <FaPrint />
              Print slips
              {data?.summary.ready ? ` (${data.summary.ready})` : ""}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 px-5 py-3">
            <button
              onClick={printRegister}
              disabled={!data || data.summary.totalActive === 0 || anyBusy}
              className="py-2.5 rounded-xl text-[12px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              title="Signature sheet for handing the slips out"
            >
              <FaClipboardList />
              Register
            </button>
            <button
              onClick={() => downloadFile("xlsx")}
              disabled={!classId || anyBusy}
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
              disabled={!classId || anyBusy}
              className="py-2.5 rounded-xl text-[12px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {busy === "csv" ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaDownload />
              )}
              CSV
            </button>
          </div>

          <p className="px-5 pb-4 text-[11px] text-gray-400 text-center">
            8 slips per A4 page. Print opens the browser dialog — choose “Save as
            PDF” if you want a file. These sheets carry live passwords: cut them
            up and hand them out, do not leave the stack lying around.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CredentialSlipsModal;
