import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Github,
  Heart,
  Eye,
  GitBranch,
  Code2,
  Zap,
  Star,
  Calendar,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Clock,
  BookOpen,
  Flame,
  BarChart2,
  Hash,
  Shield,
  TrendingUp,
  Activity,
  X,
  AlertCircle,
  ChevronRight,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Sparkles,
  Filter,
  Globe,
  User2,
  LayoutGrid,
  ArrowUpRight,
  CheckCircle2,
  KeyRound,
  Radar,
  Crown,
  FolderGit2,
  FileCode2,
} from "lucide-react";

/* ─────────────────────────────────────────
   Config
───────────────────────────────────────── */
const API =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITEAPIBASEURL ||
  "";

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

const getId = (obj) => obj?._id || obj?.id;

function cls(...arr) {
  return arr.filter(Boolean).join(" ");
}

function timeAgo(date) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  const s = Math.floor((Date.now() - parsed.getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return parsed.toLocaleDateString();
}

function formatJoinDate(date) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

async function copyText(text) {
  if (!text) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

async function apiFetch(path, options = {}) {
  return fetch(`${API}${path}`, options);
}

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const ACTIVITY_META = {
  created: {
    icon: <Code2 size={12} />,
    color: "text-blue-300",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    label: "Created",
  },
  edited: {
    icon: <Zap size={12} />,
    color: "text-amber-300",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "Edited",
  },
  deleted: {
    icon: <Trash2 size={12} />,
    color: "text-rose-300",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    label: "Deleted",
  },
  liked: {
    icon: <Heart size={12} />,
    color: "text-pink-300",
    bg: "bg-pink-500/10",
    border: "border-pink-500/20",
    label: "Liked",
  },
  unliked: {
    icon: <Heart size={12} />,
    color: "text-gray-300",
    bg: "bg-gray-500/10",
    border: "border-gray-500/20",
    label: "Unliked",
  },
  forked: {
    icon: <GitBranch size={12} />,
    color: "text-violet-300",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    label: "Forked",
  },
  commented: {
    icon: <BookOpen size={12} />,
    color: "text-cyan-300",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    label: "Commented",
  },
  joined_workspace: {
    icon: <Shield size={12} />,
    color: "text-emerald-300",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    label: "Joined WS",
  },
};

const LANG_COLORS = {
  javascript: { tw: "from-yellow-400 to-amber-500" },
  typescript: { tw: "from-blue-500 to-cyan-500" },
  python: { tw: "from-blue-600 to-teal-500" },
  java: { tw: "from-orange-400 to-red-500" },
  go: { tw: "from-cyan-400 to-blue-500" },
  rust: { tw: "from-orange-600 to-amber-500" },
  php: { tw: "from-indigo-400 to-violet-500" },
  cpp: { tw: "from-pink-500 to-rose-500" },
  ruby: { tw: "from-red-500 to-pink-500" },
  swift: { tw: "from-orange-500 to-yellow-400" },
};

/* ─────────────────────────────────────────
   Reusable UI
───────────────────────────────────────── */
function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.04] ${className}`} />;
}

function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    error: "border-rose-500/30 bg-rose-500/10 text-rose-200",
    info: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  };

  return (
    <div
      className={cls(
        "fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-2xl backdrop-blur-xl animate-slide-up",
        styles[type] || styles.info
      )}
    >
      {type === "success" && <Check size={15} />}
      {type === "error" && <AlertCircle size={15} />}
      {type === "info" && <Sparkles size={15} />}
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-1 rounded-lg p-1 opacity-60 transition hover:bg-white/10 hover:opacity-100"
      >
        <X size={13} />
      </button>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-gray-400">
        {icon}
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-200">{title}</p>
        <p className="max-w-sm text-xs leading-relaxed text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, icon, action, children, className = "" }) {
  return (
    <div
      className={cls(
        "overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.035] shadow-[0_20px_60px_rgba(0,0,0,0.20)] backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-start gap-3">
          {icon && (
            <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-gray-200">
              {icon}
            </span>
          )}
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function MetricCard({ icon, label, value, gradient, sublabel }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.04]">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
        style={{ opacity: 0.06 }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-white tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {sublabel && <p className="mt-1 text-xs text-gray-500">{sublabel}</p>}
        </div>
        <span
          className={cls(
            "flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
            gradient
          )}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

function MiniInfo({ label, value, tone = "text-white" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className={cls("mt-1 text-lg font-black", tone)}>{value}</p>
    </div>
  );
}

function TabButton({ active, icon, label, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cls(
        "flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
        active
          ? "border border-white/10 bg-white/[0.08] text-white shadow-sm"
          : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-300"
      )}
    >
      <span className={active ? "text-cyan-300" : ""}>{icon}</span>
      {label}
      {count !== null && count !== undefined && (
        <span
          className={cls(
            "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            active ? "bg-cyan-500/15 text-cyan-200" : "bg-white/[0.04] text-gray-500"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function LangBar({ snippets }) {
  const langData = useMemo(() => {
    const counts = {};
    snippets.forEach((s) => {
      const lang = (s?.language || "other").toLowerCase();
      counts[lang] = (counts[lang] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [snippets]);

  const total = snippets.length || 1;

  if (!langData.length) {
    return <p className="text-sm text-gray-500">No snippets yet.</p>;
  }

  return (
    <div className="space-y-3">
      {langData.map(([lang, count]) => {
        const pct = Math.round((count / total) * 100);
        const tw = LANG_COLORS[lang]?.tw || "from-gray-500 to-gray-600";

        return (
          <div key={lang} className="group flex items-center gap-3">
            <span className="w-24 truncate text-right text-xs font-medium capitalize text-gray-400">
              {lang}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className={`h-2 rounded-full bg-gradient-to-r ${tw} transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex w-16 items-center justify-end gap-2">
              <span className="text-xs tabular-nums text-gray-400">{count}</span>
              <span className="text-[10px] text-gray-600">{pct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SnippetRow({ snippet, rank, onView, onCopySuccess }) {
  const [copied, setCopied] = useState(false);
  const lang = (snippet?.language || "other").toLowerCase();
  const tw = LANG_COLORS[lang]?.tw || "from-gray-500 to-gray-600";
  const likes = snippet?.likes?.length || 0;
  const views = snippet?.views || 0;

  const handleCopy = async () => {
    const ok = await copyText(snippet?.title || "");
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
      onCopySuccess?.();
    }
  };

  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3.5 transition-all duration-200 hover:bg-white/[0.04]">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[10px] font-bold tabular-nums text-gray-400">
        {rank}
      </span>

      <span className={`h-10 w-1.5 flex-shrink-0 rounded-full bg-gradient-to-b ${tw}`} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight text-white">
          {snippet?.title || "Untitled"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md bg-gradient-to-r ${tw} px-1.5 py-0.5 text-[10px] font-semibold capitalize text-white/90`}
          >
            {lang}
          </span>

          {snippet?.gistUrl && (
            <a
              href={snippet.gistUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-[10px] text-emerald-300 hover:text-emerald-200 hover:underline"
            >
              <Github size={9} /> Gist
            </a>
          )}

          {snippet?.forkedFrom && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-violet-300">
              <GitBranch size={9} /> Forked
            </span>
          )}

          <span className="text-[10px] text-gray-600">{timeAgo(snippet?.createdAt)}</span>
        </div>
      </div>

      <div className="hidden flex-shrink-0 items-center gap-3 sm:flex">
        <span className="inline-flex items-center gap-1 text-xs tabular-nums text-pink-300">
          <Heart size={11} /> {likes}
        </span>
        <span className="inline-flex items-center gap-1 text-xs tabular-nums text-cyan-300">
          <Eye size={11} /> {views}
        </span>
      </div>

      <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        {onView && (
          <button
            onClick={() => onView(snippet)}
            className="rounded-xl p-2 text-gray-500 transition hover:bg-white/[0.06] hover:text-white"
            title="View snippet"
          >
            <ExternalLink size={13} />
          </button>
        )}

        <button
          onClick={handleCopy}
          className="rounded-xl p-2 text-gray-500 transition hover:bg-white/[0.06] hover:text-white"
          title="Copy title"
        >
          {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}

function ActivityFeed({ activity }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? activity : activity.slice(0, 8);

  if (!activity.length) {
    return (
      <EmptyState
        icon={<Activity size={18} className="text-gray-400" />}
        title="No activity yet"
        subtitle="Create snippets, fork code, and interact with your workspace to see activity here."
      />
    );
  }

  return (
    <div className="space-y-2">
      {displayed.map((a, idx) => {
        const meta = ACTIVITY_META[a?.type] || ACTIVITY_META.created;

        return (
          <div
            key={getId(a) || idx}
            className={cls(
              "flex items-start gap-3 rounded-2xl border p-3 transition-all duration-200 hover:brightness-110",
              meta.border,
              meta.bg
            )}
          >
            <span
              className={cls(
                "mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl border",
                meta.border,
                meta.bg,
                meta.color
              )}
            >
              {meta.icon}
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm leading-tight text-gray-200">
                <span className={cls("font-semibold", meta.color)}>{meta.label}</span>
                {a?.snippetTitle && (
                  <>
                    {" "}
                    — <span className="font-medium text-gray-300">{a.snippetTitle}</span>
                  </>
                )}
              </p>

              <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                <Clock size={9} />
                {a?.createdAt ? timeAgo(a.createdAt) : "—"}
              </p>
            </div>
          </div>
        );
      })}

      {activity.length > 8 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] py-2.5 text-xs text-gray-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          {showAll ? "Show less" : `Show ${activity.length - 8} more`}
          <ChevronRight
            size={12}
            className={showAll ? "rotate-90 transition-transform" : "transition-transform"}
          />
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Skeleton
───────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#070b12] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <Skeleton className="h-24 w-24 rounded-3xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-72 max-w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-16 w-20 rounded-2xl" />
              <Skeleton className="h-16 w-20 rounded-2xl" />
              <Skeleton className="h-16 w-20 rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-3xl" />
              ))}
            </div>
            <Skeleton className="h-72 rounded-[28px]" />
          </div>

          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-14 rounded-2xl" />
            <Skeleton className="h-[420px] rounded-[28px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main
───────────────────────────────────────── */
export default function Profile({ onNavigateToSnippet }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [snippets, setSnippets] = useState([]);
  const [activity, setActivity] = useState([]);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubProfile, setGithubProfile] = useState(null);
  const [githubToken, setGithubToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [ghLoading, setGhLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("snippets");
  const [toast, setToast] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [snippetSearch, setSnippetSearch] = useState("");
  const [snippetFilter, setSnippetFilter] = useState("all");

  const token = localStorage.getItem("token");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const loadProfileData = useCallback(
    async ({ silent = false } = {}) => {
      if (!API) {
        setError("API base URL is missing.");
        setLoading(false);
        return;
      }

      if (!token) {
        setError("Not logged in.");
        setLoading(false);
        return;
      }

      try {
        if (silent) setRefreshing(true);
        else setLoading(true);

        setError("");

        const headers = { Authorization: `Bearer ${token}` };

        const [meRes, mineRes, actRes, ghRes] = await Promise.all([
          apiFetch("/api/auth/me", { headers }),
          apiFetch("/api/snippets/mine", { headers }),
          apiFetch("/api/activity/mine", { headers }),
          apiFetch("/api/user/github-token", { headers }),
        ]);

        if (meRes.status === 401) {
          setError("Session expired. Please log in again.");
          return;
        }

        if (meRes.ok) {
          const me = await safeJson(meRes);
          setUser(me?.user ?? me ?? null);
        } else {
          setUser(null);
        }

        if (mineRes.ok) {
          const mine = await safeJson(mineRes);
          setSnippets(Array.isArray(mine) ? mine : []);
        } else {
          setSnippets([]);
        }

        if (actRes.ok) {
          const acts = await safeJson(actRes);
          setActivity(Array.isArray(acts) ? acts : []);
        } else {
          setActivity([]);
        }

        if (ghRes.ok) {
          const gh = await safeJson(ghRes);

          if (gh?.connected && !gh?.expired) {
            setGithubConnected(true);
            setGithubProfile({
              login: gh.githubUsername || "",
              avatar_url: gh.githubAvatar || "",
              html_url: gh.githubUsername ? `https://github.com/${gh.githubUsername}` : "",
            });
          } else {
            setGithubConnected(false);
            setGithubProfile(null);
          }
        } else {
          setGithubConnected(false);
          setGithubProfile(null);
        }
      } catch {
        setError("Failed to load profile. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const insights = useMemo(() => {
    const totalLikes = snippets.reduce((s, x) => s + (x?.likes?.length || 0), 0);
    const totalViews = snippets.reduce((s, x) => s + (x?.views || 0), 0);
    const totalForked = snippets.filter((s) => s?.forkedFrom).length;
    const publicCount = snippets.filter((s) => s?.isPublic).length;
    const gistCount = snippets.filter((s) => s?.gistUrl).length;

    return {
      totalSnippets: snippets.length,
      totalLikes,
      totalViews,
      totalForked,
      publicCount,
      privateCount: Math.max(snippets.length - publicCount, 0),
      gistCount,
    };
  }, [snippets]);

  const topSnippets = useMemo(() => {
    return [...snippets].sort(
      (a, b) =>
        ((b?.likes?.length || 0) + (b?.views || 0)) -
        ((a?.likes?.length || 0) + (a?.views || 0))
    );
  }, [snippets]);

  const filteredSnippets = useMemo(() => {
    let arr = [...topSnippets];

    if (snippetFilter === "public") arr = arr.filter((s) => s?.isPublic);
    if (snippetFilter === "private") arr = arr.filter((s) => !s?.isPublic);
    if (snippetFilter === "gists") arr = arr.filter((s) => s?.gistUrl);
    if (snippetFilter === "forked") arr = arr.filter((s) => s?.forkedFrom);

    if (snippetSearch.trim()) {
      const q = snippetSearch.toLowerCase();
      arr = arr.filter((s) => {
        const title = String(s?.title || "").toLowerCase();
        const lang = String(s?.language || "").toLowerCase();
        const tags = Array.isArray(s?.tags) ? s.tags.join(" ").toLowerCase() : "";
        return title.includes(q) || lang.includes(q) || tags.includes(q);
      });
    }

    return arr;
  }, [topSnippets, snippetSearch, snippetFilter]);

  const languageBreakdown = useMemo(() => {
    return Object.entries(
      snippets.reduce((acc, s) => {
        const lang = (s?.language || "other").toLowerCase();
        acc[lang] = (acc[lang] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1]);
  }, [snippets]);

  const handleConnectGithub = useCallback(async () => {
    if (!githubToken.trim()) return showToast("Enter your GitHub token", "error");
    if (!token) return showToast("Not logged in", "error");

    setGhLoading(true);
    try {
      const res = await apiFetch("/api/user/github-token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: githubToken.trim() }),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || "Failed to connect");

      const uname = data?.githubUsername || "";
      const avatar = data?.githubAvatar || "";

      setGithubConnected(true);
      setGithubProfile({
        login: uname,
        avatar_url: avatar,
        html_url: uname ? `https://github.com/${uname}` : "",
      });
      setGithubToken("");
      showToast(`Connected as @${uname || "GitHub user"}`, "success");
    } catch (err) {
      showToast(err?.message || "Failed to connect GitHub", "error");
    } finally {
      setGhLoading(false);
    }
  }, [githubToken, token, showToast]);

  const handleDisconnectGithub = useCallback(async () => {
    if (!token) return;

    setGhLoading(true);
    try {
      const res = await apiFetch("/api/user/github-token", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data?.error || "Failed to disconnect");
      }

      setGithubConnected(false);
      setGithubProfile(null);
      showToast("GitHub disconnected", "info");
    } catch (err) {
      showToast(err?.message || "Failed to disconnect", "error");
    } finally {
      setGhLoading(false);
    }
  }, [token, showToast]);

  const copyEmail = useCallback(async () => {
    if (!user?.email) return;
    const ok = await copyText(user.email);
    if (ok) {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 1500);
      showToast("Email copied", "success");
    } else {
      showToast("Failed to copy email", "error");
    }
  }, [user, showToast]);

  if (loading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-[#070b12] px-4 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl border border-rose-500/20 bg-rose-500/10">
          <AlertCircle size={26} className="text-rose-300" />
        </span>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-rose-200">{error}</p>
          <p className="text-sm text-gray-500">
            Refresh the session and try loading your profile again.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/[0.07] hover:text-white"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  const avatar = githubProfile?.avatar_url || "";
  const username = user?.username || "User";
  const joinDate = formatJoinDate(user?.createdAt);

  const tabs = [
    { id: "snippets", label: "Snippets", icon: <Code2 size={13} />, count: snippets.length },
    { id: "activity", label: "Activity", icon: <Activity size={13} />, count: activity.length },
    { id: "languages", label: "Languages", icon: <BarChart2 size={13} />, count: null },
  ];

  return (
    <>
      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.985); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slide-up { animation: slide-up 0.25s ease both; }
        .animate-fade-in { animation: fade-in 0.2s ease both; }
        .animate-scale-in { animation: scale-in 0.22s ease both; }
      `}</style>

      <div className="min-h-screen bg-[#070b12] px-4 py-8 text-gray-200 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-6 animate-fade-in">
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0b1220] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-[15%] top-0 h-40 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
              <div className="absolute right-[10%] top-4 h-40 w-72 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="absolute bottom-0 left-1/3 h-32 w-64 rounded-full bg-blue-500/10 blur-3xl" />
            </div>

            <div className="relative flex flex-col gap-6 p-6 sm:p-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                <div className="relative flex-shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={username}
                      className="h-24 w-24 rounded-[26px] border-2 border-white/10 object-cover shadow-2xl"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-[26px] border-2 border-white/10 bg-gradient-to-br from-cyan-500 to-blue-600 text-3xl font-black text-white shadow-2xl">
                      {username[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#0b1220] bg-emerald-400" />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
                      <User2 size={10} />
                      Profile
                    </span>

                    {githubConnected && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                        <CheckCircle2 size={10} />
                        GitHub linked
                      </span>
                    )}

                    {insights.totalSnippets >= 10 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                        <Crown size={10} />
                        Power creator
                      </span>
                    )}
                  </div>

                  <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                    {username}
                  </h1>

                  {user?.bio ? (
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400">
                      {user.bio}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">
                      No bio added yet. Your snippets and activity still show your developer footprint.
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {user?.email && (
                      <button
                        onClick={copyEmail}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 transition hover:text-white"
                      >
                        <Mail size={11} />
                        {user.email}
                        {copiedEmail ? (
                          <Check size={10} className="text-emerald-300" />
                        ) : (
                          <Copy size={10} className="opacity-50" />
                        )}
                      </button>
                    )}

                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={11} />
                      Joined {joinDate}
                    </span>

                    {githubProfile?.login && (
                      <a
                        href={githubProfile.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-gray-400 transition hover:text-white"
                      >
                        <Github size={11} /> @{githubProfile.login}
                        <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:min-w-[320px]">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                  <p className="text-2xl font-black tabular-nums text-white">{snippets.length}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Snippets</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                  <p className="text-2xl font-black tabular-nums text-white">{insights.totalLikes}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Likes</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-center">
                  <p className="text-2xl font-black tabular-nums text-white">{insights.totalViews}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Views</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={<Code2 size={18} className="text-white" />}
                  label="Snippets"
                  value={insights.totalSnippets}
                  gradient="from-cyan-500/20 to-blue-600/20"
                  sublabel={`${insights.publicCount} public`}
                />
                <MetricCard
                  icon={<Heart size={18} className="text-white" />}
                  label="Likes"
                  value={insights.totalLikes}
                  gradient="from-pink-500/20 to-rose-600/20"
                  sublabel="Total engagement"
                />
                <MetricCard
                  icon={<Eye size={18} className="text-white" />}
                  label="Views"
                  value={insights.totalViews}
                  gradient="from-sky-500/20 to-cyan-600/20"
                  sublabel="Across all snippets"
                />
                <MetricCard
                  icon={<GitBranch size={18} className="text-white" />}
                  label="Forked"
                  value={insights.totalForked}
                  gradient="from-violet-500/20 to-fuchsia-600/20"
                  sublabel={`${insights.gistCount} gist synced`}
                />
              </div>

              <SectionCard
                title="GitHub"
                subtitle="Connect your token to sync snippets as Gists."
                icon={<Github size={15} className="text-white" />}
                action={
                  <span
                    className={cls(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold",
                      githubConnected
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-white/10 bg-white/[0.03] text-gray-500"
                    )}
                  >
                    <span
                      className={cls(
                        "inline-block h-1.5 w-1.5 rounded-full",
                        githubConnected ? "bg-emerald-400" : "bg-gray-500"
                      )}
                    />
                    {githubConnected ? "Connected" : "Not linked"}
                  </span>
                }
              >
                {githubConnected && githubProfile ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                      {githubProfile.avatar_url ? (
                        <img
                          src={githubProfile.avatar_url}
                          alt={githubProfile.login}
                          className="h-11 w-11 rounded-2xl border border-white/10 object-cover"
                        />
                      ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 font-bold text-white">
                          {githubProfile.login?.[0]?.toUpperCase()}
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          @{githubProfile.login || "GitHub User"}
                        </p>
                        <p className="text-xs text-gray-500">GitHub account</p>
                      </div>

                      {githubProfile.html_url && (
                        <a
                          href={githubProfile.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl p-2 text-gray-500 transition hover:bg-white/[0.06] hover:text-white"
                        >
                          <ArrowUpRight size={13} />
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <MiniInfo
                        label="Gists synced"
                        value={snippets.filter((s) => s?.gistUrl).length}
                        tone="text-emerald-200"
                      />
                      <MiniInfo
                        label="Connection"
                        value="Secure"
                        tone="text-cyan-200"
                      />
                    </div>

                    <button
                      onClick={handleDisconnectGithub}
                      disabled={ghLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
                    >
                      {ghLoading ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Unlock size={13} />
                      )}
                      Disconnect GitHub
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white">
                        <KeyRound size={14} className="text-cyan-300" />
                        Personal Access Token
                      </div>
                      <p className="text-xs leading-relaxed text-gray-500">
                        Connect a GitHub Personal Access Token with <code className="text-gray-400">gist</code> scope
                        to enable direct Gist syncing from your snippets.
                      </p>
                    </div>

                    <div className="relative">
                      <input
                        type={showToken ? "text" : "password"}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxx"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleConnectGithub()}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-4 pr-11 font-mono text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-300"
                        tabIndex={-1}
                      >
                        {showToken ? <Unlock size={13} /> : <Lock size={13} />}
                      </button>
                    </div>

                    <p className="flex items-center gap-1 text-[10px] text-gray-600">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-600" />
                      You can revoke access any time.
                    </p>

                    <button
                      onClick={handleConnectGithub}
                      disabled={ghLoading || !githubToken.trim()}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-gray-700 hover:to-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ghLoading ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Github size={13} />
                      )}
                      Connect GitHub
                    </button>
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Workspace summary"
                subtitle="A quick breakdown of your account."
                icon={<LayoutGrid size={15} className="text-cyan-300" />}
              >
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <MiniInfo label="Public" value={insights.publicCount} tone="text-emerald-200" />
                  <MiniInfo label="Private" value={insights.privateCount} tone="text-gray-200" />
                  <MiniInfo label="Forked" value={insights.totalForked} tone="text-violet-200" />
                  <MiniInfo label="Gists" value={insights.gistCount} tone="text-amber-200" />
                </div>
              </SectionCard>
            </div>

            <div className="space-y-6 lg:col-span-2">
              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-1">
                  {tabs.map((tab) => (
                    <TabButton
                      key={tab.id}
                      active={activeTab === tab.id}
                      icon={tab.icon}
                      label={tab.label}
                      count={tab.count}
                      onClick={() => setActiveTab(tab.id)}
                    />
                  ))}
                </div>

                <button
                  onClick={() => loadProfileData({ silent: true })}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
                >
                  <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              {activeTab === "snippets" && (
                <SectionCard
                  title="Top snippets"
                  subtitle="Sorted by engagement."
                  icon={<Flame size={15} className="text-orange-300" />}
                  action={<span className="text-xs text-gray-500">{filteredSnippets.length} visible</span>}
                >
                  <div className="mb-4 grid gap-3 md:grid-cols-[1fr,auto]">
                    <div className="relative">
                      <Search
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
                      />
                      <input
                        type="text"
                        value={snippetSearch}
                        onChange={(e) => setSnippetSearch(e.target.value)}
                        placeholder="Search by title, language, or tag"
                        className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-500/50"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Filter size={12} />
                        Filter
                      </span>
                      {["all", "public", "private", "gists", "forked"].map((item) => (
                        <button
                          key={item}
                          onClick={() => setSnippetFilter(item)}
                          className={cls(
                            "rounded-full border px-3 py-1.5 text-[11px] font-semibold capitalize transition",
                            snippetFilter === item
                              ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-200"
                              : "border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]"
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredSnippets.length ? (
                    <div className="space-y-2">
                      {filteredSnippets.slice(0, 10).map((s, i) => (
                        <SnippetRow
                          key={getId(s) || i}
                          snippet={s}
                          rank={i + 1}
                          onView={onNavigateToSnippet}
                          onCopySuccess={() => showToast("Snippet title copied", "success")}
                        />
                      ))}

                      {filteredSnippets.length > 10 && (
                        <p className="pt-2 text-center text-xs text-gray-500">
                          +{filteredSnippets.length - 10} more snippets match this view
                        </p>
                      )}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Code2 size={18} className="text-cyan-300" />}
                      title="No snippets found"
                      subtitle="Try another search or filter, or create your first snippet to populate this section."
                    />
                  )}
                </SectionCard>
              )}

              {activeTab === "activity" && (
                <SectionCard
                  title="Recent activity"
                  subtitle="A timeline of your workspace actions."
                  icon={<Activity size={15} className="text-cyan-300" />}
                  action={activity.length > 0 ? <span className="text-xs text-gray-500">{activity.length} events</span> : null}
                >
                  <ActivityFeed activity={activity} />
                </SectionCard>
              )}

              {activeTab === "languages" && (
                <SectionCard
                  title="Language distribution"
                  subtitle="How your snippets are split by language."
                  icon={<BarChart2 size={15} className="text-violet-300" />}
                  action={<span className="text-xs text-gray-500">{snippets.length} total</span>}
                >
                  <LangBar snippets={snippets} />

                  {snippets.length > 0 && (
                    <div className="mt-5 border-t border-white/10 pt-5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
                        <Radar size={14} className="text-violet-300" />
                        Language tags
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {languageBreakdown.map(([lang, count]) => {
                          const tw = LANG_COLORS[lang]?.tw || "from-gray-500 to-gray-600";
                          return (
                            <span
                              key={lang}
                              className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r px-3 py-1.5 text-xs font-semibold text-white shadow-sm ${tw}`}
                            >
                              <Hash size={9} />
                              {lang}
                              <span className="opacity-75">×{count}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </SectionCard>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <SectionCard
                  title="Visibility"
                  subtitle="Shareable vs private code."
                  icon={<Globe size={15} className="text-emerald-300" />}
                >
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-gray-300">Public snippets</span>
                        <span className="text-sm font-bold text-emerald-200">{insights.publicCount}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
                          style={{
                            width: `${snippets.length ? Math.round((insights.publicCount / snippets.length) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-gray-300">Private snippets</span>
                        <span className="text-sm font-bold text-gray-200">{insights.privateCount}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-gray-400 to-gray-500"
                          style={{
                            width: `${snippets.length ? Math.round((insights.privateCount / snippets.length) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  title="Engagement"
                  subtitle="A quick read on snippet performance."
                  icon={<TrendingUp size={15} className="text-amber-300" />}
                >
                  {snippets.length > 0 ? (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                          Avg likes/snippet
                        </p>
                        <p className="mt-1 text-2xl font-black text-pink-200">
                          {(insights.totalLikes / Math.max(snippets.length, 1)).toFixed(1)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                          Avg views/snippet
                        </p>
                        <p className="mt-1 text-2xl font-black text-cyan-200">
                          {(insights.totalViews / Math.max(snippets.length, 1)).toFixed(1)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={<TrendingUp size={18} className="text-gray-400" />}
                      title="No engagement yet"
                      subtitle="Create and share snippets to start seeing usage and reaction trends."
                    />
                  )}
                </SectionCard>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <SectionCard
                  title="Publishing"
                  subtitle="Code sharing footprint."
                  icon={<FolderGit2 size={15} className="text-cyan-300" />}
                >
                  <div className="grid grid-cols-2 gap-3">
                    <MiniInfo label="Synced gists" value={insights.gistCount} tone="text-emerald-200" />
                    <MiniInfo label="Forked items" value={insights.totalForked} tone="text-violet-200" />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Creator mode"
                  subtitle="Snapshot of your current workspace status."
                  icon={<FileCode2 size={15} className="text-blue-300" />}
                >
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm text-gray-300">Profile completeness</span>
                        <span className="text-sm font-bold text-white">
                          {user?.bio && user?.email ? "High" : user?.bio || user?.email ? "Medium" : "Low"}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className={cls(
                            "h-2 rounded-full",
                            user?.bio && user?.email
                              ? "bg-gradient-to-r from-emerald-400 to-cyan-500 w-full"
                              : user?.bio || user?.email
                              ? "bg-gradient-to-r from-amber-400 to-orange-500 w-2/3"
                              : "bg-gradient-to-r from-gray-500 to-gray-600 w-1/3"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </div>
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