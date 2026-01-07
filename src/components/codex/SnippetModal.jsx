import { useEffect, useRef, useState } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";

import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-php";
import "prismjs/components/prism-python";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-ruby";

import { Download, Edit3, Folder, Github, Heart, MessageSquare, Trash2, Eye } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function SnippetModal({
  snippet,
  onClose,
  onDelete,
  onSnippetUpdate,
  onLike,
  onSyncGithub,
  onTagClick,
  onFork,
}) {
  const codeRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  const [comment, setComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  const [showCollections, setShowCollections] = useState(false);
  const [collections, setCollections] = useState([]);
  const [newCollection, setNewCollection] = useState("");

  useEffect(() => {
    if (!snippet) return;
    setEditData({ ...snippet });

    const recordView = async () => {
      try {
        let viewed = [];
        try {
          viewed = JSON.parse(localStorage.getItem("viewedSnippets")) || [];
        } catch {
          localStorage.removeItem("viewedSnippets");
          viewed = [];
        }
        if (viewed.includes(snippet._id)) return;

        await fetch(`${API}/api/snippets/${snippet._id}/view`, { method: "POST" });
        viewed.push(snippet._id);
        localStorage.setItem("viewedSnippets", JSON.stringify(viewed));
      } catch (err) {
        console.warn("view record failed:", err?.message);
      }
    };

    recordView();

    const t = setTimeout(() => {
      if (codeRef.current) Prism.highlightElement(codeRef.current);
    }, 10);

    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "auto";
    };
  }, [snippet]);

  useEffect(() => {
    if (!showCollections) return;

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

    fetchCollections();
  }, [showCollections]);

  if (!snippet || !editData) return null;

  const prismLang =
    (snippet.language || "javascript").toLowerCase() === "html"
      ? "markup"
      : (snippet.language || "javascript").toLowerCase();

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
    a.download = `${snippet.title || "snippet"}.${(snippet.language || "txt").toLowerCase()}`;
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
        body: JSON.stringify({
          title: editData.title,
          description: editData.description,
          language: editData.language,
          code: editData.code,
          isPublic: editData.isPublic,
          tags: editData.tags,
        }),
      });

      if (!res.ok) {
        alert("❌ Failed to update snippet");
        return;
      }
      const updated = await res.json();
      onSnippetUpdate?.(updated);
      setIsEditing(false);
    } catch (err) {
      console.error("update snippet error:", err);
      alert("❌ Failed to update snippet");
    }
  };

  const handleTagClickLocal = (tag) => {
    onClose?.();
    onTagClick?.(tag);
  };

  const handleAddComment = async (e) => {
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
        alert("Server error while adding comment");
        return;
      }

      if (!res.ok) {
        alert(data?.error || "Failed to add comment");
        return;
      }

      onSnippetUpdate?.(data);
      setComment("");
    } catch (err) {
      console.error("add comment error:", err);
      alert("Network error while adding comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;

    try {
      const res = await fetch(`${API}/api/snippets/${snippet._id}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        alert("Server error while deleting comment");
        return;
      }

      if (!res.ok) {
        alert(data?.error || "Failed to delete comment");
        return;
      }

      onSnippetUpdate?.(data.snippet || data);
    } catch (err) {
      console.error("delete comment error:", err);
      alert("Network error while deleting comment");
    }
  };

  const handleAddToCollection = async (collectionId) => {
    try {
      const res = await fetch(`${API}/api/collections/${collectionId}/add-snippet`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ snippetId: snippet._id }),
      });

      if (!res.ok) {
        alert("❌ Failed to add to collection");
        return;
      }
      alert("✅ Snippet added to collection!");
      setShowCollections(false);
    } catch (err) {
      console.error("add to collection error:", err);
      alert("❌ Failed to add to collection");
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

      if (!res.ok) {
        alert("❌ Failed to create collection");
        return;
      }

      setNewCollection("");
      const updated = await fetch(`${API}/api/collections`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (updated.ok) setCollections(await updated.json());
    } catch (err) {
      console.error("create collection error:", err);
      alert("❌ Failed to create collection");
    }
  };

  // permissions for delete comment (optional)
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 px-2 sm:px-4" onClick={onClose}>
      <div
        className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700 w-full max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b border-gray-700 pb-3">
          <h3 className="text-xl sm:text-2xl font-bold text-blue-400 break-words">
            {isEditing ? "Edit Snippet" : snippet.title}
          </h3>

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

          <button onClick={onClose} className="self-end sm:self-auto text-red-400 hover:text-red-500 font-bold text-xl">
            ✕
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-3 mt-4 text-sm">
            <input
              type="text"
              placeholder="Title"
              value={editData.title || ""}
              onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
              required
            />

            <textarea
              rows="3"
              placeholder="Description"
              value={editData.description || ""}
              onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700"
            />

            <textarea
              rows="10"
              placeholder="Code..."
              value={editData.code || ""}
              onChange={(e) => setEditData((p) => ({ ...p, code: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 font-mono text-sm"
            />

            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={Array.isArray(editData.tags) ? editData.tags.join(", ") : ""}
              onChange={(e) =>
                setEditData((p) => ({
                  ...p,
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                }))
              }
              className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 text-sm"
            />

            <div className="flex flex-wrap gap-3 mt-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
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
            <p className="text-sm text-gray-300 mt-3 break-words">{snippet.description}</p>

            {snippet.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {snippet.tags.map((tag, i) => (
                  <span
                    key={`${tag}-${i}`}
                    onClick={() => handleTagClickLocal(tag)}
                    className="cursor-pointer text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded-md hover:bg-blue-600/40 transition"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 border border-gray-700 rounded-lg bg-gray-900/80 overflow-hidden">
              <div className="flex justify-between items-center bg-gray-800/70 px-3 py-2 border-b border-gray-700 text-xs sm:text-sm">
                <span className="font-semibold text-blue-400 uppercase">{snippet.language || "Code"}</span>
                <button onClick={handleCopy} className="text-gray-300 hover:text-white flex items-center gap-1">
                  📋 Copy
                </button>
              </div>

              <pre className="m-0 overflow-x-auto max-h-[60vh] sm:max-h-[500px] p-2 sm:p-4 text-[11px] sm:text-sm leading-relaxed">
                <code ref={codeRef} className={`language-${prismLang} line-numbers block min-w-full whitespace-pre`}>
                  {snippet.code || ""}
                </code>
              </pre>
            </div>

            <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3">
              <button
                onClick={() => onLike?.(snippet._id)}
                className={`group relative flex items-center justify-center p-2.5 rounded-md transition-all duration-300 shadow-sm ${
                  snippet.isLikedByUser
                    ? "text-pink-500 bg-pink-500/10 hover:bg-pink-500/20 scale-105"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <Heart size={18} />
              </button>

              <button
                onClick={handleDownload}
                className="group relative flex items-center justify-center p-2.5 rounded-md text-gray-400 hover:text-blue-400 hover:bg-gray-800/50 transition-all duration-300"
              >
                <Download size={18} />
              </button>

              <button
                onClick={() => setIsEditing(true)}
                className="group relative flex items-center justify-center p-2.5 rounded-md text-gray-400 hover:text-blue-400 hover:bg-gray-800/50 transition-all duration-300"
              >
                <Edit3 size={18} />
              </button>

              {onDelete && (
                <button
                  onClick={() => onDelete(snippet._id)}
                  className="group relative flex items-center justify-center p-2.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-gray-800/50 transition-all duration-300"
                >
                  <Trash2 size={18} />
                </button>
              )}

              <button
                onClick={() => onSyncGithub?.(snippet._id)}
                className="group relative flex items-center justify-center p-2.5 rounded-md text-gray-400 hover:text-blue-400 hover:bg-gray-800/50 transition-all duration-300"
              >
                <Github size={18} />
              </button>

              <button
                onClick={() => onFork?.(snippet._id)}
                className="group relative flex items-center justify-center p-2.5 rounded-md text-gray-400 hover:text-yellow-400 hover:bg-gray-800/50 transition-all duration-300"
              >
                ⑂
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowCollections((v) => !v)}
                  className="group relative flex items-center justify-center p-2.5 rounded-md text-gray-400 hover:text-blue-400 hover:bg-gray-800/50 transition-all duration-300"
                >
                  <Folder size={18} />
                </button>

                {showCollections && (
                  <div className="absolute right-0 mt-2 bg-[#0d1117] border border-gray-800 shadow-xl rounded-lg p-2 w-56 z-10">
                    {collections.length > 0 ? (
                      collections.map((c) => (
                        <button
                          key={c._id}
                          onClick={() => handleAddToCollection(c._id)}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/60 rounded-md transition-all"
                        >
                          {c.name}
                        </button>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm italic px-3 py-2">No collections yet</p>
                    )}

                    <div className="mt-2 border-t border-gray-800 pt-2">
                      <input
                        type="text"
                        placeholder="New collection..."
                        value={newCollection}
                        onChange={(e) => setNewCollection(e.target.value)}
                        className="w-full px-2 py-1.5 bg-gray-900 text-white rounded-md text-sm border border-gray-800 outline-none"
                      />
                      <button
                        onClick={handleCreateCollection}
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm py-1.5 rounded-md transition-all"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 text-sm text-gray-300">
              <h4 className="text-lg font-semibold text-blue-400 mb-2">Comments</h4>

              {snippet.comments?.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-700 rounded-md p-3 bg-gray-800/60">
                  {[...snippet.comments].reverse().map((c, idx) => (
                    <div key={c._id || idx} className="border-b border-gray-700 pb-2 last:border-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-blue-300">
                            {c.user || "Anonymous"}{" "}
                            <span className="text-gray-500 text-xs ml-2">
                              {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                            </span>
                          </p>
                          <p className="text-gray-200 mt-1 whitespace-pre-wrap">{c.text}</p>
                        </div>

                        {(currentUser?.username === c.user || currentUser?.username === snippet.author) && (
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            className="text-red-400 hover:text-red-500 text-xs font-medium ml-2"
                            title="Delete comment"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No comments yet. Be the first to comment!</p>
              )}

              <form onSubmit={handleAddComment} className="mt-3 flex items-center gap-2">
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50"
                >
                  {commentLoading ? "..." : "Post"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
