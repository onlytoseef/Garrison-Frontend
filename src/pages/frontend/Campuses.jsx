import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSchool,
  FaUsers,
  FaChalkboardTeacher,
  FaPlus,
  FaSignOutAlt,
  FaKey,
  FaArrowRight,
  FaCopy,
  FaUserCheck,
  FaClipboardList,
  FaExclamationTriangle,
  FaCalendarCheck,
  FaBookOpen,
  FaFileAlt,
  FaMoneyCheck,
  FaChevronDown,
  FaBuilding,
  FaUserGraduate,
} from "react-icons/fa";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { setActiveCampusId } from "../../config/axiosSetup";
import ChangePasswordModal from "../components/ChangePasswordModal";
import LogsModal from "../components/LogsModal";
import { logoutUser } from "../../store/slices/authSlice";
import logo from "../../assets/images/logo.png";

// ---------------------------------------------------------------------------
// Design tokens — every value here comes from :root in index.css so this page
// stays in step with the rest of the app instead of inventing its own palette.
// ---------------------------------------------------------------------------
const BRAND = {
  primary: "#2F5DAA",
  primaryDark: "#1E3F72",
  primaryLight: "#5B8EE8",
  green: "#0A8F4F",
  greenLight: "#3AC97C",
  amber: "#D97706",
  amberLight: "#F59E0B",
  danger: "#DC2626",
};

/**
 * Campus identity colours, drawn from the brand ramp rather than a rainbow.
 *
 * A campus keeps the same colour on every visit because the hue is derived from
 * its code, not its position in the list — so "the green one" stays green after
 * a new campus is added above it. This is the one place the page is loud, and it
 * carries real information: which campus you are looking at.
 */
const CAMPUS_HUES = [
  { from: "#2F5DAA", to: "#1E3F72", soft: "rgba(47,93,170,0.10)", ink: "#1E3F72" },
  { from: "#0A8F4F", to: "#06683A", soft: "rgba(10,143,79,0.10)", ink: "#06683A" },
  { from: "#5B8EE8", to: "#2F5DAA", soft: "rgba(91,142,232,0.12)", ink: "#2F5DAA" },
  { from: "#F59E0B", to: "#D97706", soft: "rgba(245,158,11,0.12)", ink: "#B45309" },
  { from: "#3AC97C", to: "#0A8F4F", soft: "rgba(58,201,124,0.12)", ink: "#06683A" },
  { from: "#6366F1", to: "#4338CA", soft: "rgba(99,102,241,0.10)", ink: "#4338CA" },
];

const hueFor = (code = "") => {
  let sum = 0;
  for (let i = 0; i < code.length; i++) sum += code.charCodeAt(i);
  return CAMPUS_HUES[sum % CAMPUS_HUES.length];
};

// Shared motion variants. Kept in one place so the whole page moves with a
// single rhythm instead of each section easing differently.
const EASE = [0.22, 1, 0.36, 1];

const pageStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const riseIn = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

// Modals: the backdrop fades, the panel scales up from slightly small and low.
// Both directions are defined so AnimatePresence can play the close, which is
// the half that is usually missing and the half whose absence feels abrupt.
const overlayFade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
};

const modalPop = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.28, ease: EASE } },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.18, ease: "easeIn" } },
};

// ---------------------------------------------------------------------------
// Miniature components — each is compact, deliberate, and does one job.
// ---------------------------------------------------------------------------

/**
 * 7-day attendance trend as a tiny inline bar chart. Each bar represents one day;
 * a missing day shows as a grey stub so a gap reads as "no data" rather than
 * "zero attendance." The bar for today is rendered in a heavier tone.
 */
const MiniTrend = ({ data = [], height = 28, tint = BRAND.primary }) => {
  const maxH = height;
  const barW = 4;
  const gap = 3;
  const step = barW + gap;
  const w = Math.max(data.length * step, 1);

  return (
    <svg width={w} height={maxH} className="shrink-0 overflow-visible">
      {data.map((d, i) => {
        // A day with nothing marked gets a hollow stub, not a zero-height bar:
        // "no data" and "nobody came" must not look the same.
        if (d.rate === null) {
          return (
            <rect
              key={i}
              x={i * step}
              y={maxH - 3}
              width={barW}
              height={3}
              rx={1.5}
              fill="#DCE5F2"
            />
          );
        }
        const h = Math.max(3, (d.rate / 100) * (maxH - 3));
        const isToday = i === data.length - 1;
        return (
          <motion.rect
            key={i}
            x={i * step}
            width={barW}
            rx={2}
            fill={isToday ? tint : "rgba(47,93,170,0.28)"}
            initial={{ height: 0, y: maxH }}
            animate={{ height: h, y: maxH - h }}
            transition={{ duration: 0.45, delay: 0.15 + i * 0.04, ease: EASE }}
          />
        );
      })}
    </svg>
  );
};

/**
 * The attendance ring — kept because it reads faster than a bare number.
 * Slightly smaller and lighter than the previous version.
 */
const AttendanceRing = ({ rate, size = 48 }) => {
  const stroke = 4.5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const hasData = rate !== null && rate !== undefined;
  const value = hasData ? Math.min(100, Math.max(0, rate)) : 0;

  const color = !hasData
    ? "#DCE5F2"
    : value >= 90
    ? BRAND.greenLight
    : value >= 75
    ? BRAND.amberLight
    : BRAND.danger;

  const bg = !hasData
    ? "#E2E8F0"
    : value >= 90
    ? "rgba(58,201,124,0.18)"
    : value >= 75
    ? "rgba(245,158,11,0.18)"
    : "rgba(220,38,38,0.12)";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={bg}
          strokeWidth={stroke}
        />
        {hasData && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)" }}
            // Framer does not animate SVG dashoffset directly, so set the target
            // via style override after a paint frame.
            ref={(el) => {
              if (!el) return;
              requestAnimationFrame(() => {
                el.style.strokeDashoffset = circumference * (1 - value / 100);
              });
            }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-[11px] font-semibold text-gray-800"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {hasData ? `${value}%` : "—"}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Activity row — inline, compact.
// ---------------------------------------------------------------------------
const ActivityRow = ({ entry }) => {
  const failed = entry.outcome === "failure";
  const icon = failed ? "!" : entry.category === "security" ? "s" : "d";

  const when = (() => {
    const mins = Math.floor((Date.now() - new Date(entry.createdAt)) / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(entry.createdAt).toLocaleDateString();
  })();

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/60 transition-colors">
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
          failed
            ? "bg-red-100 text-red-600"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="text-[13px] text-gray-700 truncate block leading-tight">
          {entry.summary}
        </span>
        <span className="text-[11px] text-gray-400 truncate block">
          {entry.actorName}
          {entry.campusName ? ` · ${entry.campusName}` : ""}
        </span>
      </span>
      <span className="text-[11px] text-gray-400 shrink-0 tabular-nums">
        {when}
      </span>
    </div>
  );
};

/**
 * One collapsible category in the Needs Attention panel.
 *
 * The header summarises ("Attendance — 15 classes unmarked"); expanding reveals
 * the individual rows, each of which navigates to the campus that owns it.
 * Grouping is what keeps the panel readable when a category has thirty entries,
 * and the expansion is what keeps the detail reachable without a second page.
 *
 * @param items    the raw array from overview.attention.*
 * @param label    category name shown in the header
 * @param summary  (count) => string describing the group under the label
 * @param renderItem (item) => { title, detail } for one expanded row
 * @param onItemClick (item) => void — where a single row navigates to
 */
const AttentionGroup = ({
  icon,
  label,
  items,
  count,
  summary,
  badgeClass = "bg-amber-50 text-amber-700",
  isOpen,
  onToggle,
  renderItem,
  onItemClick,
}) => {
  if (!items.length) return null;

  return (
    <div>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left group"
      >
        <span className="text-amber-500 shrink-0 text-xs">{icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-medium text-gray-700">
            {label}
          </span>
          <span className="block text-[11px] text-gray-400">{summary}</span>
        </span>
        <span
          className={`text-[11px] font-semibold px-2 py-1 rounded-full shrink-0 ${badgeClass}`}
        >
          {count}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0"
        >
          <FaChevronDown className="text-[10px]" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="overflow-hidden bg-gray-50/60"
          >
            {items.map((item, index) => {
              const { title, detail } = renderItem(item);
              return (
                <button
                  key={index}
                  onClick={() => onItemClick(item)}
                  className="w-full flex items-center gap-3 pl-12 pr-5 py-2.5 hover:bg-white transition-colors text-left group/item border-t border-white"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-[12px] text-gray-700 truncate">
                      {title}
                    </span>
                    {detail && (
                      <span className="block text-[10px] text-gray-400 truncate">
                        {detail}
                      </span>
                    )}
                  </span>
                  <FaArrowRight className="text-gray-300 group-hover/item:text-gray-600 transition-colors shrink-0 text-[9px]" />
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const Campuses = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [campuses, setCampuses] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showAttention, setShowAttention] = useState(true);
  // Which category is expanded to show its individual items. One at a time.
  const [expandedAttention, setExpandedAttention] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [logSummary, setLogSummary] = useState(null);

  const [newCredentials, setNewCredentials] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    principalName: "",
    principalEmail: "",
  });

  // -----------------------------------------------------------------------
  // Data
  // -----------------------------------------------------------------------
  const fetchCampuses = async () => {
    try {
      setLoading(true);
      const [listRes, overviewRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/campuses`),
        axios.get(`${API_BASE_URL}/api/campus-overview`),
      ]);
      setCampuses(listRes.data);
      setOverview(overviewRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load campuses");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const [logsRes, summaryRes] = await Promise.all([
        axios.get(`${API_ENDPOINTS.LOGS}?limit=6`),
        axios.get(API_ENDPOINTS.LOGS_SUMMARY),
      ]);
      setRecentLogs(logsRes.data.logs || []);
      setLogSummary(summaryRes.data);
    } catch {
      // Panel does not render.
    }
  };

  const statsByCampus = useMemo(() => {
    const map = {};
    for (const c of overview?.campuses || []) map[c._id] = c;
    return map;
  }, [overview]);

  const openCampusById = (campusId, path = "/") => {
    if (!campusId) return;
    setActiveCampusId(campusId);
    navigate(path);
  };

  useEffect(() => {
    setActiveCampusId(null);
    fetchCampuses();
    fetchRecentActivity();
  }, []);

  const openCampus = (campus) => {
    setActiveCampusId(campus._id);
    navigate("/");
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim())
      return toast.error("Campus name and code are required");
    if (!form.principalEmail.trim())
      return toast.error("Principal email is required");

    try {
      setSaving(true);
      const res = await axios.post(`${API_BASE_URL}/api/campus`, {
        ...form,
        code: form.code.trim().toUpperCase(),
      });
      setNewCredentials(res.data.principalCredentials);
      setIsAddOpen(false);
      setForm({ name: "", code: "", address: "", phone: "", principalName: "", principalEmail: "" });
      fetchCampuses();
      toast.success("Campus created");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create campus");
    } finally {
      setSaving(false);
    }
  };

  const viewCredentials = async (campus) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/campus/${campus._id}/principal`);
      if (!res.data.password)
        return toast("This principal set their own password.", { icon: "i" });
      setNewCredentials({ email: res.data.email, password: res.data.password });
    } catch (err) {
      toast.error(err.response?.data?.message || "No principal account found");
    }
  };

  const copyCredentials = () => {
    if (!newCredentials) return;
    navigator.clipboard.writeText(
      `Email: ${newCredentials.email}\nPassword: ${newCredentials.password}`
    );
    toast.success("Copied");
  };

  const handleLogout = () => {
    setActiveCampusId(null);
    dispatch(logoutUser());
    navigate("/auth/login");
  };

  // -----------------------------------------------------------------------
  // Derived figures
  // -----------------------------------------------------------------------
  const network = overview?.network || {};
  const markedToday = network.markedToday || 0;
  const totalStudents = network.totalStudents || 0;
  const totalStaff = network.totalStaff || 0;
  const totalCampuses = network.totalCampuses || 0;

  const attendanceToday =
    markedToday > 0 ? `${network.attendanceRate}%` : "—";

  const presentRate =
    totalStudents > 0
      ? Math.round(((network.presentToday || 0) / totalStudents) * 100)
      : null;

  const attentionCount = overview?.attentionCount || 0;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #F6F9FC 0%, #E8F1FB 100%)" }}>
      {/* ================================================================ */}
      {/* HEADER                                                           */}
      {/* ================================================================ */}
      <header className="glass-card sticky top-0 z-30 mb-6" style={{ borderRadius: 0 }}>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: logo + school identity */}
            <div className="flex items-center gap-3 min-w-0">
              <img src={logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain shrink-0" />
              <div className="min-w-0 hidden sm:block">
                <h1 className="text-sm font-bold text-gray-900 truncate">
                  Quaid-e-Azam Group of Colleges
                </h1>
                <p className="text-[11px] font-medium" style={{ color: BRAND.primary }}>
                  Super Admin
                </p>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-[11px] text-gray-400 hidden md:inline mr-2 truncate max-w-[180px]">
                {user?.email}
              </span>

              <button
                onClick={() => setShowLogsModal(true)}
                className="flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-white/60 transition-all duration-200"
              >
                <FaClipboardList className="text-xs" />
                <span className="hidden sm:inline">Logs</span>
              </button>

              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-white/60 transition-all duration-200"
              >
                <FaKey className="text-xs" />
                <span className="hidden sm:inline">Password</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50/70 transition-all duration-200"
              >
                <FaSignOutAlt className="text-xs" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================ */}
      {/* MAIN CONTENT                                                     */}
      {/* ================================================================ */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {/* ------------------------------------------------------------ */}
        {/* COMMAND STRIP — colourful glass tiles                        */}
        {/* ------------------------------------------------------------ */}
        {!loading && overview && (
          <motion.div
            variants={riseIn}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            {/* Total Students — brand blue */}
            <div className="glass-card p-5 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
              >
                <FaUsers className="text-white text-lg" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                  Students
                </p>
                <p className="text-2xl font-extrabold text-gray-900 tabular-nums leading-tight">
                  {totalStudents.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  across {totalCampuses} campus{totalCampuses === 1 ? "" : "es"}
                </p>
              </div>
            </div>

            {/* Staff — light blue */}
            <div className="glass-card p-5 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #5B8EE8 0%, #2F5DAA 100%)" }}
              >
                <FaChalkboardTeacher className="text-white text-lg" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                  Staff
                </p>
                <p className="text-2xl font-extrabold text-gray-900 tabular-nums leading-tight">
                  {totalStaff.toLocaleString()}
                </p>
                {network.studentTeacherRatio !== null && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {network.studentTeacherRatio}:1 ratio
                  </p>
                )}
              </div>
            </div>

            {/* Attendance — brand green */}
            <div className="glass-card p-5 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background:
                    markedToday > 0
                      ? "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)"
                      : "linear-gradient(135deg, #94A3B8 0%, #CBD5E1 100%)",
                }}
              >
                <FaUserCheck className="text-white text-lg" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                  Attendance
                </p>
                <p className="text-2xl font-extrabold text-gray-900 tabular-nums leading-tight">
                  {attendanceToday}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {markedToday > 0
                    ? `${markedToday.toLocaleString()} marked today`
                    : "not yet marked"}
                </p>
              </div>
            </div>

            {/* Needs attention — amber, and the count itself turns red when the
                list is not empty so the tile reads at a glance. */}
            <div className="glass-card p-5 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{
                  background:
                    attentionCount > 0
                      ? "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)"
                      : "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)",
                }}
              >
                <FaExclamationTriangle className="text-white text-lg" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                  Needs attention
                </p>
                <p
                  className="text-2xl font-extrabold tabular-nums leading-tight"
                  style={{ color: attentionCount > 0 ? BRAND.amber : "#111827" }}
                >
                  {attentionCount}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {attentionCount === 0 ? "all clear" : "items to review"}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading state for command strip */}
        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-5 h-[96px] animate-pulse" />
            ))}
          </div>
        )}

        {/* ------------------------------------------------------------ */}
        {/* TWO-COLUMN BODY: campus grid + sidebar                       */}
        {/* ------------------------------------------------------------ */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* -------------------------------------------------------- */}
          {/* LEFT: campus grid                                        */}
          {/* -------------------------------------------------------- */}
          <div className="flex-1 min-w-0">
            {/* --- section header with Add button --- */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                Campuses
              </h2>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsAddOpen(true)}
                className="flex items-center gap-2 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl shadow-md transition-shadow hover:shadow-lg"
                style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
              >
                <FaPlus className="text-[10px]" />
                Add campus
              </motion.button>
            </div>

            {/* --- the cards --- */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse"
                  />
                ))}
              </div>
            ) : campuses.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <FaBuilding className="text-gray-300 text-xl" />
                </div>
                <p className="text-gray-600 font-medium mb-1">No campuses yet</p>
                <p className="text-sm text-gray-400 mb-4">
                  Create your first campus to start managing the network.
                </p>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="inline-flex items-center gap-2 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl text-sm hover:bg-[#1E293B] transition-colors"
                >
                  <FaPlus /> Add your first campus
                </button>
              </div>
            ) : (
              // This grid runs its own entrance rather than inheriting the page's.
              // The cards mount only after the fetch resolves, by which time the
              // page-level stagger has already finished orchestrating — children
              // that arrive late never receive its "show", so they were staying
              // at opacity 0 until a hover forced Framer to recompute them.
              <motion.div
                variants={pageStagger}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4"
              >
                {campuses.map((campus) => {
                  const stats = statsByCampus[campus._id];
                  const hue = hueFor(campus.code);

                  return (
                    <motion.div
                      key={campus._id}
                      variants={riseIn}
                      whileHover={{ y: -3, transition: { duration: 0.2 } }}
                      className="glass-card overflow-hidden group cursor-pointer relative"
                      onClick={() => openCampus(campus)}
                    >
                      {/* Top accent strip — campus identity color */}
                      <div
                        className="h-1.5"
                        style={{ background: `linear-gradient(90deg, ${hue.from} 0%, ${hue.to} 100%)` }}
                      />

                      {/* Top strip: campus name + code */}
                      <div className="px-5 pt-5 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-[15px] font-bold text-gray-900 truncate leading-tight mb-1.5">
                              {campus.name}
                            </h3>
                            <span
                              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg font-mono"
                              style={{
                                background: hue.soft,
                                color: hue.ink,
                              }}
                            >
                              <FaBuilding className="text-[9px]" />
                              {campus.code}
                            </span>
                          </div>
                          {!campus.isActive && (
                            <span className="text-[11px] bg-red-50 text-red-600 px-2.5 py-1 rounded-lg font-semibold shrink-0">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Core stats: three tinted tiles in the campus hue */}
                      <div className="px-5 pb-4 grid grid-cols-3 gap-2">
                        {[
                          { value: campus.totalStudents, label: "Students" },
                          { value: campus.totalStaff, label: "Staff" },
                          { value: campus.totalClasses, label: "Classes" },
                        ].map((tile) => (
                          <div
                            key={tile.label}
                            className="text-center py-2.5 rounded-xl"
                            style={{ background: hue.soft }}
                          >
                            <p
                              className="text-xl font-extrabold tabular-nums leading-none mb-1"
                              style={{ color: hue.ink }}
                            >
                              {tile.value}
                            </p>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                              {tile.label}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Extended stats row — only when overview loaded */}
                      {stats && (
                        <>
                          <div className="mx-5 border-t border-white/60" />

                          <div className="px-5 py-3.5 flex items-center gap-3">
                            <AttendanceRing
                              rate={
                                stats.markedToday > 0
                                  ? stats.attendanceRate
                                  : null
                              }
                              size={44}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                7-day trend
                              </p>
                              <MiniTrend data={stats.trend || []} tint={hue.from} />
                            </div>

                            {/* Pass rate + payroll, tucked to the right */}
                            <div className="text-right shrink-0">
                              <p className="text-[13px] font-bold text-gray-800 tabular-nums leading-tight">
                                {stats.publishedResults > 0
                                  ? `${stats.passRate}%`
                                  : "—"}
                              </p>
                              <p className="text-[10px] text-gray-400 leading-none mb-1.5">
                                pass rate
                              </p>
                              <p className="text-[13px] font-bold text-gray-800 tabular-nums leading-tight">
                                {(stats.monthlyPayroll / 1000).toLocaleString(
                                  undefined,
                                  { maximumFractionDigits: 0 }
                                )}
                                k
                              </p>
                              <p className="text-[10px] text-gray-400 leading-none">
                                payroll
                              </p>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Footer: the whole card is the click target, so this is a
                          visual affordance rather than a second button — nesting
                          a real one would fire the card handler too. */}
                      <div
                        className="w-full flex items-center justify-center gap-2 py-3 text-[13px] font-semibold border-t border-white/60 transition-colors"
                        style={{ color: hue.ink }}
                      >
                        Open campus
                        <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform duration-200" />
                      </div>

                      {/* Key icon — stops the card's own click so the credentials
                          modal opens instead of navigating into the campus. */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewCredentials(campus);
                        }}
                        title="Principal credentials"
                        className="absolute top-5 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#2F5DAA] transition-all duration-200 z-10"
                      >
                        <FaKey className="text-[10px]" />
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* -------------------------------------------------------- */}
          {/* RIGHT: sidebar — attention + activity                    */}
          {/* -------------------------------------------------------- */}
          <div className="lg:w-[340px] shrink-0 space-y-5">
            {/* -------- Needs Attention -------- */}
            {!loading &&
              overview &&
              overview.attentionCount > 0 &&
              showAttention && (
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 bg-red-50/50">
                    <span className="flex items-center gap-2 text-[13px] font-semibold text-gray-800">
                      <FaExclamationTriangle className="text-red-500 text-xs" />
                      Needs attention
                      <span className="text-[11px] font-normal bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        {overview.attentionCount}
                      </span>
                    </span>
                    <button
                      onClick={() => setShowAttention(false)}
                      className="text-[11px] text-gray-500 hover:text-gray-700"
                    >
                      Hide
                    </button>
                  </div>

                  <div className="divide-y divide-gray-50">
                    <AttentionGroup
                      icon={<FaCalendarCheck />}
                      label="Attendance"
                      items={overview.attention.unmarkedAttendance}
                      count={overview.attention.unmarkedAttendance.length}
                      summary={`${overview.attention.unmarkedAttendance.length} class${
                        overview.attention.unmarkedAttendance.length === 1 ? "" : "es"
                      } unmarked today`}
                      isOpen={expandedAttention === "attendance"}
                      onToggle={() =>
                        setExpandedAttention((prev) =>
                          prev === "attendance" ? null : "attendance"
                        )
                      }
                      renderItem={(i) => ({
                        title: `${i.grade}-${i.section}`,
                        detail: `${i.studentCount} students · ${i.campusCode}`,
                      })}
                      onItemClick={(i) =>
                        openCampusById(i.campusId, "/manual-attendance")
                      }
                    />

                    <AttentionGroup
                      icon={<FaBookOpen />}
                      label="Diary"
                      items={overview.attention.missingDiary}
                      count={overview.attention.missingDiary.length}
                      summary={`${overview.attention.missingDiary.length} class${
                        overview.attention.missingDiary.length === 1 ? "" : "es"
                      } without diary`}
                      isOpen={expandedAttention === "diary"}
                      onToggle={() =>
                        setExpandedAttention((prev) =>
                          prev === "diary" ? null : "diary"
                        )
                      }
                      renderItem={(i) => ({
                        title: `${i.grade}-${i.section}`,
                        detail: i.campusCode,
                      })}
                      onItemClick={(i) => openCampusById(i.campusId, "/diary")}
                    />

                    <AttentionGroup
                      icon={<FaFileAlt />}
                      label="Exam Results"
                      items={overview.attention.pendingMarks}
                      count={overview.attention.pendingMarks.length}
                      summary={`${overview.attention.pendingMarks.length} exam${
                        overview.attention.pendingMarks.length === 1 ? "" : "s"
                      } pending marks`}
                      isOpen={expandedAttention === "marks"}
                      onToggle={() =>
                        setExpandedAttention((prev) =>
                          prev === "marks" ? null : "marks"
                        )
                      }
                      renderItem={(i) => ({
                        title: `${i.name} · ${i.grade}-${i.section}`,
                        detail: `${i.resultCount} of ${i.studentCount} · ${i.campusCode}`,
                      })}
                      onItemClick={(i) => openCampusById(i.campusId, "/exams")}
                    />

                    <AttentionGroup
                      icon={<FaSchool />}
                      label="Empty Classes"
                      items={overview.attention.emptyClasses}
                      count={overview.attention.emptyClasses.length}
                      summary={`${overview.attention.emptyClasses.length} class${
                        overview.attention.emptyClasses.length === 1 ? "" : "es"
                      } with no students`}
                      isOpen={expandedAttention === "empty"}
                      onToggle={() =>
                        setExpandedAttention((prev) =>
                          prev === "empty" ? null : "empty"
                        )
                      }
                      renderItem={(i) => ({
                        title: `${i.grade}-${i.section}`,
                        detail: `${i.campusCode}`,
                      })}
                      onItemClick={(i) =>
                        openCampusById(i.campusId, "/classes")
                      }
                    />

                    <AttentionGroup
                      icon={<FaMoneyCheck />}
                      label="Unpaid Salaries"
                      items={overview.attention.unpaidSalaries}
                      count={overview.attention.unpaidSalaries.reduce(
                        (sum, i) => sum + i.count,
                        0
                      )}
                      summary={`Rs. ${overview.attention.unpaidSalaries
                        .reduce((sum, i) => sum + i.amount, 0)
                        .toLocaleString()} outstanding`}
                      badgeClass="bg-red-50 text-red-700"
                      isOpen={expandedAttention === "salary"}
                      onToggle={() =>
                        setExpandedAttention((prev) =>
                          prev === "salary" ? null : "salary"
                        )
                      }
                      renderItem={(i) => ({
                        title: `${i.campusCode} — ${i.count} staff`,
                        detail: `Rs. ${i.amount.toLocaleString()} due`,
                      })}
                      onItemClick={(i) => openCampusById(i.campusId, "/staff")}
                    />
                  </div>
                </div>
              )}

            {/* -------- Recent Activity -------- */}
            {recentLogs.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <span className="text-[13px] font-semibold text-gray-800">
                    Recent activity
                    {logSummary?.failuresLast24h > 0 && (
                      <span className="ml-2 text-[11px] font-normal bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        {logSummary.failuresLast24h} failed
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => setShowLogsModal(true)}
                    className="text-[11px] text-gray-500 hover:text-gray-700"
                  >
                    View all
                  </button>
                </div>

                <div className="divide-y divide-gray-50 border-t border-gray-50">
                  {recentLogs.map((entry) => (
                    <ActivityRow key={entry._id} entry={entry} />
                  ))}
                </div>

                {logSummary && (
                  <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-4 text-[11px] text-gray-400">
                    <span>
                      <strong className="text-gray-700 tabular-nums">
                        {logSummary.today.toLocaleString()}
                      </strong>{" "}
                      today
                    </span>
                    <span>
                      <strong className="text-gray-700 tabular-nums">
                        {logSummary.security.toLocaleString()}
                      </strong>{" "}
                      security
                    </span>
                    <span>
                      <strong className="text-gray-700 tabular-nums">
                        {logSummary.teaching.toLocaleString()}
                      </strong>{" "}
                      teaching
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* When attention was dismissed */}
            {!loading &&
              overview &&
              overview.attentionCount > 0 &&
              !showAttention && (
                <button
                  onClick={() => setShowAttention(true)}
                  className="flex items-center gap-2 text-[13px] text-amber-600 hover:text-amber-700 px-3 py-2"
                >
                  <FaChevronDown className="text-[10px] rotate-180" />
                  Show {overview.attentionCount} attention item
                  {overview.attentionCount === 1 ? "" : "s"}
                </button>
              )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODALS                                                          */}
      {/* ============================================================== */}

      {/* Add campus */}
      <AnimatePresence>
      {isAddOpen && (
        <motion.div
          variants={overlayFade}
          initial="hidden"
          animate="show"
          exit="hidden"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            variants={modalPop}
            initial="hidden"
            animate="show"
            exit="exit"
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div
              className="px-6 py-5 rounded-t-2xl"
              style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
            >
              <h2 className="text-xl font-bold text-white mb-0.5">New campus</h2>
              <p className="text-sm text-white/70">
                A principal login is created automatically.
              </p>
            </div>
            <div className="p-6">

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Quaid e Azam Group of Colleges, Lahore"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">
                    Code *
                  </label>
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    required
                    maxLength={6}
                    placeholder="LHR"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 -mt-1">
                The code prefixes student IDs (LHR-10001). Cannot be changed later.
              </p>

              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-gray-700 mb-1">Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
                />
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-[13px] font-medium text-gray-700 mb-3">Principal account</p>
                <div className="space-y-3">
                  <input
                    name="principalName"
                    value={form.principalName}
                    onChange={handleChange}
                    placeholder="Ahmed Khan"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
                  />
                  <input
                    type="email"
                    name="principalEmail"
                    value={form.principalEmail}
                    onChange={handleChange}
                    required
                    placeholder="principal.lhr@quaideazamgroupofcolleges.edu.pk"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-2">
                  This email is their login. A password is generated and shown once.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 text-sm text-white font-semibold rounded-xl disabled:opacity-60 transition-colors"
                  style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
                >
                  {saving ? "Creating..." : "Create campus"}
                </button>
              </div>
            </form>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Principal credentials */}
      <AnimatePresence>
      {newCredentials && (
        <motion.div
          variants={overlayFade}
          initial="hidden"
          animate="show"
          exit="hidden"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div
            variants={modalPop}
            initial="hidden"
            animate="show"
            exit="exit"
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
          >
            <div
              className="px-6 py-5 rounded-t-2xl"
              style={{ background: "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)" }}
            >
              <h2 className="text-xl font-bold text-white mb-0.5">
                Principal login
              </h2>
              <p className="text-sm text-white/80">
                Share these with the principal. Viewable again from the key icon.
              </p>
            </div>
            <div className="p-6">
            <div
              className="rounded-xl p-4 space-y-3 border"
              style={{ background: "#EFF6FF", borderColor: "#DBEAFE" }}
            >
              <div>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">Email</p>
                <p className="font-semibold text-gray-900 break-all text-sm">
                  {newCredentials.email}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">Password</p>
                <p className="font-semibold text-gray-900 tracking-wider text-sm">
                  {newCredentials.password}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={copyCredentials}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                <FaCopy /> Copy
              </button>
              <button
                onClick={() => setNewCredentials(null)}
                className="px-4 py-2.5 text-sm text-white font-semibold rounded-xl transition-colors"
                style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
              >
                Done
              </button>
            </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      {showLogsModal && (
        <LogsModal
          onClose={() => {
            setShowLogsModal(false);
            fetchRecentActivity();
          }}
        />
      )}
    </div>
  );
};

export default Campuses;
