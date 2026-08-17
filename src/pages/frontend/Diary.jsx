import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { API_ENDPOINTS } from "../../config/api";
import API_BASE_URL from "../../config/api";
import { isReadOnlyRole } from "../../utils/permissions";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaBook,
  FaCalendarAlt,
  FaChalkboardTeacher,
  FaDoorOpen,
  FaUserGraduate,
  FaPaperclip,
  FaSave,
  FaFilePdf,
  FaImage,
  FaTimes,
} from "react-icons/fa";
import { MdMenuBook, MdSubject } from "react-icons/md";

const Diary = () => {
  // Teachers only ever see the diary for the subjects they own in a class. The
  // subject rows below are filtered to those, and the save only sends them — the
  // API enforces the same, so a teacher can never write another subject's diary.
  const { user } = useSelector((state) => state.auth);
  const isTeacher = user?.role === "teacher";
  // A principal may read every class diary, but cannot edit text or upload an
  // attachment. The backend guard is authoritative; these disabled controls are
  // the read-only UX. A campus admin remains writable.
  const isReadOnly = isReadOnlyRole(user?.role);

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [subjects, setSubjects] = useState([]);
  // For teachers: { [classId]: [ownedSubject, ...] }, from /teacher/my-classes.
  const [ownedByClass, setOwnedByClass] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [diaryEntries, setDiaryEntries] = useState({});
  const [diaryForms, setDiaryForms] = useState({});
  const [classAttachment, setClassAttachment] = useState(null);
  const [existingAttachment, setExistingAttachment] = useState("");
  const [loading, setLoading] = useState(false);
  const [classLoading, setClassLoading] = useState(true);
  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchClasses = async () => {
    try {
      setClassLoading(true);
      const res = await axios.get(API_ENDPOINTS.CLASSES);
      setClasses(res.data);
      // A teacher's owned subjects per class come from my-classes; the grid list
      // itself stays from /classes so it keeps inCharge/room for display.
      if (isTeacher) {
        try {
          const mine = await axios.get(API_ENDPOINTS.TEACHER_MY_CLASSES);
          const map = {};
          (mine.data || []).forEach((c) => {
            map[c._id] = c.teacherSubjects || [];
          });
          setOwnedByClass(map);
        } catch {
          setOwnedByClass({});
        }
      }
    } catch {
      toast.error("Failed to load classes");
    } finally {
      setClassLoading(false);
    }
  };

  // The subjects a teacher may edit in a class; everyone else gets the full list.
  const subjectsForClass = (classId, allSubjects) =>
    isTeacher
      ? allSubjects.filter((s) => (ownedByClass[classId] || []).includes(s))
      : allSubjects;

  const selectClass = async (cls) => {
    setSelectedClass(cls);
    setLoading(true);
    let subs = [];
    try {
      const res = await axios.get(API_ENDPOINTS.CLASS_SUBJECTS(cls._id));
      subs = subjectsForClass(cls._id, res.data.subjects || []);
      setSubjects(subs);
    } catch {
      setSubjects([]);
    }
    await fetchDiary(cls._id, selectedDate, subs);
    setLoading(false);
  };

  const fetchDiary = async (classId, date, subjectList = subjects) => {
    try {
      const res = await axios.get(API_ENDPOINTS.DIARY, {
        params: { classId, date },
      });
      // The diary read is class-scoped, so for a teacher it also carries other
      // subjects' entries — keep only the ones they may edit so the "saved"
      // count and the attachment reflect their own rows.
      const allow = subjectList.length ? new Set(subjectList) : null;
      const entries = {};
      const forms = {};
      let foundAttachment = "";
      (res.data || []).forEach((entry) => {
        if (allow && !allow.has(entry.subject)) return;
        entries[entry.subject] = entry;
        forms[entry.subject] = entry.description || "";
        if (entry.attachment && !foundAttachment) {
          foundAttachment = entry.attachment;
        }
      });
      setDiaryEntries(entries);
      setExistingAttachment(foundAttachment);
      setClassAttachment(null);
      setDiaryForms(() => {
        const merged = {};
        subjectList.forEach((sub) => {
          merged[sub] = forms[sub] || "";
        });
        return merged;
      });
    } catch {
      setDiaryEntries({});
      setDiaryForms({});
      setExistingAttachment("");
      setClassAttachment(null);
    }
  };

  useEffect(() => {
    if (subjects.length > 0) {
      setDiaryForms((prev) => {
        const merged = {};
        subjects.forEach((sub) => {
          merged[sub] = prev[sub] || "";
        });
        return merged;
      });
    }
  }, [subjects]);

  const handleDateChange = async (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (selectedClass) {
      setLoading(true);
      await fetchDiary(selectedClass._id, newDate);
      setLoading(false);
    }
  };

  // Diary management
  const updateDiaryForm = (subject, value) => {
    setDiaryForms((prev) => ({ ...prev, [subject]: value }));
  };

  const saveAllDiary = async () => {
    const entries = subjects
      .map((sub) => ({ subject: sub, description: diaryForms[sub] || "" }))
      .filter((e) => e.description.trim());

    if (entries.length === 0) {
      toast.error("Write diary for at least one subject");
      return;
    }

    setSavingAll(true);
    try {
      const formData = new FormData();
      formData.append("classId", selectedClass._id);
      formData.append("date", selectedDate);
      formData.append("entries", JSON.stringify(entries));
      if (classAttachment) {
        formData.append("attachment", classAttachment);
      }

      const res = await axios.post(API_ENDPOINTS.DIARY_BULK, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const savedEntries = {};
      let foundAttachment = "";
      (res.data.entries || []).forEach((entry) => {
        savedEntries[entry.subject] = entry;
        if (entry.attachment && !foundAttachment) foundAttachment = entry.attachment;
      });
      setDiaryEntries(savedEntries);
      setExistingAttachment(foundAttachment);
      setClassAttachment(null);
      toast.success("Diary saved successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save diary");
    } finally {
      setSavingAll(false);
    }
  };

  const goBack = () => {
    setSelectedClass(null);
    setSubjects([]);
    setDiaryEntries({});
    setDiaryForms({});
    setClassAttachment(null);
    setExistingAttachment("");
  };

  // ─── Class Grid View ───
  if (!selectedClass) {
    return (
      <div className="p-4 sm:p-6 min-h-screen">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
              }}
            >
              <MdMenuBook className="text-white text-xl sm:text-2xl" />
            </div>
            Homework Diary
          </h1>
          <p className="text-gray-500 mt-1 ml-12 sm:ml-14">
            Select a class to manage subjects and daily diary
          </p>
        </div>

        {classLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card overflow-hidden animate-pulse">
                <div className="h-20 bg-gray-200 rounded-t-xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-16">
            <FaChalkboardTeacher className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No classes found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {classes.map((cls) => (
              <div
                key={cls._id}
                onClick={() => selectClass(cls)}
                className="glass-card hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:-translate-y-1 cursor-pointer"
              >
                <div
                  className="p-4 sm:p-5"
                  style={{
                    background:
                      "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Class {cls.grade} - {cls.section}
                    </h3>
                    <div className="bg-white/20 rounded-full p-2">
                      <FaBook className="text-white text-lg" />
                    </div>
                  </div>
                </div>
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaDoorOpen className="text-[#2F5DAA]" />
                    <span className="text-sm">Room: {cls.roomNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaChalkboardTeacher className="text-[#2F5DAA]" />
                    <span className="text-sm">{cls.inCharge}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <FaUserGraduate className="text-[#2F5DAA]" />
                    <span className="text-sm">
                      {cls.studentCount || 0} Students
                    </span>
                  </div>
                </div>
                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <button
                    className="w-full py-2.5 rounded-xl text-white font-semibold transition-all duration-300 hover:shadow-lg"
                    style={{
                      background:
                        "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                    }}
                  >
                    Open Diary
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Class Detail View ───
  return (
    <div className="p-4 sm:p-6 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="p-2.5 rounded-xl text-white hover:shadow-lg transition-all duration-300"
              style={{
                background:
                  "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
              }}
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                Class {selectedClass.grade} - {selectedClass.section}
              </h1>
              <p className="text-gray-500 text-sm">
                {selectedClass.inCharge} | Room {selectedClass.roomNumber}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily diary. Subjects are no longer edited here — the super admin
          assigns them per grade from the dashboard, and this page reads them. */}
      <div>
          {/* Date picker */}
          <div className="flex items-center gap-2 mb-6">
            <FaCalendarAlt className="text-[#2F5DAA]" />
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="px-4 py-2.5 border-2 border-gray-200 focus:border-[#2F5DAA] rounded-xl outline-none transition-all duration-300 text-gray-700"
            />
          </div>

          {subjects.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <MdSubject className="text-5xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-lg mb-2">No subjects assigned</p>
              <p className="text-gray-400 text-sm">
                This class has no subjects yet. Ask the super admin to assign
                them from the dashboard.
              </p>
            </div>
          ) : loading ? (
            <div className="glass-card p-5 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 mb-4">
                  <div className="h-10 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-10 bg-gray-200 rounded flex-1"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              {/* Diary header */}
              <div
                className="px-5 sm:px-6 py-4 flex items-center justify-between"
                style={{
                  background:
                    "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                }}
              >
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <MdMenuBook className="text-xl" /> Daily Diary
                </h3>
                <span className="text-white/70 text-sm">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-PK", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              {/* Diary body — subject rows */}
              <div className="p-5 sm:p-6">
                <div className="space-y-3">
                  {/* Column headers */}
                  <div className="hidden sm:grid grid-cols-12 gap-3 px-1 mb-1">
                    <span className="col-span-1 text-xs font-bold text-gray-400">#</span>
                    <span className="col-span-3 text-xs font-bold text-gray-400">SUBJECT</span>
                    <span className="col-span-8 text-xs font-bold text-gray-400">HOMEWORK / DIARY WORK</span>
                  </div>

                  {subjects.map((subject, idx) => {
                    const description = diaryForms[subject] || "";
                    const hasEntry = !!diaryEntries[subject];

                    return (
                      <div
                        key={subject}
                        className={`grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-start p-3 rounded-xl transition-colors duration-200 ${
                          hasEntry ? "bg-green-50/50" : "bg-gray-50"
                        } hover:bg-blue-50/50`}
                      >
                        {/* Number */}
                        <div className="hidden sm:flex col-span-1 items-center">
                          <span
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-white text-sm font-bold"
                            style={{
                              background:
                                "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                            }}
                          >
                            {idx + 1}
                          </span>
                        </div>

                        {/* Subject name */}
                        <div className="sm:col-span-3 flex items-center gap-2">
                          <span
                            className="sm:hidden w-7 h-7 flex items-center justify-center rounded-lg text-white text-xs font-bold"
                            style={{
                              background:
                                "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div className="flex items-center gap-2 min-h-[40px]">
                            <FaBook className="text-[#2F5DAA] text-sm flex-shrink-0" />
                            <span className="font-semibold text-gray-800 text-sm">
                              {subject}
                            </span>
                            {hasEntry && (
                              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                            )}
                          </div>
                        </div>

                        {/* Diary input */}
                        <div className="sm:col-span-8">
                          <input
                            type="text"
                            value={description}
                            disabled={isReadOnly}
                            onChange={(e) =>
                              updateDiaryForm(subject, e.target.value)
                            }
                            placeholder={`Enter ${subject} homework...`}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-[#2F5DAA] rounded-xl outline-none transition-all duration-300 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Class-level attachment */}
                <div className="mt-6 pt-5 border-t-2 border-gray-100">
                  <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FaPaperclip className="text-[#2F5DAA]" />
                    Class Attachment (Image or PDF)
                  </label>

                  {existingAttachment && !classAttachment && (
                    <div className="flex items-center gap-2 mb-3 p-3 bg-blue-50 rounded-xl">
                      {existingAttachment.endsWith(".pdf") ? (
                        <FaFilePdf className="text-red-500 text-lg" />
                      ) : (
                        <FaImage className="text-blue-500 text-lg" />
                      )}
                      <a
                        href={`${API_BASE_URL}${existingAttachment}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate font-medium"
                      >
                        {existingAttachment.split("/").pop()}
                      </a>
                      <span className="text-xs text-gray-400 ml-auto">Current</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-5 py-2.5 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#2F5DAA] transition-all duration-300 text-sm text-gray-600 hover:text-[#2F5DAA] flex items-center gap-2">
                      <FaPaperclip />
                      {classAttachment
                        ? classAttachment.name
                        : "Choose file (optional)"}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        disabled={isReadOnly}
                        onChange={(e) =>
                          setClassAttachment(e.target.files[0] || null)
                        }
                      />
                    </label>
                    {classAttachment && (
                      <button
                        onClick={() => setClassAttachment(null)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                </div>

                {/* Save All button */}
                <div className="mt-6 flex items-center gap-4">
                  {!isReadOnly && (
                    <button
                      onClick={saveAllDiary}
                      disabled={savingAll}
                      className="px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background:
                          "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)",
                      }}
                    >
                      {savingAll ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <FaSave /> Save All Diary
                        </span>
                      )}
                    </button>
                  )}
                  {Object.keys(diaryEntries).length > 0 && (
                    <span className="text-sm text-green-600 font-medium">
                      {Object.keys(diaryEntries).length} of {subjects.length} subjects saved
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default Diary;
