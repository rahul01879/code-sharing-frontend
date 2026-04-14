import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  ArrowLeft,
  FolderOpen,
  Layers,
  Calendar,
  Search,
  SlidersHorizontal,
  Code2,
  X,
  Sparkles,
  Hash,
  LayoutGrid,
  LayoutList,
  BookMarked,
  Eye,
  Heart,
  CheckCircle2,
  ChevronDown,
  PanelTop,
  FileCode2,
  Clock3,
  Filter,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import SnippetGrid from "./SnippetGrid";
import { formatDate } from "../../utils/codexUtils";

/* ─────────────────────────────────────────
   One-time CSS
───────────────────────────────────────── */
const CSS = `
  @keyframes cdp-fade-up {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes cdp-shimmer {
    from { transform:translateX(-100%); }
    to   { transform:translateX(250%); }
  }
  @keyframes cdp-soft-pulse {
    0%,100% { opacity:.45; transform:scale(1); }
    50% { opacity:.8; transform:scale(1.03); }
  }

  .cdp-fade-up { animation: cdp-fade-up .25s ease both; }

  .cdp-shimmer::after {
    content:'';
    position:absolute;
    inset:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent);
    animation: cdp-shimmer 2.5s ease-in-out infinite;
  }

  .cdp-soft-pulse {
    animation: cdp-soft-pulse 2.4s ease-in-out infinite;
  }
`;

let _css = false;
function ensureCSS() {
  if (_css || typeof document === "undefined") return;
  const s = document.createElement("style");
  s.textContent = CSS;
  document.head.appendChild(s);
  _css = true;
}

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const LANG_COLORS = {
  javascript: "from-yellow-400 to-amber-500",
  typescript: "from-blue-400 to-cyan-400",
  python: "from-emerald-400 to-teal-500",
  java: "from-orange-400 to-red-400",
  go: "from-cyan-400 to-blue-500",
  rust: "from-orange-600 to-amber-500",
  php: "from-indigo-400 to-violet-500",
  cpp: "from-pink-400 to-rose-500",
  ruby: "from-red-400 to-pink-500",
  html: "from-orange-500 to-red-400",
  css: "from-blue-400 to-purple-500",
};

const getLangGrad = (lang) =>
  LANG_COLORS[(lang || "").toLowerCase()] || "from-gray-500 to-gray-600";

function normalize(v) {
  return String(v ?? "").trim().toLowerCase();
}

function getLikesCount(snippet) {
  return Array.isArray(snippet?.likes)
    ? snippet.likes.length
    : Number(snippet?.likesCount ?? 0);
}

function getViewsCount(snippet) {
  return Number(snippet?.views ?? 0);
}

function getLanguage(snippet) {
  return normalize(snippet?.language || "other");
}

function cls(...parts) {
  return parts.filter(Boolean).join(" ");
}

function getSnippetId(snippet) {
  return snippet?.id ?? snippet?._id ?? snippet?.title;
}

/* ─────────────────────────────────────────
   Small UI
───────────────────────────────────────── */
function SummaryCard({ icon, label, value, sublabel, tone = "blue" }) {
  const toneMap = {
    blue: "from-blue-500/20 to-cyan-500/10 text-blue-300",
    violet: "from-violet-500/20 to-purple-500/10 text-violet-300",
    emerald: "from-emerald-500/20 to-teal-500/10 text-emerald-300",
    amber: "from-amber-500/20 to-orange-500/10 text-amber-300",
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-700/40 bg-gradient-to-b from-[#141724] to-[#0f111b] p-4 shadow-[0_12px_30px_rgba(0,0,0,.22)]">
      <div
        className={cls(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
          toneMap[tone] || toneMap.blue
        )}
        style={{ maskImage: "linear-gradient(to bottom, rgba(0,0,0,.72), transparent)" }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black tracking-tight text-white tabular-nums">
            {value}
          </p>
          {sublabel && <p className="mt-1 text-xs text-gray-500">{sublabel}</p>}
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-700/40 bg-black/20 text-white shadow-lg">
          {icon}
        </span>
      </div>
    </div>
  );
}

function FilterChip({ icon, children, active = false, onClick, activeClass = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cls(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200",
        active
          ? activeClass || "border-blue-500/40 bg-blue-500/20 text-blue-300"
          : "border-gray-700/40 bg-gray-800/60 text-gray-400 hover:border-gray-600 hover:text-white"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function LangChip({ lang, count, active = false, onClick }) {
  const grad = getLangGrad(lang);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cls(
        "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm transition-all duration-200",
        active
          ? `bg-gradient-to-r ${grad} text-white`
          : "border border-gray-700/40 bg-gray-800/60 text-gray-400 hover:border-gray-600 hover:text-white"
      )}
    >
      <Hash size={9} />
      {lang}
      <span className="opacity-70">×{count}</span>
    </button>
  );
}

/* ─────────────────────────────────────────
   Empty states
───────────────────────────────────────── */
function EmptySnippets({ collectionName }) {
  return (
    <div className="cdp-fade-up flex flex-col items-center justify-center gap-5 py-24 text-center">
      <div className="relative">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl border border-gray-700/50 bg-gray-800/60 shadow-xl">
          <Code2 size={32} className="text-gray-500" />
        </span>
        <span className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/20">
          <Sparkles size={13} className="text-blue-400" />
        </span>
      </div>

      <div className="max-w-sm space-y-2">
        <h3 className="text-base font-bold text-gray-200">No snippets here yet</h3>
        <p className="text-sm leading-relaxed text-gray-500">
          Add snippets to{" "}
          <span className="font-semibold text-gray-300">"{collectionName}"</span> from any
          snippet’s action menu.
        </p>
      </div>
    </div>
  );
}

function NoResults({ search, langFilter, onClear }) {
  return (
    <div className="cdp-fade-up flex flex-col items-center gap-4 py-20 text-center">
      <Search size={28} className="text-gray-600" />
      <div>
        <p className="text-sm font-semibold text-gray-300">No snippets match your filters</p>
        <p className="mt-1 text-xs text-gray-500">
          {search ? `Search: "${search}"` : "No matching keywords"}
          {langFilter !== "all" ? ` · Language: ${langFilter}` : ""}
        </p>
      </div>
      <button
        onClick={onClear}
        className="text-xs text-blue-400 underline underline-offset-2 transition-colors hover:text-blue-300"
      >
        Clear filters
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main CollectionDetailPage
───────────────────────────────────────── */
export default function CollectionDetailPage({
  collection,
  onBack,
  onSelectSnippet,
  onTagClick,
}) {
  ensureCSS();

  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [layout, setLayout] = useState("grid");
  const [sortBy, setSortBy] = useState("latest");
  const searchRef = useRef(null);

  const safe = collection && typeof collection === "object" ? collection : null;

  const rawSnippets = useMemo(() => {
    if (!Array.isArray(safe?.snippets)) return [];
    return safe.snippets
      .filter(Boolean)
      .map((s) => ({
        ...s,
        id: s?.id ?? s?._id,
      }));
  }, [safe]);

  const langCounts = useMemo(() => {
    const counts = {};
    rawSnippets.forEach((s) => {
      const l = getLanguage(s);
      counts[l] = (counts[l] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [rawSnippets]);

  const totalLikes = useMemo(
    () => rawSnippets.reduce((sum, x) => sum + getLikesCount(x), 0),
    [rawSnippets]
  );

  const totalViews = useMemo(
    () => rawSnippets.reduce((sum, x) => sum + getViewsCount(x), 0),
    [rawSnippets]
  );

  const avgLikes = useMemo(() => {
    if (!rawSnippets.length) return 0;
    return (totalLikes / rawSnippets.length).toFixed(1);
  }, [rawSnippets, totalLikes]);

  const avgViews = useMemo(() => {
    if (!rawSnippets.length) return 0;
    return (totalViews / rawSnippets.length).toFixed(1);
  }, [rawSnippets, totalViews]);

  const latestSnippetDate = useMemo(() => {
    if (!rawSnippets.length) return "—";
    const sorted = [...rawSnippets]
      .filter((s) => s?.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sorted[0]?.createdAt ? formatDate(sorted[0].createdAt) : "—";
  }, [rawSnippets]);

  const filtered = useMemo(() => {
    let list = [...rawSnippets];
    const q = normalize(search);

    if (q) {
      list = list.filter((s) => {
        const title = normalize(s?.title);
        const description = normalize(s?.description);
        const language = normalize(s?.language);
        const tags = Array.isArray(s?.tags)
          ? s.tags.map((t) => normalize(t)).join(" ")
          : "";

        return (
          title.includes(q) ||
          description.includes(q) ||
          language.includes(q) ||
          tags.includes(q)
        );
      });
    }

    if (langFilter !== "all") {
      list = list.filter((s) => getLanguage(s) === langFilter);
    }

    list.sort((a, b) => {
      if (sortBy === "latest") {
        return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0);
      }
      if (sortBy === "likes") {
        return getLikesCount(b) - getLikesCount(a);
      }
      if (sortBy === "views") {
        return getViewsCount(b) - getViewsCount(a);
      }
      if (sortBy === "title") {
        return String(a?.title || "").localeCompare(String(b?.title || ""));
      }
      return 0;
    });

    return list;
  }, [rawSnippets, search, langFilter, sortBy]);

  const visibleLikes = useMemo(
    () => filtered.reduce((sum, s) => sum + getLikesCount(s), 0),
    [filtered]
  );

  const visibleViews = useMemo(
    () => filtered.reduce((sum, s) => sum + getViewsCount(s), 0),
    [filtered]
  );

  const clearFilters = useCallback(() => {
    setSearch("");
    setLangFilter("all");
    setSortBy("latest");
  }, []);

  const handleBack = useCallback(() => onBack?.(), [onBack]);

  const isFiltered =
    search.trim() !== "" || langFilter !== "all" || sortBy !== "latest";

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const tag = document.activeElement?.tagName?.toLowerCase();
        const isTyping =
          tag === "input" ||
          tag === "textarea" ||
          document.activeElement?.isContentEditable;

        if (!isTyping) {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }

      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setSearch("");
        searchRef.current?.blur();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!safe) return null;

  return (
    <div className="cdp-fade-up min-h-full space-y-6 p-4 sm:p-6 lg:p-8">
      <button
        type="button"
        onClick={handleBack}
        className="group inline-flex items-center gap-2 rounded-xl border border-transparent px-3 py-1.5 text-sm font-semibold text-gray-400 transition-colors duration-200 hover:border-gray-700/50 hover:bg-gray-800/60 hover:text-white"
      >
        <ArrowLeft
          size={15}
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
        />
        Back to Collections
      </button>

      <div className="relative overflow-hidden rounded-[28px] border border-gray-700/40 bg-gradient-to-br from-[#12131f] to-[#0c0d17] shadow-[0_20px_55px_rgba(0,0,0,.25)]">
        <div className="relative h-[3px] w-full overflow-hidden bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-500 cdp-shimmer" />

        <div className="pointer-events-none absolute left-[18%] top-0 h-24 w-48 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[18%] top-0 h-24 w-48 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-blue-500/25 bg-blue-500/15 shadow-xl">
                <FolderOpen size={26} className="text-blue-400" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black leading-tight tracking-tight text-white sm:text-2xl">
                    {safe.name || "Untitled Collection"}
                  </h2>

                  {rawSnippets.length >= 8 && (
                    <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">
                      Active
                    </span>
                  )}
                </div>

                {safe.description ? (
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-400">
                    {safe.description}
                  </p>
                ) : (
                  <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-500">
                    This collection groups related snippets into one focused workspace.
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Layers size={11} className="text-blue-400" />
                    {rawSnippets.length} snippet{rawSnippets.length !== 1 ? "s" : ""}
                  </span>

                  {safe.owner && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <BookMarked size={11} className="text-violet-400" />
                      {safe.owner}
                    </span>
                  )}

                  {safe.createdAt && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={11} />
                      {formatDate(safe.createdAt)}
                    </span>
                  )}

                  {rawSnippets.length > 0 && (
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock3 size={11} className="text-amber-400" />
                      Latest snippet: {latestSnippetDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {rawSnippets.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:min-w-[220px]">
                <div className="rounded-2xl border border-gray-700/40 bg-gray-900/40 px-4 py-3 text-center">
                  <p className="text-xl font-black tabular-nums text-white">
                    {totalLikes.toLocaleString()}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">
                    Total Likes
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-700/40 bg-gray-900/40 px-4 py-3 text-center">
                  <p className="text-xl font-black tabular-nums text-white">
                    {totalViews.toLocaleString()}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">
                    Total Views
                  </p>
                </div>
              </div>
            )}
          </div>

          {rawSnippets.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={<FileCode2 size={18} />}
                label="Snippets"
                value={rawSnippets.length}
                sublabel="Items in this collection"
                tone="blue"
              />
              <SummaryCard
                icon={<Heart size={18} />}
                label="Likes"
                value={totalLikes.toLocaleString()}
                sublabel={`${avgLikes} avg per snippet`}
                tone="violet"
              />
              <SummaryCard
                icon={<Eye size={18} />}
                label="Views"
                value={totalViews.toLocaleString()}
                sublabel={`${avgViews} avg per snippet`}
                tone="emerald"
              />
              <SummaryCard
                icon={<BarChart3 size={18} />}
                label="Languages"
                value={langCounts.length}
                sublabel="Distinct languages used"
                tone="amber"
              />
            </div>
          )}

          {langCounts.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-700/40 pt-4">
              {langCounts.slice(0, 6).map(([lang, count]) => (
                <LangChip
                  key={lang}
                  lang={lang}
                  count={count}
                  active={langFilter === lang}
                  onClick={() => setLangFilter((prev) => (prev === lang ? "all" : lang))}
                />
              ))}
              {langCounts.length > 6 && (
                <span className="self-center text-xs text-gray-600">
                  +{langCounts.length - 6} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {rawSnippets.length > 0 && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-gray-700/40 bg-[#10131d]/80 p-3 backdrop-blur-sm">
            <div className="flex flex-col gap-3 lg:flex-row">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder='Search snippets… ("/" to focus)'
                  className="w-full rounded-xl border border-gray-700/50 bg-gray-900/70 py-2.5 pl-9 pr-10 text-sm text-gray-200 outline-none transition-all duration-200 placeholder:text-gray-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-white"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {langCounts.length > 1 && (
                  <button
                    onClick={() => setShowFilters((v) => !v)}
                    className={cls(
                      "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                      showFilters
                        ? "border-blue-500/40 bg-blue-500/15 text-blue-300"
                        : "border-gray-700/50 bg-gray-900/70 text-gray-400 hover:border-gray-600 hover:text-white"
                    )}
                  >
                    <SlidersHorizontal size={14} />
                    Filter
                    <ChevronDown
                      size={14}
                      className={cls(
                        "transition-transform duration-200",
                        showFilters && "rotate-180"
                      )}
                    />
                  </button>
                )}

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none rounded-xl border border-gray-700/50 bg-gray-900/70 px-4 py-2.5 pr-9 text-sm text-gray-300 outline-none transition-all duration-200 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15"
                  >
                    <option value="latest">Latest</option>
                    <option value="oldest">Oldest</option>
                    <option value="likes">Most liked</option>
                    <option value="views">Most viewed</option>
                    <option value="title">Title A-Z</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-gray-700/50 bg-gray-900/70 p-1">
                  {[
                    { id: "grid", icon: <LayoutGrid size={14} />, label: "Grid" },
                    { id: "list", icon: <LayoutList size={14} />, label: "List" },
                  ].map(({ id, icon, label }) => (
                    <button
                      key={id}
                      onClick={() => setLayout(id)}
                      className={cls(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-all duration-200",
                        layout === id
                          ? "border border-gray-700/60 bg-gray-800 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-300"
                      )}
                      title={`${label} view`}
                      aria-label={`${label} view`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {showFilters && langCounts.length > 1 && (
              <div className="cdp-fade-up mt-3 rounded-2xl border border-gray-700/40 bg-gray-900/50 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                  <Filter size={12} />
                  Language filter
                </div>

                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    icon={<Hash size={9} />}
                    active={langFilter === "all"}
                    onClick={() => setLangFilter("all")}
                  >
                    All ({rawSnippets.length})
                  </FilterChip>

                  {langCounts.map(([lang, count]) => (
                    <FilterChip
                      key={lang}
                      icon={<Hash size={9} />}
                      active={langFilter === lang}
                      onClick={() =>
                        setLangFilter((prev) => (prev === lang ? "all" : lang))
                      }
                    >
                      {lang} <span className="opacity-60">({count})</span>
                    </FilterChip>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isFiltered && (
        <div className="cdp-fade-up flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">
            <Search size={10} />
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {search && ` for "${search}"`}
            {langFilter !== "all" && ` in ${langFilter}`}
          </span>

          {sortBy !== "latest" && (
            <span className="flex items-center gap-1.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300">
              <Sparkles size={10} />
              Sorted by {sortBy}
            </span>
          )}

          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 underline underline-offset-2 transition-colors hover:text-white"
          >
            Clear filters
          </button>
        </div>
      )}

      {rawSnippets.length === 0 ? (
        <EmptySnippets collectionName={safe.name || "this collection"} />
      ) : filtered.length === 0 ? (
        <NoResults search={search} langFilter={langFilter} onClear={clearFilters} />
      ) : (
        <div className="cdp-fade-up">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-gray-700/40 bg-gray-800/60 px-3 py-1.5 text-xs font-semibold text-gray-400">
              <Layers size={11} className="text-blue-400" />
              {filtered.length} visible
            </span>

            <span className="flex items-center gap-1.5 rounded-full border border-gray-700/40 bg-gray-800/60 px-3 py-1.5 text-xs font-semibold text-gray-400">
              <Heart size={11} className="text-pink-400" />
              {visibleLikes} likes
            </span>

            <span className="flex items-center gap-1.5 rounded-full border border-gray-700/40 bg-gray-800/60 px-3 py-1.5 text-xs font-semibold text-gray-400">
              <Eye size={11} className="text-cyan-400" />
              {visibleViews} views
            </span>

            {!isFiltered && (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                <CheckCircle2 size={11} />
                All snippets shown
              </span>
            )}
          </div>

          <SnippetGrid
            key={layout}
            snippets={filtered}
            onSelect={onSelectSnippet}
            onTagClick={onTagClick}
            defaultLayout={layout}
          />
        </div>
      )}
    </div>
  );
}