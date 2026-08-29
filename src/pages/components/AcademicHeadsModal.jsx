import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FaUserTie,
  FaTimes,
  FaPlus,
  FaTrash,
  FaKey,
  FaCopy,
  FaLayerGroup,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaExclamationTriangle,
  FaSpinner,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";
import { overlayFade, modalPop } from "../../utils/animations";

/**
 * Academic head management — super admin only.
 *
 * An academic head is a cross-campus role scoped to a grade band. This modal is
 * where the super admin adds one by email + band, sees the current heads, and
 * can re-scope, reset the password for, or revoke each of them.
 *
 * The four bands mirror the backend CHECK (schema-academic-head.sql) and the
 * band map in middleware/teacherScope.js — keep them in step.
 */
const BANDS = [
  { key: "primary", label: "Primary", detail: "Play Group / Nursery / Prep, and 1–5" },
  { key: "middle", label: "Middle", detail: "Grades 6–8" },
  { key: "matric", label: "Matric", detail: "Grades 9–10" },
  { key: "intermediate", label: "Intermediate", detail: "Grades 11–12" },
];
const BAND_LABEL = Object.fromEntries(BANDS.map((b) => [b.key, b.label]));

const AcademicHeadsModal = ({ onClose }) => {
  const [heads, setHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // "list" | "create" — the create form takes over the body when adding.
  const [view, setView] = useState("list");
  const [form, setForm] = useState({ name: "", email: "", band: "primary" });
  // The one-time credentials shown right after a create or reset.
  const [credentials, setCredentials] = useState(null);
  /** Whose password is currently revealed — one at a time, id or null. */
  const [shownPassword, setShownPassword] = useState(null);
  /** The head awaiting reset confirmation; null when the dialog is closed. */
  const [resetTarget, setResetTarget] = useState(null);
  const [resetting, setResetting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_ENDPOINTS.ACADEMIC_HEADS);
      setHeads(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load academic heads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.email.trim()) return toast.error("Email is required");
    try {
      setSaving(true);
      const res = await axios.post(API_ENDPOINTS.ACADEMIC_HEADS, {
        name: form.name.trim(),
        email: form.email.trim(),
        band: form.band,
      });
      setCredentials(res.data.credentials);
      setForm({ name: "", email: "", band: "primary" });
      setView("list");
      await load();
      toast.success("Academic head created");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create academic head");
    } finally {
      setSaving(false);
    }
  };

  const changeBand = async (head, band) => {
    if (band === head.band) return;
    try {
      await axios.put(API_ENDPOINTS.ACADEMIC_HEAD_BY_ID(head._id), { band });
      setHeads((prev) =>
        prev.map((h) => (h._id === head._id ? { ...h, band } : h))
      );
      toast.success("Band updated — applies on their next sign in");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update band");
    }
  };

  /**
   * Resets the password. Only ever called from the confirm dialog below — never
   * straight off the row.
   *
   * The old password stops working the moment this returns and the plaintext copy
   * is overwritten, so there is nothing to undo. Same reasoning as the campus
   * admins modal.
   */
  const resetPassword = async (head) => {
    setResetTarget(null);
    setResetting(true);
    try {
      const res = await axios.post(
        API_ENDPOINTS.ACADEMIC_HEAD_RESET_PASSWORD(head._id)
      );
      setCredentials(res.data.credentials);
      // Reloaded so the row's stored password matches the new one — otherwise the
      // eye icon would keep revealing a password that no longer works.
      await load();
      toast.success("Password reset");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const revoke = async (head) => {
    if (
      !window.confirm(
        `Remove academic head ${head.name} (${head.email})? They will lose all access.`
      )
    )
      return;
    try {
      await axios.delete(API_ENDPOINTS.ACADEMIC_HEAD_BY_ID(head._id));
      setHeads((prev) => prev.filter((h) => h._id !== head._id));
      toast.success("Academic head removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove");
    }
  };

  const copyCredentials = () => {
    if (!credentials) return;
    navigator.clipboard.writeText(
      `Email: ${credentials.email}\nPassword: ${credentials.password}`
    );
    toast.success("Copied");
  };

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 text-white rounded-t-2xl shrink-0"
          style={{
            background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
          }}
        >
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FaUserTie /> Academic Heads
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* One-time credentials banner, shown after create/reset. */}
          {credentials && (
            <div
              className="rounded-xl p-4 mb-5 border"
              style={{ background: "#EFF6FF", borderColor: "#DBEAFE" }}
            >
              <p className="text-[13px] font-semibold text-gray-800 mb-2">
                Share these credentials — the password is shown once.
              </p>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">
                    Email
                  </p>
                  <p className="font-semibold text-gray-900 text-sm break-all">
                    {credentials.email}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 uppercase tracking-wider">
                    Password
                  </p>
                  <p className="font-semibold text-gray-900 text-sm tracking-wider">
                    {credentials.password}
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={copyCredentials}
                    className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg font-medium"
                  >
                    <FaCopy /> Copy
                  </button>
                  <button
                    onClick={() => setCredentials(null)}
                    className="px-3 py-2 text-[13px] text-white font-semibold rounded-lg"
                    style={{ background: "#2F5DAA" }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === "create" ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <button
                type="button"
                onClick={() => setView("list")}
                className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-gray-700"
              >
                <FaArrowLeft className="text-[10px]" /> Back to list
              </button>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Ahmed Khan"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5DAA] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="head.primary@quaideazamgroupofcolleges.edu.pk"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5DAA] focus:border-transparent"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  This email is their login. A password is generated and shown once.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-2">
                  Access band *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {BANDS.map((b) => (
                    <button
                      type="button"
                      key={b.key}
                      onClick={() => setForm({ ...form, band: b.key })}
                      className={`text-left px-3 py-2.5 rounded-xl border transition-colors ${
                        form.band === b.key
                          ? "border-[#2F5DAA] bg-[#EFF6FF]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-800">
                        <FaLayerGroup className="text-[#2F5DAA] text-xs" />
                        {b.label}
                      </span>
                      <span className="block text-[11px] text-gray-400 mt-0.5">
                        {b.detail}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className="px-4 py-2.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 text-sm text-white font-semibold rounded-xl disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
                >
                  {saving ? "Creating..." : "Create academic head"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] text-gray-500">
                  {heads.length} academic head{heads.length === 1 ? "" : "s"}
                </p>
                <button
                  onClick={() => setView("create")}
                  className="flex items-center gap-2 text-white text-[13px] font-semibold px-4 py-2 rounded-xl shadow-sm"
                  style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
                >
                  <FaPlus className="text-[10px]" /> Add academic head
                </button>
              </div>

              {loading ? (
                <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>
              ) : heads.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <FaUserTie className="text-gray-300" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">
                    No academic heads yet
                  </p>
                  <p className="text-sm text-gray-400">
                    Add one to give band-wide, cross-campus access.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {heads.map((head) => (
                    <div
                      key={head._id}
                      className="border border-gray-100 rounded-xl p-3 flex flex-wrap items-center gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-gray-900 truncate">
                          {head.name}
                        </p>
                        <p className="text-[12px] text-gray-400 truncate">
                          {head.email}
                        </p>
                      </div>

                      {/* Band selector — changing it re-scopes the head. */}
                      <select
                        value={head.band}
                        onChange={(e) => changeBand(head, e.target.value)}
                        className="text-[13px] border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2F5DAA]"
                        title="Access band"
                      >
                        {BANDS.map((b) => (
                          <option key={b.key} value={b.key}>
                            {b.label}
                          </option>
                        ))}
                      </select>

                      {/* Reveal the current password.
                          The plaintext is already in this row — getAcademicHeads
                          decrypts password_enc — so this only toggles whether it is
                          on screen. Hidden by default because this list gets opened
                          in front of other people. */}
                      {head.password ? (
                        <button
                          onClick={() =>
                            setShownPassword((id) =>
                              id === head._id ? null : head._id
                            )
                          }
                          title={
                            shownPassword === head._id
                              ? "Hide password"
                              : "View password"
                          }
                          aria-label={
                            shownPassword === head._id
                              ? `Hide password for ${head.name}`
                              : `View password for ${head.name}`
                          }
                          className="p-2 rounded-lg text-gray-400 hover:text-[#2F5DAA] hover:bg-blue-50"
                        >
                          {shownPassword === head._id ? (
                            <FaEyeSlash className="text-[13px]" />
                          ) : (
                            <FaEye className="text-[13px]" />
                          )}
                        </button>
                      ) : (
                        <span
                          title="No stored password — reset it to get one"
                          className="p-2 text-gray-200"
                        >
                          <FaEye className="text-[13px]" />
                        </span>
                      )}

                      <button
                        onClick={() => setResetTarget(head)}
                        disabled={resetting}
                        title="Reset password"
                        className="p-2 rounded-lg text-gray-400 hover:text-[#2F5DAA] hover:bg-blue-50 disabled:opacity-40"
                      >
                        <FaKey className="text-[13px]" />
                      </button>
                      <button
                        onClick={() => revoke(head)}
                        title="Remove"
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <FaTrash className="text-[13px]" />
                      </button>

                      {/* Full width so a long password is not squeezed by the band
                          selector and the icons. */}
                      {shownPassword === head._id && head.password && (
                        <div className="w-full flex items-center gap-2 pt-2 border-t border-gray-100">
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                            Password
                          </span>
                          <code className="flex-1 font-mono text-[13px] text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 select-all break-all">
                            {head.password}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `Email: ${head.email}\nPassword: ${head.password}`
                              );
                              toast.success("Login details copied");
                            }}
                            title="Copy email and password"
                            className="p-2 rounded-lg text-gray-400 hover:text-[#2F5DAA] hover:bg-blue-50 shrink-0"
                          >
                            <FaCopy className="text-[13px]" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Reset confirmation.
          A layer over the list, not a replacement — the head whose password is
          being reset stays visible behind the dialog.

          This exists because the key icon used to reset on the first click: one
          stray tap locked an academic head out, with no warning and nothing to
          undo. */}
      {resetTarget && (
        <motion.div
          variants={overlayFade}
          initial="hidden"
          animate="show"
          exit="hidden"
          className="absolute inset-0 z-[90] flex items-center justify-center bg-black/45 p-4"
          onClick={() => setResetTarget(null)}
        >
          <motion.div
            variants={modalPop}
            initial="hidden"
            animate="show"
            exit="exit"
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <FaExclamationTriangle className="text-amber-500" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[14px] font-bold text-gray-900">
                  Reset this password?
                </h4>
                <p className="text-[12px] text-gray-500 mt-0.5 truncate">
                  {resetTarget.name} · {resetTarget.email}
                </p>
              </div>
            </div>

            <p className="text-[12px] text-gray-600 mt-3 leading-relaxed">
              A new password is generated straight away and{" "}
              <b>the current one stops working</b>. If they are signed in they can
              keep working until their session ends, but will need the new password
              to sign in again.
            </p>
            <p className="text-[12px] text-gray-500 mt-2">
              Their access band is unchanged — you will need to pass the new
              password on to them.
            </p>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setResetTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => resetPassword(resetTarget)}
                disabled={resetting}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resetting ? (
                  <>
                    <FaSpinner className="animate-spin" /> Resetting…
                  </>
                ) : (
                  <>
                    <FaKey /> Reset password
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AcademicHeadsModal;
