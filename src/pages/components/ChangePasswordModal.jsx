import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaKey, FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";

/**
 * Change-your-own-password modal.
 *
 * Deliberately a modal rather than a route: the super admin's home is the campus
 * picker, which sits outside AdminLayout and has no campus context. Sending them
 * to a page meant leaving that screen (and, before /profile was moved out of the
 * campus guard, being bounced straight back).
 *
 * The account is decided by the auth token on the server — no user id is sent
 * from here.
 */
const ChangePasswordModal = ({ onClose }) => {
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();

    // Checked here as well as on the server so the mistake is caught before a
    // round trip; the server rules are the ones that actually hold.
    if (form.newPassword.length < 8) {
      return toast.error("New password must be at least 8 characters");
    }
    if (form.newPassword !== form.confirmPassword) {
      return toast.error("New password and confirmation do not match");
    }
    if (form.newPassword === form.currentPassword) {
      return toast.error("New password must be different from the current one");
    }

    try {
      setSaving(true);
      await axios.post(API_ENDPOINTS.UPDATE_PASSWORD, {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password updated");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, placeholder) => (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <input
        type={show ? "text" : "password"}
        value={form[key]}
        onChange={set(key)}
        placeholder={placeholder}
        required
        autoComplete={key === "currentPassword" ? "current-password" : "new-password"}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div
          className="flex items-center justify-between px-6 py-4 text-white"
          style={{
            background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
          }}
        >
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FaKey /> Change Password
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-lg"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {field("currentPassword", "Current password", "Enter current password")}
          {field("newPassword", "New password", "At least 8 characters")}
          {field("confirmPassword", "Confirm new password", "Re-enter new password")}

          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700"
          >
            {show ? <FaEyeSlash /> : <FaEye />}
            {show ? "Hide passwords" : "Show passwords"}
          </button>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-white rounded-xl font-medium disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
              }}
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
