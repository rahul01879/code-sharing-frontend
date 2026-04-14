import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Prism from "prismjs";
import AIReviewPanel from "./AIReviewPanel";

import "prismjs/themes/prism-tomorrow.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/line-highlight/prism-line-highlight";
import "prismjs/plugins/line-highlight/prism-line-highlight.css";

import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-php";
import "prismjs/components/prism-python";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-java";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  CornerDownRight,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Folder,
  GitBranch,
  Github,
  Globe,
  Hash,
  Heart,
  Layers,
  Lock,
  MessageSquare,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from "lucide-react";

const RAW_API =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITEAPIBASEURL ||
  "";

const API = String(RAW_API || "").trim().replace(/\/$/, "");

const LANG_MAP = {
  html: "markup",
  xml: "markup",
  svg: "markup",
  js: "javascript",
  ts: "typescript",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
};

const LANG_COLORS = {
  javascript: "from-yellow-400 to-amber-500",
  typescript: "from-blue-400 to-cyan-500",
  python: "from-blue-500 to-teal-500",
  java: "from-orange-400 to-red-500",
  go: "from-cyan-400 to-blue-500",
  rust: "from-orange-500 to-amber-600",
  php: "from-indigo-400 to-violet-500",
  cpp: "from-pink-500 to-rose-500",
  c: "from-slate-400 to-slate-600",
  ruby: "from-red-500 to-pink-500",
  bash: "from-green-500 to-emerald-500",
  json: "from-gray-400 to-gray-500",
  css: "from-blue-400 to-purple-500",
  html: "from-orange-400 to-red-400",
};

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "go",
  "rust",
  "php",
  "cpp",
  "c",
  "ruby",
  "swift",
  "kotlin",
  "html",
  "css",
  "bash",
  "json",
  "sql",
  "r",
  "scala",
  "haskell",
];

function cls(...arr) {
  return arr.filter(Boolean).join(" ");
}

function safeJson(value, fallback = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function initials(value, fallback = "U") {
  return String(value || fallback)[0]?.toUpperCase() || fallback;
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleString();
}

function timeAgo(date) {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

function getId(obj) {
  return obj?._id || obj?.id || null;
}

function normalizeId(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const id = getId(obj);
  return id ? { ...obj, _id: id, id } : obj;
}

function normalizeSnippet(snippet) {
  if (!snippet || typeof snippet !== "object") return null;
  const normalized = normalizeId(snippet);

  return {
    ...normalized,
    title: typeof normalized.title === "string" && normalized.title.trim() ? normalized.title : "Untitled",
    description: typeof normalized.description === "string" ? normalized.description : "",
    code: typeof normalized.code === "string" ? normalized.code : "",
    language: typeof normalized.language === "string" && normalized.language.trim() ? normalized.language : "javascript",
    author:
      normalized.author ||
      normalized.user?.username ||
      normalized.user ||
      normalized.username ||
      "Unknown",
    tags: Array.isArray(normalized.tags)
      ? normalized.tags
      : typeof normalized.tags === "string"
      ? normalized.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [],
    likes: Array.isArray(normalized.likes) ? normalized.likes : [],
    comments: Array.isArray(normalized.comments)
      ? normalized.comments.map((c) => normalizeId(c))
      : [],
    versions: Array.isArray(normalized.versions) ? normalized.versions : [],
    reviewThreads: Array.isArray(normalized.reviewThreads)
      ? normalized.reviewThreads.map((thread) => ({
          ...normalizeId(thread),
          replies: Array.isArray(thread?.replies)
            ? thread.replies.map((reply) => normalizeId(reply))
            : [],
        }))
      : [],
  };
}

function statCodeMeta(code = "") {
  return {
    lines: String(code || "").split("\n").length,
    chars: String(code || "").length,
  };
}

async function readJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function Toast({ message, type = "info", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2600);
    return () => clearTimeout(t);
  }, [onClose]);

  const tone = {
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
    error: "border-rose-500/25 bg-rose-500/10 text-rose-200",
    info: "border-blue-500/25 bg-blue-500/10 text-blue-200",
  };

  return (
    <div
      className={cls(
        "fixed bottom-5 right-5 z-[90] flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-xl animate-slide-up",
        tone[type] || tone.info
      )}
    >
      {type === "success" && <Check size={14} />}
      {type === "error" && <AlertCircle size={14} />}
      {type === "info" && <Sparkles size={14} />}
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1 opacity-70 transition hover:bg-white/10 hover:opacity-100"
      >
        <X size={12} />
      </button>
    </div>
  );
}

function StatPill({ icon, value, color = "text-gray-300" }) {
  return (
    <span
      className={cls(
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold backdrop-blur-sm",
        color
      )}
    >
      {icon}
      {value}
    </span>
  );
}

function SectionCard({ title, subtitle, action, children, className = "" }) {
  return (
    <section
      className={cls(
        "rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5",
        className
      )}
    >
      {(title || subtitle || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
            {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function SegmentedTab({ active, onClick, icon, label, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls(
        "flex min-w-fit items-center gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200",
        active
          ? "border border-cyan-500/20 bg-cyan-500/10 text-white shadow-[0_8px_22px_rgba(34,211,238,0.12)]"
          : "border border-transparent text-gray-500 hover:bg-white/[0.05] hover:text-gray-300"
      )}
    >
      <span className={active ? "text-cyan-300" : ""}>{icon}</span>
      <span>{label}</span>
      {typeof count === "number" && count > 0 && (
        <span
          className={cls(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            active ? "bg-cyan-500/15 text-cyan-200" : "bg-white/[0.06] text-gray-400"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function QuickAction({
  icon,
  label,
  sublabel,
  onClick,
  active = false,
  disabled = false,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cls(
        "flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        active
          ? "border-cyan-500/30 bg-cyan-500/10 text-white"
          : "border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.06] hover:text-white",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{label}</p>
          {sublabel && <p className="truncate text-[11px] text-gray-500">{sublabel}</p>}
        </div>
      </div>
      <ChevronRight size={15} className="text-gray-600" />
    </button>
  );
}

function MetricBox({ label, value, tone = "neutral" }) {
  const tones = {
    neutral: "text-gray-100",
    cyan: "text-cyan-200",
    amber: "text-amber-200",
    rose: "text-rose-200",
    emerald: "text-emerald-200",
    violet: "text-violet-200",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className={cls("mt-1 text-lg font-black", tones[tone] || tones.neutral)}>{value}</p>
    </div>
  );
}

function EmptyState({ icon, title, subtitle, compact = false }) {
  return (
    <div
      className={cls(
        "flex flex-col items-center text-center",
        compact ? "gap-2 py-8" : "gap-3 py-12"
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-gray-300 shadow-inner shadow-black/20">
        {icon}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-200">{title}</p>
        <p className="max-w-sm text-xs leading-relaxed text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function CommentItem({ comment, canDelete, onDelete, sandboxMode = false }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const commentId = getId(comment);
    if (!commentId || sandboxMode) return;
    setDeleting(true);
    try {
      await onDelete(commentId);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-all duration-200 hover:bg-white/[0.05]">
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-bold text-white shadow-lg shadow-cyan-500/10">
          {initials(comment?.user, "A")}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-sm font-semibold text-white">
                {comment?.user || "Anonymous"}
              </span>
              <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                <Clock size={10} />
                <span title={formatDate(comment?.createdAt)}>
                  {comment?.createdAt ? timeAgo(comment.createdAt) : ""}
                </span>
              </div>
            </div>

            {canDelete && !sandboxMode && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                title="Delete comment"
                className="rounded-xl p-2 text-gray-600 opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100"
              >
                {deleting ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
              </button>
            )}
          </div>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-300">
            {comment?.text}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewReplyItem({ reply, canDelete, onDelete, sandboxMode = false }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const replyId = getId(reply);
    if (!replyId || sandboxMode) return;
    setLoading(true);
    try {
      await onDelete(replyId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[10px] font-bold text-gray-300">
          {initials(reply?.user)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-200">
                {reply?.user || "User"}
              </span>
              <span className="text-[10px] text-gray-500">
                {reply?.createdAt ? timeAgo(reply.createdAt) : ""}
              </span>
            </div>

            {canDelete && !sandboxMode && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg p-1 text-gray-600 transition hover:bg-rose-500/10 hover:text-rose-300"
              >
                {loading ? (
                  <RefreshCw size={11} className="animate-spin" />
                ) : (
                  <Trash2 size={11} />
                )}
              </button>
            )}
          </div>

          <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-gray-300">
            {reply?.text}
          </p>
        </div>
      </div>
    </div>
  );
}

function ReviewThreadItem({
  thread,
  selected,
  onSelect,
  onResolve,
  onReopen,
  onDelete,
  onReply,
  onDeleteReply,
  currentUser,
  snippetAuthor,
  sandboxMode = false,
}) {
  const [reply, setReply] = useState("");
  const [loadingReply, setLoadingReply] = useState(false);
  const [busyAction, setBusyAction] = useState("");

  const isOwnReview =
    currentUser?.username &&
    (currentUser.username === thread?.user || currentUser.username === snippetAuthor);

  const severityClass = {
    info: "border-blue-500/20 bg-blue-500/10 text-blue-200",
    suggestion: "border-violet-500/20 bg-violet-500/10 text-violet-200",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    critical: "border-rose-500/20 bg-rose-500/10 text-rose-200",
  };

  const canDeleteReply = (r) => {
    const me = currentUser?.username;
    return !!me && (me === r?.user || me === thread?.user || me === snippetAuthor);
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || sandboxMode) return;
    setLoadingReply(true);
    try {
      await onReply(thread, reply.trim());
      setReply("");
    } finally {
      setLoadingReply(false);
    }
  };

  return (
    <div
      className={cls(
        "rounded-3xl border p-4 transition-all duration-200",
        selected
          ? "border-cyan-500/30 bg-cyan-500/[0.06] shadow-[0_10px_30px_rgba(34,211,238,0.10)]"
          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
      )}
    >
      <button type="button" onClick={() => onSelect(thread)} className="w-full text-left">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
                L{thread?.line}
                {thread?.lineEnd ? `-${thread.lineEnd}` : ""}
              </span>

              <span
                className={cls(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  severityClass[thread?.severity] || severityClass.suggestion
                )}
              >
                {thread?.severity || "suggestion"}
              </span>

              <span
                className={cls(
                  "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  thread?.status === "resolved"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                    : "border-amber-500/20 bg-amber-500/10 text-amber-200"
                )}
              >
                {thread?.status || "open"}
              </span>
            </div>

            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-200">
              {thread?.text}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
              <span>{thread?.user || "User"}</span>
              <span>•</span>
              <span title={formatDate(thread?.createdAt)}>
                {thread?.createdAt ? timeAgo(thread.createdAt) : ""}
              </span>
              {Array.isArray(thread?.replies) && thread.replies.length > 0 && (
                <>
                  <span>•</span>
                  <span>
                    {thread.replies.length} repl{thread.replies.length > 1 ? "ies" : "y"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </button>

      {selected && (
        <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
          {!sandboxMode && (
            <div className="flex flex-wrap gap-2">
              {thread?.status === "open" ? (
                <button
                  type="button"
                  onClick={async () => {
                    setBusyAction("resolve");
                    try {
                      await onResolve(thread);
                    } finally {
                      setBusyAction("");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/15"
                >
                  {busyAction === "resolve" ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={12} />
                  )}
                  Resolve
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setBusyAction("reopen");
                    try {
                      await onReopen(thread);
                    } finally {
                      setBusyAction("");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/15"
                >
                  {busyAction === "reopen" ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <RefreshCw size={12} />
                  )}
                  Reopen
                </button>
              )}

              {isOwnReview && (
                <button
                  type="button"
                  onClick={async () => {
                    setBusyAction("delete");
                    try {
                      await onDelete(thread);
                    } finally {
                      setBusyAction("");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/15"
                >
                  {busyAction === "delete" ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Delete
                </button>
              )}
            </div>
          )}

          {Array.isArray(thread?.replies) && thread.replies.length > 0 && (
            <div className="space-y-2">
              {thread.replies.map((replyItem, idx) => (
                <div key={getId(replyItem) || idx} className="pl-1">
                  <div className="mb-2 flex items-center gap-2 text-gray-600">
                    <CornerDownRight size={12} />
                    <span className="text-[10px] uppercase tracking-[0.18em]">Reply</span>
                  </div>
                  <ReviewReplyItem
                    reply={replyItem}
                    canDelete={canDeleteReply(replyItem)}
                    onDelete={(replyId) => onDeleteReply(thread, replyId)}
                    sandboxMode={sandboxMode}
                  />
                </div>
              ))}
            </div>
          )}

          {!sandboxMode ? (
            <form onSubmit={submitReply} className="flex gap-2">
              <input
                type="text"
                placeholder="Reply to this review"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-500/50"
              />
              <button
                type="submit"
                disabled={loadingReply || !reply.trim()}
                className="rounded-2xl bg-cyan-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
              >
                {loadingReply ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Send size={13} />
                )}
              </button>
            </form>
          ) : (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Replies are disabled in sandbox mode.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CollectionsDropdown({ snippetId, onToast, authToken, sandboxMode = false }) {
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [newName, setNewName] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  const hasAuth = !!authToken && !sandboxMode;

  const authHeaders = useCallback(
    (extra = {}) => {
      return hasAuth ? { ...extra, Authorization: `Bearer ${authToken}` } : extra;
    },
    [authToken, hasAuth]
  );

  const fetchAPI = useCallback(async (path, options = {}) => {
    return fetch(`${API}${path}`, options);
  }, []);

  const normalizeCollection = useCallback((collection) => {
    if (!collection || typeof collection !== "object") return null;
    const id = getId(collection);
    const snippets = Array.isArray(collection?.snippets)
      ? collection.snippets
      : Array.isArray(collection?.items)
      ? collection.items
      : [];
    return { ...collection, _id: id, id, snippets };
  }, []);

  const isSnippetSavedInCollection = useCallback(
    (collection) => {
      if (!collection || !snippetId) return false;
      const items = Array.isArray(collection?.snippets) ? collection.snippets : [];
      return items.some((item) => {
        if (!item) return false;
        if (typeof item === "string") return String(item) === String(snippetId);
        const itemId =
          item?._id ||
          item?.id ||
          item?.snippetId ||
          item?.snippet?._id ||
          item?.snippet?.id;
        return String(itemId) === String(snippetId);
      });
    },
    [snippetId]
  );

  const fetchCollections = useCallback(async () => {
    if (!hasAuth) {
      setCollections([]);
      setError(sandboxMode ? "Disabled in sandbox mode" : "Login required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetchAPI("/api/collections/mine", {
        headers: authHeaders(),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || "Failed to fetch collections");

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.collections)
        ? data.collections
        : [];

      setCollections(list.map(normalizeCollection).filter(Boolean));
    } catch (err) {
      setCollections([]);
      setError(err.message || "Failed to fetch collections");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, fetchAPI, hasAuth, normalizeCollection, sandboxMode]);

  useEffect(() => {
    if (!open) return;
    fetchCollections();
  }, [open, fetchCollections]);

  useEffect(() => {
    if (!open) return;

    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown);

    const t = setTimeout(() => inputRef.current?.focus(), 70);

    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const filteredCollections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return collections;
    return collections.filter((collection) =>
      String(collection?.name || "").toLowerCase().includes(q)
    );
  }, [collections, query]);

  const savedCount = useMemo(() => {
    return collections.filter(isSnippetSavedInCollection).length;
  }, [collections, isSnippetSavedInCollection]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cls(
          "inline-flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200",
          open
            ? "border-violet-500/30 bg-violet-500/10 text-white shadow-[0_10px_30px_rgba(139,92,246,0.14)]"
            : "border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.06] hover:text-white"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cls(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 transition-all",
              open && "bg-violet-500/10"
            )}
          >
            <Layers size={16} className={open ? "text-violet-300" : "text-gray-300"} />
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Save to collection</p>
            <p className="truncate text-[11px] text-gray-500">
              {sandboxMode
                ? "Disabled in sandbox mode"
                : savedCount > 0
                ? `Saved in ${savedCount} collection${savedCount > 1 ? "s" : ""}`
                : "Organize this snippet in your workspace"}
            </p>
          </div>
        </div>

        <ChevronRight
          size={15}
          className={cls("flex-shrink-0 transition-transform duration-200", open && "rotate-90")}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-30 overflow-hidden rounded-[26px] border border-white/10 bg-[#0f151f]/95 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl animate-fade-in-up">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
                  <Folder size={14} className="text-violet-300" />
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">Collections</p>
                  <p className="text-[11px] text-gray-500">
                    {sandboxMode
                      ? "Collections are view-only in sandbox mode"
                      : savedCount > 0
                      ? `This snippet is already saved in ${savedCount} collection${savedCount > 1 ? "s" : ""}`
                      : "Add or remove this snippet from your collections"}
                  </p>
                </div>
              </div>

              {!sandboxMode && (
                <button
                  type="button"
                  onClick={fetchCollections}
                  disabled={loading}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-gray-400 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                  title="Refresh collections"
                >
                  <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 p-3">
            <div className="relative">
              <Search
                size={13}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search collections..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition-all placeholder:text-gray-600 focus:border-violet-500/50"
              />
            </div>

            <div className="max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-black/10 p-2 scrollbar-thin">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-gray-500">
                  <RefreshCw size={16} className="animate-spin" />
                  <p className="text-xs">Loading collections...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                  <AlertCircle size={16} className="text-rose-300" />
                  <p className="text-sm font-medium text-rose-200">{error}</p>
                </div>
              ) : filteredCollections.length > 0 ? (
                <div className="space-y-1.5">
                  {filteredCollections.map((collection) => {
                    const id = collection?._id || collection?.id;
                    const saved = isSnippetSavedInCollection(collection);

                    return (
                      <div
                        key={id}
                        className={cls(
                          "flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3",
                          saved
                            ? "border-emerald-500/20 bg-emerald-500/[0.08] text-white"
                            : "border-white/5 bg-white/[0.02] text-gray-300"
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cls(
                              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border bg-black/20",
                              saved ? "border-emerald-500/20" : "border-white/10"
                            )}
                          >
                            {saved ? (
                              <Check size={14} className="text-emerald-300" />
                            ) : (
                              <Folder size={14} className="text-violet-300" />
                            )}
                          </span>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {collection?.name || "Untitled"}
                            </p>
                            <p
                              className={cls(
                                "truncate text-[11px]",
                                saved ? "text-emerald-300/80" : "text-gray-500"
                              )}
                            >
                              {sandboxMode
                                ? saved
                                  ? "Saved in this collection"
                                  : "Not saved in this collection"
                                : saved
                                ? "Already saved · click to remove"
                                : "Click to add"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
                          {saved && (
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">
                              Saved
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : collections.length > 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                  <Search size={16} className="text-gray-500" />
                  <p className="text-sm font-medium text-gray-300">No matching collections</p>
                  <p className="text-xs text-gray-500">
                    Try a different search.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                  <Folder size={16} className="text-violet-300" />
                  <p className="text-sm font-medium text-white">No collections yet</p>
                  <p className="text-xs text-gray-500">
                    Collections will appear here when available.
                  </p>
                </div>
              )}
            </div>

            {!sandboxMode && (
              <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Create new
                  </p>

                  {collections.length > 0 && (
                    <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-gray-400">
                      {collections.length} total
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="New collection name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none transition-all placeholder:text-gray-600 focus:border-violet-500/50"
                />

                <button
                  type="button"
                  disabled
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600/60 py-2.5 text-sm font-semibold text-white opacity-60"
                >
                  {creating ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  Create & Add
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EditForm({ editData, setEditData, onSubmit, onCancel, sandboxMode = false }) {
  const [saving, setSaving] = useState(false);
  const preview = statCodeMeta(editData.code || "");

  const submit = async (e) => {
    if (sandboxMode) return;
    setSaving(true);
    try {
      await onSubmit(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 animate-fade-in">
      <div className="grid gap-5 xl:grid-cols-[1.05fr,0.95fr]">
        <SectionCard
          title="Snippet details"
          subtitle="Update title, summary, language, visibility, and tags."
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Title
              </label>
              <input
                type="text"
                required
                disabled={sandboxMode}
                value={editData.title || ""}
                onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))}
                placeholder="Snippet title"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 disabled:opacity-70"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Description
              </label>
              <textarea
                rows={4}
                disabled={sandboxMode}
                value={editData.description || ""}
                onChange={(e) =>
                  setEditData((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="What does this snippet do?"
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 disabled:opacity-70"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Language
                </label>
                <select
                  disabled={sandboxMode}
                  value={editData.language || "javascript"}
                  onChange={(e) =>
                    setEditData((p) => ({ ...p, language: e.target.value }))
                  }
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none transition-all focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 disabled:opacity-70"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Visibility
                </label>
                <button
                  type="button"
                  disabled={sandboxMode}
                  onClick={() =>
                    setEditData((p) => ({ ...p, isPublic: !p.isPublic }))
                  }
                  className={cls(
                    "w-full rounded-2xl border px-3 py-3 text-sm font-medium transition-all duration-200 disabled:opacity-70",
                    editData.isPublic
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
                      : "border-white/10 bg-black/20 text-gray-400 hover:bg-white/[0.05]"
                  )}
                >
                  <span className="flex items-center justify-center gap-2">
                    {editData.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                    {editData.isPublic ? "Public" : "Private"}
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Tags
              </label>
              <input
                type="text"
                disabled={sandboxMode}
                placeholder="react, hooks, state"
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
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 disabled:opacity-70"
              />

              {Array.isArray(editData.tags) && editData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {editData.tags.map((tag, i) => (
                    <span
                      key={`${tag}-${i}`}
                      className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200"
                    >
                      <Hash size={9} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Save changes"
          subtitle={
            sandboxMode
              ? "Editing is disabled in sandbox mode."
              : "Review your current edit and commit a cleaner version."
          }
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
                  Preview
                </span>
                <span className="text-xs text-gray-400">
                  {preview.lines} lines • {preview.chars} chars
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-300">
                Make sure the language, visibility, and tags match the code before
                saving.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricBox label="Language" value={editData.language || "javascript"} tone="cyan" />
              <MetricBox
                label="Visibility"
                value={editData.isPublic ? "Public" : "Private"}
                tone={editData.isPublic ? "emerald" : "neutral"}
              />
            </div>

            {sandboxMode && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Sandbox preview mode lets you inspect the editor UI, but saving is disabled.
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving || sandboxMode}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(34,211,238,0.22)] transition-all hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50"
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                {sandboxMode ? "Disabled in sandbox" : saving ? "Saving..." : "Save changes"}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-white/[0.06] hover:text-white"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Code editor" subtitle="Edit source code directly.">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
            Code
          </label>
          <textarea
            rows={20}
            disabled={sandboxMode}
            placeholder="Paste your code here..."
            value={editData.code || ""}
            onChange={(e) => setEditData((p) => ({ ...p, code: e.target.value }))}
            className="w-full resize-none rounded-2xl border border-white/10 bg-[#071018] px-4 py-4 font-mono text-sm leading-relaxed text-emerald-300 outline-none transition-all placeholder:text-gray-700 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 disabled:opacity-70"
            spellCheck={false}
          />
        </div>
      </SectionCard>
    </form>
  );
}

export default function SnippetModal({
  snippet,
  onClose,
  onDelete,
  onSnippetUpdate,
  onLike,
  onSyncGithub,
  onTagClick,
  onFork,
  currentUser = null,
  authToken = null,
  sandboxMode = false,
}) {
  const codeRef = useRef(null);
  const preRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  const [comment, setComment] = useState("");
  const [commentLoad, setCommentLoad] = useState(false);

  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("code");

  const [ghLoading, setGhLoading] = useState(false);
  const [forkLoad, setForkLoad] = useState(false);
  const [deleteLoad, setDeleteLoad] = useState(false);
  const [likeLoad, setLikeLoad] = useState(false);

  const [selectedLine, setSelectedLine] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewSeverity, setReviewSeverity] = useState("suggestion");
  const [reviewLoad, setReviewLoad] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);

  const [reviewFilter, setReviewFilter] = useState("all");
  const [reviewQuery, setReviewQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileUtilityOpen, setMobileUtilityOpen] = useState(false);

  const normalizedSnippet = useMemo(() => normalizeSnippet(snippet), [snippet]);
  const snippetId = useMemo(() => getId(normalizedSnippet), [normalizedSnippet]);

  const resolvedUser = useMemo(() => {
    if (currentUser) return currentUser;
    if (sandboxMode) return null;
    return safeJson(safeStorageGet("user"), null);
  }, [currentUser, sandboxMode]);

  const resolvedToken = useMemo(() => {
    if (authToken) return authToken;
    if (sandboxMode) return null;
    return safeStorageGet("token");
  }, [authToken, sandboxMode]);

  const loggedIn = !!resolvedToken && !sandboxMode;

  const fetchAPI = useCallback(async (path, options = {}) => {
    return fetch(`${API}${path}`, options);
  }, []);

  const authHeaders = useCallback(
    (extra = {}) => {
      if (!loggedIn) return extra;
      return { ...extra, Authorization: `Bearer ${resolvedToken}` };
    },
    [loggedIn, resolvedToken]
  );

  const prismLang = useMemo(() => {
    const lang = (normalizedSnippet?.language || "javascript").toLowerCase();
    return LANG_MAP[lang] || lang;
  }, [normalizedSnippet?.language]);

  const langGrad =
    LANG_COLORS[(normalizedSnippet?.language || "").toLowerCase()] ||
    "from-gray-500 to-gray-600";

  const reviewThreads = useMemo(() => {
    return [...(normalizedSnippet?.reviewThreads || [])].sort((a, b) => {
      const aLine = Number(a?.line || 0);
      const bLine = Number(b?.line || 0);
      if (aLine !== bLine) return aLine - bLine;
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });
  }, [normalizedSnippet]);

  const selectedReview = useMemo(() => {
    return reviewThreads.find((r) => String(getId(r)) === String(selectedReviewId)) || null;
  }, [reviewThreads, selectedReviewId]);

  const highlightedLineRange = useMemo(() => {
    if (selectedReview?.line) {
      return selectedReview.lineEnd
        ? `${selectedReview.line}-${selectedReview.lineEnd}`
        : `${selectedReview.line}`;
    }
    if (selectedLine) return `${selectedLine}`;
    return "";
  }, [selectedReview, selectedLine]);

  const isOwner =
    !!resolvedUser &&
    (resolvedUser?.username === normalizedSnippet?.author ||
      String(resolvedUser?.id || resolvedUser?._id) ===
        String(normalizedSnippet?.authorId || ""));

  const isLiked = useMemo(() => {
    if (!Array.isArray(normalizedSnippet?.likes) || !(resolvedUser?.id || resolvedUser?._id))
      return false;
    const me = resolvedUser?.id || resolvedUser?._id;
    return normalizedSnippet.likes.some(
      (l) => String(l?.userId || l?._id || l?.id) === String(me)
    );
  }, [normalizedSnippet?.likes, resolvedUser]);

  const reviewStats = useMemo(() => {
    const total = reviewThreads.length;
    const open = reviewThreads.filter((r) => r?.status !== "resolved").length;
    const resolved = reviewThreads.filter((r) => r?.status === "resolved").length;
    const critical = reviewThreads.filter((r) => r?.severity === "critical").length;
    return { total, open, resolved, critical };
  }, [reviewThreads]);

  const filteredReviewThreads = useMemo(() => {
    let arr = [...reviewThreads];

    if (reviewFilter === "open") arr = arr.filter((r) => r?.status !== "resolved");
    if (reviewFilter === "resolved") arr = arr.filter((r) => r?.status === "resolved");
    if (reviewFilter === "critical") arr = arr.filter((r) => r?.severity === "critical");
    if (reviewFilter === "mine") arr = arr.filter((r) => r?.user === resolvedUser?.username);

    if (reviewQuery.trim()) {
      const q = reviewQuery.toLowerCase();
      arr = arr.filter(
        (r) =>
          String(r?.text || "").toLowerCase().includes(q) ||
          String(r?.user || "").toLowerCase().includes(q) ||
          String(r?.line || "").includes(q)
      );
    }

    return arr;
  }, [reviewThreads, reviewFilter, reviewQuery, resolvedUser?.username]);

  const tabs = [
    { id: "code", label: "Code", icon: <Code2 size={14} /> },
    {
      id: "reviews",
      label: "Reviews",
      icon: <MessagesSquare size={14} />,
      count: normalizedSnippet?.reviewThreads?.length || 0,
    },
    {
      id: "comments",
      label: "Comments",
      icon: <MessageSquare size={14} />,
      count: normalizedSnippet?.comments?.length || 0,
    },
    { id: "ai", label: "AI", icon: <Sparkles size={14} /> },
    {
      id: "versions",
      label: "History",
      icon: <FileText size={14} />,
      count: normalizedSnippet?.versions?.length || 0,
    },
  ];

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const guardSandboxAction = useCallback(() => {
    if (!sandboxMode) return false;
    showToast("This action is disabled in sandbox mode.", "info");
    return true;
  }, [sandboxMode, showToast]);

  useEffect(() => {
    if (!normalizedSnippet) return;

    setEditData({
      ...normalizedSnippet,
      tags: Array.isArray(normalizedSnippet.tags) ? normalizedSnippet.tags : [],
      isPublic:
        typeof normalizedSnippet.isPublic === "boolean"
          ? normalizedSnippet.isPublic
          : normalizedSnippet.visibility !== "private",
    });
  }, [normalizedSnippet]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    if (!normalizedSnippet || isEditing || activeTab !== "code") return;

    const timer = setTimeout(() => {
      if (codeRef.current) Prism.highlightElement(codeRef.current);
    }, 40);

    return () => clearTimeout(timer);
  }, [
    normalizedSnippet?.code,
    normalizedSnippet?.language,
    isEditing,
    activeTab,
    highlightedLineRange,
  ]);

  useEffect(() => {
    if (!normalizedSnippet) return;

    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      const typing =
        tag === "input" || tag === "textarea" || document.activeElement?.isContentEditable;

      if (e.key === "Escape") {
        if (mobileUtilityOpen) {
          setMobileUtilityOpen(false);
          return;
        }
        if (isEditing) {
          setIsEditing(false);
          return;
        }
        onClose?.();
        return;
      }

      if (typing) return;

      const key = e.key.toLowerCase();

      if (key === "c") handleCopy();
      if (key === "e" && isOwner && !sandboxMode) setIsEditing(true);
      if (key === "r") setActiveTab("reviews");
      if (key === "m") setActiveTab("comments");
      if (key === "a") setActiveTab("ai");
      if (key === "h") setActiveTab("versions");
      if (key === "g") setActiveTab("code");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [normalizedSnippet, onClose, isEditing, isOwner, mobileUtilityOpen, sandboxMode]);

  useEffect(() => {
    if (!selectedReview && selectedLine == null) return;
    if (activeTab !== "code") return;

    const t = setTimeout(() => {
      preRef.current?.scrollIntoView({ block: "nearest" });
    }, 60);

    return () => clearTimeout(t);
  }, [selectedReview, selectedLine, activeTab]);

  if (!normalizedSnippet || !editData) return null;

  const codeMeta = statCodeMeta(normalizedSnippet.code || "");
  const lineCount = codeMeta.lines;
  const charCount = codeMeta.chars;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(normalizedSnippet.code || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      showToast("Copied to clipboard!", "success");
    } catch {
      showToast("Copy failed", "error");
    }
  };

  const handleDownload = () => {
    try {
      const extMap = {
        javascript: "js",
        typescript: "ts",
        python: "py",
        java: "java",
        go: "go",
        rust: "rs",
        php: "php",
        cpp: "cpp",
        c: "c",
        ruby: "rb",
        html: "html",
        css: "css",
        bash: "sh",
        json: "json",
        sql: "sql",
      };

      const ext = extMap[(normalizedSnippet.language || "").toLowerCase()] || "txt";
      const blob = new Blob([normalizedSnippet.code || ""], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${normalizedSnippet.title || "snippet"}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast("Downloaded!", "success");
    } catch {
      showToast("Download failed", "error");
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (guardSandboxAction()) return;
    if (!snippetId || !loggedIn) return;

    try {
      const res = await fetchAPI(`/api/snippets/${snippetId}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          title: editData.title,
          description: editData.description,
          language: editData.language,
          code: editData.code,
          isPublic: editData.isPublic,
          tags: Array.isArray(editData.tags) ? editData.tags : [],
        }),
      });

      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || "Failed to update");

      const updated = normalizeSnippet(data?.snippet || data);
      onSnippetUpdate?.(updated);
      setIsEditing(false);
      showToast("Snippet updated!", "success");
    } catch (err) {
      showToast(err.message || "Update failed", "error");
      throw err;
    }
  };

  const handleLike = async () => {
    if (guardSandboxAction()) return;
    if (!snippetId || likeLoad || !loggedIn) {
      if (!loggedIn) showToast("Login required", "error");
      return;
    }
    setLikeLoad(true);
    try {
      await onLike?.(snippetId);
    } finally {
      setLikeLoad(false);
    }
  };

  const handleFork = async () => {
    if (guardSandboxAction()) return;
    if (!snippetId || forkLoad || !loggedIn) {
      if (!loggedIn) showToast("Login required", "error");
      return;
    }
    setForkLoad(true);
    try {
      await onFork?.(snippetId);
      showToast("Snippet forked!", "success");
    } catch {
      showToast("Fork failed", "error");
    } finally {
      setForkLoad(false);
    }
  };

  const handleSync = async () => {
    if (guardSandboxAction()) return;
    if (!snippetId || ghLoading || !loggedIn) {
      if (!loggedIn) showToast("Login required", "error");
      return;
    }
    setGhLoading(true);
    try {
      await onSyncGithub?.(snippetId);
      showToast("Synced to GitHub Gist!", "success");
    } catch {
      showToast("Sync failed", "error");
    } finally {
      setGhLoading(false);
    }
  };

  const handleDeleteSnippet = async () => {
    if (guardSandboxAction()) return;
    if (!snippetId || deleteLoad || !loggedIn) return;
    if (!window.confirm("Delete this snippet permanently?")) return;

    setDeleteLoad(true);
    try {
      await onDelete?.(snippetId);
    } finally {
      setDeleteLoad(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (guardSandboxAction()) return;
    if (!comment.trim() || !snippetId || !loggedIn) {
      if (!loggedIn) showToast("Login required", "error");
      return;
    }

    setCommentLoad(true);
    try {
      const res = await fetchAPI(`/api/snippets/${snippetId}/comments`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ text: comment.trim() }),
      });

      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || "Failed to add comment");

      const updated = normalizeSnippet(data?.snippet || data);
      onSnippetUpdate?.(updated);
      setComment("");
      showToast("Comment posted!", "success");
    } catch (err) {
      showToast(err.message || "Comment failed", "error");
    } finally {
      setCommentLoad(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (guardSandboxAction()) return;
    if (!snippetId || !commentId || !loggedIn) return;

    try {
      const res = await fetchAPI(`/api/snippets/${snippetId}/comments/${commentId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || "Failed to delete comment");

      const updated = normalizeSnippet(data?.snippet || data);
      onSnippetUpdate?.(updated);
      showToast("Comment deleted", "info");
    } catch (err) {
      showToast(err.message || "Delete failed", "error");
    }
  };

  const handleAIUpdate = (updated) => {
    const normalized = normalizeSnippet(updated?.snippet || updated);
    onSnippetUpdate?.(normalized);
    showToast("Snippet updated via AI.", "success");
  };

  const handleCreateReview = async () => {
    if (guardSandboxAction()) return;
    if (!loggedIn) return showToast("Login required", "error");
    if (!snippetId || !selectedLine || !reviewText.trim()) return;

    setReviewLoad(true);
    try {
      const res = await fetchAPI(`/api/snippets/${snippetId}/reviews`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          text: reviewText.trim(),
          line: selectedLine,
          severity: reviewSeverity,
          source: "user",
        }),
      });

      const data = await readJson(res);
      if (!res.ok) throw new Error(data?.error || "Failed to add review");

      const updated = normalizeSnippet(data?.snippet || data);
      onSnippetUpdate?.(updated);
      setReviewText("");
      setReviewSeverity("suggestion");
      setActiveTab("reviews");
      showToast("Review added!", "success");
    } catch (err) {
      showToast(err.message || "Review failed", "error");
    } finally {
      setReviewLoad(false);
    }
  };

  const handleResolveReview = async (thread) => {
    if (guardSandboxAction()) return;
    const reviewId = getId(thread);
    if (!snippetId || !reviewId || !loggedIn) return;

    const res = await fetchAPI(`/api/snippets/${snippetId}/reviews/${reviewId}/resolve`, {
      method: "PUT",
      headers: authHeaders(),
    });

    const data = await readJson(res);
    if (!res.ok) throw new Error(data?.error || "Failed to resolve review");

    const updated = normalizeSnippet(data?.snippet || data);
    onSnippetUpdate?.(updated);
    showToast("Review resolved", "success");
  };

  const handleReopenReview = async (thread) => {
    if (guardSandboxAction()) return;
    const reviewId = getId(thread);
    if (!snippetId || !reviewId || !loggedIn) return;

    const res = await fetchAPI(`/api/snippets/${snippetId}/reviews/${reviewId}/reopen`, {
      method: "PUT",
      headers: authHeaders(),
    });

    const data = await readJson(res);
    if (!res.ok) throw new Error(data?.error || "Failed to reopen review");

    const updated = normalizeSnippet(data?.snippet || data);
    onSnippetUpdate?.(updated);
    showToast("Review reopened", "info");
  };

  const handleDeleteReview = async (thread) => {
    if (guardSandboxAction()) return;
    const reviewId = getId(thread);
    if (!snippetId || !reviewId || !loggedIn) return;

    const res = await fetchAPI(`/api/snippets/${snippetId}/reviews/${reviewId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });

    const data = await readJson(res);
    if (!res.ok) throw new Error(data?.error || "Failed to delete review");

    const updated = normalizeSnippet(data?.snippet || data);
    onSnippetUpdate?.(updated);
    if (String(selectedReviewId) === String(reviewId)) setSelectedReviewId(null);
    showToast("Review deleted", "info");
  };

  const handleReplyToReview = async (thread, text) => {
    if (guardSandboxAction()) return;
    const reviewId = getId(thread);
    if (!snippetId || !reviewId || !text.trim() || !loggedIn) return;

    const res = await fetchAPI(`/api/snippets/${snippetId}/reviews/${reviewId}/replies`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ text }),
    });

    const data = await readJson(res);
    if (!res.ok) throw new Error(data?.error || "Failed to add reply");

    const updated = normalizeSnippet(data?.snippet || data);
    onSnippetUpdate?.(updated);
    showToast("Reply added", "success");
  };

  const handleDeleteReply = async (thread, replyId) => {
    if (guardSandboxAction()) return;
    const reviewId = getId(thread);
    if (!snippetId || !reviewId || !replyId || !loggedIn) return;

    const res = await fetchAPI(
      `/api/snippets/${snippetId}/reviews/${reviewId}/replies/${replyId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      }
    );

    const data = await readJson(res);
    if (!res.ok) throw new Error(data?.error || "Failed to delete reply");

    const updated = normalizeSnippet(data?.snippet || data);
    onSnippetUpdate?.(updated);
    showToast("Reply deleted", "info");
  };

  const canDeleteComment = (c) => {
    const me = resolvedUser?.username;
    return !!me && (me === c?.user || me === normalizedSnippet?.author);
  };

  const handleCodeClick = (e) => {
    const lineEl = e.target.closest(".line-numbers-rows > span");
    if (!lineEl) return;

    const rows = [...lineEl.parentElement.children];
    const index = rows.indexOf(lineEl);
    const line = index + 1;

    setSelectedLine(line);
    setSelectedReviewId(null);
    setActiveTab("reviews");
  };

  return (
    <>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.975); } to { opacity: 1; transform: scale(1); } }
        @keyframes fade-in-up { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-soft {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,211,238,0.08); }
          50% { box-shadow: 0 0 0 8px rgba(34,211,238,0.02); }
        }

        .animate-fade-in { animation: fade-in 0.18s ease both; }
        .animate-slide-up { animation: slide-up 0.22s ease both; }
        .animate-scale-in { animation: scale-in 0.22s cubic-bezier(.2,.9,.25,1) both; }
        .animate-fade-in-up { animation: fade-in-up 0.18s ease both; }
        .pulse-soft { animation: pulse-soft 1.8s ease-in-out infinite; }

        .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.28); border-radius: 9999px; }

        .line-numbers .line-numbers-rows > span {
          cursor: pointer;
          transition: background 160ms ease, color 160ms ease;
        }

        .line-numbers .line-numbers-rows > span:hover {
          background: rgba(34, 211, 238, 0.10);
        }

        .premium-shell {
          background:
            radial-gradient(circle at top left, rgba(34,211,238,0.10), transparent 26%),
            radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 24%),
            radial-gradient(circle at bottom center, rgba(168,85,247,0.10), transparent 22%),
            linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
        }

        .glass-panel {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02));
          backdrop-filter: blur(16px);
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/82 p-2 backdrop-blur-xl sm:p-4 lg:p-6 animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Snippet ${normalizedSnippet.title}`}
      >
        <div
          className="premium-shell relative flex h-[96vh] w-full max-w-[1680px] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#0a0f18] text-white shadow-[0_30px_90px_rgba(0,0,0,0.58)] animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={cls("absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r", langGrad)} />

          <header className="relative border-b border-white/10 px-4 py-4 sm:px-5 lg:px-6">
            {isEditing ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-200">
                    <Edit3 size={16} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-white">Edit snippet</h2>
                    <p className="text-xs text-gray-500">
                      {sandboxMode
                        ? "Sandbox preview mode is active."
                        : "Update metadata and commit a cleaner version."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 text-gray-400 transition-all hover:bg-white/[0.06] hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span
                    className={cls(
                      "mt-1 inline-flex flex-shrink-0 items-center rounded-xl bg-gradient-to-r px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg",
                      langGrad
                    )}
                  >
                    {normalizedSnippet.language || "code"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <h2 className="break-words text-xl font-black leading-tight text-white sm:text-2xl lg:text-[1.9rem]">
                          {normalizedSnippet.title}
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs">
                          <span className="text-gray-500">
                            by{" "}
                            <span className="font-semibold text-gray-300">
                              {normalizedSnippet.author || "Unknown"}
                            </span>
                          </span>

                          {normalizedSnippet.createdAt && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-gray-400"
                              title={formatDate(normalizedSnippet.createdAt)}
                            >
                              <Clock size={10} />
                              {timeAgo(normalizedSnippet.createdAt)}
                            </span>
                          )}

                          {normalizedSnippet.gistUrl && (
                            <a
                              href={normalizedSnippet.gistUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-emerald-200 transition hover:bg-emerald-500/15"
                            >
                              <Github size={10} />
                              Gist
                              <ExternalLink size={9} />
                            </a>
                          )}

                          {normalizedSnippet.forkedFrom && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-violet-200">
                              <GitBranch size={10} />
                              Forked
                            </span>
                          )}

                          <span
                            className={cls(
                              "inline-flex items-center gap-1 rounded-full border px-2 py-1",
                              normalizedSnippet.isPublic
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                : "border-gray-600/30 bg-white/[0.03] text-gray-400"
                            )}
                          >
                            {normalizedSnippet.isPublic ? <Globe size={10} /> : <Lock size={10} />}
                            {normalizedSnippet.isPublic ? "Public" : "Private"}
                          </span>

                          {sandboxMode && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-200">
                              <ShieldAlert size={10} />
                              Sandbox
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start">
                        <button
                          type="button"
                          onClick={() => setSidebarOpen((v) => !v)}
                          className="hidden rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 text-gray-400 transition hover:bg-white/[0.06] hover:text-white xl:inline-flex"
                          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                        >
                          {sidebarOpen ? (
                            <PanelLeftClose size={16} />
                          ) : (
                            <PanelLeftOpen size={16} />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setMobileUtilityOpen((v) => !v)}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-white/[0.06] hover:text-white xl:hidden"
                        >
                          {mobileUtilityOpen ? "Close tools" : "Tools"}
                        </button>

                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 text-gray-400 transition hover:bg-white/[0.06] hover:text-white"
                          aria-label="Close"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {normalizedSnippet.description && (
                  <div className="glass-panel rounded-2xl border border-white/10 px-4 py-3">
                    <p className="text-sm leading-relaxed text-gray-300">
                      {normalizedSnippet.description}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <StatPill icon={<Eye size={11} />} value={normalizedSnippet.views || 0} color="text-cyan-200" />
                  <StatPill icon={<Heart size={11} />} value={normalizedSnippet.likes?.length || 0} color="text-pink-200" />
                  <StatPill icon={<MessagesSquare size={11} />} value={normalizedSnippet.reviewThreads?.length || 0} color="text-violet-200" />
                  <StatPill icon={<MessageSquare size={11} />} value={normalizedSnippet.comments?.length || 0} color="text-blue-200" />
                  <StatPill icon={<Code2 size={11} />} value={`${lineCount} lines`} color="text-gray-300" />
                  <StatPill icon={<FileText size={11} />} value={`${charCount} chars`} color="text-gray-300" />
                </div>

                {Array.isArray(normalizedSnippet.tags) && normalizedSnippet.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {normalizedSnippet.tags.map((tag, i) => (
                      <button
                        key={`${tag}-${i}`}
                        type="button"
                        onClick={() => {
                          onClose?.();
                          onTagClick?.(tag);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200 transition hover:border-cyan-500/40 hover:bg-cyan-500/15"
                      >
                        <Hash size={8} />
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </header>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            {!isEditing && sidebarOpen && (
              <aside className="hidden w-[320px] flex-shrink-0 border-r border-white/10 bg-black/10 xl:flex xl:flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-thin">
                  <div className="space-y-4">
                    <SectionCard title="Workspace" subtitle="Primary actions for this snippet.">
                      <div className="space-y-2">
                        <QuickAction
                          icon={
                            likeLoad ? (
                              <RefreshCw size={16} className="animate-spin text-pink-300" />
                            ) : isLiked ? (
                              <Heart size={16} className="fill-pink-500 text-pink-400" />
                            ) : (
                              <Heart size={16} className="text-gray-300" />
                            )
                          }
                          label={isLiked ? "Liked" : "Like snippet"}
                          sublabel={
                            sandboxMode
                              ? "Disabled in sandbox mode"
                              : `${normalizedSnippet.likes?.length || 0} likes`
                          }
                          onClick={handleLike}
                          active={isLiked}
                          disabled={likeLoad || sandboxMode || !loggedIn}
                        />

                        <QuickAction
                          icon={
                            copied ? (
                              <Check size={16} className="text-emerald-300" />
                            ) : (
                              <Copy size={16} className="text-gray-300" />
                            )
                          }
                          label={copied ? "Copied" : "Copy code"}
                          sublabel="Copy raw snippet to clipboard"
                          onClick={handleCopy}
                          active={copied}
                        />

                        <QuickAction
                          icon={<Download size={16} className="text-gray-300" />}
                          label="Download"
                          sublabel="Export as source file"
                          onClick={handleDownload}
                        />

                        <QuickAction
                          icon={
                            forkLoad ? (
                              <RefreshCw size={16} className="animate-spin text-violet-300" />
                            ) : (
                              <GitBranch size={16} className="text-gray-300" />
                            )
                          }
                          label="Fork snippet"
                          sublabel={sandboxMode ? "Disabled in sandbox mode" : "Create your own version"}
                          onClick={handleFork}
                          disabled={forkLoad || sandboxMode || !loggedIn}
                        />

                        <QuickAction
                          icon={
                            ghLoading ? (
                              <RefreshCw size={16} className="animate-spin text-emerald-300" />
                            ) : (
                              <Github size={16} className="text-gray-300" />
                            )
                          }
                          label={normalizedSnippet.gistUrl ? "Synced to Gist" : "Sync to Gist"}
                          sublabel={sandboxMode ? "Disabled in sandbox mode" : "Push code to GitHub Gist"}
                          onClick={handleSync}
                          disabled={ghLoading || sandboxMode || !loggedIn}
                          active={!!normalizedSnippet.gistUrl}
                        />

                        <CollectionsDropdown
                          snippetId={snippetId}
                          onToast={showToast}
                          authToken={resolvedToken}
                          sandboxMode={sandboxMode}
                        />

                        {isOwner && !sandboxMode && (
                          <>
                            <QuickAction
                              icon={<Edit3 size={16} className="text-cyan-300" />}
                              label="Edit snippet"
                              sublabel="Update code and metadata"
                              onClick={() => setIsEditing(true)}
                            />

                            <QuickAction
                              icon={
                                deleteLoad ? (
                                  <RefreshCw size={16} className="animate-spin text-rose-300" />
                                ) : (
                                  <Trash2 size={16} className="text-rose-300" />
                                )
                              }
                              label="Delete snippet"
                              sublabel="Permanently remove this snippet"
                              onClick={handleDeleteSnippet}
                              disabled={deleteLoad || !loggedIn}
                              className="border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10"
                            />
                          </>
                        )}
                      </div>
                    </SectionCard>

                    <SectionCard title="Navigation" subtitle="Switch the active workspace panel.">
                      <div className="space-y-2">
                        <QuickAction
                          icon={<Code2 size={16} className="text-cyan-300" />}
                          label="Code view"
                          sublabel="Inspect and select lines"
                          onClick={() => setActiveTab("code")}
                          active={activeTab === "code"}
                        />
                        <QuickAction
                          icon={<MessagesSquare size={16} className="text-violet-300" />}
                          label="Reviews"
                          sublabel={`${reviewStats.total} threads • ${reviewStats.open} open`}
                          onClick={() => setActiveTab("reviews")}
                          active={activeTab === "reviews"}
                        />
                        <QuickAction
                          icon={<MessageSquare size={16} className="text-blue-300" />}
                          label="Comments"
                          sublabel={`${normalizedSnippet.comments?.length || 0} total comments`}
                          onClick={() => setActiveTab("comments")}
                          active={activeTab === "comments"}
                        />
                        <QuickAction
                          icon={<Wand2 size={16} className="text-fuchsia-300" />}
                          label="AI tools"
                          sublabel="Explain, improve, review, and tag"
                          onClick={() => setActiveTab("ai")}
                          active={activeTab === "ai"}
                        />
                        <QuickAction
                          icon={<FileText size={16} className="text-amber-300" />}
                          label="Version history"
                          sublabel={`${normalizedSnippet.versions?.length || 0} saved versions`}
                          onClick={() => setActiveTab("versions")}
                          active={activeTab === "versions"}
                        />
                      </div>
                    </SectionCard>

                    <SectionCard title="Review summary" subtitle="Current code review health.">
                      <div className="grid grid-cols-2 gap-2">
                        <MetricBox label="Open" value={reviewStats.open} tone="amber" />
                        <MetricBox label="Resolved" value={reviewStats.resolved} tone="emerald" />
                        <MetricBox label="Critical" value={reviewStats.critical} tone="rose" />
                        <MetricBox label="Total" value={reviewStats.total} tone="violet" />
                      </div>
                    </SectionCard>

                    <SectionCard title="Shortcuts" subtitle="Keyboard controls inside modal.">
                      <div className="space-y-2 text-xs text-gray-400">
                        <div className="flex items-center justify-between">
                          <span>Copy code</span>
                          <kbd className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[10px]">C</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Code</span>
                          <kbd className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[10px]">G</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Reviews</span>
                          <kbd className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[10px]">R</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Comments</span>
                          <kbd className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[10px]">M</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>AI</span>
                          <kbd className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[10px]">A</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>History</span>
                          <kbd className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[10px]">H</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Close</span>
                          <kbd className="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-[10px]">Esc</kbd>
                        </div>
                      </div>
                    </SectionCard>
                  </div>
                </div>
              </aside>
            )}

            <main className="min-w-0 flex-1 overflow-hidden">
              {isEditing ? (
                <div className="h-full overflow-y-auto p-4 scrollbar-thin sm:p-5 lg:p-6">
                  <EditForm
                    editData={editData}
                    setEditData={setEditData}
                    onSubmit={handleEditSubmit}
                    onCancel={() => setIsEditing(false)}
                    sandboxMode={sandboxMode}
                  />
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <div className="border-b border-white/10 px-4 py-3 sm:px-5">
                    <div className="flex flex-wrap gap-2">
                      {tabs.map((tab) => (
                        <SegmentedTab
                          key={tab.id}
                          active={activeTab === tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          icon={tab.icon}
                          label={tab.label}
                          count={tab.count}
                        />
                      ))}
                    </div>
                  </div>

                  {mobileUtilityOpen && (
                    <div className="border-b border-white/10 bg-black/20 p-4 xl:hidden">
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={handleCopy}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={handleDownload}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={handleLike}
                          disabled={!loggedIn || sandboxMode}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                        >
                          Like
                        </button>
                        <button
                          type="button"
                          onClick={handleFork}
                          disabled={!loggedIn || sandboxMode}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                        >
                          Fork
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-thin sm:p-5 lg:p-6">
                    {activeTab === "code" && (
                      <div className="space-y-5">
                        {selectedLine && (
                          <SectionCard
                            title="Create review"
                            subtitle={
                              sandboxMode
                                ? `Selected line ${selectedLine}. Review creation is disabled in sandbox mode.`
                                : `Selected line ${selectedLine}. Add feedback for this part of the code.`
                            }
                            action={
                              <button
                                type="button"
                                onClick={() => setSelectedLine(null)}
                                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-300 transition hover:bg-white/[0.06] hover:text-white"
                              >
                                Clear
                              </button>
                            }
                          >
                            <div className="space-y-3">
                              <div className="grid gap-3 sm:grid-cols-[180px,1fr]">
                                <select
                                  value={reviewSeverity}
                                  disabled={sandboxMode}
                                  onChange={(e) => setReviewSeverity(e.target.value)}
                                  className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-cyan-500/50 disabled:opacity-70"
                                >
                                  <option value="info">Info</option>
                                  <option value="suggestion">Suggestion</option>
                                  <option value="warning">Warning</option>
                                  <option value="critical">Critical</option>
                                </select>

                                <input
                                  type="text"
                                  value={reviewText}
                                  disabled={sandboxMode}
                                  onChange={(e) => setReviewText(e.target.value)}
                                  placeholder="Describe the issue or suggestion..."
                                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-500/50 disabled:opacity-70"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={handleCreateReview}
                                disabled={reviewLoad || !reviewText.trim() || !loggedIn || sandboxMode}
                                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
                              >
                                {reviewLoad ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <MessagesSquare size={14} />
                                )}
                                {sandboxMode ? "Disabled in sandbox" : "Add review"}
                              </button>
                            </div>
                          </SectionCard>
                        )}

                        <SectionCard
                          title="Source code"
                          subtitle="Click a line number to open a review for that line."
                        >
                          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#071018]">
                            <pre
                              ref={preRef}
                              data-line={highlightedLineRange || undefined}
                              className="line-numbers !m-0 max-h-[70vh] overflow-auto p-4 text-sm scrollbar-thin"
                              onClick={handleCodeClick}
                            >
                              <code ref={codeRef} className={`language-${prismLang}`}>
                                {normalizedSnippet.code || ""}
                              </code>
                            </pre>
                          </div>
                        </SectionCard>
                      </div>
                    )}

                    {activeTab === "reviews" && (
                      <div className="space-y-5">
                        <SectionCard
                          title="Review threads"
                          subtitle="Filter, inspect, and respond to line-based review comments."
                        >
                          <div className="space-y-4">
                            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                              <div className="relative">
                                <Search
                                  size={14}
                                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                                />
                                <input
                                  type="text"
                                  placeholder="Search reviews, users, or lines..."
                                  value={reviewQuery}
                                  onChange={(e) => setReviewQuery(e.target.value)}
                                  className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-500/50"
                                />
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {["all", "open", "resolved", "critical", "mine"].map((filter) => (
                                  <button
                                    key={filter}
                                    type="button"
                                    onClick={() => setReviewFilter(filter)}
                                    className={cls(
                                      "rounded-2xl border px-3 py-2 text-xs font-semibold capitalize transition",
                                      reviewFilter === filter
                                        ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-200"
                                        : "border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06] hover:text-white"
                                    )}
                                  >
                                    {filter}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {filteredReviewThreads.length === 0 ? (
                              <EmptyState
                                icon={<MessagesSquare size={18} />}
                                title="No matching reviews"
                                subtitle="Pick a line in code view to start a review thread."
                              />
                            ) : (
                              <div className="space-y-3">
                                {filteredReviewThreads.map((thread) => (
                                  <ReviewThreadItem
                                    key={getId(thread)}
                                    thread={thread}
                                    selected={String(selectedReviewId) === String(getId(thread))}
                                    onSelect={(t) => {
                                      setSelectedReviewId(getId(t));
                                      setSelectedLine(t?.line || null);
                                    }}
                                    onResolve={handleResolveReview}
                                    onReopen={handleReopenReview}
                                    onDelete={handleDeleteReview}
                                    onReply={handleReplyToReview}
                                    onDeleteReply={handleDeleteReply}
                                    currentUser={resolvedUser}
                                    snippetAuthor={normalizedSnippet?.author}
                                    sandboxMode={sandboxMode}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </SectionCard>
                      </div>
                    )}

                    {activeTab === "comments" && (
                      <div className="space-y-5">
                        <SectionCard title="Discussion" subtitle="Talk about this snippet with other developers.">
                          {!sandboxMode ? (
                            <form onSubmit={handleAddComment} className="space-y-3">
                              <textarea
                                rows={4}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Write a comment..."
                                className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-500/50"
                              />
                              <button
                                type="submit"
                                disabled={commentLoad || !comment.trim() || !loggedIn}
                                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                              >
                                {commentLoad ? (
                                  <RefreshCw size={14} className="animate-spin" />
                                ) : (
                                  <Send size={14} />
                                )}
                                Post comment
                              </button>
                            </form>
                          ) : (
                            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                              Comment posting is disabled in sandbox mode.
                            </div>
                          )}
                        </SectionCard>

                        <SectionCard
                          title="All comments"
                          subtitle={`${normalizedSnippet.comments?.length || 0} discussion item(s).`}
                        >
                          {normalizedSnippet.comments?.length ? (
                            <div className="space-y-3">
                              {normalizedSnippet.comments.map((c, idx) => (
                                <CommentItem
                                  key={getId(c) || idx}
                                  comment={c}
                                  canDelete={canDeleteComment(c)}
                                  onDelete={handleDeleteComment}
                                  sandboxMode={sandboxMode}
                                />
                              ))}
                            </div>
                          ) : (
                            <EmptyState
                              icon={<MessageSquare size={18} />}
                              title="No comments yet"
                              subtitle="Start the discussion with the first comment."
                            />
                          )}
                        </SectionCard>
                      </div>
                    )}

                    {activeTab === "ai" && (
                      <div className="space-y-5">
                        <SectionCard
                          title="AI assistant"
                          subtitle={
                            sandboxMode
                              ? "AI tools are available in preview mode; server-backed snippet mutations may be limited."
                              : "Use AI to explain, improve, review, or enrich this snippet."
                          }
                        >
                          <AIReviewPanel
                            snippet={normalizedSnippet}
                            onSnippetUpdate={handleAIUpdate}
                            sandboxMode={sandboxMode}
                            currentUser={resolvedUser}
                            authToken={resolvedToken}
                            
                          />
                        </SectionCard>
                      </div>
                    )}

                    {activeTab === "versions" && (
                      <div className="space-y-5">
                        <SectionCard
                          title="Version history"
                          subtitle="Previously saved versions of this snippet."
                        >
                          {normalizedSnippet.versions?.length ? (
                            <div className="space-y-3">
                              {normalizedSnippet.versions.map((version, idx) => {
                                const meta = statCodeMeta(version?.code || "");
                                return (
                                  <div
                                    key={getId(version) || idx}
                                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-semibold text-white">
                                          Version {normalizedSnippet.versions.length - idx}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                          {version?.createdAt
                                            ? formatDate(version.createdAt)
                                            : "Unknown date"}
                                        </p>
                                      </div>

                                      <div className="flex flex-wrap gap-2">
                                        <StatPill
                                          icon={<Code2 size={11} />}
                                          value={`${meta.lines} lines`}
                                        />
                                        <StatPill
                                          icon={<FileText size={11} />}
                                          value={`${meta.chars} chars`}
                                        />
                                      </div>
                                    </div>

                                    {version?.message && (
                                      <p className="mt-3 text-sm text-gray-300">
                                        {version.message}
                                      </p>
                                    )}

                                    <pre className="mt-4 max-h-64 overflow-auto rounded-2xl border border-white/10 bg-[#071018] p-4 text-xs text-gray-300 scrollbar-thin">
                                      <code>{version?.code || ""}</code>
                                    </pre>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <EmptyState
                              icon={<FileText size={18} />}
                              title="No version history"
                              subtitle="Saved revisions will appear here when available."
                            />
                          )}
                        </SectionCard>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}