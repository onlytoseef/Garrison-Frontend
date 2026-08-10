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
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";

/**
 * Manages one staff member's portal access: creates or resets their login and
 * sets which classes they may see.
 *
 * Kept out of Staff.jsx because it owns its own server state (the teacher record
 * with its assignments) and three separate mutations; folding that into the
 * staff table would tangle two unrelated concerns.
 *
 * Props:
 *   staff    - the staff row from the table ({ _id, name, role })
 *   classes  - all classes in the campus, for the checkbox list
 *   onClose  - called when dismissed; also signals the parent to refetch
 */
const TeacherAccessModal = ({ staff, classes = [], onClose }) => {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState([]);
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
      setSelected((found?.assignedClasses || []).map((c) => c._id));
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

  const saveClasses = async () => {
    try {
      setSaving(true);
      const res = await axios.put(API_ENDPOINTS.TEACHER_CLASSES(staff._id), {
        classIds: selected,
      });
      setTeacher(res.data.teacher);
      toast.success("Classes updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update classes");
    } finally {
      setSaving(false);
    }
  };

  const toggleClass = (classId) =>
    setSelected((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );

  const copyCredentials = () => {
    const email = freshCredentials?.email || teacher?.loginEmail;
    const password = freshCredentials?.password || teacher?.loginPassword;
    if (!email) return;
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
    toast.success("Copied");
  };

  // The saved set and the checkboxes can diverge, so the Save button only
  // appears when there is something to save.
  const savedIds = (teacher?.assignedClasses || []).map((c) => c._id).sort();
  const dirty =
    JSON.stringify(savedIds) !== JSON.stringify([...selected].sort());

  const displayEmail = freshCredentials?.email || teacher?.loginEmail;
  const displayPassword =
    freshCredentials?.password || teacher?.loginPassword;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div
          className="flex items-center justify-between px-6 py-4 text-white sticky top-0"
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
            <>
              {/* ---------- Login ---------- */}
              <div className="border border-gray-200 rounded-xl p-4">
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

              {/* ---------- Classes ---------- */}
              <div className="border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-700 mb-1 flex items-center gap-2">
                  <FaChalkboardTeacher className="text-[#2F5DAA]" /> Assigned
                  Classes
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  They will only see these classes: their students, diary and
                  resources.
                </p>

                {classes.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No classes in this campus yet.
                  </p>
                ) : (
                  <div className="space-y-1 max-h-52 overflow-y-auto">
                    {classes.map((cls) => (
                      <label
                        key={cls._id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(cls._id)}
                          onChange={() => toggleClass(cls._id)}
                          className="w-4 h-4 accent-[#2F5DAA]"
                        />
                        <span className="text-sm text-gray-800">
                          Class {cls.grade} - {cls.section}
                        </span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {cls.studentCount ?? 0} students
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {dirty && (
                  <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setSelected(savedIds)}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm bg-gray-200 rounded-lg disabled:opacity-60"
                    >
                      Undo
                    </button>
                    <button
                      onClick={saveClasses}
                      disabled={saving}
                      className="px-4 py-1.5 text-sm text-white rounded-lg font-medium disabled:opacity-60"
                      style={{
                        background:
                          "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                      }}
                    >
                      {saving ? "Saving..." : "Save Classes"}
                    </button>
                  </div>
                )}

                {!hasLogin && selected.length > 0 && (
                  <p className="text-xs text-amber-600 mt-3">
                    Assignments are saved, but they cannot sign in until a login
                    is created above.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAccessModal;
