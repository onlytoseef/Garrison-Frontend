import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchClassResults } from "../../store/slices/resultSlice";
import { FaArrowLeft, FaPrint, FaTrophy, FaUsers, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const NAVY = "#243F73";

const gradeColor = (grade) => {
  if (["A+", "A"].includes(grade)) return "text-green-700 bg-green-100";
  if (["B", "C"].includes(grade)) return "text-[#243F73] bg-blue-100";
  if (["D", "E"].includes(grade)) return "text-orange-600 bg-orange-100";
  return "text-red-600 bg-red-100";
};

const ClassResultSheet = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { classResults, classSummary, currentExam, loading } = useSelector(
    (state) => state.results
  );

  useEffect(() => {
    dispatch(fetchClassResults(examId));
  }, [dispatch, examId]);

  const printSheet = () => {
    const content = document.getElementById("result-sheet-print")?.innerHTML || "";
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Class Result Sheet</title>
          <style>
            body { font-family: 'Poppins', sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 12px; text-align: left; }
            th { background: ${NAVY}; color: #fff; }
            h1 { color: ${NAVY}; text-align: center; margin: 0; }
            .sub { text-align: center; color: #555; margin: 4px 0 12px; }
          </style>
        </head>
        <body>${content}
          <script>window.onload=function(){setTimeout(()=>{window.print();window.close();},400);};</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exam = currentExam;

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
                {exam ? `${exam.name} — Result Sheet` : "Result Sheet"}
              </h1>
              <p className="text-sm text-gray-500">
                {exam?.classId ? `${exam.classId.grade} - ${exam.classId.section}` : ""}
                {exam ? `  •  ${exam.academicYear}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={printSheet}
            disabled={!classResults || classResults.length === 0}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #365896 100%)` }}
          >
            <FaPrint /> Print Sheet
          </button>
        </div>

        {loading ? (
          <div className="glass-card p-10 text-center text-gray-500">Loading results...</div>
        ) : !classResults || classResults.length === 0 ? (
          <div className="glass-card p-10 text-center text-gray-500">
            No results entered for this exam yet.
          </div>
        ) : (
          <>
            {/* Summary cards */}
            {classSummary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="glass-card p-4 flex items-center gap-3 border border-gray-100">
                  <div className="p-3 rounded-full bg-blue-100 text-[#243F73]"><FaUsers /></div>
                  <div>
                    <p className="text-sm text-gray-500">Total Students</p>
                    <p className="text-2xl font-bold text-gray-800">{classSummary.totalStudents}</p>
                  </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-3 border border-gray-100">
                  <div className="p-3 rounded-full bg-green-100 text-green-700"><FaCheckCircle /></div>
                  <div>
                    <p className="text-sm text-gray-500">Passed</p>
                    <p className="text-2xl font-bold text-green-700">{classSummary.passCount}</p>
                  </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-3 border border-gray-100">
                  <div className="p-3 rounded-full bg-red-100 text-red-600"><FaTimesCircle /></div>
                  <div>
                    <p className="text-sm text-gray-500">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{classSummary.failCount}</p>
                  </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-3 border border-gray-100">
                  <div className="p-3 rounded-full bg-orange-100 text-orange-600"><FaTrophy /></div>
                  <div>
                    <p className="text-sm text-gray-500">Class Average</p>
                    <p className="text-2xl font-bold text-orange-600">{classSummary.classAverage}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Merit list */}
            <div className="glass-card p-4 border border-gray-100 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr
                    className="text-white"
                    style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #365896 100%)` }}
                  >
                    <th className="px-4 py-3 text-left text-sm font-semibold">Position</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Roll</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Student</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Obtained</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">%</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Grade</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Result</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {classResults.map((r, idx) => (
                    <tr key={r._id || idx} className={idx % 2 === 0 ? "bg-white/40" : "bg-white/20"}>
                      <td className="px-4 py-2 text-sm font-bold" style={{ color: NAVY }}>
                        {r.position || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {r.studentId?.rollNumber ?? "-"}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-800 whitespace-nowrap">
                        {r.studentId?.name || "-"}
                      </td>
                      <td className="px-4 py-2 text-center text-sm text-gray-700">
                        {r.obtainedMarks}/{r.totalMarks}
                      </td>
                      <td className="px-4 py-2 text-center text-sm font-semibold text-gray-800">
                        {r.percentage}%
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${gradeColor(r.grade)}`}>
                          {r.grade}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${r.isPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {r.isPass ? "PASS" : "FAIL"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => navigate(`/exams/${examId}/result/${r.studentId?._id}`)}
                          className="px-3 py-1.5 text-xs rounded-lg text-white font-medium"
                          style={{ background: NAVY }}
                        >
                          View Card
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Hidden printable version */}
            <div id="result-sheet-print" style={{ display: "none" }}>
              <h1>GARRISON SCHOOL SYSTEM</h1>
              <p className="sub">
                {exam?.name} ({exam?.examType}) — {exam?.classId?.grade} {exam?.classId?.section} — {exam?.academicYear}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Position</th><th>Roll</th><th>Student</th>
                    <th>Obtained</th><th>%</th><th>Grade</th><th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {classResults.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.position || "-"}</td>
                      <td>{r.studentId?.rollNumber ?? "-"}</td>
                      <td>{r.studentId?.name || "-"}</td>
                      <td>{r.obtainedMarks}/{r.totalMarks}</td>
                      <td>{r.percentage}%</td>
                      <td>{r.grade}</td>
                      <td>{r.isPass ? "PASS" : "FAIL"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClassResultSheet;
