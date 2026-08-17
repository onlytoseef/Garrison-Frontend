import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FaSchool,
  FaSignOutAlt,
  FaKey,
  FaArrowRight,
  FaBuilding,
  FaLayerGroup,
} from "react-icons/fa";
import { API_BASE_URL } from "../../config/api";
import { setActiveCampusId } from "../../config/axiosSetup";
import ChangePasswordModal from "../components/ChangePasswordModal";
import { logoutUser } from "../../store/slices/authSlice";
import logo from "../../assets/images/logo.webp";
import Loader from "../components/Loader";

// Human labels for the four grade bands. Kept in step with the backend
// (academicHeadController.js) and the AdminLayout banner.
const BAND_LABEL = {
  primary: "Primary (Play Group–5)",
  middle: "Middle (6–8)",
  matric: "Matric (9–10)",
  intermediate: "Intermediate (11–12)",
};

// A stable colour per campus, derived from its code so it never shifts as the
// list grows — the same idea the super admin's campus grid uses.
const CAMPUS_HUES = [
  { from: "#2F5DAA", to: "#1E3F72", ink: "#1E3F72" },
  { from: "#0A8F4F", to: "#06683A", ink: "#06683A" },
  { from: "#5B8EE8", to: "#2F5DAA", ink: "#2F5DAA" },
  { from: "#F59E0B", to: "#D97706", ink: "#B45309" },
  { from: "#3AC97C", to: "#0A8F4F", ink: "#06683A" },
  { from: "#6366F1", to: "#4338CA", ink: "#4338CA" },
];
const hueFor = (code = "") => {
  let sum = 0;
  for (let i = 0; i < code.length; i++) sum += code.charCodeAt(i);
  return CAMPUS_HUES[sum % CAMPUS_HUES.length];
};

/**
 * The academic head's landing page: a campus picker.
 *
 * An academic head works across every campus but is scoped to a grade band, so
 * — exactly like the super admin — they choose a campus first, then drop into
 * the campus-scoped dashboard (AdminLayout) where the data is narrowed to their
 * band. This page deliberately shows NO network figures (no payroll, pass rates
 * or attention feed): those are the super admin's, and the campus-overview API
 * refuses this role.
 */
const AcademicHeadCampuses = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const bandLabel = BAND_LABEL[user?.academicBand] || user?.academicBand || "";

  useEffect(() => {
    // A fresh campus choice every visit — never inherit a stale header.
    setActiveCampusId(null);
    let alive = true;
    (async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/campuses`);
        if (alive) setCampuses(res.data || []);
      } catch (err) {
        if (alive)
          toast.error(err.response?.data?.message || "Failed to load campuses");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const openCampus = (campus) => {
    setActiveCampusId(campus._id);
    navigate("/");
  };

  const handleLogout = () => {
    setActiveCampusId(null);
    dispatch(logoutUser());
    navigate("/auth/login");
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-white">
      {/* Header — same brand navy the sidebar uses. */}
      <header
        className="sticky top-0 z-30 mb-6 shadow-sm"
        style={{ background: "var(--sidebar-bg, #1E3F72)" }}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={logo}
                alt="Logo"
                className="w-10 h-10 rounded-lg object-contain shrink-0"
              />
              <div className="min-w-0 hidden sm:block">
                <h1 className="text-sm font-bold text-white truncate">
                  Quaid-e-Azam Group of Colleges
                </h1>
                <p className="text-[11px] font-medium text-white/70">
                  Academic Head{bandLabel ? ` · ${bandLabel}` : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-[11px] text-white/60 hidden md:inline mr-2 truncate max-w-[200px]">
                {user?.email}
              </span>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-1.5 text-[13px] text-white/85 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                <FaKey className="text-xs" />
                <span className="hidden sm:inline">Password</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-[13px] text-white/70 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-red-500/80 transition-all duration-200"
              >
                <FaSignOutAlt className="text-xs" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {/* Band banner — the one thing that defines this role's reach. */}
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-4 mb-6 text-white"
          style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
        >
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <FaLayerGroup className="text-lg" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-white/70">
              Your access
            </p>
            <p className="text-base font-bold leading-tight">
              {bandLabel || "Grade band"}
              <span className="font-normal text-white/80">
                {" "}
                · all campuses
              </span>
            </p>
          </div>
        </div>

        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-4">
          Choose a campus
        </h2>

        {campuses.length === 0 ? (
          <div className="solid-card p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FaBuilding className="text-gray-300 text-xl" />
            </div>
            <p className="text-gray-600 font-medium mb-1">No campuses yet</p>
            <p className="text-sm text-gray-400">
              Ask the super admin to create a campus first.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campuses.map((campus) => {
              const hue = hueFor(campus.code);
              return (
                <motion.button
                  key={campus._id}
                  whileHover={{ y: -3 }}
                  onClick={() => openCampus(campus)}
                  className="solid-card solid-card-interactive overflow-hidden group text-left"
                >
                  <div className="px-5 pt-5 pb-4 flex items-start gap-3.5">
                    <div
                      className="w-[52px] h-[52px] rounded-2xl shrink-0 flex items-center justify-center shadow-sm"
                      style={{
                        background: `linear-gradient(140deg, ${hue.from} 0%, ${hue.to} 100%)`,
                      }}
                    >
                      <span className="text-white font-mono font-bold text-[13px] tracking-tight">
                        {campus.code}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2">
                          {campus.name}
                        </h3>
                        {!campus.isActive && (
                          <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-md font-semibold shrink-0 mt-0.5">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1.5">
                        <FaSchool className="text-[9px]" />
                        Open campus
                      </p>
                    </div>
                  </div>
                  <div
                    className="w-full flex items-center justify-center gap-2 py-3 text-[13px] font-semibold border-t border-gray-100"
                    style={{ color: hue.ink }}
                  >
                    Enter
                    <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
};

export default AcademicHeadCampuses;
