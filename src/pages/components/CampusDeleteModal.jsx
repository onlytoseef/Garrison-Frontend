import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import {
  FaExclamationTriangle,
  FaTimes,
  FaTrashAlt,
  FaSpinner,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";

/**
 * Two-step confirmation for deleting a campus and everything under it.
 *
 * Step 1 states what will be destroyed, with the campus's own counts so the number
 * of students and staff about to be erased is on screen rather than implied.
 *
 * Step 2 requires the campus CODE to be typed. This is not theatre: a second
 * "are you sure" is dismissed by the same reflex as the first, whereas typing
 * "LHR" cannot happen by reflex. The backend enforces the same thing — it rejects
 * the DELETE without a matching confirmCode — so the guard is not bypassable by
 * calling the API directly.
 *
 * The action is IRREVERSIBLE and there is no undo, which is why the wording says
 * so plainly instead of softening it.
 */
const CampusDeleteModal = ({ campus, onClose, onDeleted }) => {
  const [step, setStep] = useState(1);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (!campus) return null;

  const matches = typed.trim().toUpperCase() === campus.code.toUpperCase();

  const handleDelete = async () => {
    if (!matches) return;
    setDeleting(true);
    try {
      const { data } = await axios.delete(API_ENDPOINTS.CAMPUS_BY_ID(campus._id), {
        // axios.delete takes the body under `data`, not as the second argument.
        data: { confirmCode: campus.code },
      });
      toast.success(data?.message || "Campus deleted");
      onDeleted?.(campus._id);
      onClose();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Could not delete this campus"
      );
    } finally {
      setDeleting(false);
    }
  };

  const totals = [
    { label: "Students", value: campus.totalStudents },
    { label: "Staff", value: campus.totalStaff },
    { label: "Classes", value: campus.totalClasses },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={deleting ? undefined : onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3 px-5 pt-5 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <FaExclamationTriangle className="text-red-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-bold text-gray-900">
                {step === 1 ? "Delete this campus?" : "This cannot be undone"}
              </h3>
              <p className="text-[12px] text-gray-500 mt-0.5 truncate">
                {campus.name} ({campus.code})
              </p>
            </div>
            {!deleting && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Close"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {step === 1 ? (
            <div className="px-5 py-4">
              <p className="text-[13px] text-gray-600 leading-relaxed">
                Everything belonging to this campus will be permanently deleted:
              </p>

              <div className="mt-3 flex items-stretch rounded-xl bg-red-50/60 border border-red-100 py-3">
                {totals.map((t, i) => (
                  <div
                    key={t.label}
                    className={`flex-1 text-center ${
                      i > 0 ? "border-l border-red-100" : ""
                    }`}
                  >
                    <p className="text-[20px] font-bold text-red-600 tabular-nums leading-none">
                      {t.value ?? 0}
                    </p>
                    <p className="text-[10px] font-medium text-red-400 uppercase tracking-wider mt-1">
                      {t.label}
                    </p>
                  </div>
                ))}
              </div>

              <ul className="mt-3 text-[12px] text-gray-500 space-y-1 list-disc list-inside">
                <li>All attendance, exams, results and marks</li>
                <li>All fee payments and dues</li>
                <li>Homework diary and uploaded resources</li>
                <li>Every login: principal, campus admins, teachers, parents</li>
              </ul>

              <p className="mt-3 text-[12px] text-red-600 font-semibold">
                There is no undo and no backup is taken.
              </p>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <div className="px-5 py-4">
              <p className="text-[13px] text-gray-600 leading-relaxed">
                Type the campus code{" "}
                <span className="font-mono font-bold text-gray-900">
                  {campus.code}
                </span>{" "}
                to confirm.
              </p>

              <input
                autoFocus
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && matches && !deleting) handleDelete();
                }}
                disabled={deleting}
                placeholder={campus.code}
                className="mt-3 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono text-[14px] tracking-wide focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 disabled:bg-gray-50"
              />

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => {
                    setStep(1);
                    setTyped("");
                  }}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!matches || deleting}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <FaSpinner className="animate-spin" /> Deleting…
                    </>
                  ) : (
                    <>
                      <FaTrashAlt /> Delete campus
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CampusDeleteModal;
