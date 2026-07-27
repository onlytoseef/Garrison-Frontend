import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import API_BASE_URL from "../../config/api";
import { FaBook, FaCalendarAlt, FaPaperclip, FaFilePdf, FaImage } from "react-icons/fa";
import { MdMenuBook } from "react-icons/md";

const ParentDiary = () => {
  const [entries, setEntries] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const token = JSON.parse(localStorage.getItem("authState"))?.token;

  const fetchDiary = async (date) => {
    setLoading(true);
    try {
      const res = await axios.get(API_ENDPOINTS.PARENT_DIARY, {
        headers: { Authorization: `Bearer ${token}` },
        params: { date },
      });
      setEntries(res.data.entries || []);
      setStudentName(res.data.studentName || "");
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiary(selectedDate);
  }, [selectedDate]);

  const attachment = entries.find((e) => e.attachment)?.attachment;

  return (
    <div className="p-4 sm:p-6 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl" style={{ background: "linear-gradient(135deg, #243F73 0%, #365896 100%)" }}>
          <MdMenuBook className="text-white text-xl" />
        </div>
        Homework Diary {studentName && `— ${studentName}`}
      </h1>

      {/* Date picker */}
      <div className="flex items-center gap-2 mb-6">
        <FaCalendarAlt className="text-[#243F73]" />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-200 focus:border-[#243F73] rounded-xl outline-none transition-all duration-300 text-gray-700"
        />
      </div>

      {loading ? (
        <div className="glass-card p-5 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 mb-4">
              <div className="h-10 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded flex-1"></div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-card p-10 text-center text-gray-500">
          <FaBook className="text-5xl text-gray-300 mx-auto mb-3" />
          <p className="text-lg">No homework diary for this date.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          {/* Header */}
          <div className="px-5 sm:px-6 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #243F73 0%, #365896 100%)" }}>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <MdMenuBook className="text-xl" /> Daily Diary
            </h3>
            <span className="text-white/70 text-sm">
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-PK", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </span>
          </div>

          <div className="p-5 sm:p-6">
            {/* Subject entries */}
            <div className="space-y-3">
              <div className="hidden sm:grid grid-cols-12 gap-3 px-1 mb-1">
                <span className="col-span-1 text-xs font-bold text-gray-400">#</span>
                <span className="col-span-3 text-xs font-bold text-gray-400">SUBJECT</span>
                <span className="col-span-8 text-xs font-bold text-gray-400">HOMEWORK</span>
              </div>

              {entries.map((entry, idx) => (
                <div key={entry._id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center p-3 rounded-xl bg-gray-50 hover:bg-blue-50/50 transition-colors">
                  <div className="hidden sm:flex col-span-1 items-center">
                    <span className="w-8 h-8 flex items-center justify-center rounded-lg text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #243F73 0%, #365896 100%)" }}>
                      {idx + 1}
                    </span>
                  </div>
                  <div className="sm:col-span-3 flex items-center gap-2">
                    <span className="sm:hidden w-7 h-7 flex items-center justify-center rounded-lg text-white text-xs font-bold" style={{ background: "linear-gradient(135deg, #243F73 0%, #365896 100%)" }}>
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                      <FaBook className="text-[#243F73] text-sm" />
                      {entry.subject}
                    </span>
                  </div>
                  <div className="sm:col-span-8">
                    <p className="text-gray-700 text-sm bg-white px-4 py-2.5 rounded-xl border border-gray-100">
                      {entry.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Attachment */}
            {attachment && (
              <div className="mt-6 pt-5 border-t-2 border-gray-100">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <FaPaperclip className="text-[#243F73]" />
                  Class Attachment
                </label>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
                  {attachment.endsWith(".pdf") ? (
                    <FaFilePdf className="text-red-500 text-lg" />
                  ) : (
                    <FaImage className="text-blue-500 text-lg" />
                  )}
                  <a
                    href={`${API_BASE_URL}${attachment}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate font-medium"
                  >
                    {attachment.split("/").pop()}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDiary;
