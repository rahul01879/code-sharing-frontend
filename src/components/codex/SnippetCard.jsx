import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import {
  Eye,
  Heart,
  MessageSquare,
  GitBranch,
  Globe,
  Lock,
  Hash,
  Sparkles,
  User,
  Copy,
  Check,
  Code2,
  Clock,
  Layers,
  Download,
  Files,
  ShieldCheck,
  ChevronRight,
  Star,
  AlertTriangle,
  FileCode2,
  ScanLine,
  Activity,
  Cpu,
} from "lucide-react";
import { formatDate, getBadgeColor } from "../../utils/codexUtils";

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const getId = (s) => s?.id ?? s?._id ?? s?.slug ?? null;

const normalizeTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return [...new Set(tags.map((t) => String(t || "").trim()).filter(Boolean))];
  }
  if (typeof tags === "string") {
    return [...new Set(tags.split(",").map((t) => t.trim()).filter(Boolean))];
  }
  return [];
};

const compactNumber = (n) => {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return "0";
  return new Intl.NumberFormat("en", { notation: "compact" }).format(num);
};

const safeString = (v, fallback = "") => (typeof v === "string" ? v : fallback);
const normalizeNewLines = (value) => String(value || "").replace(/\r\n/g, "\n");
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const getSnippetVisibility = (snippet) => {
  if (snippet?.workspaceId || snippet?.visibility === "workspace") return "workspace";
  if (snippet?.visibility === "private" || snippet?.isPublic === false) return "private";
  return "public";
};

const getReadableVisibility = (snippet) => {
  const vis = getSnippetVisibility(snippet);
  if (vis === "workspace") return "Workspace";
  if (vis === "private") return "Private";
  return "Public";
};

const getSnippetStatus = (snippet) => {
  const status = safeString(snippet?.status, "published").toLowerCase();
  if (["draft", "published", "archived"].includes(status)) return status;
  return "published";
};

const getSnippetMetrics = (snippet) => {
  const likes =
    typeof snippet?.likesCount === "number"
      ? snippet.likesCount
      : Array.isArray(snippet?.likes)
      ? snippet.likes.length
      : 0;

  const comments =
    typeof snippet?.commentsCount === "number"
      ? snippet.commentsCount
      : Array.isArray(snippet?.comments)
      ? snippet.comments.length
      : 0;

  const views = typeof snippet?.views === "number" ? snippet.views : 0;
  const downloads = typeof snippet?.downloads === "number" ? snippet.downloads : 0;
  const copies = typeof snippet?.copies === "number" ? snippet.copies : 0;
  const forks =
    typeof snippet?.forksCount === "number"
      ? snippet.forksCount
      : snippet?.forkedFrom
      ? 1
      : 0;

  return { likes, comments, views, downloads, copies, forks };
};

function pickFirstValidCodeValue(candidates = []) {
  for (const item of candidates) {
    if (isNonEmptyString(item)) return normalizeNewLines(item);
  }
  return "";
}

function extractFromFiles(files) {
  if (!files) return "";

  if (Array.isArray(files)) {
    for (const file of files) {
      if (isNonEmptyString(file)) return normalizeNewLines(file);
      if (isNonEmptyString(file?.content)) return normalizeNewLines(file.content);
      if (isNonEmptyString(file?.code)) return normalizeNewLines(file.code);
      if (isNonEmptyString(file?.text)) return normalizeNewLines(file.text);
      if (isNonEmptyString(file?.value)) return normalizeNewLines(file.value);
      if (isNonEmptyString(file?.source)) return normalizeNewLines(file.source);
    }
  }

  if (typeof files === "object") {
    for (const entry of Object.values(files)) {
      if (isNonEmptyString(entry)) return normalizeNewLines(entry);
      if (isNonEmptyString(entry?.content)) return normalizeNewLines(entry.content);
      if (isNonEmptyString(entry?.code)) return normalizeNewLines(entry.code);
      if (isNonEmptyString(entry?.text)) return normalizeNewLines(entry.text);
      if (isNonEmptyString(entry?.value)) return normalizeNewLines(entry.value);
      if (isNonEmptyString(entry?.source)) return normalizeNewLines(entry.source);
    }
  }

  return "";
}

function extractCode(snippet) {
  const directCandidates = [
    snippet?.code,
    snippet?.content,
    snippet?.snippet,
    snippet?.text,
    snippet?.source,
    snippet?.body,
    snippet?.raw,
    snippet?.value,
    snippet?.originalCode,
    snippet?.data?.code,
    snippet?.data?.content,
    snippet?.data?.snippet,
    snippet?.data?.text,
    snippet?.data?.source,
    snippet?.snippetData?.code,
    snippet?.snippetData?.content,
    snippet?.snippetData?.text,
    snippet?.previewCode,
    snippet?.latestVersion?.code,
    snippet?.latestVersion?.content,
  ];

  const direct = pickFirstValidCodeValue(directCandidates);
  if (direct) return direct;

  const fromFiles = extractFromFiles(snippet?.files);
  if (fromFiles) return fromFiles;

  return "";
}

function getPreviewMeta(snippet, code) {
  if (code.trim()) {
    return { hasCode: true, reason: "Code available" };
  }

  if (snippet?.files && Array.isArray(snippet.files) && snippet.files.length > 0) {
    return { hasCode: false, reason: "Files found, but no readable code content" };
  }

  if (
    snippet?.files &&
    typeof snippet.files === "object" &&
    Object.keys(snippet.files).length > 0
  ) {
    return { hasCode: false, reason: "File map found, but no readable code content" };
  }

  return { hasCode: false, reason: "Snippet object has no previewable code field" };
}

/* ─────────────────────────────────────────
   Language meta
───────────────────────────────────────── */
const LANG_META = {
  javascript: {
    bar: "from-yellow-400 to-amber-500",
    glow: "251,191,36",
    dot: "#fbbf24",
    cls: "text-yellow-400",
    comments: ["//", "/*"],
    keyword: ["const", "let", "function", "return", "async", "await", "if", "for", "import", "export"],
  },
  typescript: {
    bar: "from-blue-400 to-cyan-400",
    glow: "96,165,250",
    dot: "#60a5fa",
    cls: "text-blue-400",
    comments: ["//", "/*"],
    keyword: ["const", "let", "function", "return", "type", "interface", "async", "import", "export"],
  },
  python: {
    bar: "from-emerald-400 to-teal-500",
    glow: "52,211,153",
    dot: "#34d399",
    cls: "text-emerald-400",
    comments: ["#"],
    keyword: ["def", "return", "import", "from", "class", "if", "for", "async", "await"],
  },
  java: {
    bar: "from-orange-400 to-red-400",
    glow: "251,146,60",
    dot: "#fb923c",
    cls: "text-orange-400",
    comments: ["//", "/*"],
    keyword: ["public", "class", "void", "return", "static", "if", "for", "import", "new"],
  },
  go: {
    bar: "from-cyan-400 to-blue-500",
    glow: "34,211,238",
    dot: "#22d3ee",
    cls: "text-cyan-400",
    comments: ["//", "/*"],
    keyword: ["func", "return", "var", "import", "if", "for", "type", "struct", "package"],
  },
  rust: {
    bar: "from-orange-600 to-amber-500",
    glow: "234,88,12",
    dot: "#ea580c",
    cls: "text-orange-500",
    comments: ["//", "/*"],
    keyword: ["fn", "let", "mut", "return", "use", "pub", "struct", "impl", "match"],
  },
  php: {
    bar: "from-indigo-400 to-violet-500",
    glow: "129,140,248",
    dot: "#818cf8",
    cls: "text-indigo-400",
    comments: ["//", "/*", "#"],
    keyword: ["function", "return", "echo", "if", "foreach", "class", "new", "public"],
  },
  cpp: {
    bar: "from-pink-400 to-rose-500",
    glow: "244,114,182",
    dot: "#f472b6",
    cls: "text-pink-400",
    comments: ["//", "/*"],
    keyword: ["int", "void", "return", "class", "if", "for", "auto", "const", "include"],
  },
  ruby: {
    bar: "from-red-400 to-pink-500",
    glow: "248,113,113",
    dot: "#f87171",
    cls: "text-red-400",
    comments: ["#"],
    keyword: ["def", "end", "return", "class", "if", "do", "puts", "require"],
  },
  swift: {
    bar: "from-orange-400 to-yellow-400",
    glow: "251,146,60",
    dot: "#fb923c",
    cls: "text-orange-400",
    comments: ["//", "/*"],
    keyword: ["func", "let", "var", "return", "class", "if", "for", "import"],
  },
  html: {
    bar: "from-orange-500 to-red-400",
    glow: "249,115,22",
    dot: "#f97316",
    cls: "text-orange-500",
    comments: ["<!--"],
    keyword: ["div", "span", "html", "head", "body", "script", "link", "meta"],
  },
  css: {
    bar: "from-blue-400 to-purple-500",
    glow: "139,92,246",
    dot: "#8b5cf6",
    cls: "text-violet-400",
    comments: ["/*"],
    keyword: ["color", "display", "flex", "margin", "padding", "border", "font", "background"],
  },
  bash: {
    bar: "from-slate-400 to-gray-500",
    glow: "148,163,184",
    dot: "#94a3b8",
    cls: "text-slate-400",
    comments: ["#"],
    keyword: ["echo", "if", "then", "fi", "for", "do", "done", "export", "source"],
  },
  sql: {
    bar: "from-teal-400 to-emerald-500",
    glow: "45,212,191",
    dot: "#2dd4bf",
    cls: "text-teal-400",
    comments: ["--", "/*"],
    keyword: ["SELECT", "FROM", "WHERE", "INSERT", "UPDATE", "DELETE", "JOIN"],
  },
  kotlin: {
    bar: "from-purple-400 to-indigo-500",
    glow: "192,132,252",
    dot: "#c084fc",
    cls: "text-purple-400",
    comments: ["//", "/*"],
    keyword: ["fun", "val", "var", "return", "class", "if", "for", "import"],
  },
  dart: {
    bar: "from-sky-400 to-blue-500",
    glow: "56,189,248",
    dot: "#38bdf8",
    cls: "text-sky-400",
    comments: ["//", "/*"],
    keyword: ["void", "class", "final", "return", "if", "for", "import", "async"],
  },
  csharp: {
    bar: "from-green-400 to-emerald-500",
    glow: "74,222,128",
    dot: "#4ade80",
    cls: "text-green-400",
    comments: ["//", "/*"],
    keyword: ["class", "void", "return", "public", "static", "if", "for", "using"],
  },
};

const getLangMeta = (lang) =>
  LANG_META[(lang || "").toLowerCase()] ?? {
    bar: "from-gray-500 to-gray-600",
    glow: "156,163,175",
    dot: "#6b7280",
    cls: "text-gray-400",
    comments: ["//", "/*", "#"],
    keyword: [],
  };

/* ─────────────────────────────────────────
   Syntax preview
───────────────────────────────────────── */
function findCommentIndex(line, commentMarkers = []) {
  if (!line || !commentMarkers.length) return -1;
  let minIndex = -1;

  for (const marker of commentMarkers) {
    const idx = line.indexOf(marker);
    if (idx !== -1 && (minIndex === -1 || idx < minIndex)) minIndex = idx;
  }
  return minIndex;
}

function tokenize(code, keywords = [], commentMarkers = ["//"]) {
  const lines = String(code || "").replace(/\t/g, "  ").split("\n").slice(0, 10);

  return lines.map((line, li) => {
    const parts = [];
    let rest = line;
    const commentIdx = findCommentIndex(rest, commentMarkers);

    let commentSuffix = "";
    if (commentIdx !== -1) {
      commentSuffix = rest.slice(commentIdx);
      rest = rest.slice(0, commentIdx);
    }

    const regex =
      /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\b\d+\.?\d*\b|\b[a-zA-Z_$][\w$-]*\b|[{}()[\];,.<>=!+\-*/&|:@#]+)/g;

    let lastIndex = 0;
    let match;

    while ((match = regex.exec(rest)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ t: "plain", v: rest.slice(lastIndex, match.index) });
      }

      const tok = match[0];

      if (/^["'`]/.test(tok)) {
        parts.push({ t: "string", v: tok });
      } else if (/^\d/.test(tok)) {
        parts.push({ t: "number", v: tok });
      } else if (keywords.includes(tok) || keywords.includes(tok.toUpperCase())) {
        parts.push({ t: "keyword", v: tok });
      } else if (/^[{}()[\];,.<>=!+\-*/&|:@#]+$/.test(tok)) {
        parts.push({ t: "symbol", v: tok });
      } else {
        parts.push({ t: "plain", v: tok });
      }

      lastIndex = match.index + tok.length;
    }

    if (lastIndex < rest.length) {
      parts.push({ t: "plain", v: rest.slice(lastIndex) });
    }

    if (commentSuffix) {
      parts.push({ t: "comment", v: commentSuffix });
    }

    if (!parts.length) {
      parts.push({ t: "plain", v: line || " " });
    }

    return { li, parts };
  });
}

const TOKEN_CLS = {
  keyword: "text-violet-300 font-semibold",
  string: "text-emerald-300",
  number: "text-amber-300",
  comment: "text-slate-500 italic",
  symbol: "text-slate-400",
  plain: "text-slate-200",
};

/* ─────────────────────────────────────────
   CSS injection
───────────────────────────────────────── */
const CARD_CSS = `
  @keyframes sc-shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(300%); }
  }
  @keyframes sc-scan {
    0% { top:-2px; opacity:0; }
    8% { opacity:.3; }
    92% { opacity:.15; }
    100% { top:calc(100% + 2px); opacity:0; }
  }
  @keyframes sc-glow-pulse {
    0%,100% { opacity:.55; }
    50% { opacity:1; }
  }
  @keyframes sc-cursor-blink {
    0%,100% { opacity:1; }
    50% { opacity:0; }
  }
  .sc-shimmer-bar::after {
    content:'';
    position:absolute;
    inset:0;
    background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.16) 50%,transparent 100%);
    animation: sc-shimmer 2.8s ease-in-out infinite;
  }
  .sc-scan-line {
    position:absolute;
    left:0;
    right:0;
    height:1px;
    animation: sc-scan 4s linear infinite;
    pointer-events:none;
  }
  .sc-glow-pulse { animation: sc-glow-pulse 2.5s ease-in-out infinite; }
  .sc-cursor {
    display:inline-block;
    width:1.5px;
    height:.9em;
    background:currentColor;
    margin-left:1px;
    vertical-align:text-bottom;
    animation: sc-cursor-blink 1.1s step-end infinite;
  }
`;

let _cssInjected = false;
function ensureCSS() {
  if (_cssInjected || typeof document === "undefined") return;
  const s = document.createElement("style");
  s.textContent = CARD_CSS;
  document.head.appendChild(s);
  _cssInjected = true;
}

/* ─────────────────────────────────────────
   Small UI bits
───────────────────────────────────────── */
function StatPill({ icon, value, title: label, hot, accentRgb, compact = false }) {
  return (
    <span
      title={label}
      className={`group/pill flex cursor-default items-center gap-1.5 rounded-full border border-slate-700/40 bg-slate-900/70 ${
        compact ? "px-2 py-1" : "px-2.5 py-1"
      } text-[11px] font-semibold tabular-nums text-slate-400 transition-all duration-200 hover:border-slate-500/70 hover:bg-slate-800/70 hover:text-white`}
      style={hot && accentRgb ? { borderColor: `rgba(${accentRgb},.26)` } : {}}
    >
      {icon}
      {compactNumber(value)}
    </span>
  );
}

function MiniInfoCard({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-slate-700/30 bg-slate-900/55 px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </div>
      <div className="text-sm font-bold text-slate-100">{value}</div>
    </div>
  );
}

function CopyBtn({ code }) {
  const [copied, setCopied] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code || "");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={handle}
      title="Copy code"
      className="flex items-center gap-1 rounded-md border border-slate-600/40 bg-slate-800/80 px-2 py-1 text-[9px] font-semibold text-slate-300 transition-all duration-200 hover:bg-slate-700/90 hover:text-white"
    >
      {copied ? <Check size={9} className="text-green-400" /> : <Copy size={9} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function AIScoreBadge({ score }) {
  if (score == null) return null;
  const n = Number(score);
  if (!Number.isFinite(n)) return null;

  const normalized = n > 10 ? Math.round(n / 10) : Math.round(n);
  const color = normalized >= 8 ? "#34d399" : normalized >= 5 ? "#60a5fa" : "#f87171";

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold"
      style={{ color, borderColor: `${color}40`, background: `${color}12` }}
      title={`AI quality score: ${normalized}/10`}
    >
      <Sparkles size={8} />
      {normalized}/10
    </span>
  );
}

function ForkBadge({ count = 0 }) {
  return (
    <span className="flex items-center gap-1 rounded-full border border-purple-500/25 bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-purple-300">
      <GitBranch size={8} />
      {count > 0 ? `Forked · ${compactNumber(count)}` : "Forked"}
    </span>
  );
}

function VisibilityBadge({ snippet }) {
  const visibility = getSnippetVisibility(snippet);

  if (visibility === "private") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/50 bg-slate-800/80 px-2 py-0.5 text-[9px] font-semibold text-slate-300">
        <Lock size={8} />
        Private
      </span>
    );
  }

  if (visibility === "workspace") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2 py-0.5 text-[9px] font-semibold text-cyan-300">
        <ShieldCheck size={8} />
        Workspace
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold text-emerald-300">
      <Globe size={8} />
      Public
    </span>
  );
}

function StatusBadge({ status }) {
  if (status === "draft") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-300">
        <Clock size={8} />
        Draft
      </span>
    );
  }

  if (status === "archived") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-500/25 bg-slate-700/40 px-2 py-0.5 text-[9px] font-semibold text-slate-300">
        <Layers size={8} />
        Archived
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-blue-400/25 bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold text-blue-300">
      <Star size={8} />
      Published
    </span>
  );
}

/* ─────────────────────────────────────────
   Code preview block
───────────────────────────────────────── */
function CodePreviewBlock({ code, language, meta, hot }) {
  const MAX_LINES = 8;
  const MAX_CHARS_PER_LINE = 110;

  const safeCode = useMemo(() => normalizeNewLines(code), [code]);
  const totalLines = useMemo(() => safeCode.split("\n").length, [safeCode]);

  const tokenized = useMemo(() => {
    return tokenize(safeCode, meta.keyword || [], meta.comments || ["//"]).slice(0, MAX_LINES);
  }, [safeCode, meta]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border"
      style={{
        background: "linear-gradient(180deg, rgba(10,12,23,.96) 0%, rgba(7,9,17,.98) 100%)",
        borderColor: hot ? `rgba(${meta.glow},.25)` : "rgba(71,85,105,.35)",
        boxShadow: hot ? `inset 0 0 28px rgba(${meta.glow},.08)` : "none",
      }}
    >
      <div
        className="relative flex items-center justify-between border-b px-3 py-2"
        style={{
          background: "rgba(15,23,42,.7)",
          borderColor: hot ? `rgba(${meta.glow},.18)` : "rgba(71,85,105,.28)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        </div>

        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          <span
            className="sc-glow-pulse h-[7px] w-[7px] rounded-full"
            style={{
              background: meta.dot,
              boxShadow: hot ? `0 0 8px 2px ${meta.dot}66` : "none",
            }}
          />
          <span
            className="text-[9px] font-mono font-semibold uppercase tracking-[0.18em]"
            style={{ color: meta.dot }}
          >
            {language === "code" ? "plaintext" : language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-slate-500">{totalLines}L</span>
          <CopyBtn code={safeCode} />
        </div>
      </div>

      <div
        className="relative"
        style={{
          maxHeight: 210,
          overflow: "hidden",
          fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',Consolas,monospace",
          fontSize: 11,
          lineHeight: 1.65,
          padding: "8px 0",
        }}
      >
        {tokenized.map(({ li, parts }) => (
          <div key={li} className="flex items-start pr-2 transition-colors hover:bg-white/[0.025]">
            <span
              className="shrink-0 select-none text-right text-[10px]"
              style={{
                minWidth: "2.4rem",
                paddingRight: 10,
                paddingLeft: 10,
                color: hot ? `rgba(${meta.glow},.34)` : "#475569",
                borderRight: `1px solid ${
                  hot ? `rgba(${meta.glow},.12)` : "rgba(71,85,105,.35)"
                }`,
              }}
            >
              {li + 1}
            </span>

            <span
              className="block min-w-0 flex-1 whitespace-pre-wrap break-words pl-3"
              style={{ minHeight: 18 }}
            >
              {parts.map((part, i) => (
                <span key={`${li}-${i}`} className={TOKEN_CLS[part.t] || TOKEN_CLS.plain}>
                  {typeof part.v === "string" && part.v.length > MAX_CHARS_PER_LINE
                    ? `${part.v.slice(0, MAX_CHARS_PER_LINE)}…`
                    : part.v}
                </span>
              ))}
            </span>
          </div>
        ))}

        <div className="flex items-center pr-2">
          <span
            className="shrink-0 select-none text-right text-[10px]"
            style={{
              minWidth: "2.4rem",
              paddingRight: 10,
              paddingLeft: 10,
              color: "#334155",
              borderRight: "1px solid rgba(71,85,105,.35)",
            }}
          >
            {Math.min(totalLines, MAX_LINES) + 1}
          </span>
          <span className="pl-3">
            <span className="sc-cursor" style={{ color: meta.dot }} />
          </span>
        </div>
      </div>

      {totalLines > MAX_LINES && (
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-12"
          style={{
            background: "linear-gradient(to top, rgba(7,9,17,1), rgba(7,9,17,.8), transparent)",
          }}
        />
      )}

      {hot && (
        <div
          className="sc-scan-line"
          style={{
            background: `linear-gradient(90deg, transparent, ${meta.dot}66, transparent)`,
          }}
        />
      )}
    </div>
  );
}

function EmptyPreviewBlock({ reason }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-700/40 bg-[#070810] px-4 py-6">
      <div className="relative flex flex-col items-center justify-center gap-2 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700/40 bg-slate-900/70">
          <FileCode2 size={16} className="text-slate-400" />
        </span>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-300">No preview code found</p>
          <p className="text-[11px] text-slate-500">{reason}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-300">
          <AlertTriangle size={11} />
          Check public API response fields
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main
───────────────────────────────────────── */
export default function SnippetCard({
  snippet,
  onSelect,
  onTagClick,
  layout = "grid",
}) {
  ensureCSS();

  const cardRef = useRef(null);
  const [mx, setMx] = useState(50);
  const [my, setMy] = useState(50);
  const [hot, setHot] = useState(false);

  const snippetId = useMemo(() => getId(snippet), [snippet]);
  const language = useMemo(
    () => String(snippet?.language || "code").trim() || "code",
    [snippet]
  );
  const meta = useMemo(() => getLangMeta(language), [language]);
  const tags = useMemo(() => normalizeTags(snippet?.tags), [snippet]);
  const code = useMemo(() => extractCode(snippet), [snippet]);
  const previewMeta = useMemo(() => getPreviewMeta(snippet, code), [snippet, code]);

  const author = useMemo(
    () =>
      snippet?.author ||
      snippet?.user?.username ||
      (typeof snippet?.user === "string" ? snippet.user : null) ||
      snippet?.username ||
      "Unknown",
    [snippet]
  );

  const { likes, comments, views, downloads, copies, forks } = useMemo(
    () => getSnippetMetrics(snippet),
    [snippet]
  );

  const aiScore = snippet?.aiMetadata?.qualityScore ?? null;
  const isForked = !!snippet?.forkedFrom;
  const visibility = getSnippetVisibility(snippet);
  const status = getSnippetStatus(snippet);

  const lineCount = useMemo(
    () => (code.trim() ? String(code).split("\n").length : 0),
    [code]
  );
  const charCount = useMemo(() => String(code || "").length, [code]);
  const wordCount = useMemo(() => {
    const words = String(code || "").trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [code]);

  const featured = !!snippet?.featured;
  const title = safeString(snippet?.title, "Untitled");
  const description = safeString(snippet?.description, "");
  const createdAt = snippet?.createdAt;
  const updatedAt = snippet?.updatedAt;

  const handleCardClick = useCallback(() => {
    if (snippetId) onSelect?.(snippetId);
  }, [snippetId, onSelect]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCardClick();
      }
    },
    [handleCardClick]
  );

  const handleTagChipClick = useCallback(
    (tag, e) => {
      e?.preventDefault();
      e?.stopPropagation();
      const t = String(tag || "").trim();
      if (t) onTagClick?.(t);
    },
    [onTagClick]
  );

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    setMx(((e.clientX - r.left) / r.width) * 100);
    setMy(((e.clientY - r.top) / r.height) * 100);
  }, []);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const onLeave = () => {
      setMx(50);
      setMy(50);
    };

    node.addEventListener("mouseleave", onLeave);
    return () => node.removeEventListener("mouseleave", onLeave);
  }, []);

  if (layout === "list") {
    return (
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setHot(true)}
        onMouseLeave={() => setHot(false)}
        aria-label={`Open snippet ${title}`}
        className="group relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-900/70 p-3.5 transition-all duration-300 hover:border-slate-600/60 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        style={hot ? { borderColor: `rgba(${meta.glow},.35)` } : {}}
      >
        <div className={`absolute bottom-0 left-0 top-0 w-[3px] bg-gradient-to-b ${meta.bar}`} />

        <span
          className="sc-glow-pulse h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{
            background: meta.dot,
            boxShadow: hot ? `0 0 8px 2px ${meta.dot}80` : "none",
          }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className="truncate text-sm font-bold text-white transition-colors"
              style={hot ? { color: meta.dot } : {}}
            >
              {title}
            </h3>

            <span
              className={`${getBadgeColor(language)} flex-shrink-0 rounded-full border border-slate-700/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider`}
            >
              {language}
            </span>

            <VisibilityBadge snippet={snippet} />
            <StatusBadge status={status} />
            {featured && (
              <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/25 bg-yellow-500/10 px-2 py-0.5 text-[9px] font-semibold text-yellow-300">
                <Star size={8} />
                Featured
              </span>
            )}
            {isForked && <ForkBadge count={forks} />}
            <AIScoreBadge score={aiScore} />
            {!previewMeta.hasCode && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-300">
                <AlertTriangle size={8} />
                No preview
              </span>
            )}
          </div>

          <p className="mt-1 truncate text-xs text-slate-400">
            {description || "No description provided."}
          </p>

          <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <User size={9} />
              {author}
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock size={9} />
              {formatDate(createdAt)}
            </span>
            {updatedAt && updatedAt !== createdAt && (
              <>
                <span>·</span>
                <span>Updated {formatDate(updatedAt)}</span>
              </>
            )}
          </div>
        </div>

        {tags.length > 0 && (
          <div
            className="hidden flex-shrink-0 items-center gap-1 sm:flex"
            onClick={(e) => e.stopPropagation()}
          >
            {tags.slice(0, 2).map((tag, i) => (
              <button
                key={`${tag}-${i}`}
                type="button"
                onClick={(e) => handleTagChipClick(tag, e)}
                className="flex items-center gap-0.5 rounded-full border border-slate-700/40 bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400 transition-all hover:border-blue-500/40 hover:text-blue-300"
              >
                <Hash size={8} />
                {tag}
              </button>
            ))}
            {tags.length > 2 && (
              <span className="text-[10px] text-slate-500">+{tags.length - 2}</span>
            )}
          </div>
        )}

        <div className="flex flex-shrink-0 items-center gap-1.5">
          <StatPill icon={<Heart size={10} className="text-pink-400" />} value={likes} title="Likes" compact />
          <StatPill icon={<Eye size={10} className="text-blue-400" />} value={views} title="Views" compact />
          <StatPill icon={<GitBranch size={10} className="text-purple-400" />} value={forks} title="Forks" compact />
        </div>

        <div className="hidden items-center gap-1 text-[10px] font-semibold text-slate-500 md:flex">
          Open <ChevronRight size={12} />
        </div>

        <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${meta.bar} opacity-0 transition-opacity duration-500 group-hover:opacity-60`} />
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      aria-label={`Open snippet ${title}`}
      className="group relative flex h-full w-full cursor-pointer select-none flex-col overflow-hidden rounded-[24px] border border-slate-700/40 bg-gradient-to-b from-[#12131f] via-[#0d1020] to-[#090b15] transition-all duration-300 ease-out hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      style={{
        overflowWrap: "break-word",
        borderColor: hot ? `rgba(${meta.glow},.35)` : undefined,
        boxShadow: hot
          ? `0 0 0 1px rgba(${meta.glow},.12), 0 10px 36px rgba(${meta.glow},.14), 0 24px 72px rgba(${meta.glow},.10)`
          : "0 8px 24px rgba(0,0,0,.22)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: hot ? 1 : 0,
          background: `radial-gradient(320px circle at ${mx}% ${my}%, rgba(${meta.glow},.12), transparent 65%)`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,.03) 0%, transparent 24%, transparent 100%)",
        }}
      />

      <div
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl transition-opacity duration-700"
        style={{ background: `rgba(${meta.glow},.18)`, opacity: hot ? 1 : 0 }}
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full blur-3xl transition-opacity duration-1000"
        style={{ background: `rgba(${meta.glow},.12)`, opacity: hot ? 1 : 0 }}
      />

      <div className={`relative h-[3px] w-full overflow-hidden bg-gradient-to-r ${meta.bar} sc-shimmer-bar`} />

      <div className="relative z-10 flex h-full flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border"
              style={{
                borderColor: hot ? `rgba(${meta.glow},.22)` : "rgba(71,85,105,.35)",
                background: `linear-gradient(180deg, rgba(${meta.glow},.16), rgba(15,23,42,.35))`,
                boxShadow: hot ? `0 0 22px rgba(${meta.glow},.18)` : "none",
              }}
            >
              <Code2 size={18} style={{ color: meta.dot }} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`${getBadgeColor(language)} rounded-full border border-slate-700/50 px-2.5 py-[3px] text-[10px] font-bold uppercase tracking-[0.18em]`}
                >
                  {language}
                </span>

                <VisibilityBadge snippet={snippet} />
                <StatusBadge status={status} />
                {featured && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/25 bg-yellow-500/10 px-2 py-0.5 text-[9px] font-semibold text-yellow-300">
                    <Star size={8} />
                    Featured
                  </span>
                )}
                {isForked && <ForkBadge count={forks} />}
                <AIScoreBadge score={aiScore} />
                {!previewMeta.hasCode && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold text-amber-300">
                    <AlertTriangle size={8} />
                    Missing preview
                  </span>
                )}
              </div>

              <h3
                className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-100 transition-colors duration-300 sm:text-[16px]"
                style={hot ? { color: meta.dot } : {}}
              >
                {title}
              </h3>

              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                {visibility === "public" ? (
                  <Globe size={9} className="text-slate-500" />
                ) : (
                  <Lock size={9} className="text-slate-500" />
                )}
                <User size={9} className="text-slate-500" />
                <span className="max-w-[110px] truncate font-medium">{author}</span>
                <span className="text-slate-700">·</span>
                <Clock size={9} className="text-slate-500" />
                <span>{formatDate(createdAt)}</span>
                {updatedAt && updatedAt !== createdAt && (
                  <>
                    <span className="text-slate-700">·</span>
                    <span>Updated {formatDate(updatedAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-1 text-[10px] font-semibold text-slate-500 transition-colors group-hover:text-slate-300 sm:flex">
            Open <ChevronRight size={12} />
          </div>
        </div>

        {description ? (
          <p className="line-clamp-2 text-[12px] leading-relaxed text-slate-400">
            {description}
          </p>
        ) : (
          <p className="text-[11px] italic leading-relaxed text-slate-600">
            No description provided.
          </p>
        )}

        {tags.length > 0 && (
          <div
            className="flex flex-wrap gap-1.5"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            {tags.slice(0, 5).map((tag, i) => (
              <button
                key={`${tag}-${i}`}
                type="button"
                onClick={(e) => handleTagChipClick(tag, e)}
                title={`Filter by #${tag}`}
                className="flex items-center gap-[3px] rounded-full border border-slate-700/40 bg-slate-800/70 px-2 py-[4px] text-[10px] font-medium text-slate-400 transition-all duration-200 hover:border-blue-500/40 hover:bg-blue-500/15 hover:text-blue-300"
              >
                <Hash size={8} />
                {tag}
              </button>
            ))}
            {tags.length > 5 && (
              <span className="self-center px-1 text-[10px] italic text-slate-500">
                +{tags.length - 5}
              </span>
            )}
          </div>
        )}

        <div className="min-h-[232px]">
          {previewMeta.hasCode ? (
            <CodePreviewBlock code={code} language={language} meta={meta} hot={hot} />
          ) : (
            <EmptyPreviewBlock reason={previewMeta.reason} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MiniInfoCard
            label="Lines"
            value={compactNumber(lineCount)}
            icon={<Layers size={12} className="text-slate-500" />}
          />
          <MiniInfoCard
            label="Characters"
            value={compactNumber(charCount)}
            icon={<Code2 size={12} className="text-slate-500" />}
          />
          <MiniInfoCard
            label="Words"
            value={compactNumber(wordCount)}
            icon={<Activity size={12} className="text-slate-500" />}
          />
          <MiniInfoCard
            label="Access"
            value={getReadableVisibility(snippet)}
            icon={<Cpu size={12} className="text-slate-500" />}
          />
        </div>

        <div className="rounded-2xl border border-slate-700/25 bg-slate-950/30 px-3 py-3">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <ScanLine size={12} />
            Activity
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <StatPill
              icon={<Heart size={10} className="text-pink-400" />}
              value={likes}
              title="Likes"
              hot={hot}
              accentRgb={meta.glow}
            />
            <StatPill
              icon={<MessageSquare size={10} className="text-emerald-400" />}
              value={comments}
              title="Comments"
              hot={hot}
              accentRgb={meta.glow}
            />
            <StatPill
              icon={<Eye size={10} className="text-blue-400" />}
              value={views}
              title="Views"
              hot={hot}
              accentRgb={meta.glow}
            />
            <StatPill
              icon={<GitBranch size={10} className="text-purple-400" />}
              value={forks}
              title="Forks"
              hot={hot}
              accentRgb={meta.glow}
            />
            <StatPill
              icon={<Download size={10} className="text-cyan-400" />}
              value={downloads}
              title="Downloads"
              hot={hot}
              accentRgb={meta.glow}
            />
            <StatPill
              icon={<Files size={10} className="text-amber-400" />}
              value={copies}
              title="Copies"
              hot={hot}
              accentRgb={meta.glow}
            />
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-700/25 pt-2">
          <div className="flex min-w-0 items-center gap-2 text-[10px] text-slate-500">
            <span className="rounded-full border border-slate-700/40 bg-slate-900/70 px-2 py-1">
              {previewMeta.hasCode ? "Preview ready" : "Preview unavailable"}
            </span>
            {aiScore != null && (
              <span className="rounded-full border border-slate-700/40 bg-slate-900/70 px-2 py-1">
                AI enhanced
              </span>
            )}
          </div>

          <div
            className="flex items-center gap-1 text-[10px] font-semibold transition-all duration-300"
            style={{
              color: hot ? meta.dot : "rgba(148,163,184,.65)",
              transform: hot ? "translateX(0)" : "translateX(2px)",
            }}
          >
            View snippet
            <ChevronRight size={12} />
          </div>
        </div>
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${meta.bar} opacity-0 transition-opacity duration-500 group-hover:opacity-70`}
      />

      <div
        className="absolute bottom-[2px] left-0 top-[3px] w-[1px] opacity-0 transition-opacity duration-500 group-hover:opacity-50"
        style={{ background: `linear-gradient(to bottom, ${meta.dot}, transparent 80%)` }}
      />
    </div>
  );
}