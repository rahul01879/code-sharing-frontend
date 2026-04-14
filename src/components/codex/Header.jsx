import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  Home,
  PlusSquare,
  FileText,
  User,
  LogOut,
  Shield,
  Menu,
  X,
  Search,
  Folder,
  Compass,
  Sparkles,
  Bell,
  Github,
  Zap,
  Code2,
  Hash,
  Loader2,
  Filter,
  ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────────────
   Utils
───────────────────────────────────────── */
const PAGE = {
  HOME: "home",
  EXPLORE: "explore",
  ADD: "add",
  MY_SNIPPETS: "my-snippets",
  COLLECTIONS: "collections",
  PROFILE: "profile",
  SEARCH: "search",
};

const getId = (s) => s?.id ?? s?._id ?? s?.slug ?? s?.title ?? null;
const normalize = (v) => String(v ?? "").trim();
const normalizeLower = (v) => normalize(v).toLowerCase();

function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`Unable to read ${key} from localStorage:`, err);
    return null;
  }
}

function dedupeSnippets(items = []) {
  return Array.from(
    new Map(
      (Array.isArray(items) ? items : [])
        .filter(Boolean)
        .map((s) => [getId(s), s])
    ).values()
  );
}

function matchSnippetQuery(snippet, query) {
  const q = normalizeLower(query);
  if (!q) return true;

  const title = normalizeLower(snippet?.title);
  const language = normalizeLower(snippet?.language);
  const description = normalizeLower(snippet?.description);
  const tags = Array.isArray(snippet?.tags)
    ? snippet.tags.map((t) => normalizeLower(t)).join(" ")
    : "";

  return (
    title.includes(q) ||
    language.includes(q) ||
    description.includes(q) ||
    tags.includes(q)
  );
}

function normalizeSnippet(snippet) {
  if (!snippet || typeof snippet !== "object") return null;
  const id = getId(snippet);
  if (!id) return null;

  return {
    ...snippet,
    id,
    _id: snippet?._id || id,
    title:
      typeof snippet?.title === "string" && snippet.title.trim()
        ? snippet.title.trim()
        : "Untitled",
    description:
      typeof snippet?.description === "string" ? snippet.description : "",
    language:
      typeof snippet?.language === "string" && snippet.language.trim()
        ? snippet.language.trim()
        : "code",
    tags: Array.isArray(snippet?.tags)
      ? snippet.tags.filter(Boolean)
      : typeof snippet?.tags === "string"
      ? snippet.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
  };
}

function normalizeSearchPayload({
  query = "",
  filters = [],
  results = [],
} = {}) {
  return {
    mode: "advanced",
    query: normalize(query),
    filters: Array.from(
      new Set((filters || []).map(normalizeLower).filter(Boolean))
    ),
    results: Array.isArray(results)
      ? dedupeSnippets(results.map(normalizeSnippet).filter(Boolean))
      : [],
  };
}

function shallowEqualArray(a = [], b = []) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function useDebouncedCallback(cb, delay) {
  const cbRef = useRef(cb);
  const timerRef = useRef(null);

  useEffect(() => {
    cbRef.current = cb;
  }, [cb]);

  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const run = useCallback(
    (...args) => {
      cancel();
      timerRef.current = setTimeout(() => {
        cbRef.current?.(...args);
      }, delay);
    },
    [cancel, delay]
  );

  useEffect(() => cancel, [cancel]);

  return useMemo(() => ({ run, cancel }), [run, cancel]);
}

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */
function Logo({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go to home"
      className="group relative flex select-none items-center gap-2"
    >
      <span className="absolute -inset-2 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-md opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-purple-600 shadow-lg shadow-blue-500/25 transition-all duration-300 group-hover:scale-105 group-hover:shadow-blue-500/40">
        <Code2 size={17} className="text-white" />
      </span>
      <span className="relative text-xl font-black tracking-tight">
        <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
          CODE
        </span>
        <span className="text-white">X</span>
      </span>
    </button>
  );
}

function NavPill({ item, active, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(item.id)}
      className={`group relative flex items-center gap-1.5 overflow-hidden rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-300 ${
        active ? "text-white shadow-lg" : "text-gray-400 hover:text-white"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {active && (
        <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/85 to-purple-600/85" />
      )}

      {!active && (
        <span className="absolute inset-0 rounded-xl bg-white/0 transition-all duration-300 group-hover:bg-white/[0.06]" />
      )}

      {active && (
        <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-blue-300 shadow-[0_0_6px_2px_rgba(147,197,253,0.6)]" />
      )}

      <span
        className={`relative transition-transform duration-300 ${
          active ? "scale-110" : "group-hover:scale-110"
        }`}
      >
        {item.icon}
      </span>
      <span className="relative hidden lg:inline">{item.label}</span>
    </button>
  );
}

function SearchBar({
  value,
  onChange,
  onEnter,
  onClear,
  inputRef,
  suggestions = [],
  onSelectSuggestion,
  loadingSuggestions = false,
  className = "",
  activeFilters = [],
  onRemoveFilter,
  placeholder = 'Search snippets… ("/" to focus)',
}) {
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();
  const inputId = useId();

  const hasSuggestions = suggestions.length > 0;
  const showSuggestions =
    focused && value.trim().length > 0 && (loadingSuggestions || hasSuggestions);

  useEffect(() => {
    setActiveIndex(-1);
  }, [value, suggestions]);

  const commitSelection = useCallback(
    (index) => {
      const item = suggestions[index];
      if (!item) return;
      onSelectSuggestion?.(item);
      setActiveIndex(-1);
    },
    [onSelectSuggestion, suggestions]
  );

  return (
    <div className={`relative ${className}`}>
      <div
        className={`rounded-2xl border px-3 py-2 transition-all duration-300 ${
          focused
            ? "border-blue-500/60 bg-gray-800/90 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
            : "border-gray-700/60 bg-gray-800/50 hover:border-gray-600"
        }`}
      >
        <div className="flex items-center gap-2">
          <Search
            size={14}
            className={`flex-shrink-0 transition-colors duration-300 ${
              focused ? "text-blue-400" : "text-gray-500"
            }`}
          />

          <input
            id={inputId}
            ref={inputRef}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded={showSuggestions}
            aria-controls={showSuggestions ? listboxId : undefined}
            aria-activedescendant={
              showSuggestions && activeIndex >= 0
                ? `${listboxId}-option-${activeIndex}`
                : undefined
            }
            placeholder={placeholder}
            autoComplete="off"
            className="min-w-0 w-44 flex-1 bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-500 lg:w-64"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                if (!showSuggestions || suggestions.length === 0) return;
                setActiveIndex((prev) =>
                  prev < suggestions.length - 1 ? prev + 1 : 0
                );
              }

              if (e.key === "ArrowUp") {
                e.preventDefault();
                if (!showSuggestions || suggestions.length === 0) return;
                setActiveIndex((prev) =>
                  prev > 0 ? prev - 1 : suggestions.length - 1
                );
              }

              if (e.key === "Enter") {
                if (showSuggestions && activeIndex >= 0 && suggestions[activeIndex]) {
                  e.preventDefault();
                  commitSelection(activeIndex);
                  return;
                }
                onEnter?.(e.currentTarget.value);
              }

              if (e.key === "Escape") {
                e.preventDefault();
                setActiveIndex(-1);
                e.currentTarget.blur();
              }
            }}
          />

          {loadingSuggestions && (
            <Loader2 size={14} className="animate-spin text-blue-400" />
          )}

          {!!value && !loadingSuggestions && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onClear}
              className="flex-shrink-0 text-gray-500 transition-colors hover:text-red-400"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-white/5 pt-2">
            {activeFilters.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-300"
              >
                <Hash size={9} />
                {f}
                {onRemoveFilter && (
                  <button
                    type="button"
                    onClick={() => onRemoveFilter(f)}
                    className="text-blue-300/70 transition-colors hover:text-red-400"
                    aria-label={`Remove ${f} filter`}
                  >
                    <X size={10} />
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {showSuggestions && (
        <div
          id={listboxId}
          role="listbox"
          aria-labelledby={inputId}
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-700/60 bg-gray-900/95 shadow-2xl shadow-black/40 backdrop-blur-xl animate-fade-in-down"
        >
          {loadingSuggestions && suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">Loading suggestions…</div>
          ) : (
            suggestions.map((s, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={getId(s) ?? i}
                  id={`${listboxId}-option-${i}`}
                  role="option"
                  aria-selected={isActive}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelectSuggestion?.(s);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-gray-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Code2 size={13} className="flex-shrink-0 text-blue-400" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{s.title}</div>
                    {s.description ? (
                      <div className="truncate text-xs text-gray-500">
                        {s.description}
                      </div>
                    ) : null}
                  </div>
                  {s.language && (
                    <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-500">
                      {s.language}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({ lang, active, color, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onClick(lang)}
      disabled={disabled}
      aria-pressed={active}
      className={`relative flex-shrink-0 overflow-hidden rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 ${
        active
          ? `scale-105 border-transparent bg-gradient-to-r ${color} text-white shadow-md`
          : "border-gray-700/70 bg-gray-800/60 text-gray-400 hover:scale-105 hover:border-gray-500 hover:text-gray-200"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <span className="flex items-center gap-1.5">
        <Hash size={9} />
        {lang}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────
   Main Header Component
───────────────────────────────────────── */
export default function Header({
  current,
  onNavigate,
  onLogout,
  fetchSnippetsByTag,
  fetchExploreSnippets,
  fetchAutocomplete,
  notificationCount = 0,
  searchValue: controlledSearchValue = "",
  activeSearchFilters: controlledActiveFilters = [],
  currentUser = null,
  sandboxMode = false,
  adminAuth = false,
}) {
  const storedIsAdmin = safeStorageGet("isAdmin") === "true";
  const storedUsername = safeStorageGet("username") || "";
  const storedGithubAvatar = safeStorageGet("githubAvatar") || "";
  const storedGithubUsername = safeStorageGet("githubUsername") || "";

  const isAdmin = Boolean(adminAuth || storedIsAdmin);
  const username =
    currentUser?.username || currentUser?.name || storedUsername || "";
  const githubAvatar =
    currentUser?.avatar || currentUser?.githubAvatar || storedGithubAvatar || "";
  const githubUsername =
    currentUser?.githubUsername || storedGithubUsername || "";

  const [menuOpen, setMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState(normalize(controlledSearchValue));
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeFilters, setActiveFilters] = useState(
    Array.from(
      new Set((controlledActiveFilters || []).map(normalizeLower).filter(Boolean))
    )
  );
  const [filterLoading, setFilterLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const autoReqIdRef = useRef(0);
  const filterReqIdRef = useRef(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const nextValue = normalize(controlledSearchValue);
    setSearch((prev) => (prev === nextValue ? prev : nextValue));
  }, [controlledSearchValue]);

  useEffect(() => {
    const nextFilters = Array.from(
      new Set((controlledActiveFilters || []).map(normalizeLower).filter(Boolean))
    );
    setActiveFilters((prev) => (shallowEqualArray(prev, nextFilters) ? prev : nextFilters));
  }, [controlledActiveFilters]);

  const navItems = useMemo(
    () => [
      { id: PAGE.HOME, label: "Home", icon: <Home size={15} /> },
      { id: PAGE.ADD, label: "New", icon: <PlusSquare size={15} /> },
      { id: PAGE.MY_SNIPPETS, label: "Mine", icon: <FileText size={15} /> },
      { id: PAGE.COLLECTIONS, label: "Collections", icon: <Folder size={15} /> },
      { id: PAGE.EXPLORE, label: "Explore", icon: <Compass size={15} /> },
      { id: PAGE.PROFILE, label: "Profile", icon: <User size={15} /> },
    ],
    []
  );

  const filterMeta = useMemo(
    () => [
      { lang: "javascript", color: "from-yellow-500 to-amber-500" },
      { lang: "typescript", color: "from-blue-500 to-cyan-500" },
      { lang: "python", color: "from-green-500 to-teal-500" },
      { lang: "java", color: "from-orange-500 to-red-500" },
      { lang: "go", color: "from-cyan-500 to-blue-500" },
      { lang: "rust", color: "from-orange-600 to-amber-600" },
      { lang: "php", color: "from-indigo-500 to-violet-500" },
      { lang: "cpp", color: "from-pink-500 to-rose-500" },
      { lang: "ruby", color: "from-red-500 to-pink-500" },
      { lang: "swift", color: "from-orange-400 to-yellow-500" },
    ],
    []
  );

  const closeOverlays = useCallback(() => {
    setMenuOpen(false);
    setShowSearch(false);
  }, []);

  const resetAsyncUi = useCallback(() => {
    autoReqIdRef.current += 1;
    filterReqIdRef.current += 1;
    setSuggestions([]);
    setLoadingSuggestions(false);
    setFilterLoading(false);
  }, []);

  const pushSearchState = useCallback(
    async ({ query = "", filters = [] } = {}) => {
      const trimmedQuery = normalize(query);
      const cleanedFilters = Array.from(
        new Set((filters || []).map(normalizeLower).filter(Boolean))
      );

      if (!trimmedQuery && cleanedFilters.length === 0) {
        onNavigate?.(PAGE.HOME);
        return;
      }

      if (cleanedFilters.length === 0) {
        onNavigate?.(PAGE.SEARCH, trimmedQuery);
        return;
      }

      if (!fetchSnippetsByTag) {
        onNavigate?.(
          PAGE.SEARCH,
          normalizeSearchPayload({
            query: trimmedQuery,
            filters: cleanedFilters,
            results: [],
          })
        );
        return;
      }

      const reqId = ++filterReqIdRef.current;
      setFilterLoading(true);

      try {
        const settled = await Promise.allSettled(
          cleanedFilters.map((f) => fetchSnippetsByTag(f))
        );

        if (reqId !== filterReqIdRef.current) return;

        const merged = settled.flatMap((r) =>
          r.status === "fulfilled" && Array.isArray(r.value) ? r.value : []
        );

        let unique = dedupeSnippets(merged.map(normalizeSnippet).filter(Boolean));

        if (trimmedQuery) {
          unique = unique.filter((s) => matchSnippetQuery(s, trimmedQuery));
        }

        onNavigate?.(
          PAGE.SEARCH,
          normalizeSearchPayload({
            query: trimmedQuery,
            filters: cleanedFilters,
            results: unique,
          })
        );
      } catch {
        if (reqId !== filterReqIdRef.current) return;

        onNavigate?.(
          PAGE.SEARCH,
          normalizeSearchPayload({
            query: trimmedQuery,
            filters: cleanedFilters,
            results: [],
          })
        );
      } finally {
        if (reqId === filterReqIdRef.current) {
          setFilterLoading(false);
        }
      }
    },
    [fetchSnippetsByTag, onNavigate]
  );

  const debouncedSearch = useDebouncedCallback((q, filters) => {
    pushSearchState({ query: q, filters });
  }, 320);

  const debouncedAutocomplete = useDebouncedCallback(async (q) => {
    const query = normalize(q);
    const reqId = ++autoReqIdRef.current;

    if (query.length < 2 || !fetchAutocomplete) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);

    try {
      const results = await fetchAutocomplete(query);
      if (reqId !== autoReqIdRef.current) return;
      setSuggestions(
        Array.isArray(results)
          ? results.map(normalizeSnippet).filter(Boolean).slice(0, 7)
          : []
      );
    } catch {
      if (reqId === autoReqIdRef.current) {
        setSuggestions([]);
      }
    } finally {
      if (reqId === autoReqIdRef.current) {
        setLoadingSuggestions(false);
      }
    }
  }, 220);

  const setSearchAndRun = useCallback(
    (value) => {
      setSearch(value);
      debouncedSearch.run(value, activeFilters);
      debouncedAutocomplete.run(value);
    },
    [debouncedSearch, debouncedAutocomplete, activeFilters]
  );

  const runSearchNow = useCallback(
    (value) => {
      const q = normalize(value);
      debouncedSearch.cancel();
      debouncedAutocomplete.cancel();
      setSuggestions([]);
      setLoadingSuggestions(false);
      pushSearchState({ query: q, filters: activeFilters });
    },
    [debouncedSearch, debouncedAutocomplete, pushSearchState, activeFilters]
  );

  const clearSearch = useCallback(() => {
    debouncedSearch.cancel();
    debouncedAutocomplete.cancel();
    autoReqIdRef.current += 1;
    setSearch("");
    setSuggestions([]);
    setLoadingSuggestions(false);
    pushSearchState({ query: "", filters: activeFilters });
  }, [debouncedSearch, debouncedAutocomplete, pushSearchState, activeFilters]);

  const handleSelectSuggestion = useCallback(
    (s) => {
      const title = normalize(s?.title);
      setSearch(title);
      debouncedSearch.cancel();
      debouncedAutocomplete.cancel();
      setSuggestions([]);
      setLoadingSuggestions(false);
      pushSearchState({ query: title, filters: activeFilters });
    },
    [debouncedSearch, debouncedAutocomplete, pushSearchState, activeFilters]
  );

  const handleNavigate = useCallback(
    async (id, payload) => {
      debouncedSearch.cancel();
      debouncedAutocomplete.cancel();
      resetAsyncUi();

      if (id !== PAGE.SEARCH) {
        setSearch("");
        setActiveFilters([]);
      }

      closeOverlays();

      if (id === PAGE.EXPLORE) {
        try {
          await fetchExploreSnippets?.();
        } catch (err) {
          console.error("Failed to preload explore:", err);
        }
      }

      onNavigate?.(id, payload);
    },
    [
      closeOverlays,
      debouncedAutocomplete,
      debouncedSearch,
      fetchExploreSnippets,
      onNavigate,
      resetAsyncUi,
    ]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeOverlays();

      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const tag = document.activeElement?.tagName?.toLowerCase();
        const isTyping =
          tag === "input" ||
          tag === "textarea" ||
          document.activeElement?.isContentEditable;

        if (!isTyping) {
          e.preventDefault();
          setShowSearch(true);
          setTimeout(() => {
            desktopSearchRef.current?.focus();
            mobileSearchRef.current?.focus();
          }, 0);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeOverlays]);

  const toggleFilter = useCallback(
    (lang) => {
      const normalizedLang = normalizeLower(lang);
      setActiveFilters((prev) => {
        const updated = prev.includes(normalizedLang)
          ? prev.filter((f) => f !== normalizedLang)
          : [...prev, normalizedLang];

        debouncedSearch.cancel();
        debouncedAutocomplete.cancel();
        setSuggestions([]);
        setLoadingSuggestions(false);
        pushSearchState({ query: search, filters: updated });

        return updated;
      });
    },
    [pushSearchState, search, debouncedSearch, debouncedAutocomplete]
  );

  const clearAllFilters = useCallback(() => {
    filterReqIdRef.current += 1;
    setFilterLoading(false);
    setActiveFilters([]);
    pushSearchState({ query: search, filters: [] });
  }, [pushSearchState, search]);

  const handleLogoutClick = useCallback(() => {
    closeOverlays();
    onLogout?.();
  }, [closeOverlays, onLogout]);

  const showQuickFilters = current === PAGE.HOME || current === PAGE.SEARCH;
  const activeFilterCount = activeFilters.length;

  return (
    <>
      <style>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.18s ease both; }
        .animate-slide-down { animation: slide-down 0.22s ease both; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>

      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "border-b border-gray-800/80 bg-gray-950/95 shadow-xl shadow-black/30 backdrop-blur-xl"
            : "border-b border-gray-800/40 bg-gray-950/80 backdrop-blur-md"
        }`}
      >
        <div className="absolute left-0 right-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Logo onClick={() => handleNavigate(PAGE.HOME)} />

          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Primary">
            {navItems.map((item) => (
              <NavPill
                key={item.id}
                item={item}
                active={current === item.id}
                onClick={handleNavigate}
              />
            ))}

            {isAdmin && !sandboxMode && (
              <Link
                to="/admin/dashboard"
                className="group relative flex items-center gap-1.5 overflow-hidden rounded-xl px-3.5 py-2 text-sm font-medium text-amber-400 transition-all duration-300 hover:text-amber-300"
              >
                <span className="absolute inset-0 rounded-xl bg-amber-500/0 transition-all duration-300 group-hover:bg-amber-500/10" />
                <Shield size={15} className="relative" />
                <span className="relative hidden lg:inline">Admin</span>
              </Link>
            )}
          </nav>

          <div className="flex-1" />

          <div className="hidden md:block">
            <SearchBar
              value={search}
              onChange={setSearchAndRun}
              onEnter={runSearchNow}
              onClear={clearSearch}
              inputRef={desktopSearchRef}
              suggestions={suggestions}
              onSelectSuggestion={handleSelectSuggestion}
              loadingSuggestions={loadingSuggestions}
              activeFilters={activeFilters}
              onRemoveFilter={toggleFilter}
            />
          </div>

          <div className="ml-2 flex items-center gap-2">
            {notificationCount > 0 && (
              <button
                type="button"
                className="relative rounded-xl p-2 text-gray-400 transition-all duration-300 hover:bg-white/[0.06] hover:text-white"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-500 text-[9px] font-bold text-white shadow-lg">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              </button>
            )}

            {githubUsername && (
              <span
                title={`GitHub: @${githubUsername}`}
                className="hidden items-center gap-1.5 rounded-full border border-gray-700/60 bg-gray-800/70 px-2.5 py-1 text-xs text-gray-400 lg:flex"
              >
                <Github size={12} className="text-white" />
                <span className="max-w-[80px] truncate text-gray-300">
                  {githubUsername}
                </span>
              </span>
            )}

            {username && (
              <button
                type="button"
                onClick={() => handleNavigate(PAGE.PROFILE)}
                className="hidden items-center gap-2 rounded-xl px-2.5 py-1.5 transition-all duration-300 hover:bg-white/[0.06] lg:flex"
                title="View profile"
              >
                {githubAvatar ? (
                  <img
                    src={githubAvatar}
                    alt={username}
                    className="h-6 w-6 rounded-full ring-1 ring-gray-600"
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                    {username[0]?.toUpperCase()}
                  </span>
                )}
                <span className="max-w-[100px] truncate text-sm text-gray-300">
                  {username}
                </span>
              </button>
            )}

            {sandboxMode && (
              <span className="hidden items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300 lg:flex">
                <Zap size={11} />
                Sandbox
              </span>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={handleLogoutClick}
                className="hidden items-center gap-1.5 rounded-xl border border-transparent px-3.5 py-2 text-sm font-medium text-gray-400 transition-all duration-300 hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400 md:flex"
                title="Logout"
              >
                <LogOut size={15} />
                <span className="hidden lg:inline">Logout</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowSearch((v) => !v)}
              className={`rounded-xl p-2 transition-all duration-300 md:hidden ${
                showSearch
                  ? "bg-blue-500/10 text-blue-400"
                  : "text-gray-400 hover:bg-white/[0.06] hover:text-white"
              }`}
              aria-label="Toggle search"
              aria-expanded={showSearch}
            >
              <Search size={20} />
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-xl p-2 text-gray-400 transition-all duration-300 hover:bg-white/[0.06] hover:text-white md:hidden"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X size={22} className="text-red-400" />
              ) : (
                <Menu size={22} />
              )}
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="animate-fade-in-down px-4 pb-3 md:hidden">
            <SearchBar
              value={search}
              onChange={setSearchAndRun}
              onEnter={(v) => {
                runSearchNow(v);
                setShowSearch(false);
              }}
              onClear={clearSearch}
              inputRef={mobileSearchRef}
              suggestions={suggestions}
              onSelectSuggestion={(s) => {
                handleSelectSuggestion(s);
                setShowSearch(false);
              }}
              loadingSuggestions={loadingSuggestions}
              activeFilters={activeFilters}
              onRemoveFilter={toggleFilter}
              className="w-full"
            />
          </div>
        )}

        {menuOpen && (
          <div className="animate-slide-down border-t border-gray-800/60 bg-gray-950/98 backdrop-blur-xl md:hidden">
            {username && (
              <div className="flex items-center gap-3 border-b border-gray-800/60 px-5 py-4">
                {githubAvatar ? (
                  <img
                    src={githubAvatar}
                    alt={username}
                    className="h-9 w-9 rounded-full ring-2 ring-gray-700"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white">
                    {username[0]?.toUpperCase()}
                  </span>
                )}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{username}</p>
                  {githubUsername && (
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <Github size={10} /> @{githubUsername}
                    </p>
                  )}
                </div>

                {isAdmin && !sandboxMode && (
                  <span className="ml-auto flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                    <Zap size={9} /> Admin
                  </span>
                )}
              </div>
            )}

            <div className="py-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`w-full border-l-2 px-5 py-3 text-left text-sm font-medium transition-all duration-200 ${
                    current === item.id
                      ? "border-blue-500 bg-gradient-to-r from-blue-600/20 to-purple-600/10 text-white"
                      : "border-transparent text-gray-400 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className={current === item.id ? "text-blue-400" : ""}>
                      {item.icon}
                    </span>
                    {item.label}
                    {current === item.id && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />
                    )}
                  </span>
                </button>
              ))}

              {isAdmin && !sandboxMode && (
                <Link
                  to="/admin/dashboard"
                  onClick={closeOverlays}
                  className="flex w-full items-center gap-3 border-l-2 border-transparent px-5 py-3 text-sm font-medium text-amber-400 transition-all hover:bg-white/[0.04]"
                >
                  <Shield size={15} /> Admin Dashboard
                  <ChevronRight size={14} className="ml-auto" />
                </Link>
              )}
            </div>

            {onLogout && (
              <div className="border-t border-gray-800/60 p-3">
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400 transition-all duration-300 hover:border-red-500/40 hover:bg-red-500/10"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        )}

        {showQuickFilters && (
          <div className="border-t border-gray-800/50 bg-gray-950/60 backdrop-blur-sm">
            <div className="scrollbar-hide flex items-center gap-2.5 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8">
              <span className="flex flex-shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <Sparkles size={10} className="text-blue-400" />
                Quick filters
              </span>

              <span className="h-4 w-px flex-shrink-0 bg-gray-700/60" />

              {filterMeta.map(({ lang, color }) => (
                <FilterChip
                  key={lang}
                  lang={lang}
                  active={activeFilters.includes(lang)}
                  color={color}
                  onClick={toggleFilter}
                  disabled={filterLoading}
                />
              ))}

              {filterLoading && (
                <span className="flex flex-shrink-0 items-center gap-1.5 text-xs text-blue-400">
                  <Loader2 size={12} className="animate-spin" />
                  Filtering…
                </span>
              )}

              {activeFilterCount > 0 && !filterLoading && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="ml-auto flex flex-shrink-0 items-center gap-1 rounded-full border border-red-500/20 bg-red-500/5 px-2.5 py-1 text-xs text-red-400/80 transition-colors hover:text-red-400"
                >
                  <Filter size={10} />
                  <X size={11} />
                  Clear all
                </button>
              )}
            </div>

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 px-4 pb-2.5 sm:px-6 lg:px-8">
                {activeFilters.map((f) => (
                  <span
                    key={f}
                    className="flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-300"
                  >
                    <Hash size={9} />
                    {f}
                    <button
                      type="button"
                      onClick={() => toggleFilter(f)}
                      disabled={filterLoading}
                      className="ml-0.5 text-blue-400/60 transition-colors hover:text-red-400 disabled:opacity-50"
                      aria-label={`Remove ${f} filter`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}