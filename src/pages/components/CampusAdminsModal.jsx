import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FaUserShield,
  FaTimes,
  FaPlus,
  FaTrash,
  FaKey,
  FaCopy,
  FaBuilding,
  FaArrowLeft,
} from "react-icons/fa";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { overlayFade, modalPop } from "../../utils/animations";

/**
 * Campus admin management — super admin only.
 *
 * A campus admin is a campus-level administrator with the SAME rights as the
 * campus principal (role 'admin'), pinned to one campus. This modal is where the
 * super admin adds one by name + email + campus, sees the current admins, and
 * can reset the password for or revoke each of them.
 */
const CampusAdminsModal = ({ onClose }) => {
  const [admins, setAdmins] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // "list" | "create" — the create form takes over the body when adding.
  const [view, setView] = useState("list");
  const [form, setForm] = useState({ name: "", email: "", campusId: "" });
  // The one-time credentials shown right after a create or reset.
  const [credentials, setCredentials] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [adminsRes, campusesRes] = await Promise.all([
        axios.get(API_ENDPOINTS.CAMPUS_ADMINS),
        axios.get(`${API_BASE_URL}/api/campuses`),
      ]);
      setAdmins(adminsRes.data || []);
      setCampuses(campusesRes.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load campus admins");
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
    if (!form.campusId) return toast.error("Please select a campus");
    try {
      setSaving(true);
      const res = await axios.post(API_ENDPOINTS.CAMPUS_ADMINS, {
        name: form.name.trim(),
        email: form.email.trim(),
        campusId: form.campusId,
      });
      setCredentials(res.data.credentials);
      setForm({ name: "", email: "", campusId: "" });
      setView("list");
      await load();
      toast.success("Campus admin created");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create campus admin");
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (admin) => {
    try {
      const res = await axios.post(
        API_ENDPOINTS.CAMPUS_ADMIN_RESET_PASSWORD(admin._id)
      );
      setCredentials(res.data.credentials);
      toast.success("Password reset");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    }
  };

  const revoke = async (admin) => {
    if (
      !window.confirm(
        `Remove campus admin ${admin.name} (${admin.email})? They will lose all access.`
      )
    )
      return;
    try {
      await axios.delete(API_ENDPOINTS.CAMPUS_ADMIN_BY_ID(admin._id));
      setAdmins((prev) => prev.filter((a) => a._id !== admin._id));
      toast.success("Campus admin removed");
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
            <FaUserShield /> Campus Admins
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
                  placeholder="admin.lhr@quaideazamgroupofcolleges.edu.pk"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2F5DAA] focus:border-transparent"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  This email is their login. A password is generated and shown once.
                </p>
              </div>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">
                  Campus *
                </label>
                <select
                  value={form.campusId}
                  onChange={(e) => setForm({ ...form, campusId: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2F5DAA] focus:border-transparent"
                >
                  <option value="">Select a campus</option>
                  {campuses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  The admin gets the same rights as this campus's principal.
                </p>
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
                  {saving ? "Creating..." : "Create campus admin"}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] text-gray-500">
                  {admins.length} campus admin{admins.length === 1 ? "" : "s"}
                </p>
                <button
                  onClick={() => setView("create")}
                  className="flex items-center gap-2 text-white text-[13px] font-semibold px-4 py-2 rounded-xl shadow-sm"
                  style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
                >
                  <FaPlus className="text-[10px]" /> Add campus admin
                </button>
              </div>

              {loading ? (
                <p className="text-sm text-gray-400 py-8 text-center">Loading…</p>
              ) : admins.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <FaUserShield className="text-gray-300" />
                  </div>
                  <p className="text-gray-600 font-medium mb-1">
                    No campus admins yet
                  </p>
                  <p className="text-sm text-gray-400">
                    Add one to give a campus a second principal-level login.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {admins.map((admin) => (
                    <div
                      key={admin._id}
                      className="border border-gray-100 rounded-xl p-3 flex flex-wrap items-center gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-gray-900 truncate">
                          {admin.name}
                        </p>
                        <p className="text-[12px] text-gray-400 truncate">
                          {admin.email}
                        </p>
                      </div>

                      <span className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
                        <FaBuilding className="text-[#2F5DAA] text-xs" />
                        {admin.campusName}
                        {admin.campusCode ? ` (${admin.campusCode})` : ""}
                      </span>

                      <button
                        onClick={() => resetPassword(admin)}
                        title="Reset password"
                        className="p-2 rounded-lg text-gray-400 hover:text-[#2F5DAA] hover:bg-blue-50"
                      >
                        <FaKey className="text-[13px]" />
                      </button>
                      <button
                        onClick={() => revoke(admin)}
                        title="Remove"
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <FaTrash className="text-[13px]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CampusAdminsModal;
