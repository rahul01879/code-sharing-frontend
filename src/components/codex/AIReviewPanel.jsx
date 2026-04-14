import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Sparkles,
  Code2,
  Tag,
  Wrench,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Zap,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Star,
  Hash,
  Wand2,
  Languages,
  ShieldCheck,
  TrendingUp,
  FileCode2,
  FlaskConical,
  Brain,
  ShieldAlert,
  TerminalSquare,
  ScanSearch,
  Lock,
  Cpu,
  TestTube2,
  WandSparkles,
} from "lucide-react";

/* ─────────────────────────────────────────
   Config
───────────────────────────────────────── */
const RAW_API =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITEAPIBASEURL ||
  "";

const normalizeBaseUrl = (u) => {
  const s = String(u || "").trim();
  if (!s) return "";
  return s.endsWith("/") ? s.slice(0, -1) : s;
};

const API = normalizeBaseUrl(RAW_API);

const LANG_OPTIONS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
  "c",
  "csharp",
  "go",
  "rust",
  "php",
  "ruby",
  "swift",
  "kotlin",
];

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const getId = (obj) => obj?._id || obj?.id || "";
const ensureArray = (v) => (Array.isArray(v) ? v : []);
const unique = (arr) => [...new Set(arr.filter(Boolean))];

const safeStorageGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageRemove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {}
};

const safeJsonParse = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeTags = (tags) =>
  unique(
    ensureArray(tags)
      .map((t) => String(t || "").trim().toLowerCase())
      .filter(Boolean)
  );

const decodeEscapedCode = (value) => {
  if (value == null) return "";
  return String(value)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
};

const extractErrorMessage = (err) =>
  err?.response?.data?.error ||
  err?.response?.data?.message ||
  err?.message ||
  "Something went wrong.";

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(String(text || ""));
    return true;
  } catch {
    return false;
  }
};

const lineCountOf = (code) => String(code || "").split("\n").length;
const charCountOf = (code) => String(code || "").length;

const badgeClassByTone = {
  blue: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
  violet: "border-violet-500/20 bg-violet-500/10 text-violet-300",
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  rose: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  gray: "border-gray-700/50 bg-gray-800/60 text-gray-300",
};

const cls = (...arr) => arr.filter(Boolean).join(" ");

/* ─────────────────────────────────────────
   Score ring
───────────────────────────────────────── */
function ScoreRing({ score = 0 }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score / 10, 0), 1);
  const offset = circ * (1 - pct);
  const color = score >= 8 ? "#34d399" : score >= 5 ? "#60a5fa" : "#f87171";

  return (
    <div className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center">
      <svg className="-rotate-90" width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#1f2937" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-black" style={{ color }}>
          {score}
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-gray-500">
          Score
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   UI atoms
───────────────────────────────────────── */
function CopyBtn({ value, label = "Copy" }) {
  const [copied, setCopied] = useState(false);

  const handle = async () => {
    const ok = await copyText(value);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <button
      onClick={handle}
      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-700/60 bg-gray-800/80 px-3 py-2 text-xs font-medium text-gray-300 transition-all hover:border-gray-600 hover:bg-gray-700 hover:text-white"
    >
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      {copied ? "Copied!" : label}
    </button>
  );
}

function MetricPill({ icon, label, tone = "gray" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${badgeClassByTone[tone] || badgeClassByTone.gray}`}
    >
      {icon}
      {label}
    </span>
  );
}

function CodeBlock({ code, maxH = "420px", lang = "", headerRight = null }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-gray-700/40 shadow-[0_16px_40px_rgba(0,0,0,0.25)]"
      style={{ background: "rgb(13,17,23)" }}
    >
      <div className="flex items-center gap-1.5 border-b border-gray-800/80 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-500/70" />
        <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <span className="h-3 w-3 rounded-full bg-green-500/70" />
        {lang && (
          <span className="ml-2 rounded border border-gray-700/40 bg-gray-800/60 px-1.5 py-0.5 text-[10px] text-gray-500">
            {lang}
          </span>
        )}
        <span className="ml-auto text-[10px] text-gray-600">snippet</span>
        {headerRight}
      </div>
      <pre
        className="overflow-auto p-4 text-xs leading-[1.75] text-gray-200"
        style={{ maxHeight: maxH, fontFamily: "'Fira Code','Cascadia Code',monospace" }}
      >
        <code>{code || "// No code returned"}</code>
      </pre>
    </div>
  );
}

function SeverityChip({ severity }) {
  const s = String(severity || "info").toLowerCase();
  const map = {
    critical: {
      cls: "bg-red-500/15 text-red-300 border-red-500/25",
      icon: <XCircle size={11} />,
    },
    warning: {
      cls: "bg-amber-500/15 text-amber-300 border-amber-500/25",
      icon: <AlertTriangle size={11} />,
    },
    suggestion: {
      cls: "bg-violet-500/15 text-violet-300 border-violet-500/25",
      icon: <Wand2 size={11} />,
    },
    info: {
      cls: "bg-blue-500/15 text-blue-300 border-blue-500/25",
      icon: <Info size={11} />,
    },
  };
  const { cls: toneCls, icon } = map[s] || map.info;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toneCls}`}>
      {icon}
      {s}
    </span>
  );
}

function ToolTab({ id, label, icon, active, loading, disabled, onClick }) {
  const isLoading = loading === id;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-xs font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-blue-500/40 bg-blue-500/10 text-blue-300 shadow-lg shadow-blue-500/10"
          : "border-gray-700/40 bg-gray-900/60 text-gray-500 hover:border-gray-600/60 hover:bg-gray-800/60 hover:text-gray-300"
      }`}
    >
      <span className={`transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-105"}`}>
        {isLoading ? <RefreshCw size={16} className="animate-spin" /> : icon}
      </span>
      <span className="hidden sm:block">{label}</span>
      {active && (
        <span className="absolute -bottom-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-blue-400" />
      )}
    </button>
  );
}

function PanelSpinner({ icon, label, color = "blue" }) {
  const ringCls = {
    blue: "border-blue-500",
    cyan: "border-cyan-500",
    violet: "border-violet-500",
    emerald: "border-emerald-500",
    purple: "border-purple-500",
    orange: "border-orange-500",
  }[color] || "border-blue-500";

  const iconCls = {
    blue: "text-blue-400",
    cyan: "text-cyan-400",
    violet: "text-violet-400",
    emerald: "text-emerald-400",
    purple: "text-purple-400",
    orange: "text-orange-400",
  }[color] || "text-blue-400";

  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-gray-700/30 bg-gray-900/40 py-16">
      <div className="relative">
        <div className={`h-12 w-12 animate-spin rounded-full border-2 border-t-transparent ${ringCls}`} />
        <span className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${iconCls}`}>
          {icon}
        </span>
      </div>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center gap-2.5 rounded-3xl border border-dashed border-gray-700/50 bg-gray-900/30 px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-800/80 text-gray-500">
        {icon}
      </span>
      <p className="text-sm font-medium text-gray-300">{title}</p>
      <p className="max-w-xs text-xs leading-relaxed text-gray-600">{subtitle}</p>
    </div>
  );
}

function SectionCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-gray-700/30 bg-gray-900/50 p-4 shadow-[0_14px_34px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionLabel({ icon, label, count, action = null }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {label}
          {count != null && (
            <span className="ml-1.5 rounded-full border border-gray-700/40 bg-gray-800/60 px-1.5 py-px text-[10px] text-gray-500">
              {count}
            </span>
          )}
        </span>
      </div>
      {action}
    </div>
  );
}

function ApplyBtn({ onClick, loading, loadingKey, children, color = "blue", disabled = false }) {
  const busy = loading === loadingKey;

  const colorCls = {
    blue: "from-blue-600 to-blue-500 shadow-blue-500/20 hover:from-blue-500 hover:to-blue-400 hover:shadow-blue-500/30",
    emerald: "from-emerald-600 to-emerald-500 shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400",
    purple: "from-purple-600 to-purple-500 shadow-purple-500/20 hover:from-purple-500 hover:to-purple-400",
    violet: "from-violet-600 to-violet-500 shadow-violet-500/20 hover:from-violet-500 hover:to-violet-400",
  }[color] || "from-blue-600 to-blue-500 shadow-blue-500/20";

  return (
    <button
      onClick={onClick}
      disabled={busy || disabled}
      className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r px-3.5 py-2 text-xs font-semibold text-white shadow-md transition-all disabled:opacity-50 ${colorCls}`}
    >
      {busy ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
      {busy ? "Applying…" : children}
    </button>
  );
}

function RunBtn({ onClick, loading, loadingKey, icon, label, loadingLabel, color = "blue", disabled = false }) {
  const busy = loading === loadingKey;

  const colorCls = {
    blue: "from-blue-600 to-blue-500 shadow-blue-500/20 hover:from-blue-500 hover:to-blue-400",
    cyan: "from-cyan-600 to-cyan-500 shadow-cyan-500/20 hover:from-cyan-500 hover:to-cyan-400",
    violet: "from-violet-600 to-violet-500 shadow-violet-500/20 hover:from-violet-500 hover:to-violet-400",
    emerald: "from-emerald-600 to-emerald-500 shadow-emerald-500/20 hover:from-emerald-500 hover:to-emerald-400",
    purple: "from-purple-600 to-purple-500 shadow-purple-500/20 hover:from-purple-500 hover:to-purple-400",
    orange: "from-orange-600 to-orange-500 shadow-orange-500/20 hover:from-orange-500 hover:to-orange-400",
  }[color] || "from-blue-600 to-blue-500 shadow-blue-500/20";

  return (
    <button
      onClick={onClick}
      disabled={!!loading || disabled}
      className={`inline-flex flex-shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-50 ${colorCls}`}
    >
      {busy ? <RefreshCw size={14} className="animate-spin" /> : icon}
      {busy ? loadingLabel : label}
    </button>
  );
}

function OverviewCard({ icon, title, value, hint, tone = "gray" }) {
  const toneMap = {
    gray: "text-gray-200 border-gray-700/30 bg-gray-900/50",
    blue: "text-blue-200 border-blue-500/10 bg-blue-500/[0.06]",
    violet: "text-violet-200 border-violet-500/10 bg-violet-500/[0.06]",
    emerald: "text-emerald-200 border-emerald-500/10 bg-emerald-500/[0.06]",
    amber: "text-amber-200 border-amber-500/10 bg-amber-500/[0.06]",
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone] || toneMap.gray}`}>
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-gray-500">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-lg font-black">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

function SandboxBanner() {
  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
      <ShieldAlert size={15} className="mt-0.5 flex-shrink-0" />
      <span>
        Sandbox mode is active. You can inspect all AI tools and existing results, but running AI actions and applying updates is disabled.
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function AIReviewPanel({
  snippet,
  onSnippetUpdate,
  onUnauthorized,
  className = "",
  sandboxMode = false,
  authToken = null,
  currentUser = null,
}) {
  const snippetId = getId(snippet);
  const timerRef = useRef(null);

  const api = useMemo(() => axios.create({ baseURL: API || undefined }), []);

  const resolvedUser = useMemo(() => {
    if (currentUser) return currentUser;
    if (sandboxMode) return null;
    return safeJsonParse(safeStorageGet("user"), null);
  }, [currentUser, sandboxMode]);

  const resolvedToken = useMemo(() => {
    if (authToken) return authToken;
    if (sandboxMode) return null;
    return safeStorageGet("token");
  }, [authToken, sandboxMode]);

  const hasAuth = !!resolvedToken && !sandboxMode;

  /* state */
  const [activeTool, setActiveTool] = useState("review");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [review, setReview] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [fixResult, setFixResult] = useState(null);
  const [convertResult, setConvertResult] = useState(null);
  const [testResults, setTestResults] = useState([]);

  const [issueText, setIssueText] = useState("");
  const [toLang, setToLang] = useState("typescript");

  const title = String(snippet?.title || "Untitled");
  const description = String(snippet?.description || "");
  const language = String(snippet?.language || "javascript").toLowerCase();
  const code = String(snippet?.code || "");
  const isPublic = !!snippet?.isPublic;
  const currentTags = normalizeTags(snippet?.tags);
  const lineCount = lineCountOf(code);
  const charCount = charCountOf(code);

  const showSuccess = useCallback((msg) => {
    setSuccess(msg);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSuccess(""), 4000);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    setError("");
    setSuccess("");
    setReview(null);
    setExplanation("");
    setSuggestedTags([]);
    setFixResult(null);
    setConvertResult(null);
    setTestResults([]);
    setIssueText("");
    setToLang("typescript");
    setActiveTool("review");
  }, [snippetId]);

  const getAuthHeaders = useCallback(() => {
    return hasAuth ? { Authorization: `Bearer ${resolvedToken}` } : null;
  }, [hasAuth, resolvedToken]);

  const handle401 = useCallback(() => {
    safeStorageRemove("token");
    safeStorageRemove("user");
    onUnauthorized?.();
  }, [onUnauthorized]);

  const ensureActionAllowed = useCallback(() => {
    if (sandboxMode) {
      throw new Error("This action is disabled in sandbox mode.");
    }
    const headers = getAuthHeaders();
    if (!headers) {
      throw new Error("Please log in first.");
    }
    return headers;
  }, [getAuthHeaders, sandboxMode]);

  const postAI = useCallback(
    async (path, body = {}) => {
      if (!snippetId) throw new Error("Snippet id is missing.");
      const headers = ensureActionAllowed();

      try {
        const res = await api.post(`/api/ai/snippets/${snippetId}/${path}`, body, { headers });
        return res.data;
      } catch (err) {
        if (err?.response?.status === 401) handle401();
        throw err;
      }
    },
    [api, ensureActionAllowed, handle401, snippetId]
  );

  const updateSnippet = useCallback(
    async (patch = {}) => {
      if (!snippetId) throw new Error("Snippet id is missing.");
      const headers = ensureActionAllowed();

      const payload = {
        title: patch.title ?? title,
        description: patch.description ?? description,
        language: String(patch.language ?? language).toLowerCase().trim(),
        code: patch.code ?? code,
        isPublic: typeof patch.isPublic === "boolean" ? patch.isPublic : isPublic,
        tags: normalizeTags(patch.tags ?? currentTags),
      };

      try {
        const res = await api.put(`/api/snippets/${snippetId}`, payload, { headers });
        onSnippetUpdate?.(res.data);
        return res.data;
      } catch (err) {
        if (err?.response?.status === 401) handle401();
        throw err;
      }
    },
    [
      api,
      code,
      currentTags,
      description,
      ensureActionAllowed,
      handle401,
      isPublic,
      language,
      onSnippetUpdate,
      snippetId,
      title,
    ]
  );

  const run = useCallback(async (key, fn) => {
    setActiveTool(key);
    setLoading(key);
    setError("");
    setSuccess("");
    try {
      await fn();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading("");
    }
  }, []);

  const runReview = useCallback(
    () =>
      run("review", async () => {
        const data = await postAI("review");
        setReview(data?.review || null);
        showSuccess("AI review completed.");
      }),
    [postAI, run, showSuccess]
  );

  const runExplain = useCallback(
    () =>
      run("explain", async () => {
        const data = await postAI("explain");
        setExplanation(String(data?.explanation || ""));
        showSuccess("Explanation generated.");
      }),
    [postAI, run, showSuccess]
  );

  const runSuggestTags = useCallback(
    () =>
      run("tags", async () => {
        const data = await postAI("suggest-tags");
        setSuggestedTags(normalizeTags(data?.tags));
        showSuccess("Tag suggestions ready.");
      }),
    [postAI, run, showSuccess]
  );

  const runFix = useCallback(
    () =>
      run("fix", async () => {
        const data = await postAI("fix", { issue: issueText.trim() });
        setFixResult({
          fixedCode: decodeEscapedCode(data?.fixedCode || ""),
          explanation: String(data?.explanation || ""),
        });
        showSuccess("Fixed version generated.");
      }),
    [issueText, postAI, run, showSuccess]
  );

  const runConvert = useCallback(
    () =>
      run("convert", async () => {
        const data = await postAI("convert", { toLang });
        setConvertResult({
          convertedCode: decodeEscapedCode(data?.convertedCode || ""),
          notes: String(data?.notes || ""),
          toLang,
        });
        showSuccess(`Converted to ${toLang}.`);
      }),
    [postAI, run, showSuccess, toLang]
  );

  const runGenerateTests = useCallback(
    () =>
      run("tests", async () => {
        const data = await postAI("generate-tests");
        setTestResults(ensureArray(data?.tests));
        showSuccess("Test cases generated.");
      }),
    [postAI, run, showSuccess]
  );

  const applySuggestedTags = useCallback(async () => {
    if (!suggestedTags.length) return;
    setLoading("apply-tags");
    setError("");

    try {
      await updateSnippet({ tags: normalizeTags([...currentTags, ...suggestedTags]) });
      showSuccess("Tags applied to snippet.");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading("");
    }
  }, [currentTags, showSuccess, suggestedTags, updateSnippet]);

  const applyFixedCode = useCallback(async () => {
    const fc = String(fixResult?.fixedCode || "");
    if (!fc.trim()) return;
    setLoading("apply-fix");
    setError("");

    try {
      await updateSnippet({ code: fc });
      showSuccess("Fixed code applied.");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading("");
    }
  }, [fixResult?.fixedCode, showSuccess, updateSnippet]);

  const applyConvertedCode = useCallback(async () => {
    const cc = String(convertResult?.convertedCode || "");
    const nextLang = String(convertResult?.toLang || toLang || language);
    if (!cc.trim()) return;
    setLoading("apply-convert");
    setError("");

    try {
      await updateSnippet({ code: cc, language: nextLang });
      showSuccess(`Converted ${nextLang} applied.`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading("");
    }
  }, [convertResult, language, showSuccess, toLang, updateSnippet]);

  const toolResultsCount = useMemo(() => {
    let count = 0;
    if (review) count += 1;
    if (explanation) count += 1;
    if (suggestedTags.length) count += 1;
    if (fixResult) count += 1;
    if (convertResult) count += 1;
    if (testResults.length) count += 1;
    return count;
  }, [review, explanation, suggestedTags, fixResult, convertResult, testResults]);

  const issueCount = ensureArray(review?.issues).length;
  const positivesCount = ensureArray(review?.positives).length;

  const tools = [
    { id: "review", label: "Review", icon: <ShieldCheck size={16} />, run: runReview },
    { id: "explain", label: "Explain", icon: <BookOpen size={16} />, run: runExplain },
    { id: "tags", label: "Tags", icon: <Tag size={16} />, run: runSuggestTags },
    { id: "fix", label: "Fix", icon: <Wrench size={16} />, run: runFix },
    { id: "convert", label: "Convert", icon: <Languages size={16} />, run: runConvert },
    { id: "tests", label: "Tests", icon: <FlaskConical size={16} />, run: runGenerateTests },
  ];

  if (!snippetId) {
    return (
      <div className={`rounded-3xl border border-gray-800 bg-gray-950/80 p-8 ${className}`}>
        <EmptyState
          icon={<Sparkles size={20} />}
          title="No snippet selected"
          subtitle="Open a snippet to use AI review, explain, fix, convert, tag, and test generation."
        />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes ai-fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ai-fade-up { animation: ai-fade-up 220ms ease both; }
      `}</style>

      <section
        className={`overflow-hidden rounded-[28px] border border-gray-800/80 bg-gradient-to-br from-gray-950 via-[#0d1117] to-gray-950 text-gray-200 shadow-2xl ${className}`}
      >
        <div className="border-b border-gray-800/60 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-violet-600 shadow-lg shadow-blue-500/20">
                  <Sparkles size={17} className="text-white" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-white">AI Review Panel</h2>
                  <p className="text-xs text-gray-500">
                    Analyze, explain, improve, convert, and test this snippet.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-gray-700/30 bg-gray-900/60 px-4 py-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{title}</p>
                    {description && (
                      <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <MetricPill icon={<FileCode2 size={10} className="text-blue-400" />} label={language} tone="blue" />
                    <MetricPill
                      icon={<Lock size={10} className={isPublic ? "text-emerald-400" : "text-amber-400"} />}
                      label={isPublic ? "public" : "private"}
                      tone={isPublic ? "emerald" : "amber"}
                    />
                    <MetricPill icon={<Hash size={10} className="text-violet-400" />} label={`${currentTags.length} tags`} tone="violet" />
                    <MetricPill icon={<Code2 size={10} className="text-cyan-400" />} label={`${lineCount} lines`} tone="cyan" />
                    <MetricPill icon={<TerminalSquare size={10} className="text-gray-400" />} label={`${charCount} chars`} tone="gray" />
                    {sandboxMode && (
                      <MetricPill icon={<ShieldAlert size={10} className="text-amber-400" />} label="sandbox" tone="amber" />
                    )}
                  </div>
                </div>

                {currentTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {currentTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-gray-700/40 bg-gray-800/60 px-2 py-0.5 text-[10px] text-gray-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[440px]">
              <OverviewCard
                icon={<Brain size={13} className="text-blue-400" />}
                title="Active tool"
                value={tools.find((t) => t.id === activeTool)?.label || "Review"}
                hint="Selected workspace"
                tone="blue"
              />
              <OverviewCard
                icon={<ScanSearch size={13} className="text-violet-400" />}
                title="Results"
                value={toolResultsCount}
                hint="Generated outputs"
                tone="violet"
              />
              <OverviewCard
                icon={<ShieldAlert size={13} className="text-amber-400" />}
                title="Issues"
                value={issueCount}
                hint="From AI review"
                tone="amber"
              />
              <OverviewCard
                icon={<TrendingUp size={13} className="text-emerald-400" />}
                title="Positives"
                value={positivesCount}
                hint="Strengths detected"
                tone="emerald"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-700/40 bg-gray-800/60 px-2.5 py-1">
              <Cpu size={11} />
              {sandboxMode ? "Read-only preview" : "Live AI actions enabled"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-700/40 bg-gray-800/60 px-2.5 py-1">
              <ShieldCheck size={11} />
              {hasAuth ? "Authenticated" : sandboxMode ? "Sandbox session" : "Login required for actions"}
            </span>
            {resolvedUser?.username && (
              <span className="inline-flex items-center gap-1 rounded-full border border-gray-700/40 bg-gray-800/60 px-2.5 py-1">
                <WandSparkles size={11} />
                {resolvedUser.username}
              </span>
            )}
          </div>
        </div>

        <div className="border-b border-gray-800/60 px-5 py-4 sm:px-6">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {tools.map((t) => (
              <ToolTab
                key={t.id}
                id={t.id}
                label={t.label}
                icon={t.icon}
                active={activeTool === t.id}
                loading={loading}
                disabled={!!loading && loading !== t.id}
                onClick={() => {
                  setActiveTool(t.id);
                  setError("");
                }}
              />
            ))}
          </div>
        </div>

        <div className="px-5 pt-4 sm:px-6">
          {sandboxMode && <SandboxBanner />}

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <XCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                className="ml-auto flex-shrink-0 text-red-400 hover:text-red-300"
              >
                <XCircle size={14} />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              <CheckCircle2 size={15} className="flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>

        <div className="space-y-4 px-5 pb-6 sm:px-6">
          {activeTool === "review" && (
            <div className="space-y-4 ai-fade-up">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-400">
                  Get a quality score, strengths, issues, and a refactored version of your code.
                </p>

                <RunBtn
                  onClick={runReview}
                  loading={loading}
                  loadingKey="review"
                  icon={<ShieldCheck size={14} />}
                  label="Run Review"
                  loadingLabel="Analyzing…"
                  color="blue"
                  disabled={sandboxMode}
                />
              </div>

              {loading === "review" ? (
                <PanelSpinner
                  icon={<Sparkles size={16} />}
                  label="Analyzing snippet quality…"
                  color="blue"
                />
              ) : review ? (
                <div className="space-y-4">
                  <SectionCard>
                    <div className="flex flex-col gap-4 sm:flex-row">
                      {review.score != null && <ScoreRing score={review.score} />}

                      <div className="min-w-0 flex-1">
                        <SectionLabel
                          icon={<Star size={13} className="text-yellow-400" />}
                          label="Summary"
                          action={<CopyBtn value={review.summary || ""} label="Copy summary" />}
                        />
                        <p className="text-sm leading-relaxed text-gray-200">
                          {review.summary || "—"}
                        </p>
                      </div>
                    </div>
                  </SectionCard>

                  {ensureArray(review.positives).length > 0 && (
                    <SectionCard>
                      <SectionLabel
                        icon={<TrendingUp size={13} className="text-emerald-400" />}
                        label="Positives"
                        count={review.positives.length}
                      />
                      <ul className="space-y-2.5">
                        {review.positives.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                            <span className="text-sm leading-relaxed text-gray-200">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </SectionCard>
                  )}

                  {ensureArray(review.issues).length > 0 && (
                    <SectionCard>
                      <SectionLabel
                        icon={<AlertTriangle size={13} className="text-amber-400" />}
                        label="Issues"
                        count={review.issues.length}
                      />
                      <div className="space-y-3">
                        {review.issues.map((issue, i) => (
                          <div
                            key={i}
                            className="rounded-2xl border border-gray-700/30 bg-gray-950/60 p-4"
                          >
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <SeverityChip severity={issue?.severity} />
                              {issue?.line != null && (
                                <span className="rounded-full border border-gray-700/40 bg-gray-800/60 px-2 py-0.5 text-[11px] text-gray-400">
                                  line {issue.line}
                                </span>
                              )}
                            </div>

                            <p className="text-sm font-medium text-white">
                              {issue?.message || "Issue found"}
                            </p>

                            {issue?.fix && (
                              <p className="mt-1.5 text-xs leading-relaxed text-gray-400">
                                <span className="mr-1.5 font-semibold text-blue-400">Fix:</span>
                                {issue.fix}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {review.refactoredCode && (
                    <SectionCard>
                      <SectionLabel
                        icon={<Zap size={13} className="text-violet-400" />}
                        label="Refactored"
                        action={<CopyBtn value={decodeEscapedCode(review.refactoredCode)} />}
                      />
                      <CodeBlock
                        code={decodeEscapedCode(review.refactoredCode)}
                        lang={language}
                      />
                    </SectionCard>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={<ShieldCheck size={20} />}
                  title="No review yet"
                  subtitle="Run Review to get a quality score, strengths, issues, and a refactored version."
                />
              )}
            </div>
          )}

          {activeTool === "explain" && (
            <div className="space-y-4 ai-fade-up">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-400">
                  Generate a plain-English explanation of what this snippet does.
                </p>
                <RunBtn
                  onClick={runExplain}
                  loading={loading}
                  loadingKey="explain"
                  icon={<BookOpen size={14} />}
                  label="Explain Code"
                  loadingLabel="Explaining…"
                  color="cyan"
                  disabled={sandboxMode}
                />
              </div>

              {loading === "explain" ? (
                <PanelSpinner
                  icon={<BookOpen size={16} />}
                  label="Generating explanation…"
                  color="cyan"
                />
              ) : explanation ? (
                <SectionCard>
                  <SectionLabel
                    icon={<BookOpen size={13} className="text-cyan-400" />}
                    label="Explanation"
                    action={<CopyBtn value={explanation} />}
                  />
                  <p className="text-sm leading-[1.9] text-gray-200">{explanation}</p>
                </SectionCard>
              ) : (
                <EmptyState
                  icon={<BookOpen size={20} />}
                  title="No explanation yet"
                  subtitle="Run Explain Code to get a plain-English summary of what this snippet does."
                />
              )}
            </div>
          )}

          {activeTool === "tags" && (
            <div className="space-y-4 ai-fade-up">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-400">
                  AI will analyze your code and suggest up to 10 relevant tags.
                </p>
                <RunBtn
                  onClick={runSuggestTags}
                  loading={loading}
                  loadingKey="tags"
                  icon={<Tag size={14} />}
                  label="Suggest Tags"
                  loadingLabel="Analyzing…"
                  color="violet"
                  disabled={sandboxMode}
                />
              </div>

              {loading === "tags" ? (
                <PanelSpinner
                  icon={<Tag size={16} />}
                  label="Finding relevant tags…"
                  color="violet"
                />
              ) : suggestedTags.length > 0 ? (
                <div className="space-y-4">
                  <SectionCard>
                    <SectionLabel
                      icon={<Tag size={13} className="text-violet-400" />}
                      label="Suggested"
                      count={suggestedTags.length}
                    />
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-sm text-violet-300"
                        >
                          <Hash size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </SectionCard>

                  {currentTags.length > 0 && (
                    <SectionCard>
                      <SectionLabel
                        icon={<Hash size={12} className="text-gray-500" />}
                        label="Current tags"
                        count={currentTags.length}
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {currentTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-gray-700/40 bg-gray-800/60 px-2.5 py-1 text-xs text-gray-400"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <ApplyBtn
                      onClick={applySuggestedTags}
                      loading={loading}
                      loadingKey="apply-tags"
                      color="blue"
                      disabled={sandboxMode}
                    >
                      Apply Suggested Tags
                    </ApplyBtn>
                    <span className="text-xs text-gray-500">Merges with existing tags</span>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Tag size={20} />}
                  title="No tag suggestions yet"
                  subtitle="Run Suggest Tags to get AI-generated tags for this snippet."
                />
              )}
            </div>
          )}

          {activeTool === "fix" && (
            <div className="space-y-4 ai-fade-up">
              <SectionCard>
                <SectionLabel
                  icon={<Wrench size={13} className="text-emerald-400" />}
                  label="Issue focus"
                />
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Optional — describe the issue to focus on
                </label>
                <textarea
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                  placeholder="e.g. fix async error handling, memory leak, wrong loop logic…"
                  rows={3}
                  disabled={sandboxMode}
                  className="w-full resize-none rounded-2xl border border-gray-700/60 bg-gray-950/80 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-60"
                />
              </SectionCard>

              <div className="flex justify-start">
                <RunBtn
                  onClick={runFix}
                  loading={loading}
                  loadingKey="fix"
                  icon={<Wrench size={14} />}
                  label="Generate Fixed Version"
                  loadingLabel="Generating fix…"
                  color="emerald"
                  disabled={sandboxMode}
                />
              </div>

              {loading === "fix" ? (
                <PanelSpinner
                  icon={<Wrench size={16} />}
                  label="Generating corrected code…"
                  color="emerald"
                />
              ) : fixResult ? (
                <div className="space-y-4">
                  <SectionCard>
                    <SectionLabel
                      icon={<Info size={13} className="text-blue-400" />}
                      label="What was fixed"
                      action={<CopyBtn value={fixResult.explanation || ""} label="Copy notes" />}
                    />
                    <p className="text-sm leading-relaxed text-gray-200">
                      {fixResult.explanation || "No explanation returned."}
                    </p>
                  </SectionCard>

                  <SectionCard>
                    <SectionLabel
                      icon={<Wrench size={13} className="text-emerald-400" />}
                      label="Fixed code"
                      action={
                        <div className="flex items-center gap-2">
                          <CopyBtn value={fixResult.fixedCode} />
                          <ApplyBtn
                            onClick={applyFixedCode}
                            loading={loading}
                            loadingKey="apply-fix"
                            color="emerald"
                            disabled={sandboxMode}
                          >
                            Apply
                          </ApplyBtn>
                        </div>
                      }
                    />
                    <CodeBlock code={fixResult.fixedCode} lang={language} />
                  </SectionCard>
                </div>
              ) : (
                <EmptyState
                  icon={<Wrench size={20} />}
                  title="No fixed version yet"
                  subtitle="Describe the issue optionally and run Fix Code to get a corrected version."
                />
              )}
            </div>
          )}

          {activeTool === "convert" && (
            <div className="space-y-4 ai-fade-up">
              <SectionCard>
                <SectionLabel
                  icon={<Languages size={13} className="text-purple-400" />}
                  label="Target language"
                />
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                  {LANG_OPTIONS.filter((l) => l !== language).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setToLang(lang)}
                      className={`rounded-2xl border px-2 py-2.5 text-xs font-semibold transition-all ${
                        toLang === lang
                          ? "border-purple-500/40 bg-purple-500/15 text-purple-300"
                          : "border-gray-700/40 bg-gray-900/60 text-gray-500 hover:border-gray-600 hover:text-gray-300"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </SectionCard>

              <div className="flex justify-start">
                <RunBtn
                  onClick={runConvert}
                  loading={loading}
                  loadingKey="convert"
                  icon={<Languages size={14} />}
                  label={
                    <span className="flex items-center gap-1.5">
                      Convert
                      <span className="font-bold text-purple-200">{language}</span>
                      <ArrowRight size={12} />
                      <span className="font-bold text-purple-200">{toLang}</span>
                    </span>
                  }
                  loadingLabel="Converting…"
                  color="purple"
                  disabled={sandboxMode}
                />
              </div>

              {loading === "convert" ? (
                <PanelSpinner
                  icon={<Languages size={16} />}
                  label={`Converting to ${toLang}…`}
                  color="purple"
                />
              ) : convertResult ? (
                <div className="space-y-4">
                  {convertResult.notes && (
                    <SectionCard>
                      <SectionLabel
                        icon={<Info size={13} className="text-blue-400" />}
                        label="Conversion notes"
                        action={<CopyBtn value={convertResult.notes} label="Copy notes" />}
                      />
                      <p className="text-sm leading-relaxed text-gray-200">
                        {convertResult.notes}
                      </p>
                    </SectionCard>
                  )}

                  <SectionCard>
                    <SectionLabel
                      icon={<Languages size={13} className="text-purple-400" />}
                      label={`${convertResult.toLang} output`}
                      action={
                        <div className="flex items-center gap-2">
                          <CopyBtn value={convertResult.convertedCode} />
                          <ApplyBtn
                            onClick={applyConvertedCode}
                            loading={loading}
                            loadingKey="apply-convert"
                            color="purple"
                            disabled={sandboxMode}
                          >
                            Apply
                          </ApplyBtn>
                        </div>
                      }
                    />
                    <CodeBlock code={convertResult.convertedCode} lang={convertResult.toLang} />
                  </SectionCard>
                </div>
              ) : (
                <EmptyState
                  icon={<Languages size={20} />}
                  title="No converted version yet"
                  subtitle="Pick a target language and run Convert Code."
                />
              )}
            </div>
          )}

          {activeTool === "tests" && (
            <div className="space-y-4 ai-fade-up">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-gray-400">
                  Generate unit test cases covering happy paths, edge cases, null inputs, and failure scenarios.
                </p>
                <RunBtn
                  onClick={runGenerateTests}
                  loading={loading}
                  loadingKey="tests"
                  icon={<TestTube2 size={14} />}
                  label="Generate Tests"
                  loadingLabel="Generating…"
                  color="orange"
                  disabled={sandboxMode}
                />
              </div>

              {loading === "tests" ? (
                <PanelSpinner
                  icon={<FlaskConical size={16} />}
                  label="Writing test cases…"
                  color="orange"
                />
              ) : testResults.length > 0 ? (
                <div className="space-y-3">
                  {testResults.map((tc, i) => (
                    <SectionCard key={i}>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/15 text-[10px] font-bold text-orange-300">
                            {i + 1}
                          </span>
                          <p className="text-sm font-semibold text-white">
                            {tc.title || `Test case ${i + 1}`}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        {tc.input && (
                          <div className="rounded-xl border border-gray-700/30 bg-gray-950/60 p-3">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                              Input
                            </p>
                            <p className="text-xs text-gray-300">{tc.input}</p>
                          </div>
                        )}

                        {tc.expectedOutput && (
                          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-3">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                              Expected output
                            </p>
                            <p className="text-xs text-emerald-300">{tc.expectedOutput}</p>
                          </div>
                        )}
                      </div>

                      {tc.explanation && (
                        <p className="mt-3 text-xs leading-relaxed text-gray-500">
                          {tc.explanation}
                        </p>
                      )}
                    </SectionCard>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<FlaskConical size={20} />}
                  title="No test cases yet"
                  subtitle="Run Generate Tests to get unit test cases covering edge cases and error scenarios."
                />
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}