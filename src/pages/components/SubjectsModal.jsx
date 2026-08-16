import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FaBook,
  FaTimes,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCheck,
  FaLayerGroup,
  FaBuilding,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";
import { overlayFade, modalPop } from "../../utils/animations";

/**
 * Grade-wise subjects, defined once by the super admin and assigned to class
 * sections across every campus in one action.
 *
 * Two tabs:
 *   Manage  — pick a grade, edit that grade's master subject list.
 *   Assign  — pick a grade, tick subjects and tick sections (from all campuses),
 *             assign. Replace, not merge — the point is to make sections uniform.
 */
const SubjectsModal = ({ onClose }) => {
  const [tab, setTab] = useState("manage");
  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(true);

  useEffect(() => {
    axios
      .get(API_ENDPOINTS.SUBJECT_GRADES)
      .then((res) => setGrades(res.data))
      .catch(() => toast.error("Could not load grades"))
      .finally(() => setGradesLoading(false));
  }, []);

  return (
    <motion.div
      variants={overlayFade}
      initial="hidden"
      animate="show"
      exit="hidden"
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-3 sm:p-4"
    >
      <motion.div
        variants={modalPop}
        initial="hidden"
        animate="show"
        exit="exit"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[92rem] flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 text-white rounded-t-2xl shrink-0"
          style={{
            background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
          }}
        >
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FaBook /> Subjects
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <FaTimes />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 shrink-0 border-b border-gray-100">
          {[
            { key: "manage", label: "Manage subjects", icon: <FaLayerGroup /> },
            { key: "assign", label: "Assign to classes", icon: <FaCheck /> },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold rounded-t-lg transition-colors ${
                tab === t.key
                  ? "text-[#2F5DAA] border-b-2 border-[#2F5DAA] -mb-px"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {gradesLoading ? (
            <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          ) : grades.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FaBook className="text-4xl text-gray-300 mx-auto mb-3" />
              <p>No classes exist yet, so there are no grades to define subjects for.</p>
            </div>
          ) : tab === "manage" ? (
            <ManageTab grades={grades} />
          ) : (
            <AssignTab grades={grades} />
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ---------------------------------------------------------------------------
// Tab A — Manage: edit a grade's master subject list
// ---------------------------------------------------------------------------
const ManageTab = ({ grades }) => {
  const [gradeKey, setGradeKey] = useState(grades[0]?.gradeKey || "");
  const grade = grades.find((g) => g.gradeKey === gradeKey);

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const load = () => {
    if (!gradeKey) return;
    setLoading(true);
    axios
      .get(API_ENDPOINTS.SUBJECTS_FOR_GRADE(gradeKey))
      .then((res) => setSubjects(res.data))
      .catch(() => toast.error("Could not load subjects"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [gradeKey]);

  const addSubject = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await axios.post(API_ENDPOINTS.SUBJECTS, {
        gradeKey,
        gradeLabel: grade?.gradeLabel || gradeKey,
        name,
      });
      setNewName("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add subject");
    } finally {
      setBusy(false);
    }
  };

  const saveRename = async (id) => {
    const name = editingName.trim();
    if (!name) return;
    try {
      await axios.put(API_ENDPOINTS.SUBJECT_BY_ID(id), { name });
      setEditingId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not rename");
    }
  };

  const remove = async (id) => {
    try {
      await axios.delete(API_ENDPOINTS.SUBJECT_BY_ID(id));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove");
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Grade
      </label>
      <select
        value={gradeKey}
        onChange={(e) => setGradeKey(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F5DAA] mb-5"
      >
        {grades.map((g) => (
          <option key={g.gradeKey} value={g.gradeKey}>
            {g.gradeLabel} ({g.classCount} section{g.classCount === 1 ? "" : "s"})
          </option>
        ))}
      </select>

      {/* Add */}
      <div className="flex gap-2 mb-5">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addSubject()}
          placeholder="Add a subject (e.g. English)"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F5DAA]"
        />
        <button
          onClick={addSubject}
          disabled={busy || !newName.trim()}
          className="flex items-center gap-2 px-4 py-2.5 text-white rounded-xl font-medium disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
        >
          <FaPlus /> Add
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
      ) : subjects.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-6">
          No subjects for {grade?.gradeLabel} yet. Add the first one above.
        </p>
      ) : (
        <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
          {subjects.map((s) => (
            <div
              key={s._id}
              className="flex items-center gap-2 px-4 py-2.5"
            >
              {editingId === s._id ? (
                <>
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveRename(s._id)}
                    autoFocus
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5DAA]"
                  />
                  <button
                    onClick={() => saveRename(s._id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                  >
                    <FaCheck />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                  >
                    <FaTimes />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-gray-800">{s.name}</span>
                  <button
                    onClick={() => {
                      setEditingId(s._id);
                      setEditingName(s.name);
                    }}
                    className="p-2 text-gray-400 hover:text-[#2F5DAA] hover:bg-blue-50 rounded-lg"
                  >
                    <FaEdit className="text-xs" />
                  </button>
                  <button
                    onClick={() => remove(s._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tab B — Assign: tick subjects + tick sections across campuses, assign
// ---------------------------------------------------------------------------
const AssignTab = ({ grades }) => {
  const [gradeKey, setGradeKey] = useState(grades[0]?.gradeKey || "");
  const grade = grades.find((g) => g.gradeKey === gradeKey);

  const [master, setMaster] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chosenSubjects, setChosenSubjects] = useState(new Set());
  const [chosenSections, setChosenSections] = useState(new Set());
  const [assigning, setAssigning] = useState(false);

  const load = () => {
    if (!gradeKey) return;
    setLoading(true);
    setChosenSubjects(new Set());
    setChosenSections(new Set());
    Promise.all([
      axios.get(API_ENDPOINTS.SUBJECTS_FOR_GRADE(gradeKey)),
      axios.get(API_ENDPOINTS.SUBJECT_SECTIONS(gradeKey)),
    ])
      .then(([m, s]) => {
        setMaster(m.data);
        setSections(s.data);
      })
      .catch(() => toast.error("Could not load"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [gradeKey]);

  const toggle = (set, setter, value) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  };

  const allSectionsChosen =
    sections.length > 0 && chosenSections.size === sections.length;
  const toggleAllSections = () => {
    setChosenSections(
      allSectionsChosen ? new Set() : new Set(sections.map((s) => s._id))
    );
  };

  const assign = async () => {
    if (chosenSections.size === 0) {
      toast.error("Tick at least one section");
      return;
    }
    setAssigning(true);
    try {
      const res = await axios.post(API_ENDPOINTS.SUBJECT_ASSIGN, {
        classIds: [...chosenSections],
        subjects: [...chosenSubjects],
      });
      toast.success(
        `Assigned ${res.data.subjects.length} subject(s) to ${res.data.sections} section(s)`
      );
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Assign failed");
    } finally {
      setAssigning(false);
    }
  };

  // Group sections by campus for a readable list.
  const byCampus = sections.reduce((acc, s) => {
    (acc[s.campusCode] ||= { name: s.campusName, items: [] }).items.push(s);
    return acc;
  }, {});

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Grade
      </label>
      <select
        value={gradeKey}
        onChange={(e) => setGradeKey(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2F5DAA] mb-5"
      >
        {grades.map((g) => (
          <option key={g.gradeKey} value={g.gradeKey}>
            {g.gradeLabel} ({g.classCount} section{g.classCount === 1 ? "" : "s"})
          </option>
        ))}
      </select>

      {loading ? (
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Subjects */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Subjects to assign
            </p>
            {master.length === 0 ? (
              <p className="text-xs text-gray-500 border border-gray-100 rounded-xl p-4">
                No subjects defined for {grade?.gradeLabel}. Add them in the
                Manage tab first.
              </p>
            ) : (
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {master.map((s) => (
                  <label
                    key={s._id}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={chosenSubjects.has(s.name)}
                      onChange={() =>
                        toggle(chosenSubjects, setChosenSubjects, s.name)
                      }
                      className="w-4 h-4 accent-[#2F5DAA]"
                    />
                    <span className="text-sm text-gray-800">{s.name}</span>
                  </label>
                ))}
              </div>
            )}
            {master.length > 0 && (
              <p className="text-[11px] text-gray-400 mt-2">
                Assigning replaces each chosen section's subjects with exactly
                these. Tick none to clear a section.
              </p>
            )}
          </div>

          {/* Sections */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">
                Sections (all campuses)
              </p>
              {sections.length > 0 && (
                <button
                  onClick={toggleAllSections}
                  className="text-[11px] text-[#2F5DAA] hover:underline"
                >
                  {allSectionsChosen ? "Clear all" : "Select all"}
                </button>
              )}
            </div>
            {sections.length === 0 ? (
              <p className="text-xs text-gray-500 border border-gray-100 rounded-xl p-4">
                No sections found for this grade.
              </p>
            ) : (
              <div className="border border-gray-100 rounded-xl max-h-64 overflow-y-auto">
                {Object.entries(byCampus).map(([code, group]) => (
                  <div key={code}>
                    <div className="px-4 py-1.5 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 sticky top-0">
                      <FaBuilding className="text-[9px]" /> {code}
                    </div>
                    {group.items.map((s) => (
                      <label
                        key={s._id}
                        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 border-t border-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={chosenSections.has(s._id)}
                          onChange={() =>
                            toggle(chosenSections, setChosenSections, s._id)
                          }
                          className="w-4 h-4 accent-[#2F5DAA]"
                        />
                        <span className="flex-1 text-sm text-gray-800">
                          {s.grade} — {s.section}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {s.subjectCount > 0
                            ? `${s.subjectCount} now`
                            : "none"}
                        </span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {chosenSubjects.size} subject(s) → {chosenSections.size} section(s)
        </p>
        <button
          onClick={assign}
          disabled={assigning || chosenSections.size === 0}
          className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)" }}
        >
          <FaCheck />
          {assigning ? "Assigning..." : "Assign"}
        </button>
      </div>
    </div>
  );
};

export default SubjectsModal;
