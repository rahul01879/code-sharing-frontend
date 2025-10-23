// src/pages/AdminSnippetsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, Copy, Code2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-numbers/prism-line-numbers";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";

export default function AdminSnippetsPage() {
  const [snippets, setSnippets] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const adminKey = sessionStorage.getItem("adminKey");

  useEffect(() => {
    if (!adminKey) {
      navigate("/admin/login");
      return;
    }
    fetchSnippets();
  }, [adminKey]);

  const fetchSnippets = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/admin/snippets", {
        headers: { "x-admin-key": adminKey },
      });
      setSnippets(res.data);
    } catch (err) {
      console.error("Error fetching snippets:", err);
      if (err.response?.status === 403) {
        alert("Unauthorized access. Please log in again.");
        sessionStorage.removeItem("adminKey");
        sessionStorage.removeItem("adminAuth");
        navigate("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteSnippet = async (id) => {
    if (!window.confirm("Are you sure you want to delete this snippet?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/snippets/${id}`, {
        headers: { "x-admin-key": adminKey },
      });
      setSnippets((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Error deleting snippet:", err);
      alert("❌ Failed to delete snippet.");
    }
  };

  // ✅ Auto-highlight when modal opens
  useEffect(() => {
    Prism.highlightAll();
  }, [selectedSnippet]);

  // ✅ Improved author detection
  const getAuthor = (snippet) => {
    return (
      snippet.author ||
      snippet.user?.username ||
      snippet.user ||
      "Anonymous"
    );
  };

  // ✅ Safe search
  const filteredSnippets = snippets.filter((snippet) => {
    const title = snippet.title?.toLowerCase() || "";
    const author = getAuthor(snippet).toLowerCase();
    const language = snippet.language?.toLowerCase() || "";

    return (
      title.includes(search.toLowerCase()) ||
      author.includes(search.toLowerCase()) ||
      language.includes(search.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-300">
        <p className="animate-pulse text-lg">Loading snippets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          <Code2 size={28} />
          Manage Snippets
          <span className="text-xs px-3 py-1 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/30">
            {filteredSnippets.length} Found
          </span>
        </h1>

        <input
          type="text"
          placeholder="🔍 Search by title, author, or language..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl bg-gray-800/80 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition w-80"
        />
      </div>

      {/* Snippet Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSnippets.length > 0 ? (
          filteredSnippets.map((snippet) => (
            <div
              key={snippet._id}
              onClick={() => setSelectedSnippet(snippet)} // ✅ open modal on click
              className="cursor-pointer bg-gray-800/70 rounded-2xl border border-gray-700 hover:border-blue-500/40 p-5 shadow-md hover:shadow-blue-500/10 transition-all duration-300 group"
            >
              {/* Title & Author */}
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-lg truncate text-white/90 group-hover:text-blue-400 transition">
                  {snippet.title || "Untitled"}
                </h2>
                <span className="text-sm text-gray-400 italic">
                  👤 {getAuthor(snippet)}
                </span>
              </div>

              {/* Language & Time */}
              <div className="flex justify-between items-center mb-3 text-sm text-gray-400">
                <span className="capitalize">
                  🧩 {snippet.language || "Unknown"}
                </span>
                <span>
                  ⏱{" "}
                  {snippet.createdAt
                    ? new Date(snippet.createdAt).toLocaleString()
                    : "N/A"}
                </span>
              </div>

              {/* Code Preview */}
              <pre className="line-numbers bg-gray-900/90 p-3 rounded-lg text-sm text-gray-300 overflow-x-auto max-h-48 border border-gray-800">
                <code
                  className={`language-${snippet.language || "javascript"}`}
                >
                  {snippet.code?.length > 300
                    ? snippet.code.substring(0, 300) + "..."
                    : snippet.code || "No code available"}
                </code>
              </pre>

              {/* Actions */}
              <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    snippet.code &&
                      navigator.clipboard.writeText(snippet.code);
                  }}
                  className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg bg-blue-600/80 hover:bg-blue-700/80 transition"
                >
                  <Copy size={14} /> Copy
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSnippet(snippet._id);
                  }}
                  className="flex items-center gap-1 px-3 py-1 text-sm rounded-lg bg-red-600/80 hover:bg-red-700/80 transition"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center col-span-full">
            🚫 No snippets found
          </p>
        )}
      </div>

      {/* Full Snippet Modal */}
      {selectedSnippet && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/95 border border-gray-700 rounded-2xl max-w-5xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedSnippet(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition"
            >
              <X size={22} />
            </button>

            <h2 className="text-2xl font-bold text-white/90 mb-3">
              {selectedSnippet.title || "Untitled"}
            </h2>

            <p className="text-sm text-gray-400 mb-5">
              👤 {getAuthor(selectedSnippet)} | 🧩{" "}
              {selectedSnippet.language || "Unknown"} | ⏱{" "}
              {selectedSnippet.createdAt
                ? new Date(selectedSnippet.createdAt).toLocaleString()
                : "N/A"}
            </p>

            <pre className="line-numbers bg-gray-950 p-4 rounded-xl text-sm text-gray-300 overflow-x-auto max-h-[70vh] border border-gray-800">
              <code
                className={`language-${selectedSnippet.language || "javascript"}`}
              >
                {selectedSnippet.code || "No code available"}
              </code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
