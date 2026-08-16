import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import {
  FaChartBar,
  FaArrowLeft,
  FaPrint,
  FaTrophy,
  FaChevronRight,
} from "react-icons/fa";
import logo from "../../assets/images/logo.webp";

const NAVY = "#2F5DAA";
const GRAD = `linear-gradient(135deg, ${NAVY} 0%, #1E3F72 100%)`;

const gradeColor = (grade) => {
  if (["A+", "A"].includes(grade)) return "text-green-700 bg-green-100";
  if (["B", "C"].includes(grade)) return "text-[#2F5DAA] bg-blue-100";
  if (["D", "E"].includes(grade)) return "text-orange-600 bg-orange-100";
  return "text-red-600 bg-red-100";
};

/**
 * Parent result view. Same two-step flow as the admin side: a list of the
 * child's published exams, then the identical report card on click — the exact
 * ResultCard.jsx design (logo header, info grid, marks table, summary, print).
 */
const ParentResults = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const token = JSON.parse(localStorage.getItem("authState"))?.token;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.PARENT_RESULTS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const printCard = () => {
    const content =
      document.getElementById("report-card-print")?.innerHTML || "";
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Report Card</title>
          <style>
            body { font-family: 'Poppins', sans-serif; padding: 24px; color: #1f2937; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 13px; text-align: left; }
            th { background: ${NAVY}; color: #fff; }
            .center { text-align: center; }
          </style>
        </head>
        <body>${content}
          <script>window.onload=function(){setTimeout(()=>{window.print();window.close();},400);};</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <div className="p-6 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl" style={{ background: GRAD }}>
            <FaChartBar className="text-white text-xl" />
          </div>
          Exam Results
        </h1>
        <div className="glass-card p-10 text-center text-gray-500">
          <FaChartBar className="text-5xl text-gray-300 mx-auto mb-3" />
          <p className="text-lg">No published results available yet.</p>
        </div>
      </div>
    );
  }

  const student = data.student || {};
  const selected = data.results.find((r) => r.exam._id === selectedId);

  // ----------------------------------------------------------------------
  // Report card view — the same design as the admin ResultCard.
  // ----------------------------------------------------------------------
  if (selected && selected.result) {
    const { exam, result } = selected;
    return (
      <div className="min-h-screen bg-white p-4 sm:p-6">
        <div className="max-w-3xl mx-auto animate-fadeIn">
          {/* Controls (not printed) */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-2 p-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
            >
              <FaArrowLeft /> Back
            </button>
            <button
              onClick={printCard}
              className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all"
              style={{ background: GRAD }}
            >
              <FaPrint /> Print
            </button>
          </div>

          {/* Card */}
          <div
            id="report-card-print"
            className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200"
          >
            {/* Header */}
            <div
              className="flex flex-col items-center border-b-2 pb-4 mb-4"
              style={{ borderColor: NAVY }}
            >
              <img src={logo} alt="Logo" style={{ width: 70, marginBottom: 8 }} />
              <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
                THE QUAID-E-AZAM GROUP OF SCHOOLS &amp; COLLEGES
              </h1>
              <p className="text-sm text-gray-500">Student Report Card</p>
            </div>

            {/* Exam + student info */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-6 text-sm mb-5">
              <p>
                <span className="font-semibold text-gray-600">Exam:</span>{" "}
                {exam?.name} ({exam?.examType})
              </p>
              <p>
                <span className="font-semibold text-gray-600">Year:</span>{" "}
                {exam?.academicYear}
              </p>
              <p>
                <span className="font-semibold text-gray-600">Class:</span>{" "}
                {student.grade} - {student.section}
              </p>
              <p>
                <span className="font-semibold text-gray-600">Position:</span>{" "}
                {result.position || "-"}
              </p>
              <p>
                <span className="font-semibold text-gray-600">Name:</span>{" "}
                {student.name}
              </p>
              <p>
                <span className="font-semibold text-gray-600">Roll No:</span>{" "}
                {student.rollNumber}
              </p>
              <p>
                <span className="font-semibold text-gray-600">Student ID:</span>{" "}
                {student.studentId}
              </p>
              <p>
                <span className="font-semibold text-gray-600">Guardian:</span>{" "}
                {student.guardianName || "-"}
              </p>
            </div>

            {/* Marks table */}
            <table className="w-full border-collapse mb-5">
              <thead>
                <tr className="text-white" style={{ background: NAVY }}>
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm">
                    Subject
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm">
                    Total
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm">
                    Passing
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm">
                    Obtained
                  </th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.marks.map((m, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      {m.subjectName}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                      {m.totalMarks}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                      {m.passingMarks}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">
                      {m.obtainedMarks}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                      {m.grade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-lg bg-gray-50 text-center">
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-bold text-gray-800">
                  {result.obtainedMarks}/{result.totalMarks}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 text-center">
                <p className="text-xs text-gray-500">Percentage</p>
                <p className="font-bold" style={{ color: NAVY }}>
                  {result.percentage}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 text-center">
                <p className="text-xs text-gray-500">Grade</p>
                <p
                  className={`inline-block px-2 py-0.5 rounded-full text-sm font-bold ${gradeColor(
                    result.grade
                  )}`}
                >
                  {result.grade}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 text-center">
                <p className="text-xs text-gray-500">Result</p>
                <p
                  className={`inline-block px-2 py-0.5 rounded-full text-sm font-bold ${
                    result.isPass
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {result.isPass ? "PASS" : "FAIL"}
                </p>
              </div>
            </div>

            {result.remarks && (
              <p className="text-sm text-gray-600 mb-6">
                <span className="font-semibold">Remarks:</span> {result.remarks}
              </p>
            )}

            {/* Signatures */}
            <div className="flex justify-between mt-10 pt-4 text-sm text-gray-600">
              <div className="text-center">
                <div className="border-t border-gray-400 w-40 mb-1"></div>
                Class Teacher
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 w-40 mb-1"></div>
                Principal
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // List view — the child's published exams; click to open the report card.
  // ----------------------------------------------------------------------
  return (
    <div className="p-4 sm:p-6 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl" style={{ background: GRAD }}>
          <FaChartBar className="text-white text-xl" />
        </div>
        Exam Results — {data.studentName}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.results.map(({ exam, result }) => {
          const hasResult = !!result;
          return (
            <button
              key={exam._id}
              onClick={() => hasResult && setSelectedId(exam._id)}
              disabled={!hasResult}
              className={`glass-card p-5 text-left flex flex-col ${
                hasResult
                  ? "hover:shadow-lg transition-shadow cursor-pointer"
                  : "opacity-70 cursor-default"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-800 truncate">
                    {exam.name}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {exam.examType} — {exam.academicYear}
                  </p>
                </div>
                {hasResult && (
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
                      result.isPass
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {result.isPass ? "PASS" : "FAIL"}
                  </span>
                )}
              </div>

              {hasResult ? (
                <>
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <span className="text-gray-600">
                      <span className="font-bold text-gray-800">
                        {result.percentage}%
                      </span>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${gradeColor(
                        result.grade
                      )}`}
                    >
                      {result.grade}
                    </span>
                    {result.position ? (
                      <span className="flex items-center gap-1 text-gray-600 text-xs">
                        <FaTrophy className="text-yellow-500" /> Position{" "}
                        {result.position}
                      </span>
                    ) : null}
                  </div>
                  <span
                    className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: NAVY }}
                  >
                    View report card <FaChevronRight className="text-xs" />
                  </span>
                </>
              ) : (
                <p className="text-sm text-gray-400 mt-1">
                  Result not entered yet.
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ParentResults;
