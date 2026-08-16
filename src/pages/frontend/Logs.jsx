import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaDatabase,
  FaChalkboardTeacher,
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaTimes,
  FaSignInAlt,
  FaKey,
  FaUserPlus,
  FaTrash,
  FaEdit,
  FaBook,
  FaFolderOpen,
  FaCalendarCheck,
  FaGraduationCap,
  FaSchool,
  FaUserSlash,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";

/**
 * Activity log viewer for super admins and principals.
 *
 * A super admin sees every campus and can filter to one; a principal only ever
 * sees their own, which the API enforces from their token — the campus filter is
 * hidden for them rather than shown and ignored.
 */

const CATEGORIES = [
  { key: "", label: "All", icon: <FaFilter /> },
  { key: "security", label: "Security", icon: <FaShieldAlt /> },
  { key: "data", label: "Data", icon: <FaDatabase /> },
  { key: "teaching", label: "Teaching", icon: <FaChalkboardTeacher /> },
];

/** Icon per action prefix. Keeps the timeline scannable without reading text. */
const actionIcon = (action) => {
  if (action.startsWith("login")) return <FaSignInAlt />;
  if (action.includes("password")) return <FaKey />;
  if (action.includes("login_created")) return <FaUserPlus />;
  if (action.includes("revoked") || action.includes("blocked"))
    return <FaUserSlash />;
  if (action.includes("deleted")) return <FaTrash />;
  if (action.includes("created")) return <FaUserPlus />;
  if (action.includes("updated")) return <FaEdit />;
  if (action.startsWith("diary")) return <FaBook />;
  if (action.startsWith("resource")) return <FaFolderOpen />;
  if (action.startsWith("attendance")) return <FaCalendarCheck />;
  if (action.startsWith("exam") || action.startsWith("marks"))
    return <FaGraduationCap />;
  if (action.startsWith("campus")) return <FaSchool />;
  return <FaEdit />;
};

const CATEGORY_STYLE = {
  security: { bg: "#EFF6FF", fg: "#1D4ED8", label: "Security" },
  data: { bg: "#F5F3FF", fg: "#6D28D9", label: "Data" },
  teaching: { bg: "#ECFDF5", fg: "#047857", label: "Teaching" },
};

const ROLE_LABEL = {
  super_admin: "Super Admin",
  principal: "Principal",
  admin: "Admin",
  teacher: "Teacher",
  user: "User",
};

/** "3 minutes ago" for recent entries, absolute time once it stops being useful. */
const relativeTime = (iso) => {
  const then = new Date(iso);
  const diffMs = Date.now() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return then.toLocaleDateString();
};

const dayLabel = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const StatCard = ({ icon, label, value, accent, alert }) => (
  <div
    className="glass-card p-4 flex items-center gap-3"
    style={alert ? { borderColor: "rgba(220,38,38,0.35)" } : undefined}
  >
    <div
      className="p-3 rounded-xl shrink-0"
      style={{ background: accent.bg, color: accent.fg }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p
        className="text-2xl font-bold text-gray-800 leading-tight"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </p>
    </div>
  </div>
);

const Logs = () => {
  const { user } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === "super_admin";

  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 0, total: 0 });

  const [category, setCategory] = useState("");
  const [outcome, setOutcome] = useState("");
  const [campusId, setCampusId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Typing in the search box should not fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 50 });
      if (category) params.append("category", category);
      if (outcome) params.append("outcome", outcome);
      if (campusId) params.append("campusId", campusId);
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (from) params.append("from", from);
      if (to) params.append("to", to);

      const res = await axios.get(`${API_ENDPOINTS.LOGS}?${params}`);
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }, [page, category, outcome, campusId, debouncedSearch, from, to]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    const params = campusId ? `?campusId=${campusId}` : "";
    axios
      .get(`${API_ENDPOINTS.LOGS_SUMMARY}${params}`)
      .then((res) => setSummary(res.data))
      .catch(() => {
        // The cards are informational; their failure must not blank the page.
      });
  }, [campusId]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    // Campus picker is only meaningful for a super admin — a principal is
    // pinned to one campus by the API regardless.
    axios
      .get(API_ENDPOINTS.CAMPUSES)
      .then((res) => setCampuses(res.data))
      .catch(() => {});
  }, [isSuperAdmin]);

  // Any filter change invalidates the current page number.
  useEffect(() => {
    setPage(1);
  }, [category, outcome, campusId, debouncedSearch, from, to]);

  const clearFilters = () => {
    setCategory("");
    setOutcome("");
    setCampusId("");
    setSearch("");
    setFrom("");
    setTo("");
  };

  const hasFilters =
    category || outcome || campusId || search || from || to;

  // Group by day so the timeline reads as a diary rather than a flat list.
  const grouped = logs.reduce((acc, entry) => {
    const key = dayLabel(entry.createdAt);
    (acc[key] ||= []).push(entry);
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-screen bg-white">
      <div className="max-w-6xl 2xl:max-w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Activity Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Staff activity across the system.
            {summary?.retentionDays
              ? ` Entries older than ${summary.retentionDays} days are removed automatically.`
              : ""}
          </p>
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              icon={<FaFilter className="text-lg" />}
              label="Total entries"
              value={summary.total.toLocaleString()}
              accent={{ bg: "#EFF6FF", fg: "#1D4ED8" }}
            />
            <StatCard
              icon={<FaShieldAlt className="text-lg" />}
              label="Today"
              value={summary.today.toLocaleString()}
              accent={{ bg: "#ECFDF5", fg: "#047857" }}
            />
            <StatCard
              icon={<FaExclamationTriangle className="text-lg" />}
              label="Failures (24h)"
              value={summary.failuresLast24h.toLocaleString()}
              accent={{ bg: "#FEF2F2", fg: "#B91C1C" }}
              alert={summary.failuresLast24h > 0}
            />
            <StatCard
              icon={<FaChalkboardTeacher className="text-lg" />}
              label="Teaching activity"
              value={summary.teaching.toLocaleString()}
              accent={{ bg: "#F5F3FF", fg: "#6D28D9" }}
            />
          </div>
        )}

        {/* Filters */}
        <div className="glass-card p-4 mb-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === c.key
                    ? "text-white"
                    : "bg-white/70 text-gray-600 hover:bg-white"
                }`}
                style={
                  category === c.key
                    ? { background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }
                    : undefined
                }
              >
                {c.icon} {c.label}
                {summary && c.key && (
                  <span className="text-xs opacity-70">
                    {summary[c.key]?.toLocaleString() ?? 0}
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={() => setOutcome(outcome === "failure" ? "" : "failure")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                outcome === "failure"
                  ? "bg-red-600 text-white"
                  : "bg-white/70 text-red-600 hover:bg-white"
              }`}
            >
              <FaExclamationTriangle /> Failures only
            </button>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Person, action or record"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {isSuperAdmin && campuses.length > 0 && (
              <div className="min-w-[160px]">
                <label className="block text-xs text-gray-500 mb-1">
                  Campus
                </label>
                <select
                  value={campusId}
                  onChange={(e) => setCampusId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All campuses</option>
                  {campuses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                <FaTimes /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="glass-card h-16 animate-pulse bg-white/40"
              />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <FaFilter className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No activity found</p>
            <p className="text-sm text-gray-400 mt-1">
              {hasFilters
                ? "Try widening the filters."
                : "Activity will appear here as staff use the system."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([day, entries]) => (
              <div key={day}>
                <h2 className="text-sm font-semibold text-gray-500 mb-2 px-1">
                  {day}
                </h2>
                <div className="glass-card divide-y divide-gray-100 overflow-hidden">
                  {entries.map((entry) => {
                    const style =
                      CATEGORY_STYLE[entry.category] || CATEGORY_STYLE.data;
                    const failed = entry.outcome === "failure";
                    return (
                      <motion.div
                        key={entry._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-start gap-3 p-4 hover:bg-white/50 transition-colors"
                      >
                        <div
                          className="p-2.5 rounded-lg shrink-0 mt-0.5"
                          style={{
                            background: failed ? "#FEF2F2" : style.bg,
                            color: failed ? "#B91C1C" : style.fg,
                          }}
                        >
                          {actionIcon(entry.action)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              failed
                                ? "text-red-700 font-medium"
                                : "text-gray-800"
                            }`}
                          >
                            {entry.summary}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                            <span className="font-medium text-gray-600">
                              {entry.actorName}
                            </span>
                            {entry.actorRole && (
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                                {ROLE_LABEL[entry.actorRole] || entry.actorRole}
                              </span>
                            )}
                            {entry.campusName && (
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                                {entry.campusName}
                              </span>
                            )}
                            <span
                              className="px-1.5 py-0.5 rounded"
                              style={{ background: style.bg, color: style.fg }}
                            >
                              {style.label}
                            </span>
                            {failed && (
                              <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded font-medium">
                                Failed
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-400 whitespace-nowrap">
                            {relativeTime(entry.createdAt)}
                          </p>
                          <p className="text-[11px] text-gray-300 whitespace-nowrap">
                            {new Date(entry.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white/70 rounded-lg text-sm disabled:opacity-50 hover:bg-white"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {pagination.pages}
              <span className="text-gray-400">
                {" "}
                ({pagination.total.toLocaleString()} entries)
              </span>
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.pages}
              className="px-4 py-2 bg-white/70 rounded-lg text-sm disabled:opacity-50 hover:bg-white"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
