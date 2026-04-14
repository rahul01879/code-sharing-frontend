import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  Edit2,
  FolderOpen,
  Trash2,
  Search,
  Hash,
  Calendar,
  Layers,
  FolderX,
  Sparkles,
  BookMarked,
  ArrowUpRight,
  X,
  Grid2X2,
  CheckCircle2,
} from "lucide-react";
import { formatDate } from "../../utils/codexUtils";

/* ─────────────────────────────────────────
   One-time CSS
───────────────────────────────────────── */
const CSS = `
  @keyframes col-shimmer {
    from { transform: translateX(-100%); }
    to   { transform: translateX(250%); }
  }
  @keyframes col-fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes col-scale-out {
    from { opacity: 1; transform: scale(1); }
    to   { opacity: 0; transform: scale(.96); }
  }

  .col-shimmer::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.06), transparent);
    animation: col-shimmer 2.5s ease-in-out infinite;
  }

  .col-fade-up {
    animation: col-fade-up .22s ease both;
  }

  .col-delete-out {
    animation: col-scale-out .20s ease forwards;
  }
`;

let _injected = false;
function ensureCSS() {
  if (_injected || typeof document === "undefined") return;
  const s = document.createElement("style");
  s.textContent = CSS;
  document.head.appendChild(s);
  _injected = true;
}

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const getId = (c) => c?.id ?? c?._id ?? c?.name;

function normalize(v) {
  return String(v ?? "").trim().toLowerCase();
}

function getSnippetsCount(collection) {
  return Array.isArray(collection?.snippets)
    ? collection.snippets.length
    : Number(collection?.snippetsCount ?? 0);
}

function matchesCollection(collection, query) {
  const q = normalize(query);
  if (!q) return true;

  const name = normalize(collection?.name);
  const description = normalize(collection?.description);
  const owner = normalize(collection?.owner);
  const snippetsCount = String(getSnippetsCount(collection));
  const createdAt = normalize(formatDate(collection?.createdAt));

  return (
    name.includes(q) ||
    description.includes(q) ||
    owner.includes(q) ||
    snippetsCount.includes(q) ||
    createdAt.includes(q)
  );
}

/* ─────────────────────────────────────────
   Palette
───────────────────────────────────────── */
const PALETTES = [
  {
    bar: "from-blue-500 to-cyan-500",
    glow: "59,130,246",
    iconClass: "text-blue-400",
    hoverTitleClass: "group-hover:text-blue-400",
    iconBg: "bg-blue-500/15 border-blue-500/25",
  },
  {
    bar: "from-violet-500 to-purple-600",
    glow: "139,92,246",
    iconClass: "text-violet-400",
    hoverTitleClass: "group-hover:text-violet-400",
    iconBg: "bg-violet-500/15 border-violet-500/25",
  },
  {
    bar: "from-emerald-400 to-teal-500",
    glow: "52,211,153",
    iconClass: "text-emerald-400",
    hoverTitleClass: "group-hover:text-emerald-400",
    iconBg: "bg-emerald-500/15 border-emerald-500/25",
  },
  {
    bar: "from-pink-500 to-rose-500",
    glow: "244,114,182",
    iconClass: "text-pink-400",
    hoverTitleClass: "group-hover:text-pink-400",
    iconBg: "bg-pink-500/15 border-pink-500/25",
  },
  {
    bar: "from-amber-400 to-orange-500",
    glow: "251,191,36",
    iconClass: "text-amber-400",
    hoverTitleClass: "group-hover:text-amber-400",
    iconBg: "bg-amber-500/15 border-amber-500/25",
  },
  {
    bar: "from-sky-400 to-blue-600",
    glow: "56,189,248",
    iconClass: "text-sky-400",
    hoverTitleClass: "group-hover:text-sky-400",
    iconBg: "bg-sky-500/15 border-sky-500/25",
  },
];

const getPalette = (index) => PALETTES[index % PALETTES.length];

/* ─────────────────────────────────────────
   Collection Card
───────────────────────────────────────── */
function CollectionCard({ collection, index, onSelect, onEdit, onDelete }) {
  const cardRef = useRef(null);
  const [mx, setMx] = useState(50);
  const [my, setMy] = useState(50);
  const [hot, setHot] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const id = getId(collection);
  const palette = getPalette(index);
  const snippetsCount = getSnippetsCount(collection);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    setMx(((e.clientX - r.left) / r.width) * 100);
    setMy(((e.clientY - r.top) / r.height) * 100);
  }, []);

  const handleSelect = useCallback(() => {
    if (!id) return;
    onSelect?.(id);
  }, [id, onSelect]);

  const stopCardEvent = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDelete = useCallback(
    (e) => {
      stopCardEvent(e);
      if (!id || deleting) return;
      setDeleting(true);
      window.setTimeout(() => {
        onDelete?.(id);
      }, 200);
    },
    [id, deleting, onDelete, stopCardEvent]
  );

  const handleEdit = useCallback(
    (e) => {
      stopCardEvent(e);
      onEdit?.(collection);
    },
    [collection, onEdit, stopCardEvent]
  );

  return (
    <div
      ref={cardRef}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect ? handleSelect : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSelect();
              }
            }
          : undefined
      }
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      aria-label={`Open collection ${collection?.name || "Untitled"}`}
      className={`
        group relative overflow-hidden rounded-2xl border border-gray-700/50
        bg-gradient-to-b from-[#13141f] to-[#0c0d18]
        transition-all duration-300 ease-out
        ${onSelect ? "cursor-pointer hover:-translate-y-1.5" : "cursor-default"}
        ${deleting ? "col-delete-out pointer-events-none" : "col-fade-up"}
        focus:outline-none focus:ring-2 focus:ring-blue-500/30
      `}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: hot ? 1 : 0,
          background: `radial-gradient(280px circle at ${mx}% ${my}%, rgba(${palette.glow}, .1), transparent 65%)`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-500"
        style={{
          opacity: hot ? 1 : 0,
          boxShadow: `0 0 32px rgba(${palette.glow}, .18), 0 0 64px rgba(${palette.glow}, .07)`,
        }}
      />

      <div className={`relative h-[3px] w-full overflow-hidden bg-gradient-to-r ${palette.bar} col-shimmer`} />

      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl transition-opacity duration-700"
        style={{
          background: `rgba(${palette.glow}, .25)`,
          opacity: hot ? 1 : 0,
        }}
      />

      {(onEdit || onDelete) && (
        <div className="absolute right-3.5 top-3.5 z-20 flex translate-y-1 gap-1.5 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
          {onEdit && (
            <button
              type="button"
              onMouseDown={stopCardEvent}
              onClick={handleEdit}
              title="Edit collection"
              aria-label="Edit collection"
              className="flex h-7 w-7 items-center justify-center rounded-xl border border-gray-700/60 bg-gray-800/90 text-yellow-400 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-yellow-500/40 hover:bg-gray-700/90 hover:text-yellow-300"
            >
              <Edit2 size={12} />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onMouseDown={stopCardEvent}
              onClick={handleDelete}
              disabled={!id || deleting}
              title="Delete collection"
              aria-label="Delete collection"
              className="flex h-7 w-7 items-center justify-center rounded-xl border border-gray-700/60 bg-gray-800/90 text-red-400 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-red-500/40 hover:bg-gray-700/90 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-4 p-5">
        <div className="flex items-start gap-3.5">
          <span
            className={`
              flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border
              ${palette.iconBg}
              transition-all duration-300 shadow-sm group-hover:scale-110
            `}
          >
            <FolderOpen size={20} className={palette.iconClass} />
          </span>

          <div className="min-w-0 flex-1 pt-0.5">
            <h4
              className={`
                line-clamp-1 text-[15px] font-bold leading-snug text-gray-100 transition-colors duration-300
                ${palette.hoverTitleClass}
              `}
            >
              {collection?.name || "Untitled Collection"}
            </h4>

            {collection?.description ? (
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500">
                {collection.description}
              </p>
            ) : (
              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-600">
                No description added yet.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-gray-700/40 bg-gray-800/60 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-gray-400">
            <Layers size={10} className={palette.iconClass} />
            {snippetsCount} snippet{snippetsCount !== 1 ? "s" : ""}
          </span>

          {!!collection?.owner && (
            <span className="flex items-center gap-1.5 rounded-full border border-gray-700/40 bg-gray-800/60 px-2.5 py-1 text-[11px] font-medium text-gray-500">
              <BookMarked size={9} />
              {collection.owner}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-700/30 pt-0.5">
          <span className="flex items-center gap-1.5 text-[10px] text-gray-600">
            <Calendar size={9} />
            {formatDate(collection?.createdAt)}
          </span>

          {onSelect && (
            <span
              className={`
                flex translate-x-1 items-center gap-1 text-[10px] font-semibold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100
                ${palette.iconClass}
              `}
            >
              Open <ArrowUpRight size={10} />
            </span>
          )}
        </div>
      </div>

      <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${palette.bar} opacity-0 transition-opacity duration-500 group-hover:opacity-70`} />
    </div>
  );
}

/* ─────────────────────────────────────────
   Empty states
───────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-5 py-20 text-center">
      <div className="relative">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl border border-gray-700/50 bg-gray-800/60 shadow-xl">
          <FolderX size={32} className="text-gray-500" />
        </span>
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/20">
          <Sparkles size={12} className="text-blue-400" />
        </span>
      </div>

      <div className="max-w-xs space-y-1.5">
        <h3 className="text-base font-bold text-gray-200">No collections yet</h3>
        <p className="text-sm leading-relaxed text-gray-500">
          Start organizing your snippets by adding them to collections from any snippet modal.
        </p>
      </div>
    </div>
  );
}

function NoResultsState({ search, onClear }) {
  return (
    <div className="col-span-full flex flex-col items-center gap-4 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl border border-gray-700/50 bg-gray-800/50">
        <Search size={24} className="text-gray-500" />
      </span>

      <div className="space-y-1">
        <p className="text-sm text-gray-400">
          No collections match <span className="font-semibold text-gray-200">"{search}"</span>
        </p>
        <p className="text-xs text-gray-600">
          Try searching by collection name, description, owner, snippet count, or date.
        </p>
      </div>

      <button
        onClick={onClear}
        className="rounded-xl border border-blue-500/25 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500/15 hover:text-blue-300"
      >
        Clear search
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main CollectionsPage
───────────────────────────────────────── */
export default function CollectionsPage({
  collections,
  onSelectCollection,
  onEditCollection,
  onDeleteCollection,
}) {
  ensureCSS();

  const [search, setSearch] = useState("");
  const searchRef = useRef(null);

  const safeCollections = useMemo(
    () => (Array.isArray(collections) ? collections : []),
    [collections]
  );

  const filtered = useMemo(() => {
    const q = normalize(search);
    if (!q) return safeCollections;
    return safeCollections.filter((c) => matchesCollection(c, q));
  }, [safeCollections, search]);

  const totalSnippets = useMemo(
    () =>
      safeCollections.reduce((sum, c) => {
        return sum + getSnippetsCount(c);
      }, 0),
    [safeCollections]
  );

  const collectionsWithDescriptions = useMemo(
    () => safeCollections.filter((c) => normalize(c?.description)).length,
    [safeCollections]
  );

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

  return (
    <div className="min-h-full space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/15">
              <FolderOpen size={16} className="text-blue-400" />
            </span>
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              My Collections
            </h2>
          </div>

          <p className="ml-10 text-sm text-gray-500">
            {safeCollections.length > 0
              ? `${safeCollections.length} collection${safeCollections.length !== 1 ? "s" : ""} · ${totalSnippets} total snippets`
              : "Organize your snippets into curated groups"}
          </p>
        </div>

        {safeCollections.length > 0 && (
          <div className="relative sm:w-72">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              ref={searchRef}
              type="text"
              placeholder='Search collections… ("/" to focus)'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-700/50 bg-gray-900/70 py-2.5 pl-9 pr-10 text-sm text-gray-200 outline-none transition-all duration-200 placeholder:text-gray-600 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/15"
            />
            {!!search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {safeCollections.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-gray-700/40 bg-gray-800/60 px-3 py-1.5 text-xs font-semibold text-gray-400">
            <Hash size={11} className="text-blue-400" />
            {safeCollections.length} Collections
          </span>

          <span className="flex items-center gap-1.5 rounded-full border border-gray-700/40 bg-gray-800/60 px-3 py-1.5 text-xs font-semibold text-gray-400">
            <Layers size={11} className="text-emerald-400" />
            {totalSnippets} Snippets
          </span>

          <span className="flex items-center gap-1.5 rounded-full border border-gray-700/40 bg-gray-800/60 px-3 py-1.5 text-xs font-semibold text-gray-400">
            <Grid2X2 size={11} className="text-violet-400" />
            {collectionsWithDescriptions} Described
          </span>

          {!!search && (
            <span className="flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400">
              <Search size={11} />
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
            </span>
          )}

          {!search && filtered.length === safeCollections.length && safeCollections.length > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle2 size={11} />
              All visible
            </span>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {safeCollections.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <NoResultsState search={search} onClear={() => setSearch("")} />
        ) : (
          filtered.map((c, i) => (
            <CollectionCard
              key={getId(c) ?? `${c?.name}-${i}`}
              collection={c}
              index={i}
              onSelect={onSelectCollection}
              onEdit={onEditCollection}
              onDelete={onDeleteCollection}
            />
          ))
        )}
      </div>
    </div>
  );
}