// src/pages/CodeSharingPage.jsx
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Prism from "prismjs";
import { motion, AnimatePresence } from "framer-motion";
// Prism styles + line numbers plugin
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";

// Pre-import languages to avoid dynamic import issues
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup"; // html
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-php";
import "prismjs/components/prism-python";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-ruby";
import { FaUser, FaEnvelope, FaCode, FaGithub, FaCalendarAlt, FaExternalLinkAlt } from "react-icons/fa";

import { Home, PlusSquare, FileText, User, LogOut, Shield, FolderOpen,
         Edit2, Trash2, ArrowLeft, Github, Twitter, Linkedin, Mail, Code2, Menu,
          X , Search, Folder,  Eye, Heart, MessageSquare } from "lucide-react";




import "../App.css";
import AdminLoginPage from "./AdminLoginPage";
import AdminDashboardPage from "./AdminDashboardPage";

const API = import.meta.env.VITE_API_BASE_URL;

// ---------------- helpers ----------------
const getBadgeColor = (lang) => {
  switch ((lang || "").toLowerCase()) {
    case "javascript": return "bg-yellow-500/20 text-yellow-300";
    case "css": return "bg-blue-500/20 text-blue-300";
    case "html":
    case "markup": return "bg-orange-500/20 text-orange-300";
    case "php": return "bg-purple-500/20 text-purple-300";
    case "python": return "bg-green-500/20 text-green-300";
    case "c":
    case "cpp": return "bg-red-500/20 text-red-300";
    case "java": return "bg-amber-500/20 text-amber-300";
    case "ruby": return "bg-pink-500/20 text-pink-300";
    default: return "bg-gray-600/30 text-gray-300";
  }
};

const formatDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return "—"; }
};

function timeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - new Date(date)) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  for (const [unit, value] of Object.entries(intervals)) {
    const count = Math.floor(seconds / value);
    if (count > 0) {
      return `${count}${unit[0]} ago`; // e.g. "2d ago"
    }
  }
  return "just now";
}

// ---------------- Header ----------------
function Header({ current, onNavigate, onLogout, fetchSnippetsByTag }) {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [loading, setLoading] = useState(false);

  const navItems = [
    { id: "home", label: "Home", icon: <Home size={18} /> },
    { id: "add", label: "Add Snippet", icon: <PlusSquare size={18} /> },
    { id: "my-snippets", label: "My Snippets", icon: <FileText size={18} /> },
    { id: "collections", label: "Collections", icon: <Folder size={18} /> },
    { id: "profile", label: "Profile", icon: <User size={18} /> },
  ];

  const handleNavigate = (id, value) => {
    onNavigate?.(id, value);
    setMenuOpen(false);
    setShowSearch(false);
  };

  // ✅ Combine filter results
  const applyFilters = async (filters) => {
    if (!filters || filters.length === 0) {
      handleNavigate("home");
      return;
    }

    setLoading(true);
    try {
      const allResults = [];
      for (const lang of filters) {
        const data = await fetchSnippetsByTag(lang);
        if (data && Array.isArray(data)) allResults.push(...data);
      }

      // remove duplicates
      const uniqueResults = Array.from(new Map(allResults.map(s => [s._id, s])).values());

      onNavigate("search", uniqueResults);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Toggle language filter
  const handleFilterClick = async (lang) => {
    const updated = activeFilters.includes(lang)
      ? activeFilters.filter(f => f !== lang)
      : [...activeFilters, lang];
    setActiveFilters(updated);
    await applyFilters(updated);
  };

  const removeFilter = async (lang) => {
    const updated = activeFilters.filter(f => f !== lang);
    setActiveFilters(updated);
    await applyFilters(updated);
  };

  const clearAllFilters = async () => {
    setActiveFilters([]);
    handleNavigate("home");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-gray-950/90 backdrop-blur-md border-b border-gray-800 shadow-md">
      {/* --- Top Section --- */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4">
        {/* Logo */}
        <button
          onClick={() => handleNavigate("home")}
          className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight hover:scale-105 transition-transform"
        >
          CODE<span className="text-gray-300">X</span>
        </button>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                current === item.id
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105"
                  : "text-gray-300 hover:text-white hover:bg-gray-800/70"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-300 hover:bg-gray-800/70 hover:text-white transition-all"
            >
              <Shield size={18} /> Admin
            </Link>
          )}

          {/* Search */}
          <div className="relative ml-3">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search snippets..."
              className="pl-9 pr-4 py-2 rounded-full bg-gray-800/80 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 lg:w-64 transition-all"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleNavigate("search", e.target.value);
              }}
            />
          </div>

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 ml-3 px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium text-sm shadow-md hover:scale-105 transition-all"
            >
              <LogOut size={18} /> Logout
            </button>
          )}
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setShowSearch((prev) => !prev)}
            className="text-gray-300 hover:text-white p-1.5 rounded-full transition"
          >
            <Search size={24} />
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-300 hover:text-white p-1.5 rounded-full transition"
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {/* --- Quick Filters --- */}
      {(current === "home" || current === "search") && (
        <div className="relative border-t border-gray-800">
          <div className="flex items-center overflow-x-auto gap-3 px-4 sm:px-8 py-3 scrollbar-hide">
            <span className="text-sm text-gray-400 flex-shrink-0 font-medium">
              Quick filters:
            </span>

            {["javascript", "python", "java", "php", "typescript", "go", "ruby", "csharp"].map(
              (lang) => (
                <button
                  key={lang}
                  onClick={() => handleFilterClick(lang)}
                  className={`flex-shrink-0 px-4 py-1.5 text-xs rounded-full font-semibold transition-all duration-300 ${
                    activeFilters.includes(lang)
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md scale-105"
                      : "bg-gray-800/70 border border-gray-700 text-gray-300 hover:bg-blue-600/30 hover:text-blue-300"
                  }`}
                >
                  {lang}
                </button>
              )
            )}

            {loading && (
              <span className="text-sm text-gray-400 ml-2 animate-pulse">
                Loading…
              </span>
            )}

            {activeFilters.length > 0 && (
              <button
                onClick={clearAllFilters}
                className="ml-auto text-xs text-red-400 hover:underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Active Filter Chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 sm:px-8 pb-3">
              {activeFilters.map((f) => (
                <span
                  key={f}
                  className="flex items-center gap-2 px-3 py-1 text-xs rounded-full border border-blue-500 bg-gray-800 text-blue-300 shadow-sm transition-all"
                >
                  {f}
                  <button
                    onClick={() => removeFilter(f)}
                    className="text-gray-400 hover:text-red-400 transition"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}










function SnippetCard({ snippet, onSelect, onTagClick }) {
  return (
    <div
      onClick={() => onSelect(snippet._id)}
      className="group w-full bg-gradient-to-b from-[#1a1a2f]/90 to-[#0f0f1a]/95 
                 border border-gray-800 rounded-2xl p-5 sm:p-6 
                 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.25)]
                 transition-all duration-300 ease-out 
                 hover:-translate-y-[4px] hover:scale-[1.01] cursor-pointer 
                 overflow-hidden backdrop-blur-md"
      style={{ overflowWrap: "break-word" }}
    >
      {/* --- Header --- */}
      <div className="flex flex-wrap justify-between items-center mb-3">
        <h3 className="text-lg sm:text-xl font-semibold text-blue-400 group-hover:text-blue-300 transition-colors duration-300 line-clamp-1">
          {snippet.title}
        </h3>

        <span
          className={`${getBadgeColor(
            snippet.language
          )} px-3 py-[3px] rounded-full text-[11px] sm:text-xs font-medium uppercase tracking-wide border border-gray-700/70`}
        >
          {snippet.language || "N/A"}
        </span>
      </div>

      {/* --- Description --- */}
      <p className="text-gray-300 text-sm sm:text-base leading-snug mb-3 line-clamp-2">
        {snippet.description || "No description provided."}
      </p>

      {/* --- Tags --- */}
      {snippet.tags?.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5 mb-4"
          onClick={(e) => e.stopPropagation()} // ✅ Prevent card click when tag clicked
        >
          {snippet.tags.map((tag, idx) => (
            <span
              key={idx}
              onClick={() => onTagClick?.(tag)} // ✅ Filter by tag
              className="bg-gray-800/60 text-gray-300 text-[11px] sm:text-xs px-2 py-[2px] rounded-full border border-gray-700/70 hover:bg-blue-500/30 hover:text-blue-300 transition-all cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* --- Code Preview --- */}
      <div className="relative bg-[#11111a]/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between bg-[#1b1b2f]/80 px-3 py-2 border-b border-gray-800 text-gray-400 text-xs font-mono">
          <div className="flex items-center gap-2">
            <FaCode size={12} className="text-blue-400" />
            <span className="font-medium">{snippet.language || "code"}</span>
          </div>
        </div>

        <pre className="max-h-36 overflow-hidden text-[11px] sm:text-xs p-3 font-mono text-gray-200 leading-relaxed">
          <code className={`language-${(snippet.language || "javascript").toLowerCase()}`}>
            {snippet.code?.length > 200
              ? snippet.code.slice(0, 200) + "..."
              : snippet.code}
          </code>
        </pre>

        {snippet.code?.length > 200 && (
          <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-[#0f0f1a]/95 to-transparent pointer-events-none" />
        )}
      </div>

      {/* --- Footer (Likes, Comments, Views, Author, Date) --- */}
      <div className="mt-4 flex flex-wrap justify-between items-center text-gray-400 text-[12px] sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 bg-gray-800/70 px-2 py-[3px] rounded-full border border-gray-700/70">
            <Heart size={14} className="text-pink-500" />
            {snippet.likes?.length || 0}
          </span>

          <span className="flex items-center gap-1 bg-gray-800/70 px-2 py-[3px] rounded-full border border-gray-700/70">
            <MessageSquare size={14} className="text-blue-400" />
            {snippet.comments?.length || 0}
          </span>

          <span className="flex items-center gap-1 bg-gray-800/70 px-2 py-[3px] rounded-full border border-gray-700/70">
            <Eye size={14} className="text-green-400" />
            {snippet.views || 0}
          </span>
        </div>

        <div className="flex items-center gap-2 text-gray-500">
          <span className="truncate max-w-[100px] sm:max-w-[150px]">
            {snippet.author || "Unknown"}
          </span>
          <span className="text-gray-600">•</span>
          <span>{formatDate(snippet.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}









// ---------------- Snippet Grid ----------------
function SnippetGrid({ snippets, onSelect, onTagClick }) {
  const [currentPage, setCurrentPage] = useState(1);
  const snippetsPerPage = 8; // adjust as needed

  if (!snippets || snippets.length === 0) {
    return (
      <p className="text-center text-gray-400 text-lg w-full mt-12">
        No snippets to show.
      </p>
    );
  }

  // Pagination calculations
  const indexOfLastSnippet = currentPage * snippetsPerPage;
  const indexOfFirstSnippet = indexOfLastSnippet - snippetsPerPage;
  const currentSnippets = snippets.slice(indexOfFirstSnippet, indexOfLastSnippet);

  const totalPages = Math.ceil(snippets.length / snippetsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" }); // scroll to top on page change
    }
  };

  return (
    <div className="w-full">
      {/* Snippet Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentSnippets.map((s) => (
          <SnippetCard
            key={s._id || s.id}
            snippet={s}
            onSelect={onSelect}
            onTagClick={onTagClick} // ✅ FIXED
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
          >
            Prev
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={`px-4 py-2 rounded-lg transition ${
                currentPage === i + 1
                  ? "bg-blue-500 text-white shadow-lg scale-105"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}




// ---------------- Snippet Modal ----------------
function SnippetModal({
  snippet,
  onClose,
  onDelete,
  onSnippetUpdate,
  onLike,
  onComment,
  onSyncGithub,
  onTagClick,
}) {
  const codeRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...snippet });
  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("user")); // for delete permissions
  const [showCollections, setShowCollections] = useState(false);
  const [collections, setCollections] = useState([]);
  const [newCollection, setNewCollection] = useState("");

    useEffect(() => {
  if (!snippet) return;
  setEditData({ ...snippet });

  // ✅ Record a view only once per user per snippet (safe version)
  const recordView = async () => {
    try {
      // Read local cache safely
      let viewedSnippets = [];
      try {
        viewedSnippets = JSON.parse(localStorage.getItem("viewedSnippets")) || [];
      } catch {
        localStorage.removeItem("viewedSnippets"); // reset if broken JSON
        viewedSnippets = [];
      }

      // Skip if already viewed
      if (viewedSnippets.includes(snippet._id)) return;

      // Send view count update
      const res = await fetch(`${API}/api/snippets/${snippet._id}/view`, { method: "POST" });
      if (!res.ok) {
        console.warn("⚠️ View record failed:", res.status);
        return;
      }

      // Cache locally so it’s not counted again
      viewedSnippets.push(snippet._id);
      localStorage.setItem("viewedSnippets", JSON.stringify(viewedSnippets));

      console.log("✅ View recorded for snippet:", snippet._id);
    } catch (err) {
      console.error("Error recording view:", err);
    }
  };

  recordView();

  // Highlight code
  const t = setTimeout(() => {
    if (codeRef.current) Prism.highlightElement(codeRef.current);
  }, 20);

  // Prevent background scrolling
  document.body.style.overflow = "hidden";
  return () => {
    clearTimeout(t);
    document.body.style.overflow = "auto";
  };
}, [snippet]);


  useEffect(() => {
    if (showCollections) fetchCollections();
  }, [showCollections]);

  const fetchCollections = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(`${API}/api/collections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setCollections(await res.json());
    } catch (err) {
      console.error("fetch collections error:", err);
    }
  };

  if (!snippet) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code || "");
      alert("✅ Code copied to clipboard!");
    } catch {
      alert("❌ Copy failed");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([snippet.code || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${snippet.title || "snippet"}.${
      (snippet.language || "txt").toLowerCase()
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/snippets/${snippet._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        const updated = await res.json();
        onSnippetUpdate(updated);
        setIsEditing(false);
      } else alert("❌ Failed to update snippet");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCollection = async (collectionId) => {
    try {
      const res = await fetch(
        `${API}/api/collections/${collectionId}/add-snippet`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ snippetId: snippet._id }),
        }
      );

      if (res.ok) {
        alert("✅ Snippet added to collection!");
        setShowCollections(false);
      } else alert("❌ Failed to add to collection");
    } catch (err) {
      console.error("add to collection error:", err);
    }
  };

  const handleTagClick = (tag) => {
  onClose(); // close modal
  if (onTagClick) onTagClick(tag); // notify parent to filter by tag
};



  const handleCreateCollection = async () => {
    if (!newCollection.trim()) return alert("Enter collection name");
    try {
      const res = await fetch(`${API}/api/collections`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ name: newCollection }),
      });
      if (res.ok) {
        setNewCollection("");
        fetchCollections();
      } else alert("❌ Failed to create collection");
    } catch (err) {
      console.error("create collection error:", err);
    }
  };

  const prismLang =
    (snippet.language || "javascript").toLowerCase() === "html"
      ? "markup"
      : (snippet.language || "javascript").toLowerCase();

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 px-2 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700 w-full max-w-3xl sm:max-w-4xl md:max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-gray-700 pb-3">
          <h3 className="text-xl sm:text-2xl font-bold text-blue-400 break-words">
            {isEditing ? "Edit Snippet" : snippet.title}
          </h3>
           {/* Stats */}
            {!isEditing && (
              <div className="flex items-center gap-4 text-gray-400 text-sm mt-2">
                <span className="flex items-center gap-1">
                  <Eye className="text-blue-400" size={14} /> {snippet.views || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="text-pink-500" size={14} /> {snippet.likes?.length || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="text-green-400" size={14} /> {snippet.comments?.length || 0}
                </span>
              </div>
            )}

          <button
            onClick={onClose}
            className="self-end sm:self-auto text-red-400 hover:text-red-500 font-bold text-xl"
          >
            ✕
          </button>
        </div>

        {/* EDIT MODE */}
        {isEditing ? (
          <form
            onSubmit={handleEditSubmit}
            className="flex flex-col gap-3 mt-4 text-sm"
          >
            <input
              type="text"
              placeholder="Title"
              value={editData.title}
              onChange={(e) =>
                setEditData({ ...editData, title: e.target.value })
              }
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
            />
            <textarea
              rows="3"
              placeholder="Description"
              value={editData.description}
              onChange={(e) =>
                setEditData({ ...editData, description: e.target.value })
              }
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
            />
            <textarea
              rows="8"
              placeholder="Code..."
              value={editData.code}
              onChange={(e) =>
                setEditData({ ...editData, code: e.target.value })
              }
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 font-mono text-sm"
            />
            {/* Tags Input */}
              <input
                type="text"
                placeholder="Enter tags (comma separated)"
                value={editData.tags?.join(", ") || ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 text-sm"
                style={{ marginTop: "4px" }}
              />


            <div className="flex flex-wrap gap-3 mt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                💾 Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Description */}
            <p className="text-sm text-gray-300 mt-2 break-words">
              {snippet.description}
            </p>


            {/* TAGS */}
            {snippet.tags && snippet.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {snippet.tags.map((tag, i) => (
                  <span
                    key={i}
                    onClick={() => handleTagClick(tag)}
                    className="cursor-pointer text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded-md hover:bg-blue-600/40 transition"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            
           {/* CODE BLOCK */}
        <div className="mt-4 border border-gray-700 rounded-lg bg-gray-900/80 overflow-hidden">
          <div className="flex justify-between items-center bg-gray-800/70 px-3 py-2 border-b border-gray-700 text-xs sm:text-sm">
            <span className="font-semibold text-blue-400 uppercase">
              {snippet.language || "Code"}
            </span>
            <button
              onClick={handleCopy}
              className="text-gray-300 hover:text-white flex items-center gap-1 aria-label"
            >
              📋 Copy
            </button>
          </div>

          {/* ✅ Responsive Code Area */}
          <pre className="m-0 overflow-x-auto max-h-[60vh] sm:max-h-[500px] p-2 sm:p-4 text-[11px] sm:text-sm leading-relaxed">
            <code
              ref={codeRef}
              className={`language-${prismLang} line-numbers block min-w-full whitespace-pre`}
              style={{
                fontSize: window.innerWidth < 640 ? "11px" : "14px",
                lineHeight: window.innerWidth < 640 ? "1.3" : "1.6",
              }}
            >
              {snippet.code}
            </code>
          </pre>
        </div>


            {/* ACTION BUTTONS */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 mt-5">
              <button
                onClick={() => onLike?.(snippet._id)}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-white text-sm flex items-center gap-1"
              >
                👍 {snippet.likes?.length || 0}
              </button>

              <button
                onClick={handleDownload}
                className="bg-green-500 hover:bg-green-600 px-3 py-2 rounded-lg text-white text-sm aria-label"
              >
                ⬇ Download
              </button>

              <button
                onClick={() => setIsEditing(true)}
                className="bg-yellow-500 hover:bg-yellow-600 px-3 py-2 rounded-lg text-white text-sm"
              >
                ✏ Edit
              </button>

              {onDelete && (
                <button
                  onClick={() => onDelete(snippet._id)}
                  className="bg-red-500 hover:bg-red-600 px-3 py-2 rounded-lg text-white text-sm"
                >
                  🗑 Delete
                </button>
              )}

              {/* 🔄 Sync GitHub */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSyncGithub(snippet._id)}
                  className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md text-sm hover:scale-105 transition"
                >
                  🔄 Sync GitHub
                </button>
                {snippet.gistUrl && (
                  <a
                    href={snippet.gistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline text-sm hover:text-blue-300"
                  >
                    View →
                  </a>
                )}
              </div>

              {/* 📂 Add to Collection */}
              <div className="relative">
                <button
                  onClick={() => setShowCollections(!showCollections)}
                  className="bg-teal-600 hover:bg-teal-700 px-3 py-2 rounded-lg text-white text-sm"
                >
                  📂 Collection
                </button>
                {showCollections && (
                  <div className="absolute right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2 w-52 max-h-56 overflow-y-auto z-10">
                    {collections.length > 0 ? (
                      collections.map((c) => (
                        <button
                          key={c._id}
                          onClick={() => handleAddToCollection(c._id)}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 rounded"
                        >
                          {c.name}
                        </button>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm p-2">
                        No collections yet
                      </p>
                    )}
                    <div className="mt-2 border-t border-gray-700 pt-2">
                      <input
                        type="text"
                        placeholder="New collection..."
                        value={newCollection}
                        onChange={(e) => setNewCollection(e.target.value)}
                        className="w-full px-2 py-1 bg-gray-700 text-white rounded text-sm"
                      />
                      <button
                        onClick={handleCreateCollection}
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 rounded"
                      >
                        ➕ Create
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

       {/* 💬 COMMENTS SECTION */}
        <div className="mt-6 text-sm text-gray-300">
          <h4 className="text-lg font-semibold text-blue-400 mb-2">💬 Comments</h4>

          {/* Existing comments */}
          {snippet.comments && snippet.comments.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-700 rounded-md p-3 bg-gray-800/60">
              {snippet.comments
                .slice()
                .reverse()
                .map((c, i) => (
                  <div
                    key={c._id || i}
                    className="border-b border-gray-700 pb-2 last:border-0 last:pb-0 flex justify-between items-start"
                  >
                    <div>
                      <p className="font-semibold text-blue-300">
                        {c.user || "Anonymous"}
                        <span className="text-gray-500 text-xs ml-2">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </p>
                      <p className="text-gray-200 mt-1 whitespace-pre-wrap">{c.text}</p>
                    </div>

                    {/* 🗑 Delete button (only for author or snippet owner) */}
                    {(currentUser?.username === c.user ||
                      currentUser?.username === snippet.author) && (
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this comment?")) return;

                          try {
                            const token = localStorage.getItem("token");
                            const res = await fetch(
                              `${API}/api/snippets/${snippet._id}/comments/${c._id}`,
                              {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` },
                              }
                            );

                            const text = await res.text(); // 🧠 safer parse
                            let data;
                            try {
                              data = JSON.parse(text);
                            } catch {
                              console.error("❌ Non-JSON response:", text);
                              alert("Server error while deleting comment");
                              return;
                            }

                            if (res.ok) {
                              onSnippetUpdate(data.snippet || snippet);
                            } else {
                              alert("❌ Failed: " + (data.error || "Unknown error"));
                            }
                          } catch (err) {
                            console.error("delete comment error:", err);
                            alert("❌ Network error while deleting comment");
                          }
                        }}
                        className="text-red-400 hover:text-red-500 text-xs font-medium ml-2"
                        title="Delete comment"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              No comments yet. Be the first to comment!
            </p>
          )}

          {/* ➕ Add new comment */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!comment.trim()) return alert("Enter a comment");
              setCommentLoading(true);

              try {
                const res = await fetch(`${API}/api/snippets/${snippet._id}/comments`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                  body: JSON.stringify({ text: comment }),
                });

                const text = await res.text();
                let data;
                try {
                  data = JSON.parse(text);
                } catch {
                  console.error("❌ Non-JSON response:", text);
                  alert("Server error while adding comment");
                  return;
                }

                if (res.ok) {
                  onSnippetUpdate(data);
                  setComment("");
                } else {
                  alert("❌ Failed: " + (data.error || "Unknown error"));
                }
              } catch (err) {
                console.error("add comment error:", err);
                alert("❌ Network error while adding comment");
              } finally {
                setCommentLoading(false);
              }
            }}
            className="mt-3 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Write a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={commentLoading}
              className="flex-1 px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={commentLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center justify-center disabled:opacity-50"
            >
              {commentLoading ? "..." : "➤"}
            </button>
          </form>
        </div>



          </>
        )}
      </div>
    </div>
  );
}




// ------------------------------------------------------------------
// Collections UI
// ------------------------------------------------------------------
function CollectionsPage({ collections, onSelectCollection, onEditCollection, onDeleteCollection }) {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-blue-400 mb-6">📂 My Collections</h2>

      {collections.length === 0 ? (
        <p className="text-gray-500">No collections yet. Create one by adding a snippet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((c) => (
            <div
              key={c._id}
              onClick={() => onSelectCollection(c._id)}
              className="relative group bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700 
                         rounded-2xl p-6 shadow-md hover:shadow-blue-500/30 hover:border-blue-500 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/20 rounded-xl p-3 group-hover:bg-blue-600/30 transition">
                  <FolderOpen className="text-blue-400 w-6 h-6" />
                </div>
                <h4 className="text-lg font-semibold text-blue-300">{c.name}</h4>
              </div>
              {c.description && <p className="text-sm text-gray-400 mt-2">{c.description}</p>}
              <div className="mt-4 flex justify-between text-xs text-gray-400">
                <span>{c.snippets?.length || 0} snippets</span>
                <span>{formatDate(c.createdAt)}</span>
              </div>

              {/* Edit/Delete */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCollection(c);
                  }}
                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  <Edit2 size={14} className="text-yellow-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCollection(c._id);
                  }}
                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionDetailPage({ collection, onBack, onSelectSnippet }) {
  if (!collection) return null;
  return (
    <div className="p-8 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
      >
        <ArrowLeft size={16} /> Back
      </button>
      <h2 className="text-2xl font-bold text-blue-400">{collection.name}</h2>
      <p className="text-gray-400">{collection.description}</p>

      <SnippetGrid snippets={collection.snippets || []} onSelect={onSelectSnippet} />
    </div>
  );
}




// ---------------- add snippet form ----------------
function AddSnippetForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("");
  const [code, setCode] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in.");
        return;
      }
      const res = await axios.post(
        `${API}/api/snippets`,
        { title, description, language, code, isPublic: privacy === "public" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onAdd?.(res.data);
      setTitle(""); setDescription(""); setLanguage(""); setCode(""); setPrivacy("public");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error adding snippet");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-3xl mx-auto bg-gray-900/60 backdrop-blur-lg p-10 rounded-2xl shadow-2xl border border-gray-700"
    >
      <h2 className="text-4xl font-extrabold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-8">
        ✨ Add a New Snippet
      </h2>

      <div className="space-y-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Snippet Title"
          className="w-full border border-gray-600 bg-gray-800/70 text-gray-200 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />

        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder="Short Description"
          className="w-full border border-gray-600 bg-gray-800/70 text-gray-200 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          required
          className="w-full border border-gray-600 bg-gray-800/70 text-gray-200 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        >
          <option value="">Select Language</option>
          <option value="javascript">JavaScript</option>
          <option value="css">CSS</option>
          <option value="html">HTML</option>
          <option value="php">PHP</option>
          <option value="python">Python</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="ruby">Ruby</option>
        </select>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          placeholder="Paste your code here..."
          className="w-full border border-gray-600 bg-gray-800/70 text-gray-200 rounded-xl px-5 py-4 min-h-[180px] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />

        <div className="flex gap-6 text-gray-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={privacy === "public"}
              onChange={() => setPrivacy("public")}
              className="accent-blue-500"
            />
            <span className="text-sm">🌍 Public</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={privacy === "private"}
              onChange={() => setPrivacy("private")}
              className="accent-purple-500"
            />
            <span className="text-sm">🔒 Private</span>
          </label>
        </div>

        <div className="text-center">
          <button
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white px-10 py-4 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            {loading ? "🚀 Adding..." : "➕ Add Snippet"}
          </button>
        </div>
      </div>
    </form>
  );
}




function Profile() {
  const [user, setUser] = useState(null);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubProfile, setGithubProfile] = useState(null);
  const [githubToken, setGithubToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [totalSnippets, setTotalSnippets] = useState(0);

  // ✅ Fetch user profile (username, email, etc.)
  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${API}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setUser(data.user);
  };

  // ✅ Load GitHub status on mount
  const fetchGitHubStatus = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setChecking(true);
      const res = await fetch(`${API}/api/user/github-token`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.connected && !data.expired) {
        setGithubConnected(true);
        setGithubProfile({
          login: data.githubUsername,
          email: data.githubEmail,
          avatar_url: data.githubAvatar,
          html_url: `https://github.com/${data.githubUsername}`,
        });
      } else {
        setGithubConnected(false);
        setGithubProfile(null);
      }
    } catch (err) {
      console.error("GitHub status fetch error:", err);
    } finally {
      setChecking(false);
    }
  };

  // ✅ Fetch user snippets count
  const fetchSnippetCount = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(`${API}/api/snippets/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setTotalSnippets(data.length);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchGitHubStatus();
    fetchSnippetCount();
  }, []);

  // ✅ Verify token with GitHub API (for manual connect)
  const verifyGitHubToken = async (token) => {
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `token ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  // ✅ Save + verify GitHub token
  const handleSaveGithubToken = async () => {
    if (!githubToken.trim()) {
      alert("Please enter your GitHub personal access token");
      return;
    }

    try {
      setLoading(true);
      const appToken = localStorage.getItem("token");
      const profile = await verifyGitHubToken(githubToken);
      if (!profile) {
        alert("❌ Invalid or expired GitHub token.");
        return;
      }

      const res = await fetch(`${API}/api/user/github-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${appToken}`,
        },
        body: JSON.stringify({ token: githubToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save GitHub token");

      setGithubConnected(true);
      setGithubProfile(profile);
      setGithubToken("");
      alert(`✅ Connected to GitHub as ${profile.login}`);
    } catch (err) {
      console.error("GitHub connect error:", err);
      alert(err.message || "Failed to connect GitHub");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Disconnect GitHub
  const handleDisconnectGithub = async () => {
    if (!window.confirm("Disconnect your GitHub account?")) return;

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/api/user/github-token`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setGithubConnected(false);
      setGithubProfile(null);
      alert("🔌 GitHub disconnected.");
    } catch (err) {
      console.error("Disconnect error:", err);
      alert("❌ Failed to disconnect GitHub");
    }
  };

  if (checking) {
    return (
      <div className="flex justify-center items-center min-h-[200px] text-gray-400">
        Checking GitHub connection...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 rounded-3xl shadow-2xl border border-gray-800 text-gray-100">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg ring-4 ring-gray-900 bg-gray-700 flex items-center justify-center">
            {githubProfile?.avatar_url ? (
              <img
                src={githubProfile.avatar_url}
                alt="GitHub avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUser className="text-white text-4xl" />
            )}
          </div>
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></div>
        </div>

        <div>
          <h2 className="text-3xl font-extrabold text-white mb-1">
            {user?.username || "User"}
          </h2>
          <p className="text-gray-400 text-sm">
            {user?.email || "No email provided"}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <FaCalendarAlt className="text-blue-400" />
            <span>
              Joined{" "}
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>
      </div>

      <div className="h-[1px] bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-8"></div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-5 bg-gray-800/70 rounded-2xl border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <FaUser className="text-blue-400" />
            <h3 className="font-semibold">Username</h3>
          </div>
          <p>{user?.username || "N/A"}</p>
        </div>

        <div className="p-5 bg-gray-800/70 rounded-2xl border border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <FaEnvelope className="text-green-400" />
            <h3 className="font-semibold">Email</h3>
          </div>
          <p>{user?.email || "N/A"}</p>
        </div>

        <div className="p-5 bg-gray-800/70 rounded-2xl border border-gray-700 sm:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <FaCode className="text-purple-400" />
            <h3 className="font-semibold">Total Snippets</h3>
          </div>
          <p className="text-2xl font-bold">{totalSnippets}</p>
        </div>
      </div>

      {/* GitHub Integration */}
      <div className="mt-10 bg-gray-800/70 rounded-2xl p-6 border border-gray-700 shadow">
        <div className="flex items-center gap-3 mb-3">
          <FaGithub className="text-white text-2xl" />
          <h3 className="text-lg font-semibold text-white">
            GitHub Integration
          </h3>
        </div>

        {githubConnected && githubProfile ? (
          <div className="space-y-3">
            <p className="text-green-400 text-sm flex items-center gap-2">
              ✅ Connected as{" "}
              <a
                href={githubProfile.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline flex items-center gap-1"
              >
                {githubProfile.login} <FaExternalLinkAlt size={10} />
              </a>
            </p>

            {githubProfile.email && (
              <p className="text-gray-400 text-sm">
                📧 {githubProfile.email}
              </p>
            )}

            <button
              onClick={handleDisconnectGithub}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm text-white transition"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="password"
              placeholder="Enter your GitHub Personal Access Token"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSaveGithubToken}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm text-white disabled:opacity-60"
            >
              {loading ? "Connecting..." : "Connect GitHub"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 text-gray-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
        {/* Top Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand + About */}
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="text-blue-400" size={22} />
              <h2 className="text-xl font-bold text-white tracking-tight">
                CODE <span className="text-purple-400">X</span>
              </h2>
            </div>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              A modern code sharing platform where developers can create,
              organize, and showcase code snippets effortlessly.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-blue-400 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/add" className="hover:text-blue-400 transition">
                  Add Snippet
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-blue-400 transition">
                  Collections
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-blue-400 transition">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-3">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/docs" className="hover:text-blue-400 transition">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-blue-400 transition">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-blue-400 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-blue-400 transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact + Social */}
          <div>
            <h3 className="text-white font-semibold mb-3">Connect</h3>
            <p className="text-sm text-gray-400 mb-3">
              Got feedback or questions? We’d love to hear from you!
            </p>

            <a
              href="mailto:support@codex.dev"
              className="flex items-center gap-2 text-sm hover:text-blue-400 transition"
            >
              <Mail size={16} /> support@codex.dev
            </a>

            <div className="flex gap-4 mt-4">
              <a
                href="https://github.com/"
                className="hover:text-blue-400 transition"
              >
                <Github size={18} />
              </a>
              <a
                href="https://twitter.com/"
                className="hover:text-blue-400 transition"
              >
                <Twitter size={18} />
              </a>
              <a
                href="https://linkedin.com/"
                className="hover:text-blue-400 transition"
              >
                <Linkedin size={18} />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 mt-10 pt-6 text-sm text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>
            © {new Date().getFullYear()} <span className="font-semibold text-gray-300">CODE X</span>. 
            All rights reserved.
          </p>
          <p>
            Built with 💻 by{" "}
            <span className="text-blue-400 font-medium hover:underline">
              Developers Community
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}






export default function CodeSharingPage({ onLogout }) {
  const [page, setPage] = useState("home");
  const [publicSnippets, setPublicSnippets] = useState([]);
  const [userSnippets, setUserSnippets] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  // ✅ Collections
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);

// near the top of the component, add new states
const [currentFilter, setCurrentFilter] = useState(null);
const [loading, setLoading] = useState(false);


  // ✅ Search
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const searchDebounceRef = useRef(null);
  const normalizeSnippets = (data) =>
    Array.isArray(data)
      ? data
      : Array.isArray(data?.snippets)
      ? data.snippets
      : [];

  useEffect(() => {
   
   axios.interceptors.response.use(
      r => r,
      err => {
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("token");
          // optional: show toast "Session expired"
          window.location.reload(); // or call onLogout()
        }
        return Promise.reject(err);
      }
    );


   
    // Fetch public snippets
    axios
      .get(`${API}/api/snippets/public`)
      .then((res) => setPublicSnippets(normalizeSnippets(res.data)))
      .catch((err) => console.error("fetch public error:", err));

    const token = localStorage.getItem("token");
    if (token) {
      // Fetch current user
      axios
        .get(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setCurrentUser(res.data))
        .catch(() => {
          localStorage.removeItem("token");
          onLogout?.();
        });

      // Fetch user’s own snippets
      axios
        .get(`${API}/api/snippets/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setUserSnippets(normalizeSnippets(res.data)))
        .catch((err) => console.error("fetch mine error:", err));

      // Fetch collections
      fetchCollections();
    }
  }, []);

  // ========================= Collections =========================
  const fetchCollections = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/collections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCollections(res.data || []);
    } catch (err) {
      console.error("fetch collections error:", err);
    }
  };

  const handleSelectCollection = async (id) => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API}/api/collections/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSelectedCollection(res.data);
  };

  const handleEditCollection = async (collection) => {
    const name = prompt("Edit collection name:", collection.name);
    const description = prompt("Edit description:", collection.description);
    if (!name) return;
    const token = localStorage.getItem("token");
    await axios.put(
      `${API}/api/collections/${collection._id}`,
      { name, description },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchCollections();
  };

  const handleDeleteCollection = async (id) => {
    if (!window.confirm("Delete this collection?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(`${API}/api/collections/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchCollections();
  };

  // ========================= Snippets =========================
  const fetchSnippetById = async (id) => {
    if (!id) return;
    try {
      const res = await axios.get(`${API}/api/snippets/${id}`);
      setSelectedSnippet(res.data);
    } catch (err) {
      console.error("fetch snippet error:", err);
    }
  };

  const handleAddSnippet = (snippet) => {
    setUserSnippets((prev) => [snippet, ...prev]);
    if (snippet.isPublic) setPublicSnippets((prev) => [snippet, ...prev]);
    setPage("my-snippets");
  };

  const handleDeleteSnippet = async (id) => {
    if (!window.confirm("Delete this snippet?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/api/snippets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPublicSnippets((prev) => prev.filter((s) => s._id !== id));
      setUserSnippets((prev) => prev.filter((s) => s._id !== id));
      setSelectedSnippet(null);
    } catch (err) {
      console.error("delete error:", err);
      alert(err.response?.data?.error || "Error deleting snippet");
    }
  };

  const handleSnippetUpdate = (updatedSnippet) => {
    setPublicSnippets((prev) =>
      prev.map((s) => (s._id === updatedSnippet._id ? updatedSnippet : s))
    );
    setUserSnippets((prev) =>
      prev.map((s) => (s._id === updatedSnippet._id ? updatedSnippet : s))
    );
    setSelectedSnippet(updatedSnippet);
  };

  const handleLike = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Login required to like snippets!");
      const res = await axios.post(
        `${API}/api/snippets/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      handleSnippetUpdate(res.data);
    } catch (err) {
      console.error("like error:", err);
    }
  };

  const handleComment = async (id, text) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Login required to comment!");
      const res = await axios.post(
        `${API}/api/snippets/${id}/comments`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      handleSnippetUpdate(res.data);
    } catch (err) {
      console.error("comment error:", err);
    }
  };

// --- GitHub Sync Function ---
// 🧩 Add this here:
  const handleSyncGithub = async (snippetId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to sync snippets.");
        return;
      }

      const response = await fetch(
        `${API}/api/snippets/${snippetId}/sync-github`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync snippet to GitHub");
      }

      alert(data.message || "Snippet synced successfully to GitHub!");
    } catch (err) {
      console.error("GitHub sync error:", err);
      alert(err.message || "Sync failed");
    }
  };



  // ========================= Search =========================
  // update handleNavigate (search)
   const handleNavigate = async (targetPage, query) => {
      setPage(targetPage);

      // ✅ Normalize query so it's always a string
      const normalizedQuery = Array.isArray(query)
        ? query.join(" ")
        : (query || "").toString();

      if (targetPage === "search") {
        setSearchQuery(normalizedQuery);

        if (searchDebounceRef.current)
          clearTimeout(searchDebounceRef.current);

        searchDebounceRef.current = setTimeout(async () => {
          if (!normalizedQuery.trim()) {
            setSearchResults([]);
            return;
          }

          try {
            const res = await axios.get(
              `${API}/api/snippets/search?q=${encodeURIComponent(normalizedQuery)}`
            );
            setSearchResults(res.data || []);
          } catch (err) {
            console.error("search error:", err);
          }
        }, 350);
      }
    };


    // ========================= Tag Filtering =========================
     const fetchSnippetsByTag = async (tag) => {
  try {
    // ✅ Step 1: Toggle tag in current filters
    setCurrentFilter((prev) => {
      const updated = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];

      // ✅ Step 2: If no filters left → show home page
      if (updated.length === 0) {
        setSearchResults([]);
        setSearchQuery("");
        setPage("home");
        return [];
      }

      // ✅ Step 3: Build query string (space-separated for multiple tags)
      const query = updated.join(" ");

      // ✅ Step 4: Fetch snippets for combined filters
      (async () => {
        setLoading(true);
        try {
          const res = await axios.get(
            `${API}/api/snippets/search?q=${encodeURIComponent(query)}`
          );

          const data = res.data || [];
          setSearchResults(data);
          setPage("search");
          setSearchQuery(query);
        } catch (err) {
          console.error("Tag filter fetch error:", err);
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      })();

      return updated;
    });
  } catch (err) {
    console.error("Tag filter error:", err);
  }
};




    // Clear all filters
    const clearFilter = () => {
      setCurrentFilter([]);
      setSearchResults([]);
      setPage("home");
    };


  // ========================= Render =========================
  return (
    <div className="min-h-screen w-full bg-gray-950 text-gray-200">
      <Header
        current={page}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        fetchSnippetsByTag={fetchSnippetsByTag}
        clearFilter={clearFilter}
        loading={loading}
        currentFilter={currentFilter}
      />




      <main className="w-full px-6 py-10 space-y-12">
        {page === "home" && (
          <SnippetGrid snippets={publicSnippets} onSelect={fetchSnippetById} onTagClick={(tag) => fetchSnippetsByTag(tag)} />

        )}

        {page === "add" && <AddSnippetForm onAdd={handleAddSnippet} />}

        {page === "my-snippets" && (
          <SnippetGrid snippets={userSnippets} onSelect={fetchSnippetById} />
        )}

        {/* ✅ Collections Section */}
        {page === "collections" &&
          (selectedCollection ? (
            <CollectionDetailPage
              collection={selectedCollection}
              onBack={() => setSelectedCollection(null)}
              onSelectSnippet={fetchSnippetById}
            />
          ) : (
            <CollectionsPage
              collections={collections}
              onSelectCollection={handleSelectCollection}
              onEditCollection={handleEditCollection}
              onDeleteCollection={handleDeleteCollection}
            />
          ))}

        {page === "profile" && currentUser && (
          <Profile user={currentUser} total={userSnippets.length} />
        )}

        {/* ✅ Search Results Section */}
          {page === "search" && (
            <div className="animate-fadeIn">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-200">
                <span role="img" aria-label="search">🔍</span>
                <span>
                  Search Results for{" "}
                  <span className="text-blue-400 font-semibold">{searchQuery}</span>
                </span>
              </h2>

              {/* 🔄 Loading State */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm text-gray-400">Fetching your snippets...</p>
                </div>
              ) : searchResults.length > 0 ? (
                /* ✅ Results Grid */
                <SnippetGrid snippets={searchResults} onSelect={fetchSnippetById} />
              ) : (
                /* ❌ No Results Found */
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 transition-all duration-300">
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/10 rounded-full p-5 mb-5 shadow-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-10 h-10 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-200 mb-1">
                    No snippets found
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    We couldn’t find any snippets matching{" "}
                    <span className="text-blue-400 font-medium">{searchQuery}</span>.  
                    Try searching with a different keyword or check your filters.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={() => setPage("home")}
                      className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium shadow-md hover:opacity-90 transition"
                    >
                      🔙 Back to Home
                    </button>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="px-4 py-2 text-sm rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition"
                    >
                      Clear Search
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}


        <SnippetModal
          snippet={selectedSnippet}
          onClose={() => setSelectedSnippet(null)}
          onDelete={handleDeleteSnippet}
          onSnippetUpdate={handleSnippetUpdate}
          onLike={handleLike}
          onComment={handleComment}
          onSyncGithub={handleSyncGithub}
          onTagClick={(tag) => fetchSnippetsByTag(tag)} // ✅ fixed
        />
      </main>
      <Footer />
    </div>
  );
}
