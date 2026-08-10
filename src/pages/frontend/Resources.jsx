import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";
import API_BASE_URL from "../../config/api";
import toast from "react-hot-toast";
import {
  FaFolderOpen,
  FaPlus,
  FaTrash,
  FaArrowLeft,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileImage,
  FaFileAlt,
  FaDownload,
  FaSearch,
  FaTimes,
  FaCloudUploadAlt,
  FaGraduationCap,
  FaDoorOpen,
  FaUserTie,
} from "react-icons/fa";
import { MdFolderSpecial } from "react-icons/md";

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

const Resources = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [resources, setResources] = useState([]);
  const [classLoading, setClassLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");

  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Notes",
    subject: "",
  });
  const [files, setFiles] = useState([]);

  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setClassLoading(true);
      const res = await axios.get(API_ENDPOINTS.CLASSES);
      setClasses(res.data || []);
    } catch {
      toast.error("Failed to load classes");
    } finally {
      setClassLoading(false);
    }
  };

  const selectClass = async (cls) => {
    setSelectedClass(cls);
    setCategoryFilter("");
    setSearch("");
    setLoading(true);
    try {
      const subRes = await axios.get(API_ENDPOINTS.CLASS_SUBJECTS(cls._id));
      setSubjects(subRes.data.subjects || []);
    } catch {
      setSubjects([]);
    }
    await fetchResources(cls._id);
    setLoading(false);
  };

  const fetchResources = async (classId) => {
    try {
      const res = await axios.get(API_ENDPOINTS.RESOURCES, {
        params: { classId },
      });
      setResources(res.data || []);
    } catch {
      toast.error("Failed to load resources");
    }
  };

  const handleFileSelect = (e) => {
    const picked = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...picked]);
  };

  const removeStagedFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setForm({ title: "", description: "", category: "Notes", subject: "" });
    setFiles([]);
    setProgress(0);
  };

  const handleUpload = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    const data = new FormData();
    data.append("classId", selectedClass._id);
    data.append("title", form.title.trim());
    data.append("description", form.description.trim());
    data.append("category", form.category);
    data.append("subject", form.subject);
    files.forEach((f) => data.append("files", f));

    setUploading(true);
    setProgress(0);
    try {
      await axios.post(API_ENDPOINTS.RESOURCES, data, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      toast.success("Resource uploaded");
      setShowUpload(false);
      resetForm();
      fetchResources(selectedClass._id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(API_ENDPOINTS.RESOURCE_BY_ID(deleteId));
      toast.success("Resource deleted");
      setResources((prev) => prev.filter((r) => r._id !== deleteId));
    } catch {
      toast.error("Failed to delete resource");
    } finally {
      setDeleteId(null);
    }
  };

  const filteredResources = resources.filter((r) => {
    const matchCat = categoryFilter ? r.category === categoryFilter : true;
    const q = search.trim().toLowerCase();
    const matchSearch = q
      ? r.title.toLowerCase().includes(q) ||
        (r.subject || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q)
      : true;
    return matchCat && matchSearch;
  });

  // ---------- CLASS GRID VIEW ----------
  if (!selectedClass) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl 2xl:max-w-full mx-auto animate-fadeIn">
          <div className="glass-card p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div
                className="p-2 sm:p-3 rounded-xl"
                style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
              >
                <MdFolderSpecial className="text-2xl sm:text-3xl text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                  Resources
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-1">
                  Upload study material for a class
                </p>
              </div>
            </div>
          </div>

          {classLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          ) : classes.length === 0 ? (
            <div className="glass-card p-12 text-center text-gray-500">
              <FaFolderOpen className="text-6xl text-gray-300 mx-auto mb-3" />
              <p className="text-lg">No classes found. Add a class first.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {classes.map((cls, index) => (
                <button
                  key={cls._id}
                  onClick={() => selectClass(cls)}
                  className="glass-card text-left hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
                >
                  <div
                    className="p-4"
                    style={{
                      background:
                        index % 3 === 2
                          ? "linear-gradient(135deg, #1E3F72 0%, #6C8BC4 100%)"
                          : index % 3 === 1
                          ? "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)"
                          : "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)",
                    }}
                  >
                    <div className="flex items-center gap-2 text-white">
                      <FaGraduationCap className="text-2xl" />
                      <h3 className="text-xl font-bold">
                        {cls.grade} - {cls.section}
                      </h3>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <FaDoorOpen className="text-blue-600" />
                      <span className="text-sm">
                        <strong>Room:</strong> {cls.roomNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <FaUserTie className="text-blue-600" />
                      <span className="text-sm">
                        <strong>In-charge:</strong> {cls.inCharge}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-gray-100 flex items-center gap-2 text-[#2F5DAA] font-medium text-sm">
                      <FaFolderOpen /> Manage Resources
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- RESOURCE MANAGEMENT VIEW ----------
  return (
    <div className="min-h-screen bg-white p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl 2xl:max-w-full mx-auto animate-fadeIn">
        {/* Header */}
        <div className="glass-card p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedClass(null)}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
              >
                <FaArrowLeft />
              </button>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                  Resources — {selectedClass.grade} {selectedClass.section}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {resources.length} resource{resources.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowUpload(true);
              }}
              className="flex items-center justify-center gap-2 text-white px-5 py-2.5 rounded-xl font-medium transition-all hover:scale-105 shadow-md"
              style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
            >
              <FaPlus /> Upload Resource
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-card p-3 sm:p-4 mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources..."
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Resource list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-200 border-t-blue-600"></div>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="glass-card p-12 text-center text-gray-500">
            <FaFolderOpen className="text-6xl text-gray-300 mx-auto mb-3" />
            <p className="text-lg">No resources yet. Upload the first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            {filteredResources.map((r) => (
              <div key={r._id} className="glass-card p-4 sm:p-5 border border-gray-100">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryColor(
                          r.category
                        )}`}
                      >
                        {r.category}
                      </span>
                      {r.subject && (
                        <span className="text-xs text-gray-500 font-medium">
                          {r.subject}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-800">{r.title}</h3>
                    {r.description && (
                      <p className="text-sm text-gray-600 mt-1">{r.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteId(r._id)}
                    className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex-shrink-0"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>

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
                      <FaDownload className="text-gray-400 group-hover:text-blue-600" />
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

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
            <div
              className="p-5 rounded-t-2xl flex-shrink-0 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg, #2F5DAA 0%, #1E3F72 100%)" }}
            >
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaCloudUploadAlt /> Upload Resource
              </h2>
              <button
                onClick={() => !uploading && setShowUpload(false)}
                className="text-white/80 hover:text-white"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Chapter 5 - Notes"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none"
                  >
                    <option value="">— None —</option>
                    {subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Optional detail"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 focus:border-blue-500 rounded-xl outline-none"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Files *
                </label>
                <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl cursor-pointer text-gray-500 hover:text-blue-600 transition-colors">
                  <FaCloudUploadAlt className="text-3xl" />
                  <span className="text-sm">Click to add files (PDF, images, Word, Excel, PPT)</span>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*"
                    className="hidden"
                  />
                </label>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm"
                      >
                        <span className="text-lg">{fileIcon(f.name)}</span>
                        <span className="flex-1 truncate">{f.name}</span>
                        <span className="text-xs text-gray-400">{formatSize(f.size)}</span>
                        <button
                          onClick={() => removeStagedFile(i)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {uploading && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">{progress}%</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 flex-shrink-0 flex justify-end gap-3">
              <button
                onClick={() => !uploading && setShowUpload(false)}
                disabled={uploading}
                className="px-5 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-5 py-2.5 text-white rounded-xl font-medium disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #0A8F4F 0%, #3AC97C 100%)" }}
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-fadeIn overflow-hidden">
            <div
              className="p-5 rounded-t-2xl"
              style={{ background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)" }}
            >
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FaTrash /> Delete Resource
              </h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this resource and all its files? This cannot be
                undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-5 py-2.5 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-5 py-2.5 text-white rounded-xl font-medium"
                  style={{ background: "linear-gradient(135deg, #DC2626 0%, #EF4444 100%)" }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resources;
