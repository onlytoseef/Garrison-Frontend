import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaKey,
  FaRedo,
  FaCopy,
  FaTimes,
  FaChalkboardTeacher,
  FaUserSlash,
  FaChevronRight,
  FaChevronDown,
  FaBook,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";

/**
 * Manages one staff member's portal access: creates or resets their login and
 * sets which SUBJECTS they teach in which classes — and which classes they are
 * IN-CHARGE of.
 *
 * Access is granted at the subject level, not the whole class: a teacher owns
 * Biology in 12-Med-A and Chemistry in 11-ICS-B, and on login they can only
 * touch those subjects (diary, marks) in those classes. So the class list here
 * drills down — expand a class, tick the subjects that teacher owns.
 *
 * A class can instead be marked IN-CHARGE: the teacher then runs the whole class
 * — marks its attendance and works across every subject — regardless of the
 * subject ticks, which is why they are hidden when in-charge is on. One teacher
 * can be in-charge of several classes and a single-subject teacher in others.
 *
 * Kept out of Staff.jsx because it owns its own server state (the teacher record
 * with its assignments) and several separate mutations; folding that into the
 * staff table would tangle two unrelated concerns.
 *
 * Props:
 *   staff    - the staff row from the table ({ _id, name, role })
 *   classes  - all classes in the campus ({ _id, grade, section, subjects[],
 *              studentCount }); `subjects` drives the per-class checklist
 *   onClose  - called when dismissed; also signals the parent to refetch
 */

// Normalize an assignments map + in-charge set to a stable string so the Save
// button only shows when the ticked subjects or in-charge flags actually differ
// from what is saved.
const normalizeAssignments = (map, incharge) =>
  JSON.stringify({
    subjects: Object.keys(map)
      .filter((cid) => (map[cid] || []).length > 0)
      .sort()
      .map((cid) => [cid, [...map[cid]].sort()]),
    incharge: Object.keys(incharge)
      .filter((cid) => incharge[cid])
      .sort(),
  });

// Build the initial subjects map { [classId]: [subjectName, ...] } and in-charge
// map { [classId]: true } from a teacher record.
const seedFromTeacher = (teacher) => {
  const subs = {};
  const inc = {};
  (teacher?.assignedClasses || []).forEach((c) => {
    subs[c._id] = [...(c.subjects || [])];
    if (c.isIncharge) inc[c._id] = true;
  });
  return { subs, inc };
};

const TeacherAccessModal = ({ staff, classes = [], onClose }) => {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // { [classId]: [subjectName, ...] } — the subjects ticked for each class.
  const [assignments, setAssignments] = useState({});
  // { [classId]: true } — classes this teacher is in-charge of.
  const [incharge, setIncharge] = useState({});
  const [expanded, setExpanded] = useState({});
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  // Shown once after create/reset. Held separately from `teacher` because a
  // freshly generated password is only in the response, not in the list payload.
  const [freshCredentials, setFreshCredentials] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      // /api/teachers returns every teacher with their assignments; picking the
      // one row here avoids a second endpoint for a single record.
      const res = await axios.get(API_ENDPOINTS.TEACHERS);
      const found = res.data.find((t) => t._id === staff._id);
      setTeacher(found || null);
      const seeded = seedFromTeacher(found);
      setAssignments(seeded.subs);
      setIncharge(seeded.inc);
      // Open the classes that already have access (subjects or in-charge), so
      // existing access is visible at a glance without hunting for it.
      const openCids = new Set([
        ...Object.keys(seeded.subs),
        ...Object.keys(seeded.inc),
      ]);
      setExpanded(
        [...openCids].reduce((acc, cid) => ({ ...acc, [cid]: true }), {})
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load teacher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff._id]);

  const hasLogin = Boolean(teacher?.userId);

  const createLogin = async () => {
    try {
      setSaving(true);
      const res = await axios.post(API_ENDPOINTS.TEACHER_CREATE_LOGIN(staff._id));
      setFreshCredentials(res.data.credentials);
      toast.success("Login created");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create login");
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    try {
      setSaving(true);
      const res = await axios.post(
        API_ENDPOINTS.TEACHER_RESET_PASSWORD(staff._id)
      );
      setFreshCredentials(res.data.credentials);
      setConfirmReset(false);
      toast.success("Password reset");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setSaving(false);
    }
  };

  const revokeLogin = async () => {
    try {
      setSaving(true);
      await axios.delete(API_ENDPOINTS.TEACHER_REVOKE_LOGIN(staff._id));
      setFreshCredentials(null);
      setConfirmRevoke(false);
      toast.success("Login revoked");
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revoke login");
    } finally {
      setSaving(false);
    }
  };

  const saveAssignments = async () => {
    try {
      setSaving(true);
      // One entry per class that grants something: in-charge classes send
      // isIncharge (subjects are implied and ignored by the backend); others
      // send their ticked subjects. Classes with neither are omitted.
      const cids = new Set([
        ...Object.keys(assignments),
        ...Object.keys(incharge),
      ]);
      const payload = [];
      cids.forEach((classId) => {
        if (incharge[classId]) {
          payload.push({ classId, isIncharge: true, subjects: [] });
        } else if ((assignments[classId] || []).length > 0) {
          payload.push({ classId, subjects: assignments[classId] });
        }
      });
      const res = await axios.put(API_ENDPOINTS.TEACHER_CLASSES(staff._id), {
        assignments: payload,
      });
      setTeacher(res.data.teacher);
      const seeded = seedFromTeacher(res.data.teacher);
      setAssignments(seeded.subs);
      setIncharge(seeded.inc);
      toast.success("Access updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update access");
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (classId) =>
    setExpanded((prev) => ({ ...prev, [classId]: !prev[classId] }));

  // In-charge is exclusive of the subject checklist: turning it on clears any
  // ticked subjects for that class (they are implied), turning it off leaves the
  // class with no subjects for the admin to pick fresh.
  const toggleIncharge = (classId) =>
    setIncharge((prev) => {
      const copy = { ...prev };
      if (copy[classId]) {
        delete copy[classId];
      } else {
        copy[classId] = true;
        setAssignments((prevA) => {
          const c = { ...prevA };
          delete c[classId];
          return c;
        });
      }
      return copy;
    });

  const toggleSubject = (classId, subject) =>
    setAssignments((prev) => {
      const cur = prev[classId] || [];
      const next = cur.includes(subject)
        ? cur.filter((s) => s !== subject)
        : [...cur, subject];
      const copy = { ...prev };
      if (next.length === 0) delete copy[classId];
      else copy[classId] = next;
      return copy;
    });

  const toggleAllInClass = (cls) => {
    const all = cls.subjects || [];
    setAssignments((prev) => {
      const cur = prev[cls._id] || [];
      const copy = { ...prev };
      if (cur.length === all.length) delete copy[cls._id]; // all → none
      else copy[cls._id] = [...all]; // some/none → all
      return copy;
    });
  };

  const copyCredentials = () => {
    const email = freshCredentials?.email || teacher?.loginEmail;
    const password = freshCredentials?.password || teacher?.loginPassword;
    if (!email) return;
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
    toast.success("Copied");
  };

  const saved = seedFromTeacher(teacher);
  const savedMap = saved.subs;
  const savedIncharge = saved.inc;
  const dirty =
    normalizeAssignments(savedMap, savedIncharge) !==
    normalizeAssignments(assignments, incharge);

  // Reset both the subjects and in-charge maps to what is saved (the Undo button).
  const resetToSaved = () => {
    setAssignments(savedMap);
    setIncharge(savedIncharge);
  };

  // Count of classes that grant something — a subject or in-charge — the
  // headline "assigned" number.
  const assignedClassCount = new Set([
    ...Object.keys(assignments).filter(
      (cid) => (assignments[cid] || []).length > 0
    ),
    ...Object.keys(incharge).filter((cid) => incharge[cid]),
  ]).size;

  const displayEmail = freshCredentials?.email || teacher?.loginEmail;
  const displayPassword =
    freshCredentials?.password || teacher?.loginPassword;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div
          className="flex items-center justify-between px-6 py-4 text-white sticky top-0 z-10"
          style={{
            background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
          }}
        >
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FaChalkboardTeacher /> Teacher Access
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-lg font-semibold text-gray-800">{staff.name}</p>
            <p className="text-sm text-gray-500 capitalize">{staff.role}</p>
          </div>

          {loading ? (
            <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <div className="flex flex-col lg:flex-row gap-5 items-start">
              {/* ---------- Login ---------- */}
              <div className="border border-gray-200 rounded-xl p-4 w-full lg:w-80 lg:flex-shrink-0">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FaKey className="text-amber-600" /> Portal Login
                </h3>

                {hasLogin ? (
                  <>
                    <div className="space-y-2 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="font-semibold text-gray-800 break-all">
                          {displayEmail}
                        </p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <p className="text-xs text-gray-400">Password</p>
                        <p className="font-semibold text-gray-800 tracking-widest">
                          {displayPassword || "—"}
                        </p>
                      </div>
                    </div>

                    {confirmReset ? (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg space-y-2">
                        <p className="text-sm text-red-700">
                          The current password stops working immediately. Make
                          sure you can pass the new one on.
                        </p>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setConfirmReset(false)}
                            disabled={saving}
                            className="px-3 py-1.5 text-sm bg-gray-200 rounded-lg disabled:opacity-60"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={resetPassword}
                            disabled={saving}
                            className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg disabled:opacity-60"
                          >
                            {saving ? "Resetting..." : "Yes, reset"}
                          </button>
                        </div>
                      </div>
                    ) : confirmRevoke ? (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg space-y-2">
                        <p className="text-sm text-red-700">
                          They will lose portal access. The staff record and
                          class assignments are kept.
                        </p>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setConfirmRevoke(false)}
                            disabled={saving}
                            className="px-3 py-1.5 text-sm bg-gray-200 rounded-lg disabled:opacity-60"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={revokeLogin}
                            disabled={saving}
                            className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg disabled:opacity-60"
                          >
                            {saving ? "Revoking..." : "Yes, revoke"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setConfirmReset(true)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg font-medium"
                        >
                          <FaRedo /> Reset Password
                        </button>
                        <button
                          onClick={copyCredentials}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                        >
                          <FaCopy /> Copy
                        </button>
                        <button
                          onClick={() => setConfirmRevoke(true)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg font-medium"
                        >
                          <FaUserSlash /> Revoke
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-3">
                      No login yet. An email and password will be generated.
                    </p>
                    <button
                      onClick={createLogin}
                      disabled={saving}
                      className="px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-60"
                      style={{
                        background:
                          "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                      }}
                    >
                      {saving ? "Creating..." : "Create Login"}
                    </button>
                  </>
                )}
              </div>

              {/* ---------- Classes & subjects ---------- */}
              <div className="border border-gray-200 rounded-xl p-4 w-full lg:flex-1 lg:min-w-0">
                <h3 className="font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  <FaChalkboardTeacher className="text-[#2F5DAA]" /> Class &
                  Subject Access
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Expand a class and tick the subjects this teacher owns — the
                  diary and exam marks they can edit are limited to them. Or mark
                  them <span className="font-semibold">In-charge</span> of the
                  class for full access: attendance and every subject.
                </p>

                {classes.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No classes in this campus yet.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {classes.map((cls) => {
                      const clsSubjects = cls.subjects || [];
                      const picked = assignments[cls._id] || [];
                      const noSubjects = clsSubjects.length === 0;
                      const isOpen = !!expanded[cls._id];
                      const isIncharge = !!incharge[cls._id];
                      const allPicked =
                        clsSubjects.length > 0 &&
                        picked.length === clsSubjects.length;
                      const hasAccess = isIncharge || picked.length > 0;
                      return (
                        <div
                          key={cls._id}
                          className={`rounded-lg border ${
                            hasAccess
                              ? "border-[#2F5DAA]/40 bg-blue-50/40"
                              : "border-gray-100"
                          }`}
                        >
                          {/* Class header */}
                          <button
                            type="button"
                            onClick={() => toggleExpand(cls._id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-left"
                          >
                            <span className="text-gray-400">
                              {isOpen ? (
                                <FaChevronDown className="text-xs" />
                              ) : (
                                <FaChevronRight className="text-xs" />
                              )}
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              Class {cls.grade} - {cls.section}
                            </span>
                            {isIncharge ? (
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                In-charge
                              </span>
                            ) : (
                              picked.length > 0 && (
                                <span className="text-xs font-semibold text-[#2F5DAA] bg-blue-100 px-2 py-0.5 rounded-full">
                                  {picked.length} subject
                                  {picked.length === 1 ? "" : "s"}
                                </span>
                              )
                            )}
                            <span className="text-xs text-gray-400 ml-auto">
                              {cls.studentCount ?? 0} students
                            </span>
                          </button>

                          {/* Access options */}
                          {isOpen && (
                            <div className="px-3 pb-2.5 pt-0.5">
                              {/* In-charge toggle — grants the whole class */}
                              <label className="flex items-start gap-2 pl-5 py-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isIncharge}
                                  onChange={() => toggleIncharge(cls._id)}
                                  className="w-4 h-4 mt-0.5 accent-emerald-600"
                                />
                                <span>
                                  <span className="text-sm font-semibold text-emerald-700">
                                    In-charge of this class
                                  </span>
                                  <span className="block text-xs text-gray-500">
                                    Marks attendance and works across every
                                    subject.
                                  </span>
                                </span>
                              </label>

                              {isIncharge ? (
                                <p className="text-xs text-emerald-600 pl-5 pt-1">
                                  Full access to attendance, diary and marks for
                                  all subjects of this class.
                                </p>
                              ) : noSubjects ? (
                                <p className="text-xs text-amber-600 pl-5">
                                  No subjects added to this class yet. Add them on
                                  the class's diary page first, or mark them
                                  in-charge above.
                                </p>
                              ) : (
                                <>
                                  <div className="pl-5 pt-1 pb-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                                    Or pick individual subjects
                                  </div>
                                  <label className="flex items-center gap-2 pl-5 py-1 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={allPicked}
                                      onChange={() => toggleAllInClass(cls)}
                                      className="w-3.5 h-3.5 accent-[#2F5DAA]"
                                    />
                                    <span className="text-xs font-medium text-gray-500">
                                      Select all
                                    </span>
                                  </label>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3">
                                    {clsSubjects.map((sub) => (
                                      <label
                                        key={sub}
                                        className="flex items-center gap-2 pl-5 py-1 cursor-pointer hover:bg-white rounded"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={picked.includes(sub)}
                                          onChange={() =>
                                            toggleSubject(cls._id, sub)
                                          }
                                          className="w-4 h-4 accent-[#2F5DAA]"
                                        />
                                        <FaBook className="text-gray-300 text-xs" />
                                        <span className="text-sm text-gray-800">
                                          {sub}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {dirty && (
                  <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={resetToSaved}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm bg-gray-200 rounded-lg disabled:opacity-60"
                    >
                      Undo
                    </button>
                    <button
                      onClick={saveAssignments}
                      disabled={saving}
                      className="px-4 py-1.5 text-sm text-white rounded-lg font-medium disabled:opacity-60"
                      style={{
                        background:
                          "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                      }}
                    >
                      {saving ? "Saving..." : "Save Access"}
                    </button>
                  </div>
                )}

                {!hasLogin && assignedClassCount > 0 && (
                  <p className="text-xs text-amber-600 mt-3">
                    Assignments are saved, but they cannot sign in until a login
                    is created for them.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAccessModal;
