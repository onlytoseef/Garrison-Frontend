import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaFileExcel,
  FaFileCsv,
  FaFilePdf,
  FaTimes,
  FaDownload,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";

/**
 * Roster export — pick a class (or all) and a format.
 *
 * Excel and CSV are built by the server, because the Students page only holds
 * one page of students at a time; exporting what is on screen would quietly
 * produce a 50-row file for a 600-student campus.
 *
 * PDF is different: it is built here, from the same rows, and handed to the
 * browser's print dialog where "Save as PDF" does the rest. That keeps a PDF
 * engine out of the backend, and the print preview doubles as the page the user
 * would print anyway.
 *
 * Parent credentials are deliberately absent from all three. A roster gets
 * shared and printed; passwords stay behind the per-student modal.
 */
const FORMATS = [
  {
    id: "xlsx",
    label: "Excel",
    hint: ".xlsx — opens in Excel",
    icon: FaFileExcel,
    color: "#0A8F4F",
  },
  {
    id: "csv",
    label: "CSV",
    hint: "Plain text, any tool",
    icon: FaFileCsv,
    color: "#2F5DAA",
  },
  {
    id: "pdf",
    label: "PDF",
    hint: "Print or save a list",
    icon: FaFilePdf,
    color: "#C0392B",
  },
];

const ExportStudentsModal = ({ classes = [], initialClassId = "", onClose }) => {
  const [classId, setClassId] = useState(initialClassId);
  const [format, setFormat] = useState("xlsx");
  const [busy, setBusy] = useState(false);

  const selectedClass = classes.find((c) => c._id === classId);
  const scopeLabel = selectedClass
    ? `${selectedClass.grade} - ${selectedClass.section}`
    : "All classes";

  /** Excel and CSV: ask the server for the file and save it. */
  const downloadFile = async () => {
    const res = await axios.get(API_ENDPOINTS.STUDENTS_EXPORT, {
      params: { format, ...(classId ? { classId } : {}) },
      responseType: "blob",
    });

    // Prefer the server's filename — it already carries the class and date.
    const disposition = res.headers["content-disposition"] || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : `students.${format}`;

    const url = URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded ${filename}`);
  };

  /**
   * PDF: fetch the same rows as CSV, then render them into a print window.
   * CSV is parsed rather than re-queried so the PDF can never disagree with
   * the spreadsheet — one endpoint, one source of truth.
   */
  const openPdf = async () => {
    const res = await axios.get(API_ENDPOINTS.STUDENTS_EXPORT, {
      params: { format: "csv", ...(classId ? { classId } : {}) },
      responseType: "text",
    });

    const lines = res.data.replace(/^﻿/, "").trim().split(/\r?\n/);
    // Fields are quoted only when they contain a comma, so a naive split would
    // break addresses. This walks the line and respects quotes.
    const parseRow = (line) => {
      const out = [];
      let value = "";
      let quoted = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (quoted && line[i + 1] === '"') {
            value += '"';
            i++;
          } else quoted = !quoted;
        } else if (ch === "," && !quoted) {
          out.push(value);
          value = "";
        } else value += ch;
      }
      out.push(value);
      return out;
    };

    const header = parseRow(lines[0]);
    const rows = lines.slice(1).map(parseRow);

    const escape = (text) =>
      String(text ?? "").replace(
        /[&<>]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]
      );

    const printed = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Landscape: ten columns do not fit portrait without shrinking the text to
    // something nobody can read across a room.
    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>Students — ${escape(scopeLabel)}</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      * { box-sizing: border-box; }
      body { font-family: Arial, Helvetica, sans-serif; margin: 0; color: #1a1a1a; }
      .head { border-bottom: 2px solid #1E3F72; padding-bottom: 8px; margin-bottom: 12px; }
      .school { font-size: 17px; font-weight: bold; color: #1E3F72; }
      .meta { display: flex; justify-content: space-between; font-size: 11px; margin-top: 4px; color: #555; }
      table { width: 100%; border-collapse: collapse; font-size: 10px; }
      thead { display: table-header-group; }
      th { background: #1E3F72; color: #fff; text-align: left; padding: 5px 6px; font-weight: 600; }
      td { padding: 4px 6px; border-bottom: 1px solid #ddd; }
      tr:nth-child(even) td { background: #f6f8fb; }
      tr { page-break-inside: avoid; }
      .addr { max-width: 190px; }
      .foot { margin-top: 10px; font-size: 9px; color: #888; text-align: right; }
    </style>
  </head>
  <body>
    <div class="head">
      <div class="school">Quaid-e-Azam Group of Colleges</div>
      <div class="meta">
        <span><strong>Student List — ${escape(scopeLabel)}</strong></span>
        <span>${rows.length} student${rows.length === 1 ? "" : "s"} &nbsp;·&nbsp; ${printed}</span>
      </div>
    </div>
    <table>
      <thead>
        <tr>${header.map((h) => `<th>${escape(h)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r) =>
              `<tr>${r
                .map(
                  (cell, i) =>
                    `<td${i === 8 ? ' class="addr"' : ""}>${escape(cell)}</td>`
                )
                .join("")}</tr>`
          )
          .join("")}
      </tbody>
    </table>
    <div class="foot">Generated ${printed}</div>
  </body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Allow pop-ups for this site to export a PDF");
      return;
    }
    win.document.write(html);
    win.document.close();
    // Give the browser a moment to lay the table out before the dialog opens,
    // otherwise the preview can come up blank on a long list.
    win.onload = () => setTimeout(() => win.print(), 300);

    toast.success('Choose "Save as PDF" in the print dialog');
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      if (format === "pdf") await openPdf();
      else await downloadFile();
      onClose();
    } catch (err) {
      // The error body is a Blob when responseType is blob, so it has to be
      // read back as text before the message is visible.
      let message = "Export failed";
      const data = err.response?.data;
      if (data instanceof Blob) {
        try {
          message = JSON.parse(await data.text()).message || message;
        } catch {
          /* keep the default */
        }
      } else if (data?.message) message = data.message;
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[92vh]">
        <div
          className="flex items-center justify-between px-6 py-4 text-white rounded-t-2xl shrink-0"
          style={{
            background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
          }}
        >
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FaDownload /> Export Students
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Which students?
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.grade} - {cls.section}
                  {cls.studentCount != null ? ` (${cls.studentCount})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {FORMATS.map((f) => {
                const Icon = f.icon;
                const active = format === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all ${
                      active
                        ? "border-blue-500 bg-blue-50/60 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="text-2xl" style={{ color: f.color }} />
                    <span className="text-sm font-semibold text-gray-800">
                      {f.label}
                    </span>
                    <span className="text-[10px] text-gray-500 text-center leading-tight">
                      {f.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 space-y-1">
            <p>
              <strong className="text-gray-800">{scopeLabel}</strong> — roll
              number, ID, name, father name, class, section, gender, contact,
              address and status.
            </p>
            <p className="text-xs text-gray-500">
              Parent logins are not included. View those from the key icon on a
              student.
            </p>
            {format === "pdf" && (
              <p className="text-xs text-gray-500">
                Opens a print preview — pick “Save as PDF” as the destination.
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={busy}
            className="px-5 py-2.5 text-white rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
            style={{
              background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
            }}
          >
            <FaDownload />
            {busy
              ? "Preparing..."
              : format === "pdf"
              ? "Open print view"
              : `Download ${format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportStudentsModal;
