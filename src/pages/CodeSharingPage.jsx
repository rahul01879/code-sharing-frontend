import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import axios from "axios";
import {
  Sparkles,
  Code2,
  Globe2,
  FolderGit2,
  Layers3,
  Boxes,
  Search,
  Compass,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Filter,
  X,
} from "lucide-react";

import Header from "../components/codex/Header";
import SnippetGrid from "../components/codex/SnippetGrid";
import SnippetModal from "../components/codex/SnippetModal";
import AddSnippetForm from "../components/codex/AddSnippetForm";
import CollectionsPage from "../components/codex/CollectionsPage";
import CollectionDetailPage from "../components/codex/CollectionDetailPage";
import Profile from "../components/codex/Profile";
import Footer from "../components/codex/Footer";

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

const PAGE = {
  HOME: "home",
  EXPLORE: "explore",
  ADD: "add",
  MY_SNIPPETS: "my-snippets",
  COLLECTIONS: "collections",
  PROFILE: "profile",
  SEARCH: "search",
};

const getId = (obj) => obj?._id || obj?.id;

const safeStorageGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`Unable to read ${key} from localStorage:`, err);
    return null;
  }
};

const safeStorageRemove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`Unable to remove ${key} from localStorage:`, err);
  }
};

const normalizeSnippet = (s) => {
  if (!s || typeof s !== "object") return null;
  const id = getId(s);
  if (!id) return null;

  return {
    ...s,
    id,
    _id: s._id || id,
    tags: Array.isArray(s.tags)
      ? s.tags
      : typeof s.tags === "string"
      ? s.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    language: String(s?.language || "code").trim() || "code",
    title:
      typeof s?.title === "string" && s.title.trim()
        ? s.title.trim()
        : "Untitled",
    description: typeof s?.description === "string" ? s.description : "",
  };
};

const normalizeSnippets = (data) => {
  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.snippets)
    ? data.snippets
    : [];
  return arr.map(normalizeSnippet).filter(Boolean);
};

const normalizeCollection = (c) => {
  if (!c || typeof c !== "object") return null;
  const id = getId(c);
  if (!id) return null;

  const snippets = Array.isArray(c.snippets)
    ? c.snippets.map(normalizeSnippet).filter(Boolean)
    : c.snippets;

  return {
    ...c,
    id,
    _id: c._id || id,
    snippets,
  };
};

const normalizeExplore = (data) => {
  const trending = normalizeSnippets(data?.trending);
  const recent = normalizeSnippets(data?.recent);

  const byLanguageRaw =
    data?.byLanguage && typeof data.byLanguage === "object"
      ? data.byLanguage
      : {};

  const byLanguage = Object.fromEntries(
    Object.entries(byLanguageRaw).map(([lang, list]) => [
      lang,
      normalizeSnippets(list),
    ])
  );

  return { trending, recent, byLanguage };
};

function cls(...arr) {
  return arr.filter(Boolean).join(" ");
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
      timerRef.current = setTimeout(() => cbRef.current?.(...args), delay);
    },
    [delay, cancel]
  );

  useEffect(() => cancel, [cancel]);

  return useMemo(() => ({ run, cancel }), [run, cancel]);
}

function ShellMetric({ icon, label, value, tone = "blue" }) {
  const toneMap = {
    blue: "border-blue-500/15 bg-blue-500/10 text-blue-200/80",
    emerald: "border-emerald-500/15 bg-emerald-500/10 text-emerald-200/80",
    violet: "border-violet-500/15 bg-violet-500/10 text-violet-200/80",
    amber: "border-amber-500/15 bg-amber-500/10 text-amber-200/80",
  };

  return (
    <div className={cls("rounded-2xl border p-4", toneMap[tone] || toneMap.blue)}>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/20 text-white">
          {icon}
        </span>
        <div className="text-xs">{label}</div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function SectionShell({
  title,
  subtitle,
  accent = "blue",
  action,
  children,
  compact = false,
}) {
  const accentMap = {
    blue: {
      panel: "from-blue-500/20 via-cyan-500/10 to-transparent",
      text: "text-blue-300",
      dot: "bg-blue-400",
    },
    green: {
      panel: "from-emerald-500/20 via-green-500/10 to-transparent",
      text: "text-emerald-300",
      dot: "bg-emerald-400",
    },
    purple: {
      panel: "from-violet-500/20 via-fuchsia-500/10 to-transparent",
      text: "text-violet-300",
      dot: "bg-violet-400",
    },
    amber: {
      panel: "from-amber-500/20 via-yellow-500/10 to-transparent",
      text: "text-amber-300",
      dot: "bg-amber-400",
    },
    pink: {
      panel: "from-pink-500/20 via-rose-500/10 to-transparent",
      text: "text-pink-300",
      dot: "bg-pink-400",
    },
    slate: {
      panel: "from-slate-500/20 via-slate-400/10 to-transparent",
      text: "text-slate-200",
      dot: "bg-slate-300",
    },
  };

  const theme = accentMap[accent] || accentMap.blue;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      <div
        className={cls(
          "pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-r",
          theme.panel
        )}
      />
      <div className={cls("relative z-10", compact ? "p-4 sm:p-5 lg:p-6" : "p-5 sm:p-6 lg:p-7")}>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className={cls("h-2 w-2 rounded-full", theme.dot)} />
              <span className={cls("text-xs font-semibold uppercase tracking-[0.18em]", theme.text)}>
                Workspace section
              </span>
            </div>
            <h2 className={cls("text-2xl font-bold tracking-tight", theme.text)}>
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
                {subtitle}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function LoadingState({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.03] px-6 py-16 text-slate-400">
      <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500/70 border-t-transparent" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

function EmptyState({ title, subtitle, icon = <Boxes size={22} /> }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-slate-300 ring-1 ring-white/10">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
      {subtitle ? <p className="mt-2 max-w-xl text-sm text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-[24px] border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/15 bg-red-500/10 text-red-300">
        <AlertTriangle size={20} />
      </div>
      <p className="text-sm font-medium text-red-300">
        {message || "Something went wrong."}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      ) : null}
    </div>
  );
}

function PageHero({ stats, page, currentUser, sandboxMode }) {
  const pageLabelMap = {
    [PAGE.HOME]: "Community feed",
    [PAGE.EXPLORE]: "Explore workspace",
    [PAGE.ADD]: "Create snippet",
    [PAGE.MY_SNIPPETS]: "Personal library",
    [PAGE.COLLECTIONS]: "Collections center",
    [PAGE.PROFILE]: "Developer profile",
    [PAGE.SEARCH]: "Search results",
  };

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] px-5 py-8 shadow-[0_20px_100px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-7 sm:py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_24%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.14),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.4fr_.9fr] lg:items-end">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
              <Sparkles size={12} />
              Advanced Codex Workspace
            </div>

            {sandboxMode ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                <AlertTriangle size={12} />
                Sandbox mode
              </div>
            ) : null}
          </div>

          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            <CheckCircle2 size={12} className="text-emerald-300" />
            {pageLabelMap[page] || "Developer hub"}
          </div>

          <h1 className="max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            Welcome back{currentUser?.name ? `, ${currentUser.name}` : ""}. Build,
            discover, organize, and share snippets in one place.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Browse public snippets, manage personal code, fork useful ideas, organize
            collections, and explore language-specific examples with a smoother and
            more resilient workspace shell.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
          <ShellMetric icon={<Globe2 size={16} />} label="Public" value={stats.publicCount} tone="blue" />
          <ShellMetric icon={<Code2 size={16} />} label="Mine" value={stats.myCount} tone="emerald" />
          <ShellMetric icon={<FolderGit2 size={16} />} label="Collections" value={stats.collectionCount} tone="violet" />
          <ShellMetric icon={<Layers3 size={16} />} label="Languages" value={stats.languageCount} tone="amber" />
        </div>
      </div>
    </section>
  );
}

export default function CodeSharingPage({
  onLogout,
  currentUser = null,
  sandboxMode = false,
}) {
  const [page, setPage] = useState(PAGE.HOME);

  const [publicSnippets, setPublicSnippets] = useState([]);
  const [userSnippets, setUserSnippets] = useState([]);
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);

  const [bootLoading, setBootLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState([]);

  const [exploreData, setExploreData] = useState({
    trending: [],
    recent: [],
    byLanguage: {},
  });
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [exploreError, setExploreError] = useState("");

  const [actionBusy, setActionBusy] = useState({
    like: false,
    fork: false,
    sync: false,
    delete: false,
  });

  const searchReqIdRef = useRef(0);
  const exploreReqIdRef = useRef(0);

  const api = useMemo(() => {
    return axios.create({
      baseURL: API || undefined,
      timeout: 20000,
    });
  }, []);

  const authToken = useMemo(() => {
    if (sandboxMode) return null;
    return safeStorageGet("token");
  }, [sandboxMode]);

  useEffect(() => {
    if (!API) {
      console.error("Missing API base url. Put VITE_API_BASE_URL in frontend .env and restart Vite.");
    }
  }, []);

  const getAuthHeaders = useCallback(() => {
    if (sandboxMode) return null;
    return authToken ? { Authorization: `Bearer ${authToken}` } : null;
  }, [sandboxMode, authToken]);

  const clearAuthAndLogout = useCallback(() => {
    safeStorageRemove("token");
    safeStorageRemove("user");
    onLogout?.();
  }, [onLogout]);

  const mergeSnippetIntoList = useCallback((list, updated) => {
    const item = normalizeSnippet(updated);
    if (!item) return list;
    const id = getId(item);

    let found = false;
    const next = (list || []).map((s) => {
      if (getId(s) !== id) return s;
      found = true;
      return { ...s, ...item };
    });

    return found ? next : [item, ...next];
  }, []);

  const removeSnippetFromList = useCallback((list, id) => {
    const safeId = String(id || "").trim();
    return (list || []).filter((s) => getId(s) !== safeId);
  }, []);

  const updateSnippetEverywhere = useCallback(
    (updated) => {
      const u = normalizeSnippet(updated);
      if (!u) return;
      const uid = getId(u);

      setPublicSnippets((prev) => mergeSnippetIntoList(prev, u));
      setUserSnippets((prev) => mergeSnippetIntoList(prev, u));
      setSearchResults((prev) => mergeSnippetIntoList(prev, u));

      setExploreData((prev) => {
        const updateArr = (arr) =>
          (arr || []).map((s) => (getId(s) === uid ? { ...s, ...u } : s));

        const byLanguage = Object.fromEntries(
          Object.entries(prev.byLanguage || {}).map(([lang, list]) => [
            lang,
            updateArr(list),
          ])
        );

        return {
          ...prev,
          trending: updateArr(prev.trending),
          recent: updateArr(prev.recent),
          byLanguage,
        };
      });

      setSelectedSnippet((prev) => (getId(prev) === uid ? { ...prev, ...u } : prev));

      setSelectedCollection((prev) => {
        if (!prev?.snippets) return prev;
        return {
          ...prev,
          snippets: prev.snippets.map((s) => (getId(s) === uid ? { ...s, ...u } : s)),
        };
      });

      setCollections((prev) =>
        prev.map((c) =>
          Array.isArray(c?.snippets)
            ? {
                ...c,
                snippets: c.snippets.map((s) => (getId(s) === uid ? { ...s, ...u } : s)),
              }
            : c
        )
      );
    },
    [mergeSnippetIntoList]
  );

  const removeSnippetEverywhere = useCallback(
    (id) => {
      setPublicSnippets((prev) => removeSnippetFromList(prev, id));
      setUserSnippets((prev) => removeSnippetFromList(prev, id));
      setSearchResults((prev) => removeSnippetFromList(prev, id));

      setExploreData((prev) => {
        const byLanguage = Object.fromEntries(
          Object.entries(prev.byLanguage || {}).map(([lang, list]) => [
            lang,
            removeSnippetFromList(list, id),
          ])
        );

        return {
          ...prev,
          trending: removeSnippetFromList(prev.trending, id),
          recent: removeSnippetFromList(prev.recent, id),
          byLanguage,
        };
      });

      setSelectedSnippet((prev) =>
        getId(prev) === String(id || "").trim() ? null : prev
      );

      setSelectedCollection((prev) => {
        if (!prev?.snippets) return prev;
        return {
          ...prev,
          snippets: removeSnippetFromList(prev.snippets, id),
        };
      });

      setCollections((prev) =>
        prev.map((c) =>
          Array.isArray(c?.snippets)
            ? { ...c, snippets: removeSnippetFromList(c.snippets, id) }
            : c
        )
      );
    },
    [removeSnippetFromList]
  );

  const searchDebounced = useDebouncedCallback(async (q) => {
    const reqId = ++searchReqIdRef.current;
    const query = String(q || "").trim();

    if (!query) {
      setSearchLoading(false);
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await api.get("/api/snippets/search", { params: { q: query } });
      if (reqId !== searchReqIdRef.current) return;
      setSearchResults(normalizeSnippets(res.data));
    } catch (err) {
      if (reqId !== searchReqIdRef.current) return;
      console.error("search error:", err?.response?.status, err?.message, err);
      setSearchResults([]);
    } finally {
      if (reqId === searchReqIdRef.current) setSearchLoading(false);
    }
  }, 350);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (r) => r,
      (err) => {
        if (err?.response?.status === 401 && !sandboxMode) {
          clearAuthAndLogout();
        }
        return Promise.reject(err);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [api, clearAuthAndLogout, sandboxMode]);

  const fetchPublic = useCallback(async () => {
    try {
      const res = await api.get("/api/snippets/public");
      const normalized = normalizeSnippets(res.data);
      setPublicSnippets(normalized);
      return normalized;
    } catch (e) {
      console.error("fetch public error:", e?.response?.status, e?.message, e);
      setPublicSnippets([]);
      return [];
    }
  }, [api]);

  const fetchMine = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      setUserSnippets([]);
      return [];
    }

    try {
      const res = await api.get("/api/snippets/mine", { headers });
      const normalized = normalizeSnippets(res.data);
      setUserSnippets(normalized);
      return normalized;
    } catch (e) {
      console.error("fetch mine error:", e?.response?.status, e?.message, e);
      return [];
    }
  }, [api, getAuthHeaders]);

  const fetchCollections = useCallback(async () => {
    const headers = getAuthHeaders();
    if (!headers) {
      setCollections([]);
      return [];
    }

    try {
      const res = await api.get("/api/collections", { headers });
      const arr = Array.isArray(res.data) ? res.data : [];
      const normalized = arr.map(normalizeCollection).filter(Boolean);
      setCollections(normalized);
      return normalized;
    } catch (e) {
      console.error("fetch collections error:", e?.response?.status, e?.message, e);
      return [];
    }
  }, [api, getAuthHeaders]);

  const bootstrap = useCallback(async () => {
    if (!API) {
      setPageError("API base URL is missing. Add VITE_API_BASE_URL to your frontend .env file.");
      setBootLoading(false);
      return;
    }

    setBootLoading(true);
    setPageError("");

    try {
      await Promise.all([fetchPublic(), fetchMine(), fetchCollections()]);
    } catch (err) {
      console.error("bootstrap error:", err);
      setPageError("Failed to load initial data.");
    } finally {
      setBootLoading(false);
    }
  }, [fetchCollections, fetchMine, fetchPublic]);

  useEffect(() => {
    bootstrap();

    return () => {
      searchDebounced.cancel();
      searchReqIdRef.current++;
      exploreReqIdRef.current++;
    };
  }, [bootstrap, searchDebounced]);

  const fetchSnippetById = useCallback(
    async (id) => {
      const safeId = String(id || "").trim();
      if (!safeId) return;

      try {
        const res = await api.get(`/api/snippets/${encodeURIComponent(safeId)}`);
        setSelectedSnippet(normalizeSnippet(res.data));
      } catch (err) {
        console.error("fetch snippet error:", err?.response?.status, err?.message, err);
      }
    },
    [api]
  );

  const fetchAutocomplete = useCallback(
    async (q) => {
      const query = String(q || "").trim();
      if (query.length < 2) return [];

      try {
        const res = await api.get("/api/snippets/search", {
          params: { q: query },
        });
        return normalizeSnippets(res.data).slice(0, 7);
      } catch (err) {
        console.error("autocomplete error:", err?.response?.status, err?.message, err);
        return [];
      }
    },
    [api]
  );

  const handleAddSnippet = useCallback((snippet) => {
    const s = normalizeSnippet(snippet);
    if (!s) return;

    setUserSnippets((prev) => [s, ...prev]);
    if (s?.isPublic || s?.visibility === "public") {
      setPublicSnippets((prev) => [s, ...prev]);
    }
    setPage(PAGE.MY_SNIPPETS);
  }, []);

  const handleDeleteSnippet = useCallback(
    async (id) => {
      const safeId = String(id || "").trim();
      if (!safeId) return;
      if (!window.confirm("Delete this snippet?")) return;

      const headers = getAuthHeaders();
      if (!headers) return alert("Not logged in");

      setActionBusy((prev) => ({ ...prev, delete: true }));

      try {
        await api.delete(`/api/snippets/${encodeURIComponent(safeId)}`, { headers });
        removeSnippetEverywhere(safeId);
      } catch (err) {
        console.error("delete error:", err);
        alert(err?.response?.data?.error || "Error deleting snippet");
      } finally {
        setActionBusy((prev) => ({ ...prev, delete: false }));
      }
    },
    [api, getAuthHeaders, removeSnippetEverywhere]
  );

  const handleSnippetUpdate = useCallback(
    (updated) => {
      updateSnippetEverywhere(updated);
    },
    [updateSnippetEverywhere]
  );

  const handleLike = useCallback(
    async (id) => {
      const safeId = String(id || "").trim();
      if (!safeId) return;

      const headers = getAuthHeaders();
      if (!headers) return alert("Please log in to like snippets.");

      setActionBusy((prev) => ({ ...prev, like: true }));

      try {
        const res = await api.post(`/api/snippets/${encodeURIComponent(safeId)}/like`, {}, { headers });
        const msg = String(res?.data?.message || "");
        const isLikedByUser = /liked/i.test(msg) && !/unliked/i.test(msg);
        const likes = Array.isArray(res?.data?.likes) ? res.data.likes : [];
        updateSnippetEverywhere({ id: safeId, _id: safeId, likes, isLikedByUser });
      } catch (err) {
        console.error("like error:", err);
        alert(err?.response?.data?.error || "Failed to like");
      } finally {
        setActionBusy((prev) => ({ ...prev, like: false }));
      }
    },
    [api, getAuthHeaders, updateSnippetEverywhere]
  );

  const handleFork = useCallback(
    async (snippetId) => {
      const safeId = String(snippetId || "").trim();
      if (!safeId) return;

      const headers = getAuthHeaders();
      if (!headers) return alert("Please log in to fork snippets.");

      setActionBusy((prev) => ({ ...prev, fork: true }));

      try {
        const res = await api.post(`/api/snippets/${encodeURIComponent(safeId)}/fork`, {}, { headers });
        const forked = normalizeSnippet(res?.data?.snippet);
        if (forked) {
          setUserSnippets((prev) => [forked, ...prev]);
          alert(`✅ Forked "${forked?.title || "snippet"}"`);
        }
      } catch (err) {
        console.error("fork error:", err);
        alert(err?.response?.data?.error || "Error forking snippet");
      } finally {
        setActionBusy((prev) => ({ ...prev, fork: false }));
      }
    },
    [api, getAuthHeaders]
  );

  const handleSyncGithub = useCallback(
    async (snippetId) => {
      const safeId = String(snippetId || "").trim();
      if (!safeId) return;

      const headers = getAuthHeaders();
      if (!headers) return alert("You must be logged in to sync snippets.");

      setActionBusy((prev) => ({ ...prev, sync: true }));

      try {
        const res = await api.post(
          `/api/snippets/${encodeURIComponent(safeId)}/sync-github`,
          {},
          { headers }
        );
        alert(res?.data?.message || "✅ Synced to GitHub!");
      } catch (err) {
        console.error("GitHub sync error:", err);
        alert(err?.response?.data?.error || "Sync failed");
      } finally {
        setActionBusy((prev) => ({ ...prev, sync: false }));
      }
    },
    [api, getAuthHeaders]
  );

  const fetchSnippetsByTag = useCallback(
    async (tag) => {
      const safeTag = String(tag || "").trim();
      if (!safeTag) return [];

      try {
        const tagRes = await api.get(`/api/snippets/tag/${encodeURIComponent(safeTag)}`);
        const arr = normalizeSnippets(tagRes.data);
        if (arr.length) return arr;
      } catch {}

      try {
        const res = await api.get("/api/snippets/search", { params: { q: safeTag } });
        return normalizeSnippets(res.data);
      } catch (err) {
        console.error("fetchSnippetsByTag error:", err?.response?.status, err?.message, err);
        return [];
      }
    },
    [api]
  );

  const fetchExploreSnippets = useCallback(async () => {
    const reqId = ++exploreReqIdRef.current;

    try {
      setExploreError("");
      setLoadingExplore(true);

      const res = await api.get("/api/snippets/explore");
      const normalized = normalizeExplore(res.data);

      if (reqId !== exploreReqIdRef.current) return null;
      setExploreData(normalized);
      return normalized;
    } catch (err) {
      if (reqId !== exploreReqIdRef.current) return null;

      const msg = err?.response?.data?.error || err.message || "Failed to load explore data";
      setExploreError(msg);
      setExploreData({ trending: [], recent: [], byLanguage: {} });
      return null;
    } finally {
      if (reqId === exploreReqIdRef.current) setLoadingExplore(false);
    }
  }, [api]);

  const clearSearchState = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSearchFilters([]);
    setSearchLoading(false);
  }, []);

  const handleNavigate = useCallback(
    (targetPage, payload) => {
      setPage(targetPage);

      searchDebounced.cancel();
      searchReqIdRef.current++;

      if (targetPage === PAGE.EXPLORE) {
        clearSearchState();
        fetchExploreSnippets();
        return;
      }

      if (targetPage === PAGE.COLLECTIONS) {
        clearSearchState();
        setSelectedCollection(null);
        return;
      }

      if (
        targetPage === PAGE.HOME ||
        targetPage === PAGE.ADD ||
        targetPage === PAGE.MY_SNIPPETS ||
        targetPage === PAGE.PROFILE
      ) {
        clearSearchState();
        return;
      }

      if (targetPage === PAGE.SEARCH && Array.isArray(payload)) {
        setSearchQuery("");
        setSearchFilters([]);
        setSearchLoading(false);
        setSearchResults(payload.map(normalizeSnippet).filter(Boolean));
        return;
      }

      if (targetPage === PAGE.SEARCH && payload && typeof payload === "object") {
        const nextQuery = String(payload.query || "").trim();
        const nextFilters = Array.isArray(payload.filters)
          ? payload.filters.map((f) => String(f).trim()).filter(Boolean)
          : [];
        const nextResults = Array.isArray(payload.results) ? payload.results : [];

        setSearchQuery(nextQuery);
        setSearchFilters(nextFilters);
        setSearchLoading(false);
        setSearchResults(nextResults.map(normalizeSnippet).filter(Boolean));
        return;
      }

      if (targetPage !== PAGE.SEARCH) return;

      const q = String(payload || "");
      setSearchQuery(q);
      setSearchFilters([]);
      searchDebounced.run(q);
    },
    [fetchExploreSnippets, searchDebounced, clearSearchState]
  );

  const handleSelectCollection = useCallback(
    async (id) => {
      const headers = getAuthHeaders();
      if (!headers) return alert("Not logged in");

      const cid = String(id || "").trim();
      if (!cid) return;

      try {
        const res = await api.get(`/api/collections/${encodeURIComponent(cid)}`, { headers });
        setSelectedCollection(normalizeCollection(res.data));
      } catch (err) {
        console.error("select collection error:", err);
      }
    },
    [api, getAuthHeaders]
  );

  const handleEditCollection = useCallback(
    async (collection) => {
      const headers = getAuthHeaders();
      if (!headers) return alert("Not logged in");

      const cid = getId(collection);
      if (!cid) return;

      const name = window.prompt("Edit collection name:", collection?.name || "");
      if (!name) return;

      const description = window.prompt("Edit description:", collection?.description || "") ?? "";

      try {
        await api.put(`/api/collections/${encodeURIComponent(cid)}`, { name, description }, { headers });
        await fetchCollections();
      } catch (err) {
        console.error("edit collection error:", err);
      }
    },
    [api, getAuthHeaders, fetchCollections]
  );

  const handleDeleteCollection = useCallback(
    async (id) => {
      const headers = getAuthHeaders();
      if (!headers) return alert("Not logged in");

      const cid = String(id || "").trim();
      if (!cid) return;
      if (!window.confirm("Delete this collection?")) return;

      try {
        await api.delete(`/api/collections/${encodeURIComponent(cid)}`, { headers });
        await fetchCollections();
        setSelectedCollection(null);
      } catch (err) {
        console.error("delete collection error:", err);
      }
    },
    [api, getAuthHeaders, fetchCollections]
  );

  const handleTagClickGlobal = useCallback(
    (tag) => fetchSnippetsByTag(tag).then((arr) => handleNavigate(PAGE.SEARCH, arr)),
    [fetchSnippetsByTag, handleNavigate]
  );

  const snippetsToShow = useMemo(() => {
    if (page === PAGE.SEARCH) return searchResults;
    if (page === PAGE.MY_SNIPPETS) return userSnippets;
    return publicSnippets;
  }, [page, searchResults, userSnippets, publicSnippets]);

  const stats = useMemo(() => {
    const allVisible = Array.isArray(publicSnippets) ? publicSnippets : [];
    const allMine = Array.isArray(userSnippets) ? userSnippets : [];
    const languages = new Set(allVisible.map((s) => s?.language).filter(Boolean));

    return {
      publicCount: allVisible.length,
      myCount: allMine.length,
      collectionCount: collections.length,
      languageCount: languages.size,
    };
  }, [publicSnippets, userSnippets, collections]);

  const renderSnippetSection = (snippets, emptyTitle, emptySubtitle) => {
    if (!snippets.length) {
      return (
        <EmptyState
          title={emptyTitle}
          subtitle={emptySubtitle}
          icon={<Code2 size={22} />}
        />
      );
    }

    return (
      <SnippetGrid
        snippets={snippets}
        onSelect={fetchSnippetById}
        onTagClick={handleTagClickGlobal}
      />
    );
  };

  const searchSubtitle = useMemo(() => {
    if (searchQuery && searchFilters.length) {
      return `Showing matches for "${searchQuery}" with ${searchFilters.length} active filter${searchFilters.length > 1 ? "s" : ""}.`;
    }
    if (searchQuery) {
      return `Showing matches for "${searchQuery}".`;
    }
    if (searchFilters.length) {
      return `Showing filtered snippet results for ${searchFilters.join(", ")}.`;
    }
    return "Showing filtered snippet results.";
  }, [searchQuery, searchFilters]);

  if (bootLoading) {
    return (
      <div className="min-h-screen bg-[#060816] text-slate-200">
        <Header
          current={page}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          fetchSnippetsByTag={fetchSnippetsByTag}
          fetchExploreSnippets={fetchExploreSnippets}
          fetchAutocomplete={fetchAutocomplete}
          searchValue={searchQuery}
          activeSearchFilters={searchFilters}
          currentUser={currentUser}
          sandboxMode={sandboxMode}
        />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <LoadingState label="Preparing your code hub..." />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_22%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.10),transparent_18%),linear-gradient(180deg,#050816_0%,#090d1d_35%,#060816_100%)] text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.18]" />

      <Header
        current={page}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        fetchSnippetsByTag={fetchSnippetsByTag}
        fetchExploreSnippets={fetchExploreSnippets}
        fetchAutocomplete={fetchAutocomplete}
        searchValue={searchQuery}
        activeSearchFilters={searchFilters}
        currentUser={currentUser}
        sandboxMode={sandboxMode}
      />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {pageError ? (
          <ErrorState message={pageError} onRetry={bootstrap} />
        ) : (
          <div className="space-y-8">
            <PageHero
              stats={stats}
              page={page}
              currentUser={currentUser}
              sandboxMode={sandboxMode}
            />

            {page === PAGE.HOME && (
              <SectionShell
                title="Public snippets"
                subtitle="Discover the latest shared snippets from the community."
                accent="blue"
                action={
                  <button
                    onClick={() => handleNavigate(PAGE.EXPLORE)}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/15"
                  >
                    <Compass size={14} />
                    Explore more
                  </button>
                }
              >
                {renderSnippetSection(
                  publicSnippets,
                  "No public snippets yet",
                  "Once snippets are published publicly, they will appear here."
                )}
              </SectionShell>
            )}

            {page === PAGE.EXPLORE && (
              <div className="space-y-8">
                {loadingExplore ? (
                  <LoadingState label="Loading explore sections..." />
                ) : exploreError ? (
                  <ErrorState message={exploreError} onRetry={fetchExploreSnippets} />
                ) : (
                  <>
                    <SectionShell
                      title="Trending"
                      subtitle="The most active and engaging snippets right now."
                      accent="blue"
                    >
                      {renderSnippetSection(
                        exploreData.trending || [],
                        "No trending snippets",
                        "Trending content will show up here as engagement grows."
                      )}
                    </SectionShell>

                    <SectionShell
                      title="Recently added"
                      subtitle="Fresh snippets recently added by users."
                      accent="green"
                    >
                      {renderSnippetSection(
                        exploreData.recent || [],
                        "No recent snippets",
                        "Newly added snippets will appear here."
                      )}
                    </SectionShell>

                    {Object.keys(exploreData.byLanguage || {}).map((lang) => (
                      <SectionShell
                        key={lang}
                        title={lang}
                        subtitle={`Explore snippets related to ${lang}.`}
                        accent="purple"
                      >
                        {renderSnippetSection(
                          exploreData.byLanguage[lang] || [],
                          `No ${lang} snippets yet`,
                          `When ${lang} snippets are available, they will appear here.`
                        )}
                      </SectionShell>
                    ))}
                  </>
                )}
              </div>
            )}

            {page === PAGE.ADD && (
              <SectionShell
                title="Add snippet"
                subtitle="Create and publish a new code snippet to your workspace."
                accent="amber"
              >
                <AddSnippetForm onAdd={handleAddSnippet} />
              </SectionShell>
            )}

            {page === PAGE.MY_SNIPPETS && (
              <SectionShell
                title="My snippets"
                subtitle="Your personal snippets, drafts, and published code."
                accent="green"
                action={
                  <button
                    onClick={() => handleNavigate(PAGE.ADD)}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/15"
                  >
                    <ArrowUpRight size={14} />
                    Add new
                  </button>
                }
              >
                {renderSnippetSection(
                  userSnippets,
                  "You have no snippets yet",
                  "Create your first snippet to start building your personal code library."
                )}
              </SectionShell>
            )}

            {page === PAGE.COLLECTIONS &&
              (selectedCollection ? (
                <SectionShell
                  title={selectedCollection?.name || "Collection"}
                  subtitle={selectedCollection?.description || "Manage the snippets inside this collection."}
                  accent="purple"
                  compact
                >
                  <CollectionDetailPage
                    collection={selectedCollection}
                    onBack={() => setSelectedCollection(null)}
                    onSelectSnippet={fetchSnippetById}
                    onTagClick={handleTagClickGlobal}
                  />
                </SectionShell>
              ) : (
                <SectionShell
                  title="Collections"
                  subtitle="Organize your snippets into meaningful groups."
                  accent="purple"
                  compact
                >
                  {collections.length === 0 ? (
                    <EmptyState
                      title="No collections yet"
                      subtitle="Create collections to organize snippets by topic, project, or workflow."
                      icon={<FolderGit2 size={22} />}
                    />
                  ) : (
                    <CollectionsPage
                      collections={collections}
                      onSelectCollection={handleSelectCollection}
                      onEditCollection={handleEditCollection}
                      onDeleteCollection={handleDeleteCollection}
                    />
                  )}
                </SectionShell>
              ))}

            {page === PAGE.PROFILE && (
              <SectionShell
                title="Profile"
                subtitle="Manage your profile and account information."
                accent="pink"
                compact
              >
                <Profile currentUser={currentUser} sandboxMode={sandboxMode} />
              </SectionShell>
            )}

            {page === PAGE.SEARCH && (
              <SectionShell
                title="Search results"
                subtitle={searchSubtitle}
                accent="slate"
                action={
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-400">
                      <Search size={12} />
                      {searchLoading
                        ? "Searching..."
                        : `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}`}
                    </div>

                    {(searchQuery || searchFilters.length > 0) && (
                      <button
                        type="button"
                        onClick={() => handleNavigate(PAGE.HOME)}
                        className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/15"
                      >
                        <X size={12} />
                        Clear search
                      </button>
                    )}
                  </div>
                }
              >
                {searchFilters.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {searchFilters.map((filterTag) => (
                      <span
                        key={filterTag}
                        className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300"
                      >
                        <Filter size={11} />
                        {filterTag}
                      </span>
                    ))}
                  </div>
                )}

                {searchLoading ? (
                  <LoadingState label="Fetching snippets..." />
                ) : searchResults.length === 0 ? (
                  <EmptyState
                    title="No results found"
                    subtitle="Try another keyword, tag, or language search."
                    icon={<Search size={22} />}
                  />
                ) : (
                  <SnippetGrid
                    snippets={snippetsToShow}
                    onSelect={fetchSnippetById}
                    onTagClick={handleTagClickGlobal}
                  />
                )}
              </SectionShell>
            )}
          </div>
        )}
      </main>

      <Footer />

      {selectedSnippet && (
        <SnippetModal
          snippet={selectedSnippet}
          onClose={() => setSelectedSnippet(null)}
          onDelete={handleDeleteSnippet}
          onSnippetUpdate={handleSnippetUpdate}
          onLike={handleLike}
          onSyncGithub={handleSyncGithub}
          onTagClick={handleTagClickGlobal}
          onFork={handleFork}
          currentUser={currentUser}
          authToken={authToken}
          sandboxMode={sandboxMode}
        />
      )}
    </div>
  );
}