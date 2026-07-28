import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import { FaChartBar, FaCheckCircle, FaTimesCircle, FaTrophy } from "react-icons/fa";

const ParentResults = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = JSON.parse(localStorage.getItem("authState"))?.token;

  useEffect(() => {
    const fetch = async () => {
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
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-gray-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  if (!data || data.results.length === 0) {
    return (
      <div className="p-6 min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl" style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}>
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

  return (
    <div className="p-4 sm:p-6 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl" style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}>
          <FaChartBar className="text-white text-xl" />
        </div>
        Exam Results — {data.studentName}
      </h1>

      <div className="space-y-5">
        {data.results.map(({ exam, result }) => (
          <div key={exam._id} className="glass-card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}>
              <div>
                <h3 className="text-white font-bold text-lg">{exam.name}</h3>
                <p className="text-white/70 text-sm capitalize">{exam.examType} — {exam.academicYear}</p>
              </div>
              {result && (
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${result.isPass ? "bg-green-400/20 text-green-100" : "bg-red-400/20 text-red-100"}`}>
                    {result.isPass ? "PASS" : "FAIL"}
                  </span>
                </div>
              )}
            </div>

            <div className="p-5">
              {!result ? (
                <p className="text-gray-500 text-sm">Results not yet entered for this student.</p>
              ) : (
                <>
                  {/* Summary row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="bg-blue-50 p-3 rounded-xl text-center">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-lg font-bold text-gray-800">{result.obtainedMarks}/{result.totalMarks}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl text-center">
                      <p className="text-xs text-gray-500">Percentage</p>
                      <p className="text-lg font-bold text-gray-800">{result.percentage}%</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-xl text-center">
                      <p className="text-xs text-gray-500">Grade</p>
                      <p className="text-lg font-bold text-gray-800">{result.grade}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl text-center">
                      <p className="text-xs text-gray-500">Position</p>
                      <p className="text-lg font-bold text-gray-800 flex items-center justify-center gap-1">
                        <FaTrophy className="text-yellow-500" /> {result.position || "—"}
                      </p>
                    </div>
                  </div>

                  {/* Subject wise marks */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Subject</th>
                        <th className="text-center px-4 py-2 font-semibold text-gray-600">Obtained</th>
                        <th className="text-center px-4 py-2 font-semibold text-gray-600">Total</th>
                        <th className="text-center px-4 py-2 font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.marks?.map((mark, idx) => {
                        const examSubject = exam.subjects.find((s) => s.subjectName === mark.subjectName);
                        const passing = examSubject?.passingMarks || 33;
                        const passed = mark.obtainedMarks >= passing;

                        return (
                          <tr key={idx} className="border-t border-gray-100">
                            <td className="px-4 py-2.5 font-medium text-gray-800">{mark.subjectName}</td>
                            <td className="px-4 py-2.5 text-center font-semibold">{mark.obtainedMarks}</td>
                            <td className="px-4 py-2.5 text-center text-gray-500">{mark.totalMarks}</td>
                            <td className="px-4 py-2.5 text-center">
                              {passed ? (
                                <FaCheckCircle className="text-green-500 inline" />
                              ) : (
                                <FaTimesCircle className="text-red-500 inline" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParentResults;
