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
import { Home, PlusSquare, FileText, User, LogOut, Shield, FolderOpen, Edit2, Trash2, ArrowLeft, Github, Twitter, Linkedin, Mail, Code2, Menu, X , Search } from "lucide-react";




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
function Header({ current, onNavigate, onLogout }) {
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");

  const navItems = [
    { id: "home", label: "Home", icon: <Home size={18} /> },
    { id: "add", label: "Add Snippet", icon: <PlusSquare size={18} /> },
    { id: "my-snippets", label: "My Snippets", icon: <FileText size={18} /> },
    { id: "collections", label: "Collections", icon: <FileText size={18} /> },
    { id: "profile", label: "Profile", icon: <User size={18} /> },
  ];

  const handleNavigate = (id, value) => {
    onNavigate?.(id, value);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-gray-950/80 backdrop-blur-xl border-b border-gray-800 shadow-lg">
      <div className="flex items-center justify-between px-5 sm:px-8 py-4">
        {/* --- LOGO --- */}
        <button
          onClick={() => handleNavigate("home")}
          className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight hover:scale-105 transition-transform"
        >
          CODE<span className="text-gray-300">X</span>
        </button>

        {/* --- DESKTOP NAV --- */}
        <nav className="hidden md:flex items-center gap-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                current === item.id
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105"
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
            >
              <Shield size={18} /> Admin
            </Link>
          )}

          {/* Search bar (desktop only) */}
          <div className="relative ml-4">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search snippets..."
              className="pl-9 pr-4 py-2 rounded-full bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleNavigate("search", e.target.value);
              }}
            />
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 ml-3 px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium text-sm shadow-md hover:scale-105 transition-all duration-300"
            >
              <LogOut size={18} /> Logout
            </button>
          )}
        </nav>

        {/* --- MOBILE MENU BUTTON --- */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-300 hover:text-white transition-transform duration-200"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* --- MOBILE NAV DROPDOWN --- */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          menuOpen ? "max-h-[450px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col gap-3 bg-gray-900/95 px-6 py-4 border-t border-gray-800 rounded-b-2xl">
          {/* Search Bar */}
          <li className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 rounded-md bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleNavigate("search", e.target.value);
              }}
            />
          </li>

          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleNavigate(item.id)}
                className={`flex items-center gap-3 w-full px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  current === item.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}

          {isAdmin && (
            <li>
              <Link
                to="/admin/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 w-full px-4 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <Shield size={18} /> Admin
              </Link>
            </li>
          )}

          {onLogout && (
            <li>
              <button
                onClick={() => {
                  onLogout();
                  setMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full mt-2 bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 rounded-md text-white font-medium hover:scale-105 transition-all"
              >
                <LogOut size={18} /> Logout
              </button>
            </li>
          )}
        </ul>
      </div>
    </header>
  );
}



// ---------------- Snippet Card ----------------
function SnippetCard({ snippet, onSelect }) {
  return (
    <div
      onClick={() => onSelect(snippet._id)}
      className="group bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80
                 border border-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg
                 hover:shadow-blue-500/20 backdrop-blur-md transition-all duration-300
                 transform hover:-translate-y-1 hover:scale-[1.01] sm:hover:-translate-y-2 sm:hover:scale-[1.02]
                 cursor-pointer w-full"
    >
      {/* Title */}
      <h3 className="text-lg sm:text-xl font-semibold sm:font-bold text-blue-400 group-hover:text-blue-300 transition line-clamp-1">
        {snippet.title}
      </h3>

      {/* Description */}
      <p className="text-gray-300 text-xs sm:text-sm mt-1 sm:mt-2 line-clamp-2 leading-relaxed">
        {snippet.description || "No description provided."}
      </p>

      {/* Tags */}
      {snippet.tags?.length > 0 && (
        <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
          {snippet.tags.map((tag, idx) => (
            <span
              key={idx}
              className="bg-gray-800 text-gray-300 text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Language */}
      <div className="mt-2 sm:mt-3">
        <span
          className={`${getBadgeColor(
            snippet.language
          )} px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold shadow-md`}
        >
          {snippet.language || "N/A"}
        </span>
      </div>

      {/* Code Preview */}
      <div className="mt-3 sm:mt-4 bg-gray-900/70 border border-gray-700 rounded-lg overflow-hidden">
        <pre className="m-0 max-h-24 sm:max-h-32 overflow-hidden text-[11px] sm:text-xs p-2 sm:p-3 font-mono">
          <code
            className={`language-${(snippet.language || "javascript").toLowerCase()}`}
          >
            {snippet.code?.length > 160
              ? snippet.code.slice(0, 160) + "..."
              : snippet.code}
          </code>
        </pre>
      </div>

      {/* Footer */}
      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0 text-[11px] sm:text-xs text-gray-400">
        <span className="flex items-center gap-1">📅 {formatDate(snippet.createdAt)}</span>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-1">👍 {snippet.likes?.length || 0}</span>
          {/* Uncomment if you want comment count */}
          {/* <span className="flex items-center gap-1">💬 {snippet.comments?.length || 0}</span> */}
          <span className="flex items-center gap-1">👤 {snippet.author || "Unknown"}</span>
        </div>
      </div>
    </div>
  );
}



// ---------------- snippet grid ----------------
function SnippetGrid({ snippets, onSelect }) {
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
          <SnippetCard key={s._id || s.id} snippet={s} onSelect={onSelect} />
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


// ---------------- snippet modal ----------------
// ---------------- Snippet Modal ----------------
function SnippetModal({
  snippet,
  onClose,
  onDelete,
  onSnippetUpdate,
  onLike,
  onComment,
  onSyncGithub,
}) {
  const codeRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...snippet });
  const [comment, setComment] = useState("");
  const [showCollections, setShowCollections] = useState(false);
  const [collections, setCollections] = useState([]);
  const [newCollection, setNewCollection] = useState("");

  useEffect(() => {
    if (!snippet) return;
    setEditData({ ...snippet });

    const t = setTimeout(() => {
      if (codeRef.current) Prism.highlightElement(codeRef.current);
    }, 20);

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

            {/* CODE BLOCK */}
            <div className="mt-4 border border-gray-700 rounded-lg bg-gray-900/80 overflow-hidden">
              <div className="flex justify-between items-center bg-gray-800/70 px-3 py-2 border-b border-gray-700 text-xs sm:text-sm">
                <span className="font-semibold text-blue-400 uppercase">
                  {snippet.language || "Code"}
                </span>
                <button
                  onClick={handleCopy}
                  className="text-gray-300 hover:text-white flex items-center gap-1"
                >
                  📋 Copy
                </button>
              </div>
              <pre className="m-0 text-xs sm:text-sm max-h-[400px] sm:max-h-[500px] overflow-auto p-3 sm:p-4 line-numbers">
                <code
                  ref={codeRef}
                  className={`language-${prismLang} line-numbers`}
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
                className="bg-green-500 hover:bg-green-600 px-3 py-2 rounded-lg text-white text-sm"
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

            {/* COMMENTS SECTION */}
            <div className="mt-6 text-sm text-gray-300">
              {/* You can integrate your existing comment section here */}
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
                <a href="/" className="hover:text-blue-400 transition">
                  Home
                </a>
              </li>
              <li>
                <a href="/add" className="hover:text-blue-400 transition">
                  Add Snippet
                </a>
              </li>
              <li>
                <a href="/collections" className="hover:text-blue-400 transition">
                  Collections
                </a>
              </li>
              <li>
                <a href="/profile" className="hover:text-blue-400 transition">
                  Profile
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-3">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/docs" className="hover:text-blue-400 transition">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/faq" className="hover:text-blue-400 transition">
                  FAQs
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-blue-400 transition">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-blue-400 transition">
                  Terms of Service
                </a>
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

  // ✅ Search
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const normalizeSnippets = (data) =>
    Array.isArray(data)
      ? data
      : Array.isArray(data?.snippets)
      ? data.snippets
      : [];

  useEffect(() => {
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
  const handleNavigate = async (targetPage, query) => {
    setPage(targetPage);
    if (targetPage === "search" && query) {
      setSearchQuery(query);
      try {
        const res = await axios.get(
          `${API}/api/snippets/search?q=${encodeURIComponent(query)}`
        );
        setSearchResults(res.data || []);
      } catch (err) {
        console.error("search error:", err);
      }
    }
  };

  // ========================= Render =========================
  return (
    <div className="min-h-screen w-full bg-gray-950 text-gray-200">
      <Header current={page} onNavigate={handleNavigate} onLogout={onLogout} />

      <main className="w-full px-6 py-10 space-y-12">
        {page === "home" && (
          <SnippetGrid snippets={publicSnippets} onSelect={fetchSnippetById} />
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

        {/* ✅ Search Results */}
        {page === "search" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              🔍 Search Results for "<span className="text-blue-400">{searchQuery}</span>"
            </h2>
            {searchResults.length > 0 ? (
              <SnippetGrid snippets={searchResults} onSelect={fetchSnippetById} />
            ) : (
              <p className="text-gray-500 text-center mt-10">
                🚫 No results found for "{searchQuery}".
              </p>
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
        />
      </main>
      <Footer />
    </div>
  );
}
