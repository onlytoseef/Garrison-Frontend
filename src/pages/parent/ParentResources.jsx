import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import API_BASE_URL from "../../config/api";
import {
  FaFolderOpen,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileImage,
  FaFileAlt,
  FaDownload,
  FaSearch,
  FaEye,
} from "react-icons/fa";
import { MdFolderSpecial } from "react-icons/md";
import Loader from "../components/Loader";

const CATEGORIES = [
  "Notes",
  "Assignment",
  "Syllabus",
  "Date Sheet",
  "Book",
  "Past Paper",
  "Circular",
  "Other",
];

const categoryColor = (cat) => {
  const map = {
    Notes: "bg-blue-100 text-blue-700",
    Assignment: "bg-purple-100 text-purple-700",
    Syllabus: "bg-green-100 text-green-700",
    "Date Sheet": "bg-orange-100 text-orange-700",
    Book: "bg-teal-100 text-teal-700",
    "Past Paper": "bg-pink-100 text-pink-700",
    Circular: "bg-red-100 text-red-700",
    Other: "bg-gray-100 text-gray-700",
  };
  return map[cat] || "bg-gray-100 text-gray-700";
};

const isPreviewable = (name = "") => {
  const ext = name.split(".").pop()?.toLowerCase();
  return ["pdf", "jpg", "jpeg", "png", "gif", "webp"].includes(ext);
};

const fileIcon = (name = "") => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return <FaFilePdf className="text-red-500" />;
  if (["doc", "docx"].includes(ext)) return <FaFileWord className="text-blue-600" />;
  if (["xls", "xlsx"].includes(ext)) return <FaFileExcel className="text-green-600" />;
  if (["ppt", "pptx"].includes(ext)) return <FaFilePowerpoint className="text-orange-500" />;
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext))
    return <FaFileImage className="text-blue-400" />;
  return <FaFileAlt className="text-gray-500" />;
};

const formatSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isNew = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff < 3 * 24 * 60 * 60 * 1000; // 3 days
};

const ParentResources = () => {
  const [resources, setResources] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const token = JSON.parse(localStorage.getItem("authState"))?.token;

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const res = await axios.get(API_ENDPOINTS.PARENT_RESOURCES, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setResources(res.data.resources || []);
        setStudentName(res.data.studentName || "");
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const filtered = resources.filter((r) => {
    const matchCat = categoryFilter ? r.category === categoryFilter : true;
    const q = search.trim().toLowerCase();
    const matchSearch = q
      ? r.title.toLowerCase().includes(q) ||
        (r.subject || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q)
      : true;
    return matchCat && matchSearch;
  });

  return (
    <div className="p-4 sm:p-6 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3 mb-6">
        <div
          className="p-2 rounded-xl"
          style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
        >
          <MdFolderSpecial className="text-white text-xl" />
        </div>
        Resources {studentName && `— ${studentName}`}
      </h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 focus:border-[#2F5DAA] rounded-xl outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2.5 border-2 border-gray-200 focus:border-[#2F5DAA] rounded-xl outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader fullscreen={false} />
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 text-center text-gray-500">
          <FaFolderOpen className="text-5xl text-gray-300 mx-auto mb-3" />
          <p className="text-lg">No resources available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {filtered.map((r) => (
            <div key={r._id} className="glass-card p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryColor(
                    r.category
                  )}`}
                >
                  {r.category}
                </span>
                {r.subject && (
                  <span className="text-xs text-gray-500 font-medium">{r.subject}</span>
                )}
                {isNew(r.createdAt) && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500 text-white">
                    NEW
                  </span>
                )}
              </div>
              <h3 className="font-bold text-gray-800">{r.title}</h3>
              {r.description && (
                <p className="text-sm text-gray-600 mt-1">{r.description}</p>
              )}

              <div className="mt-3 space-y-2">
                {(r.files || []).map((f, i) => (
                  <a
                    key={i}
                    href={`${API_BASE_URL}${f.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors group"
                  >
                    <span className="text-xl">{fileIcon(f.fileName)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {f.fileName}
                      </p>
                      <p className="text-xs text-gray-400">{formatSize(f.fileSize)}</p>
                    </div>
                    {isPreviewable(f.fileName) ? (
                      <FaEye className="text-gray-400 group-hover:text-[#2F5DAA]" title="Preview" />
                    ) : (
                      <FaDownload className="text-gray-400 group-hover:text-[#2F5DAA]" title="Download" />
                    )}
                  </a>
                ))}
              </div>

              <p className="text-xs text-gray-400 mt-3">
                {new Date(r.createdAt).toLocaleDateString("en-PK", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentResources;
