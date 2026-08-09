import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  FaTimes,
  FaShieldAlt,
  FaDatabase,
  FaChalkboardTeacher,
  FaExclamationTriangle,
  FaSearch,
  FaFilter,
  FaSyncAlt,
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
  FaClipboardList,
} from "react-icons/fa";
import { API_ENDPOINTS } from "../../config/api";
import { overlayFade, modalPop } from "../../utils/animations";
import Loader from "./Loader";

/**
 * Activity log viewer as a modal.
 *
 * The super admin's home is the campus picker, which sits outside AdminLayout
 * and has no campus context — routing them to a page meant leaving that screen
 * entirely. Same reasoning as ChangePasswordModal.
 *
 * Self-contained: it owns its filters, paging and fetching, so it can be dropped
 * onto any screen without the host managing log state.
 */

const CATEGORIES = [
  { key: "", label: "All", icon: <FaFilter /> },
  { key: "security", label: "Security", icon: <FaShieldAlt /> },
  { key: "data", label: "Data", icon: <FaDatabase /> },
  { key: "teaching", label: "Teaching", icon: <FaChalkboardTeacher /> },
];

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

/** Icon per action prefix, so the list is scannable without reading every line. */
const actionIcon = (action = "") => {
  if (action.startsWith("login")) return <FaSignInAlt />;
  if (action.includes("password")) return <FaKey />;
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

const relativeTime = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const dayLabel = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const PAGE_SIZE = 30;

const LogsModal = ({ onClose }) => {
  const { user } = useSelector((state) => state.auth);
  const isSuperAdmin = user?.role === "super_admin";

  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 0, total: 0 });

  const [category, setCategory] = useState("");
  const [outcome, setOutcome] = useState("");
  const [campusId, setCampusId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  const buildParams = useCallback(
    (targetPage) => {
      const params = new URLSearchParams({
        page: targetPage,
        limit: PAGE_SIZE,
      });
      if (category) params.append("category", category);
      if (outcome) params.append("outcome", outcome);
      if (campusId) params.append("campusId", campusId);
      if (debouncedSearch) params.append("search", debouncedSearch);
      return params;
    },
    [category, outcome, campusId, debouncedSearch]
  );

  /** Page 1 replaces the list; later pages append, so scroll position holds. */
  const fetchPage = useCallback(
    async (targetPage, { append = false } = {}) => {
      try {
        append ? setLoadingMore(true) : setLoading(true);
        const res = await axios.get(
          `${API_ENDPOINTS.LOGS}?${buildParams(targetPage)}`
        );
        setLogs((prev) =>
          append ? [...prev, ...res.data.logs] : res.data.logs
        );
        setPagination(res.data.pagination);
        setPage(targetPage);
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load logs");
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [buildParams]
  );

  // Any filter change starts a fresh list from page 1.
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const refreshSummary = useCallback(() => {
    const qs = campusId ? `?campusId=${campusId}` : "";
    axios
      .get(`${API_ENDPOINTS.LOGS_SUMMARY}${qs}`)
      .then((res) => setSummary(res.data))
      .catch(() => {
        // Counts are decoration; their failure must not empty the list.
      });
  }, [campusId]);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    axios
      .get(API_ENDPOINTS.CAMPUSES)
      .then((res) => setCampuses(res.data))
      .catch(() => {});
  }, [isSuperAdmin]);

  const refresh = () => {
    fetchPage(1);
    refreshSummary();
  };

  const clearFilters = () => {
    setCategory("");
    setOutcome("");
    setCampusId("");
    setSearch("");
  };

  const hasFilters = category || outcome || campusId || search;
  const hasMore = page < pagination.pages;

  // Grouped by day so the list reads as a timeline rather than a flat dump.
  const grouped = logs.reduce((acc, entry) => {
    const key = dayLabel(entry.createdAt);
    (acc[key] ||= []).push(entry);
    return acc;
  }, {});

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
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 sm:px-6 py-4 text-white rounded-t-2xl shrink-0"
          style={{
            background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
          }}
        >
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FaClipboardList /> Activity Logs
            </h2>
            {summary && (
              <p className="text-xs text-white/70 mt-0.5">
                {pagination.total.toLocaleString()} entries · kept for{" "}
                {summary.retentionDays} days
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={refresh}
              title="Refresh"
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FaSyncAlt className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Actions / filters — fixed, so they stay reachable while scrolling */}
        <div className="px-5 sm:px-6 py-3 border-b border-gray-100 space-y-3 shrink-0">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  category === c.key
                    ? "text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={
                  category === c.key
                    ? {
                        background:
                          "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                      }
                    : undefined
                }
              >
                {c.icon} {c.label}
                {summary && c.key && (
                  <span className="opacity-70">
                    {summary[c.key]?.toLocaleString() ?? 0}
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={() => setOutcome(outcome === "failure" ? "" : "failure")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                outcome === "failure"
                  ? "bg-red-600 text-white"
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              <FaExclamationTriangle /> Failures
              {summary?.failures > 0 && (
                <span className="opacity-70">{summary.failures}</span>
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search person, action or record"
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {isSuperAdmin && campuses.length > 0 && (
              <select
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All campuses</option>
                {campuses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code}
                  </option>
                ))}
              </select>
            )}

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="p-4">
              <Loader fullscreen={false} size={92} />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <FaFilter className="text-3xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No activity found</p>
              <p className="text-sm text-gray-400 mt-1">
                {hasFilters
                  ? "Try widening the filters."
                  : "Activity appears here as staff use the system."}
              </p>
            </div>
          ) : (
            <>
              {Object.entries(grouped).map(([day, entries]) => (
                <div key={day}>
                  <div className="sticky top-0 bg-gray-50/95 backdrop-blur px-5 sm:px-6 py-1.5 text-xs font-semibold text-gray-500 border-b border-gray-100">
                    {day}
                  </div>
                  <div className="divide-y divide-gray-50">
                    {entries.map((entry) => {
                      const style =
                        CATEGORY_STYLE[entry.category] || CATEGORY_STYLE.data;
                      const failed = entry.outcome === "failure";
                      return (
                        <div
                          key={entry._id}
                          className="flex items-start gap-3 px-5 sm:px-6 py-3 hover:bg-gray-50/60 transition-colors"
                        >
                          <span
                            className="p-2 rounded-lg shrink-0 mt-0.5 text-sm"
                            style={{
                              background: failed ? "#FEF2F2" : style.bg,
                              color: failed ? "#B91C1C" : style.fg,
                            }}
                          >
                            {failed ? (
                              <FaExclamationTriangle />
                            ) : (
                              actionIcon(entry.action)
                            )}
                          </span>

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
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-gray-500">
                              <span className="font-medium text-gray-600">
                                {entry.actorName}
                              </span>
                              {entry.actorRole && (
                                <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                                  {ROLE_LABEL[entry.actorRole] ||
                                    entry.actorRole}
                                </span>
                              )}
                              {entry.campusName && (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                                  {entry.campusName}
                                </span>
                              )}
                              {failed && (
                                <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded font-medium">
                                  Failed
                                </span>
                              )}
                            </div>
                          </div>

                          <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                            {relativeTime(entry.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {hasMore && (
                <div className="p-4 text-center">
                  <button
                    onClick={() => fetchPage(page + 1, { append: true })}
                    disabled={loadingMore}
                    className="px-5 py-2 text-sm text-[#2F5DAA] bg-blue-50 hover:bg-blue-100 rounded-lg font-medium disabled:opacity-60"
                  >
                    {loadingMore
                      ? "Loading..."
                      : `Load more (${(
                          pagination.total - logs.length
                        ).toLocaleString()} left)`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500">
            Showing {logs.length.toLocaleString()} of{" "}
            {pagination.total.toLocaleString()}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-white rounded-lg font-medium"
            style={{
              background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
            }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LogsModal;
