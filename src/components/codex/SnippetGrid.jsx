import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import SnippetCard from "./SnippetCard";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  LayoutList,
  Code2,
  Sparkles,
  Search,
  FolderOpen,
  ArrowRight,
  Rows3,
  PanelTop,
  CheckCircle2,
  AlertTriangle,
  Database,
  ScanSearch,
  Boxes,
  Gauge,
  FileCode2,
} from "lucide-react";

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const PAGE_SIZES = [8, 12, 16, 24];
const MAX_PAGES = 7;
const PAGE_CHANGE_DELAY = 120;
const PAGE_SIZE_DELAY = 90;

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function buildPageRange(current, total) {
  if (total <= MAX_PAGES) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [1];
  const windowSize = MAX_PAGES - 2;
  const half = Math.floor(windowSize / 2);

  let start = Math.max(2, current - half);
  let end = Math.min(total - 1, start + windowSize - 1);

  if (end >= total) {
    end = total - 1;
    start = Math.max(2, end - windowSize + 1);
  }

  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);

  return pages;
}

function compactNumber(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return "0";
  return new Intl.NumberFormat("en", { notation: "compact" }).format(num);
}

function getId(s, index) {
  return s?.id ?? s?._id ?? s?.slug ?? `snippet-${index}`;
}

function hasPreviewCode(snippet) {
  if (!snippet || typeof snippet !== "object") return false;

  const directCandidates = [
    snippet?.code,
    snippet?.content,
    snippet?.snippet,
    snippet?.text,
    snippet?.source,
    snippet?.body,
    snippet?.raw,
    snippet?.value,
    snippet?.data?.code,
    snippet?.data?.content,
    snippet?.data?.snippet,
    snippet?.originalCode,
    snippet?.previewCode,
    snippet?.latestVersion?.code,
    snippet?.latestVersion?.content,
  ];

  for (const item of directCandidates) {
    if (typeof item === "string" && item.trim()) return true;
  }

  if (Array.isArray(snippet?.files)) {
    return snippet.files.some(
      (f) =>
        (typeof f === "string" && f.trim()) ||
        (typeof f?.content === "string" && f.content.trim()) ||
        (typeof f?.code === "string" && f.code.trim()) ||
        (typeof f?.text === "string" && f.text.trim())
    );
  }

  if (snippet?.files && typeof snippet.files === "object") {
    return Object.values(snippet.files).some(
      (f) =>
        (typeof f === "string" && f.trim()) ||
        (typeof f?.content === "string" && f.content.trim()) ||
        (typeof f?.code === "string" && f.code.trim()) ||
        (typeof f?.text === "string" && f.text.trim())
    );
  }

  return false;
}

function normalizeSnippets(list = []) {
  const safeList = Array.isArray(list) ? list : [];
  return safeList
    .filter(Boolean)
    .map((s, index) => ({
      ...s,
      id: getId(s, index),
      _hasPreviewCode: hasPreviewCode(s),
    }));
}

function clampPage(page, totalPages) {
  const p = Number(page);
  if (!Number.isFinite(p)) return 1;
  return Math.min(Math.max(1, p), Math.max(1, totalPages));
}

/* ─────────────────────────────────────────
   Small UI
───────────────────────────────────────── */
function ToolbarChip({ icon, children, accent = "text-slate-400" }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/40 bg-slate-900/65 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 backdrop-blur-sm">
      <span className={accent}>{icon}</span>
      {children}
    </span>
  );
}

function SectionCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-[24px] border border-slate-700/40 bg-gradient-to-b from-slate-900/80 to-slate-950/70 shadow-[0_10px_30px_rgba(0,0,0,0.16)] ${className}`}
    >
      {children}
    </div>
  );
}

function ControlBtn({ active, onClick, children, title, ariaLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 ${
        active
          ? "border border-slate-700/60 bg-slate-800 text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-800/70 hover:text-slate-300"
      }`}
    >
      {children}
    </button>
  );
}

function PageBtn({ page, current, onClick }) {
  const isEllipsis = page === "...";
  const isActive = page === current;

  if (isEllipsis) {
    return (
      <span className="flex h-9 w-9 select-none items-center justify-center text-sm text-slate-500">
        ···
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(page)}
      className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 ${
        isActive
          ? "scale-[1.04] bg-blue-500 text-white shadow-lg shadow-blue-500/20"
          : "border border-slate-700/40 bg-slate-800/60 text-slate-400 hover:border-slate-600/60 hover:bg-slate-700/80 hover:text-white"
      }`}
      aria-label={`Go to page ${page}`}
      aria-current={isActive ? "page" : undefined}
    >
      {page}
    </button>
  );
}

function NavIconBtn({ onClick, disabled, ariaLabel, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/40 bg-slate-800/60 text-slate-400 transition-all duration-200 hover:border-slate-600 hover:bg-slate-700/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────
   Skeleton card
───────────────────────────────────────── */
function SkeletonCard({ layout = "grid" }) {
  if (layout === "list") {
    return (
      <div className="animate-pulse overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-900/60 p-4">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-700/70" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded-lg bg-slate-700/60" />
            <div className="h-3 w-2/3 rounded bg-slate-800/60" />
          </div>
          <div className="h-5 w-16 rounded-full bg-slate-700/40" />
          <div className="h-8 w-24 rounded-xl bg-slate-800/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse overflow-hidden rounded-[22px] border border-slate-700/40 bg-slate-900/60">
      <div className="h-1 w-full bg-slate-700/60" />
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-1 items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-800/70" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded-lg bg-slate-700/60" />
              <div className="h-3 w-1/2 rounded bg-slate-800/60" />
            </div>
          </div>
          <div className="h-5 w-16 rounded-full bg-slate-700/40" />
        </div>

        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-slate-800/60" />
          <div className="h-3 w-4/5 rounded bg-slate-800/60" />
        </div>

        <div className="space-y-2 rounded-2xl border border-slate-700/30 bg-slate-800/55 p-3">
          {[80, 64, 92, 58, 74].map((w, i) => (
            <div
              key={i}
              className="h-2.5 rounded bg-slate-700/60"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="h-5 w-14 rounded-full bg-slate-800/60" />
          <div className="h-5 w-16 rounded-full bg-slate-800/60" />
          <div className="h-5 w-12 rounded-full bg-slate-800/60" />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-xl border border-slate-700/30 bg-slate-800/50"
            />
          ))}
        </div>

        <div className="flex justify-between pt-2">
          <div className="flex gap-2">
            <div className="h-8 w-14 rounded-full bg-slate-800/60" />
            <div className="h-8 w-14 rounded-full bg-slate-800/60" />
            <div className="h-8 w-14 rounded-full bg-slate-800/60" />
          </div>
          <div className="h-3 w-20 rounded bg-slate-800/60" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Empty state
───────────────────────────────────────── */
function EmptyState({
  title = "No snippets found",
  message = "Try a different search, tag, or filter.",
}) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-4 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700/40 bg-slate-900/70 shadow-lg shadow-black/20">
        <FolderOpen size={28} className="text-slate-500" />
      </span>

      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-200">{title}</p>
        <p className="text-sm text-slate-500">{message}</p>
      </div>

      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700/40 bg-slate-900/60 px-3 py-2 text-xs text-slate-400">
        <Search size={14} />
        Try broader keywords or remove one filter
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main
───────────────────────────────────────── */
export default function SnippetGrid({
  snippets = [],
  onSelect,
  onTagClick,
  loading = false,
  defaultLayout = "grid",
  defaultSize = 8,
  title = "Snippets",
  subtitle = "Browse, inspect, and open reusable code.",
  layout: controlledLayout,
  pageSize: controlledPageSize,
  currentPage: controlledCurrentPage,
  onLayoutChange,
  onPageChange,
  onPageSizeChange,
  emptyTitle = "No snippets found",
  emptyMessage = "Try a different search, tag, or filter.",
}) {
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(
    PAGE_SIZES.includes(defaultSize) ? defaultSize : 8
  );
  const [internalLayout, setInternalLayout] = useState(
    defaultLayout === "list" ? "list" : "grid"
  );
  const [animating, setAnimating] = useState(false);
  const [jumpPage, setJumpPage] = useState("1");

  const gridRef = useRef(null);
  const animationTimerRef = useRef(null);

  const normalizedSnippets = useMemo(() => normalizeSnippets(snippets), [snippets]);

  const layout =
    controlledLayout === "list" || controlledLayout === "grid"
      ? controlledLayout
      : internalLayout;

  const pageSize = PAGE_SIZES.includes(controlledPageSize)
    ? controlledPageSize
    : internalPageSize;

  const totalItems = normalizedSnippets.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const currentPageRaw =
    typeof controlledCurrentPage === "number" ? controlledCurrentPage : internalPage;
  const currentPage = clampPage(currentPageRaw, totalPages);

  useEffect(() => {
    if (defaultLayout === "list" || defaultLayout === "grid") {
      setInternalLayout(defaultLayout);
    }
  }, [defaultLayout]);

  useEffect(() => {
    if (PAGE_SIZES.includes(defaultSize)) {
      setInternalPageSize(defaultSize);
    }
  }, [defaultSize]);

  useEffect(() => {
    if (typeof controlledCurrentPage !== "number") {
      setInternalPage(1);
    }
  }, [snippets, controlledCurrentPage]);

  useEffect(() => {
    if (typeof controlledCurrentPage !== "number") {
      setInternalPage((p) => clampPage(p, totalPages));
    }
  }, [totalPages, controlledCurrentPage]);

  useEffect(() => {
    setJumpPage(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        window.clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const currentSnippets = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return normalizedSnippets.slice(startIndex, startIndex + pageSize);
  }, [normalizedSnippets, currentPage, pageSize]);

  const previewCountCurrentPage = useMemo(() => {
    return currentSnippets.filter((s) => s?._hasPreviewCode).length;
  }, [currentSnippets]);

  const previewCountAll = useMemo(() => {
    return normalizedSnippets.filter((s) => s?._hasPreviewCode).length;
  }, [normalizedSnippets]);

  const safelyAnimateThen = useCallback((callback, delay) => {
    if (animationTimerRef.current) {
      window.clearTimeout(animationTimerRef.current);
    }

    setAnimating(true);

    animationTimerRef.current = window.setTimeout(() => {
      callback?.();
      setAnimating(false);
      animationTimerRef.current = null;
    }, delay);
  }, []);

  const scrollGridIntoView = useCallback(() => {
    if (gridRef.current) {
      gridRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handlePageChange = useCallback(
    (page) => {
      const next = clampPage(page, totalPages);
      if (next === currentPage) return;

      safelyAnimateThen(() => {
        if (typeof controlledCurrentPage !== "number") {
          setInternalPage(next);
        }
        onPageChange?.(next);
        scrollGridIntoView();
      }, PAGE_CHANGE_DELAY);
    },
    [
      totalPages,
      currentPage,
      controlledCurrentPage,
      onPageChange,
      safelyAnimateThen,
      scrollGridIntoView,
    ]
  );

  const handlePageSize = useCallback(
    (size) => {
      if (!PAGE_SIZES.includes(size) || size === pageSize) return;

      safelyAnimateThen(() => {
        if (!PAGE_SIZES.includes(controlledPageSize)) {
          setInternalPageSize(size);
        }
        if (typeof controlledCurrentPage !== "number") {
          setInternalPage(1);
        }
        setJumpPage("1");
        onPageSizeChange?.(size);
        onPageChange?.(1);
      }, PAGE_SIZE_DELAY);
    },
    [
      pageSize,
      controlledPageSize,
      controlledCurrentPage,
      onPageSizeChange,
      onPageChange,
      safelyAnimateThen,
    ]
  );

  const handleLayoutChange = useCallback(
    (nextLayout) => {
      const safeLayout = nextLayout === "list" ? "list" : "grid";
      if (!(controlledLayout === "grid" || controlledLayout === "list")) {
        setInternalLayout(safeLayout);
      }
      onLayoutChange?.(safeLayout);
    },
    [controlledLayout, onLayoutChange]
  );

  const commitJump = useCallback(() => {
    const val = parseInt(jumpPage, 10);
    if (Number.isNaN(val)) {
      setJumpPage(String(currentPage));
      return;
    }
    handlePageChange(val);
  }, [jumpPage, currentPage, handlePageChange]);

  const pageRange = useMemo(
    () => buildPageRange(currentPage, totalPages),
    [currentPage, totalPages]
  );

  const gridClass =
    layout === "grid"
      ? "grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-stretch"
      : "grid grid-cols-1 gap-4";

  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div ref={gridRef} className="w-full space-y-5">
      {(totalItems > 0 || loading) && (
        <SectionCard className="relative overflow-hidden p-4 sm:p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.08),transparent_24%)]" />

          <div className="relative flex flex-col gap-5">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300">
                  <Sparkles size={13} />
                  Discover
                </div>

                <div>
                  <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
                  <p className="text-sm text-slate-400">{subtitle}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                {loading ? (
                  <>
                    <div className="h-11 animate-pulse rounded-2xl bg-slate-800/70" />
                    <div className="h-11 animate-pulse rounded-2xl bg-slate-800/70" />
                    <div className="h-11 animate-pulse rounded-2xl bg-slate-800/70" />
                    <div className="h-11 animate-pulse rounded-2xl bg-slate-800/70" />
                    <div className="h-11 animate-pulse rounded-2xl bg-slate-800/70" />
                  </>
                ) : (
                  <>
                    <ToolbarChip icon={<Code2 size={13} />} accent="text-blue-300">
                      {compactNumber(totalItems)} total
                    </ToolbarChip>
                    <ToolbarChip icon={<Rows3 size={13} />} accent="text-purple-300">
                      {pageSize}/page
                    </ToolbarChip>
                    <ToolbarChip
                      icon={layout === "grid" ? <LayoutGrid size={13} /> : <LayoutList size={13} />}
                      accent="text-emerald-300"
                    >
                      {layout === "grid" ? "Grid view" : "List view"}
                    </ToolbarChip>
                    <ToolbarChip icon={<PanelTop size={13} />} accent="text-cyan-300">
                      Page {currentPage}
                    </ToolbarChip>
                    <ToolbarChip icon={<Database size={13} />} accent="text-amber-300">
                      Preview {previewCountCurrentPage}/{currentSnippets.length || 0}
                    </ToolbarChip>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="flex flex-wrap items-center gap-2">
                {loading ? (
                  <div className="h-4 w-40 animate-pulse rounded-lg bg-slate-800/70" />
                ) : (
                  <>
                    <p className="text-sm text-slate-400">
                      Showing{" "}
                      <span className="tabular-nums font-semibold text-white">
                        {start}–{end}
                      </span>{" "}
                      of{" "}
                      <span className="tabular-nums font-semibold text-white">
                        {totalItems}
                      </span>{" "}
                      snippet{totalItems !== 1 ? "s" : ""}
                    </p>

                    {totalItems > 0 && currentSnippets.length === totalItems && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300">
                        <CheckCircle2 size={12} />
                        All visible
                      </span>
                    )}

                    {totalItems > 0 && previewCountAll < totalItems && (
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-300">
                        <AlertTriangle size={12} />
                        Some items have no preview data
                      </span>
                    )}
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                <div className="flex items-center gap-1 rounded-xl border border-slate-700/40 bg-slate-900/70 p-1">
                  {PAGE_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handlePageSize(size)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                        pageSize === size
                          ? "border border-slate-700/60 bg-slate-800 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                      aria-label={`Show ${size} snippets per page`}
                      aria-pressed={pageSize === size}
                    >
                      {size}
                    </button>
                  ))}
                </div>

                <div className="hidden h-6 w-px bg-slate-700/60 sm:block" />

                <div
                  className="flex items-center gap-1 rounded-xl border border-slate-700/40 bg-slate-900/70 p-1"
                  role="group"
                  aria-label="Snippet layout"
                >
                  <ControlBtn
                    active={layout === "grid"}
                    onClick={() => handleLayoutChange("grid")}
                    title="Grid view"
                    ariaLabel="Switch to grid view"
                  >
                    <LayoutGrid size={15} />
                  </ControlBtn>

                  <ControlBtn
                    active={layout === "list"}
                    onClick={() => handleLayoutChange("list")}
                    title="List view"
                    ariaLabel="Switch to list view"
                  >
                    <LayoutList size={15} />
                  </ControlBtn>
                </div>
              </div>
            </div>

            {!loading && totalItems > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-700/30 bg-slate-900/55 px-3 py-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    <Boxes size={12} />
                    Dataset
                  </div>
                  <div className="text-sm font-bold text-slate-100">
                    {compactNumber(totalItems)} snippets
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-700/30 bg-slate-900/55 px-3 py-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    <FileCode2 size={12} />
                    Previewable
                  </div>
                  <div className="text-sm font-bold text-slate-100">
                    {compactNumber(previewCountAll)}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-700/30 bg-slate-900/55 px-3 py-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    <Gauge size={12} />
                    Page status
                  </div>
                  <div className="text-sm font-bold text-slate-100">
                    {currentPage}/{totalPages}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-700/30 bg-slate-900/55 px-3 py-3">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    <ScanSearch size={12} />
                    Current view
                  </div>
                  <div className="text-sm font-bold text-slate-100">
                    {layout === "grid" ? "Visual grid" : "Compact list"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      <div
        className={`${gridClass} transition-all duration-150 ${
          animating ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {loading ? (
          Array.from({ length: pageSize }).map((_, i) => (
            <SkeletonCard key={i} layout={layout} />
          ))
        ) : currentSnippets.length === 0 ? (
          <EmptyState title={emptyTitle} message={emptyMessage} />
        ) : (
          currentSnippets.map((s) => (
            <div key={s.id} className="min-w-0">
              <SnippetCard
                snippet={s}
                onSelect={onSelect}
                onTagClick={onTagClick}
                layout={layout}
              />
            </div>
          ))
        )}
      </div>

      {!loading && totalPages > 1 && (
        <SectionCard className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="order-2 xl:order-1">
              <p className="tabular-nums text-xs text-slate-500">
                Page <span className="font-semibold text-slate-300">{currentPage}</span> of{" "}
                <span className="font-semibold text-slate-300">{totalPages}</span>
              </p>
            </div>

            <nav className="order-1 xl:order-2" aria-label="Pagination">
              <div className="flex flex-wrap items-center gap-1.5">
                <NavIconBtn
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  ariaLabel="Go to first page"
                >
                  <ChevronsLeft size={15} />
                </NavIconBtn>

                <NavIconBtn
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  ariaLabel="Go to previous page"
                >
                  <ChevronLeft size={15} />
                </NavIconBtn>

                <div className="flex items-center gap-1">
                  {pageRange.map((page, i) => (
                    <PageBtn
                      key={`${page}-${i}`}
                      page={page}
                      current={currentPage}
                      onClick={handlePageChange}
                    />
                  ))}
                </div>

                <NavIconBtn
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  ariaLabel="Go to next page"
                >
                  <ChevronRight size={15} />
                </NavIconBtn>

                <NavIconBtn
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  ariaLabel="Go to last page"
                >
                  <ChevronsRight size={15} />
                </NavIconBtn>
              </div>
            </nav>

            {totalPages > 7 && (
              <div className="order-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">Jump to</span>

                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitJump();
                  }}
                  onBlur={commitJump}
                  className="w-16 rounded-xl border border-slate-700/40 bg-slate-800/60 px-2 py-2 text-center text-sm tabular-nums text-white outline-none transition-all [appearance:textfield] focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  aria-label={`Jump to page, between 1 and ${totalPages}`}
                />

                <button
                  type="button"
                  onClick={commitJump}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/40 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 transition-all hover:bg-slate-700/80 hover:text-white"
                  aria-label="Go to entered page"
                >
                  Go
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}