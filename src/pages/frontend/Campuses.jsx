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
  FaQrcode,
  FaFileAlt,
  FaMoneyCheck,
} from "react-icons/fa";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import { setActiveCampusId } from "../../config/axiosSetup";
import ChangePasswordModal from "../components/ChangePasswordModal";
import LogsModal from "../components/LogsModal";
import { logoutUser } from "../../store/slices/authSlice";

/**
 * Super admin landing page: every campus with its totals, plus campus creation.
 *
 * Opening a campus stores its id, which the axios interceptor then sends as
 * X-Campus-Id on every request — from that point the super admin sees exactly
 * what that campus's principal sees.
 */
/**
 * 7-day attendance sparkline, hand-rolled SVG.
 *
 * No chart library: this is a polyline in a fixed viewBox, which keeps the
 * bundle unchanged and renders identically at any card width.
 *
 * Days with rate === null (nothing marked — holiday, or attendance not taken)
 * break the line rather than plotting as zero, so a gap reads as "no data"
 * instead of "everyone was absent".
 */
const Sparkline = ({ data, width = 132, height = 34 }) => {
  const points = (data || []).map((d, i) => ({ ...d, i }));
  const known = points.filter((p) => p.rate !== null);

  if (known.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[10px] text-gray-400"
        style={{ width, height }}
      >
        not enough data
      </div>
    );
  }

  const stepX = width / Math.max(points.length - 1, 1);
  // Always scale 0-100: attendance is a percentage, and auto-scaling would make
  // a 60→65 wobble look like a cliff.
  const toY = (rate) => height - 3 - (rate / 100) * (height - 6);

  // Split into unbroken runs so a null day leaves a real gap in the line.
  const runs = [];
  let run = [];
  for (const p of points) {
    if (p.rate === null) {
      if (run.length) runs.push(run);
      run = [];
    } else {
      run.push(`${(p.i * stepX).toFixed(1)},${toY(p.rate).toFixed(1)}`);
    }
  }
  if (run.length) runs.push(run);

  const last = known[known.length - 1];
  const first = known[0];
  const rising = last.rate >= first.rate;
  const stroke = rising ? "#16A34A" : "#DC2626";

  return (
    <svg width={width} height={height} className="overflow-visible">
      {runs.map((r, idx) =>
        r.length === 1 ? (
          <circle
            key={idx}
            cx={r[0].split(",")[0]}
            cy={r[0].split(",")[1]}
            r="1.8"
            fill={stroke}
          />
        ) : (
          <polyline
            key={idx}
            points={r.join(" ")}
            fill="none"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      )}
      <circle
        cx={(last.i * stepX).toFixed(1)}
        cy={toY(last.rate).toFixed(1)}
        r="2.6"
        fill={stroke}
      />
    </svg>
  );
};

/** Circular attendance gauge — reads faster than a bare number. */
const AttendanceRing = ({ rate, size = 60 }) => {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const hasData = rate !== null && rate !== undefined;
  const value = hasData ? rate : 0;

  const color = !hasData
    ? "#D1D5DB"
    : value >= 90
    ? "#16A34A"
    : value >= 75
    ? "#F59E0B"
    : "#DC2626";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(0,0,0,0.07)"
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
            strokeDashoffset={circumference * (1 - value / 100)}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="text-sm font-bold text-gray-800"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {hasData ? `${value}%` : "—"}
        </span>
      </div>
    </div>
  );
};

/**
 * Tier 1 stat tile. tabular-nums keeps digits the same width so the numbers
 * line up across the row instead of jittering.
 */
const StatTile = ({ icon, label, value, sub, accent, alert }) => (
  <motion.div
    whileHover={{ y: -3 }}
    className="glass-card p-5 flex items-start gap-4"
    style={alert ? { borderColor: "rgba(220,38,38,0.35)" } : undefined}
  >
    <div
      className="p-3 rounded-xl shrink-0"
      style={{ background: accent.bg, color: accent.fg }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs sm:text-sm text-gray-600 font-medium">{label}</p>
      <p
        className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-0.5 truncate">{sub}</p>}
    </div>
  </motion.div>
);

/** One row in the Needs Attention panel. Clicking opens the relevant campus. */
const AttentionRow = ({ icon, label, detail, campusCode, onOpen }) => (
  <button
    onClick={onOpen}
    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/60 transition-colors text-left group"
  >
    <span className="text-amber-600 shrink-0">{icon}</span>
    <span className="flex-1 min-w-0">
      <span className="block text-sm text-gray-800 font-medium truncate">
        {label}
      </span>
      {detail && (
        <span className="block text-xs text-gray-500 truncate">{detail}</span>
      )}
    </span>
    {campusCode && (
      <span className="text-xs font-mono bg-white/70 text-gray-600 px-2 py-0.5 rounded shrink-0">
        {campusCode}
      </span>
    )}
    <FaArrowRight className="text-gray-300 group-hover:text-[#2F5DAA] transition-colors shrink-0" />
  </button>
);

/**
 * One entry in the Recent Activity panel.
 *
 * A failure (a rejected login) is styled apart from ordinary activity — it is
 * the one line on this dashboard that might mean someone is trying to get in.
 */
const ActivityRow = ({ entry }) => {
  const failed = entry.outcome === "failure";
  const tone = failed
    ? { bg: "#FEF2F2", fg: "#B91C1C" }
    : entry.category === "security"
    ? { bg: "#EFF6FF", fg: "#1D4ED8" }
    : entry.category === "data"
    ? { bg: "#F5F3FF", fg: "#6D28D9" }
    : { bg: "#ECFDF5", fg: "#047857" };

  // Relative time for anything recent, falling back to a date once "x days ago"
  // stops being easier to read than the date itself.
  const when = (() => {
    const mins = Math.floor((Date.now() - new Date(entry.createdAt)) / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(entry.createdAt).toLocaleDateString();
  })();

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span
        className="p-2 rounded-lg shrink-0 mt-0.5 text-sm"
        style={{ background: tone.bg, color: tone.fg }}
      >
        {failed ? <FaExclamationTriangle /> : <FaClipboardList />}
      </span>
      <span className="flex-1 min-w-0">
        <span
          className={`block text-sm truncate ${
            failed ? "text-red-700 font-medium" : "text-gray-800"
          }`}
        >
          {entry.summary}
        </span>
        <span className="block text-xs text-gray-500 truncate">
          {entry.actorName}
          {entry.campusName ? ` · ${entry.campusName}` : ""}
        </span>
      </span>
      <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
        {when}
      </span>
    </div>
  );
};

const Campuses = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [campuses, setCampuses] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Needs Attention panel starts open — the whole point is that the super admin
  // sees these without having to go looking.
  const [showAttention, setShowAttention] = useState(true);

  // Recent staff activity. Held separately from `overview` because it comes from
  // a different endpoint and a failure there must not blank the campus cards.
  const [recentLogs, setRecentLogs] = useState([]);
  const [logSummary, setLogSummary] = useState(null);

  // Shown once after creation — the generated password cannot be recovered from
  // the bcrypt hash, only from the AES copy via the credentials endpoint.
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

  // Campus list and overview are fetched together so the stat strip and the
  // cards can never show figures from two different moments.
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

  /**
   * Recent activity for the dashboard panel. Fetched on its own and failing
   * quietly: the log is useful context, but the campus list is the page's job
   * and must still render if this call breaks.
   */
  const fetchRecentActivity = async () => {
    try {
      const [logsRes, summaryRes] = await Promise.all([
        axios.get(`${API_ENDPOINTS.LOGS}?limit=8`),
        axios.get(API_ENDPOINTS.LOGS_SUMMARY),
      ]);
      setRecentLogs(logsRes.data.logs || []);
      setLogSummary(summaryRes.data);
    } catch {
      // Panel simply does not render.
    }
  };

  // Per-campus overview stats, keyed by id so a card can pick up its own row
  // without scanning the array on every render.
  const statsByCampus = useMemo(() => {
    const map = {};
    for (const c of overview?.campuses || []) map[c._id] = c;
    return map;
  }, [overview]);

  // Jump straight from an attention row into the campus it belongs to.
  const openCampusById = (campusId, path = "/") => {
    if (!campusId) return;
    setActiveCampusId(campusId);
    navigate(path);
  };

  useEffect(() => {
    // Leaving a campus context: the picker itself must not send X-Campus-Id, or
    // a stale id would follow the super admin around.
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
    if (!form.name.trim() || !form.code.trim()) {
      return toast.error("Campus name and code are required");
    }
    if (!form.principalEmail.trim()) {
      return toast.error("Principal email is required");
    }

    try {
      setSaving(true);
      const res = await axios.post(`${API_BASE_URL}/api/campus`, {
        ...form,
        code: form.code.trim().toUpperCase(),
      });
      setNewCredentials(res.data.principalCredentials);
      setIsAddOpen(false);
      setForm({
        name: "",
        code: "",
        address: "",
        phone: "",
        principalName: "",
        principalEmail: "",
      });
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
      const res = await axios.get(
        `${API_BASE_URL}/api/campus/${campus._id}/principal`
      );
      if (!res.data.password) {
        return toast(
          "This principal set their own password — it cannot be shown. Use reset instead.",
          { icon: "i" }
        );
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-[#1E3F72]/10 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Campuses
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Signed in as {user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 bg-[#2F5DAA] text-white px-4 py-2 rounded-lg hover:bg-[#24487f] transition-colors"
            >
              <FaPlus /> Add Campus
            </button>
            <button
              onClick={() => setShowLogsModal(true)}
              className="flex items-center gap-2 bg-white/70 text-gray-700 px-4 py-2 rounded-lg hover:bg-white transition-colors"
            >
              <FaClipboardList /> Logs
            </button>
            {/* This page is the super admin's home and sits outside AdminLayout,
                so there is no sidebar to navigate from — and no campus context.
                A modal keeps them here instead of routing away and back. */}
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 bg-white/70 text-gray-700 px-4 py-2 rounded-lg hover:bg-white transition-colors"
            >
              <FaKey /> Change Password
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>

        {/* ---------------- Tier 1: network totals ---------------- */}
        {!loading && overview && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatTile
              icon={<FaUsers className="text-xl" />}
              label="Total Students"
              value={overview.network.totalStudents.toLocaleString()}
              sub={`across ${overview.network.totalCampuses} campus${
                overview.network.totalCampuses === 1 ? "" : "es"
              }`}
              accent={{ bg: "rgba(47,93,170,0.12)", fg: "#2F5DAA" }}
            />
            <StatTile
              icon={<FaUserCheck className="text-xl" />}
              label="Attendance Today"
              value={
                overview.network.markedToday > 0
                  ? `${overview.network.attendanceRate}%`
                  : "—"
              }
              sub={
                overview.network.markedToday > 0
                  ? (overview.campuses || [])
                      .filter((c) => c.markedToday > 0)
                      .map((c) => `${c.code} ${c.attendanceRate}%`)
                      .join(" · ") || "not marked yet"
                  : "not marked yet"
              }
              accent={{ bg: "rgba(22,163,74,0.12)", fg: "#16A34A" }}
            />
            <StatTile
              icon={<FaChalkboardTeacher className="text-xl" />}
              label="Total Staff"
              value={overview.network.totalStaff.toLocaleString()}
              sub={
                overview.network.studentTeacherRatio !== null
                  ? `${overview.network.studentTeacherRatio}:1 students per teacher`
                  : "no teachers yet"
              }
              accent={{ bg: "rgba(99,102,241,0.12)", fg: "#6366F1" }}
            />
            <StatTile
              icon={<FaExclamationTriangle className="text-xl" />}
              label="Needs Attention"
              value={overview.attentionCount}
              sub={
                overview.attentionCount === 0
                  ? "everything is up to date"
                  : "items to review below"
              }
              alert={overview.attentionCount > 0}
              accent={
                overview.attentionCount > 0
                  ? { bg: "rgba(217,119,6,0.14)", fg: "#B45309" }
                  : { bg: "rgba(22,163,74,0.12)", fg: "#16A34A" }
              }
            />
          </div>
        )}

        {/* ---------------- Tier 3: needs attention ---------------- */}
        {!loading && overview && overview.attentionCount > 0 && (
          <div className="glass-card mb-6 overflow-hidden">
            <button
              onClick={() => setShowAttention((v) => !v)}
              className="w-full flex items-center justify-between px-5 py-4"
            >
              <span className="flex items-center gap-2 text-gray-800 font-semibold">
                <FaExclamationTriangle className="text-amber-600" />
                Needs Attention
                <span className="text-xs font-normal bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {overview.attentionCount}
                </span>
              </span>
              <span className="text-sm text-gray-500">
                {showAttention ? "Hide" : "Show"}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {showAttention && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-white/40"
                >
                  <div className="p-2 divide-y divide-white/40">
                    {overview.attention.unmarkedAttendance.map((i) => (
                      <AttentionRow
                        key={`att-${i.classId}`}
                        icon={<FaCalendarCheck />}
                        label={`Attendance not marked — Class ${i.grade}-${i.section}`}
                        detail={`${i.studentCount} student${
                          i.studentCount === 1 ? "" : "s"
                        } waiting`}
                        campusCode={i.campusCode}
                        onOpen={() =>
                          openCampusById(i.campusId, "/manual-attendance")
                        }
                      />
                    ))}

                    {overview.attention.missingDiary.map((i) => (
                      <AttentionRow
                        key={`diary-${i.classId}`}
                        icon={<FaBookOpen />}
                        label={`No diary today — Class ${i.grade}-${i.section}`}
                        campusCode={i.campusCode}
                        onOpen={() => openCampusById(i.campusId, "/diary")}
                      />
                    ))}

                    {overview.attention.pendingMarks.map((i) => (
                      <AttentionRow
                        key={`marks-${i.examId}`}
                        icon={<FaFileAlt />}
                        label={`Marks pending — ${i.name} (${i.grade}-${i.section})`}
                        detail={`${i.resultCount} of ${i.studentCount} entered`}
                        campusCode={i.campusCode}
                        onOpen={() => openCampusById(i.campusId, "/exams")}
                      />
                    ))}

                    {overview.attention.emptyClasses.map((i) => (
                      <AttentionRow
                        key={`empty-${i.classId}`}
                        icon={<FaSchool />}
                        label={`Empty class — ${i.grade}-${i.section}`}
                        detail="No students enrolled yet"
                        campusCode={i.campusCode}
                        onOpen={() => openCampusById(i.campusId, "/classes")}
                      />
                    ))}

                    {overview.attention.missingQr.map((i) => (
                      <AttentionRow
                        key={`qr-${i.campusId}`}
                        icon={<FaQrcode />}
                        label={`${i.count} student${
                          i.count === 1 ? "" : "s"
                        } without a QR code`}
                        detail="ID cards cannot be printed"
                        campusCode={i.campusCode}
                        onOpen={() => openCampusById(i.campusId, "/students")}
                      />
                    ))}

                    {overview.attention.unpaidSalaries.map((i) => (
                      <AttentionRow
                        key={`sal-${i.campusId}`}
                        icon={<FaMoneyCheck />}
                        label={`${i.count} salar${
                          i.count === 1 ? "y" : "ies"
                        } unpaid this month`}
                        detail={`Rs. ${i.amount.toLocaleString()} outstanding`}
                        campusCode={i.campusCode}
                        onOpen={() => openCampusById(i.campusId, "/staff")}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ---------------- Recent activity ---------------- */}
        {recentLogs.length > 0 && (
          <div className="glass-card mb-6 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="flex items-center gap-2 text-gray-800 font-semibold">
                <FaClipboardList className="text-[#2F5DAA]" />
                Recent Activity
                {logSummary?.failuresLast24h > 0 && (
                  <span className="text-xs font-normal bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    {logSummary.failuresLast24h} failed sign-in
                    {logSummary.failuresLast24h === 1 ? "" : "s"} in 24h
                  </span>
                )}
              </span>
              <button
                onClick={() => setShowLogsModal(true)}
                className="flex items-center gap-1.5 text-sm text-[#2F5DAA] hover:underline"
              >
                View all <FaArrowRight className="text-xs" />
              </button>
            </div>

            <div className="border-t border-white/40 divide-y divide-white/40">
              {recentLogs.map((entry) => (
                <ActivityRow key={entry._id} entry={entry} />
              ))}
            </div>

            {logSummary && (
              <div className="px-5 py-3 border-t border-white/40 flex flex-wrap gap-4 text-xs text-gray-500">
                <span>
                  <strong className="text-gray-700">
                    {logSummary.today.toLocaleString()}
                  </strong>{" "}
                  today
                </span>
                <span>
                  <strong className="text-gray-700">
                    {logSummary.security.toLocaleString()}
                  </strong>{" "}
                  security
                </span>
                <span>
                  <strong className="text-gray-700">
                    {logSummary.teaching.toLocaleString()}
                  </strong>{" "}
                  teaching
                </span>
                <span className="ml-auto text-gray-400">
                  Kept for {logSummary.retentionDays} days
                </span>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white/70 rounded-xl h-44 animate-pulse border border-gray-100"
              />
            ))}
          </div>
        ) : campuses.length === 0 ? (
          <div className="bg-white/70 rounded-xl p-10 text-center border border-gray-100">
            <FaSchool className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 mb-1">No campuses yet</p>
            <p className="text-sm text-gray-400">
              Add your first campus to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campuses.map((campus) => (
              <motion.div
                key={campus._id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      {campus.name}
                    </h2>
                    <span className="inline-block mt-1 text-xs font-mono bg-blue-50 text-[#2F5DAA] px-2 py-0.5 rounded">
                      {campus.code}
                    </span>
                  </div>
                  {!campus.isActive && (
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center my-4">
                  <div>
                    <FaUsers className="mx-auto text-blue-500 mb-1" />
                    <p className="text-lg font-bold text-gray-800">
                      {campus.totalStudents}
                    </p>
                    <p className="text-xs text-gray-500">Students</p>
                  </div>
                  <div>
                    <FaChalkboardTeacher className="mx-auto text-green-500 mb-1" />
                    <p className="text-lg font-bold text-gray-800">
                      {campus.totalStaff}
                    </p>
                    <p className="text-xs text-gray-500">Staff</p>
                  </div>
                  <div>
                    <FaSchool className="mx-auto text-indigo-500 mb-1" />
                    <p className="text-lg font-bold text-gray-800">
                      {campus.totalClasses}
                    </p>
                    <p className="text-xs text-gray-500">Classes</p>
                  </div>
                </div>

                {/* Overview strip: attendance today, pass rate, payroll.
                    Rendered only when the overview call succeeded, so the card
                    still works on its own if that request fails. */}
                {statsByCampus[campus._id] && (
                  <>
                    {/* Attendance: today's ring next to the 7-day trend, so a
                        good day inside a falling week is still visible. */}
                    <div className="flex items-center gap-3 mb-3 pt-3 border-t border-white/50">
                      <AttendanceRing
                        rate={
                          statsByCampus[campus._id].markedToday > 0
                            ? statsByCampus[campus._id].attendanceRate
                            : null
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-gray-500 mb-0.5">
                          Attendance · last 7 days
                        </p>
                        <Sparkline data={statsByCampus[campus._id].trend} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mb-4 text-center">
                      <div className="flex-1">
                        <p
                          className="text-sm font-bold text-gray-800"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {statsByCampus[campus._id].publishedResults > 0
                            ? `${statsByCampus[campus._id].passRate}%`
                            : "—"}
                        </p>
                        <p className="text-[11px] text-gray-500">Pass rate</p>
                      </div>
                      <div className="w-px h-8 bg-white/60" />
                      <div className="flex-1">
                        <p
                          className="text-sm font-bold text-gray-800"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {statsByCampus[campus._id].studentTeacherRatio !== null
                            ? `${statsByCampus[campus._id].studentTeacherRatio}:1`
                            : "—"}
                        </p>
                        <p className="text-[11px] text-gray-500">Ratio</p>
                      </div>
                      <div className="w-px h-8 bg-white/60" />
                      <div className="flex-1">
                        <p
                          className="text-sm font-bold text-gray-800"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {(
                            statsByCampus[campus._id].monthlyPayroll / 1000
                          ).toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                          k
                        </p>
                        <p className="text-[11px] text-gray-500">Payroll</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-auto flex gap-2">
                  <button
                    onClick={() => openCampus(campus)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#2F5DAA] text-white py-2 rounded-lg hover:bg-[#24487f] transition-colors text-sm"
                  >
                    Open <FaArrowRight />
                  </button>
                  <button
                    onClick={() => viewCredentials(campus)}
                    title="Principal login"
                    className="px-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <FaKey />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add campus */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-1">New Campus</h2>
            <p className="text-sm text-gray-500 mb-4">
              A principal login is created automatically.
            </p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">
                    Campus name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Quaid e Azam Group of Colleges, Lahore"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Code *
                  </label>
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    required
                    maxLength={6}
                    placeholder="LHR"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 -mt-1">
                The code prefixes student IDs (LHR-10001) and cannot be changed
                later.
              </p>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Address
                </label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <hr className="my-4" />

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Principal name
                </label>
                <input
                  name="principalName"
                  value={form.principalName}
                  onChange={handleChange}
                  placeholder="Ahmed Khan"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Principal email *
                </label>
                <input
                  type="email"
                  name="principalEmail"
                  value={form.principalEmail}
                  onChange={handleChange}
                  required
                  placeholder="principal.lhr@quaideazamgroupofcolleges.edu.pk"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  This is their login. A password is generated and shown once.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-[#2F5DAA] text-white rounded-lg hover:bg-[#24487f] disabled:opacity-60"
                >
                  {saving ? "Creating..." : "Create Campus"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Principal credentials */}
      {newCredentials && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              Principal login
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Share these with the principal. You can view them again from the
              key icon.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100">
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-semibold text-gray-800 break-all">
                  {newCredentials.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Password</p>
                <p className="font-semibold text-gray-800 tracking-widest">
                  {newCredentials.password}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={copyCredentials}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <FaCopy /> Copy
              </button>
              <button
                onClick={() => setNewCredentials(null)}
                className="px-4 py-2 bg-[#2F5DAA] text-white rounded-lg hover:bg-[#24487f]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      {showLogsModal && (
        <LogsModal
          onClose={() => {
            setShowLogsModal(false);
            // The panel behind the modal is a snapshot from page load; refresh it
            // so closing the full view does not leave stale entries on screen.
            fetchRecentActivity();
          }}
        />
      )}
    </div>
  );
};

export default Campuses;
