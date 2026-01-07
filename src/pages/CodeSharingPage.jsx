import { useEffect, useRef, useState } from "react";
import axios from "axios";

import Header from "../components/codex/Header";
import SnippetGrid from "../components/codex/SnippetGrid";
import SnippetModal from "../components/codex/SnippetModal";
import AddSnippetForm from "../components/codex/AddSnippetForm";
import CollectionsPage from "../components/codex/CollectionsPage";
import CollectionDetailPage from "../components/codex/CollectionDetailPage";
import Profile from "../components/codex/Profile";
import Footer from "../components/codex/Footer";

const API = import.meta.env.VITE_API_BASE_URL;

const normalizeSnippets = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.snippets) ? data.snippets : [];

export default function CodeSharingPage({ onLogout }) {
  const [page, setPage] = useState("home");

  const [publicSnippets, setPublicSnippets] = useState([]);
  const [userSnippets, setUserSnippets] = useState([]);
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);

  const [loading, setLoading] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const searchDebounceRef = useRef(null);

  const fetchPublic = async () => {
    const res = await axios.get(`${API}/api/snippets/public`);
    setPublicSnippets(normalizeSnippets(res.data));
  };

  const fetchMine = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await axios.get(`${API}/api/snippets/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUserSnippets(normalizeSnippets(res.data));
  };

  const fetchCollections = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await axios.get(`${API}/api/collections`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setCollections(res.data || []);
  };

  useEffect(() => {
    // basic global 401 handling like your old file did
    const interceptor = axios.interceptors.response.use(
      (r) => r,
      (err) => {
        if (err?.response?.status === 401) {
          localStorage.removeItem("token");
          onLogout?.();
        }
        return Promise.reject(err);
      }
    );

    fetchPublic().catch((e) => console.error("fetch public error:", e));
    fetchMine().catch((e) => console.error("fetch mine error:", e));
    fetchCollections().catch((e) => console.error("fetch collections error:", e));

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const fetchSnippetById = async (id) => {
    if (!id) return;
    try {
      const res = await axios.get(`${API}/api/snippets/${id}`);
      setSelectedSnippet(res.data);
    } catch (err) {
      console.error("fetch snippet error:", err);
    }
  };

  const handleAddSnippet = (snippet) => {
    setUserSnippets((prev) => [snippet, ...prev]);
    if (snippet?.isPublic) setPublicSnippets((prev) => [snippet, ...prev]);
    setPage("my-snippets");
  };

  const handleDeleteSnippet = async (id) => {
    if (!window.confirm("Delete this snippet?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/api/snippets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPublicSnippets((prev) => prev.filter((s) => s._id !== id));
      setUserSnippets((prev) => prev.filter((s) => s._id !== id));
      setSearchResults((prev) => prev.filter((s) => s._id !== id));
      setSelectedSnippet(null);
    } catch (err) {
      console.error("delete error:", err);
      alert(err?.response?.data?.error || "Error deleting snippet");
    }
  };

  const handleSnippetUpdate = (updated) => {
    const updateList = (setFn) =>
      setFn((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));

    updateList(setPublicSnippets);
    updateList(setUserSnippets);
    updateList(setSearchResults);
    setSelectedSnippet(updated);
  };

  const handleLike = async (id) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Please log in to like snippets.");

      const res = await axios.post(
        `${API}/api/snippets/${id}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // backend returns likes array; merge into snippet
      const apply = (setFn) =>
        setFn((prev) =>
          prev.map((s) =>
            s._id === id ? { ...s, likes: res.data.likes, isLikedByUser: res.data.message?.includes("liked") } : s
          )
        );

      apply(setPublicSnippets);
      apply(setUserSnippets);
      apply(setSearchResults);

      setSelectedSnippet((prev) =>
        prev?._id === id ? { ...prev, likes: res.data.likes, isLikedByUser: res.data.message?.includes("liked") } : prev
      );
    } catch (err) {
      console.error("like error:", err);
      alert(err?.response?.data?.error || "Failed to like");
    }
  };

  const handleFork = async (snippetId) => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please log in to fork snippets.");

    try {
      const res = await fetch(`${API}/api/snippets/${snippetId}/fork`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Fork failed");

      setUserSnippets((prev) => [data.snippet, ...prev]);
      alert(`✅ Forked "${data.snippet.title}"`);
    } catch (err) {
      console.error("fork error:", err);
      alert(err.message || "Error forking snippet");
    }
  };

  const handleSyncGithub = async (snippetId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("You must be logged in to sync snippets.");

      const response = await fetch(`${API}/api/snippets/${snippetId}/sync-github`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to sync");

      alert(data.message || "✅ Synced to GitHub!");
    } catch (err) {
      console.error("GitHub sync error:", err);
      alert(err.message || "Sync failed");
    }
  };

  const fetchSnippetsByTag = async (tag) => {
    try {
      // First try tag endpoint
      const tagRes = await axios.get(`${API}/api/snippets/tag/${encodeURIComponent(tag)}`);
      const arr = normalizeSnippets(tagRes.data);
      if (Array.isArray(arr) && arr.length) return arr;
    } catch {
      // ignore and fallback
    }

    try {
      const res = await axios.get(`${API}/api/snippets/search`, { params: { q: tag } });
      return normalizeSnippets(res.data);
    } catch (err) {
      console.error("fetchSnippetsByTag error:", err);
      return [];
    }
  };

  const fetchExploreSnippets = async () => {
    // optional endpoint; safe
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/snippets/explore`);
      if (!res.ok) throw new Error("Explore endpoint not available");
      const data = await res.json();
      // If you add an Explore page later, store this data
      console.log("Explore:", data);
    } catch (err) {
      console.warn("explore load skipped:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (targetPage, query) => {
    setPage(targetPage);

    // if Header passed an array of snippets (from quick filters)
    if (targetPage === "search" && Array.isArray(query)) {
      setSearchResults(query);
      setSearchQuery("");
      return;
    }

    if (targetPage !== "search") return;

    const q = (query || "").toString();
    setSearchQuery(q);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/snippets/search`, { params: { q } });
        setSearchResults(normalizeSnippets(res.data));
      } catch (err) {
        console.error("search error:", err);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  // Collections actions
  const handleSelectCollection = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/collections/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedCollection(res.data);
    } catch (err) {
      console.error("select collection error:", err);
    }
  };

  const handleEditCollection = async (collection) => {
    const name = window.prompt("Edit collection name:", collection?.name || "");
    if (!name) return;

    const description = window.prompt("Edit description:", collection?.description || "");
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/api/collections/${collection._id}`,
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCollections();
    } catch (err) {
      console.error("edit collection error:", err);
    }
  };

  const handleDeleteCollection = async (id) => {
    if (!window.confirm("Delete this collection?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/api/collections/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCollections();
      setSelectedCollection(null);
    } catch (err) {
      console.error("delete collection error:", err);
    }
  };

  return (

    <div className="min-h-screen w-full bg-gray-950 text-gray-200">

      <Header
        current={page}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        fetchSnippetsByTag={fetchSnippetsByTag}
        fetchExploreSnippets={fetchExploreSnippets}
      />

      <main className="w-full px-6 py-10 space-y-12">
        {page === "home" && (
          <SnippetGrid
            snippets={publicSnippets}
            onSelect={fetchSnippetById}
            onTagClick={(tag) => fetchSnippetsByTag(tag).then((arr) => handleNavigate("search", arr))}
          />
        )}

        {page === "add" && <AddSnippetForm onAdd={handleAddSnippet} />}

        {page === "my-snippets" && <SnippetGrid snippets={userSnippets} onSelect={fetchSnippetById} />}

        {page === "collections" &&
          (selectedCollection ? (
            <CollectionDetailPage
              collection={selectedCollection}
              onBack={() => setSelectedCollection(null)}
              onSelectSnippet={fetchSnippetById}
            />
          ) : (
            <CollectionsPage
              collections={collections}
              onSelectCollection={handleSelectCollection}
              onEditCollection={handleEditCollection}
              onDeleteCollection={handleDeleteCollection}
            />
          ))}

        {page === "profile" && <Profile />}

        {page === "search" && (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-gray-200">
              Search Results{searchQuery ? ` for "${searchQuery}"` : ""}
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm text-gray-400">Fetching snippets...</p>
              </div>
            ) : (
              <SnippetGrid snippets={searchResults} onSelect={fetchSnippetById} />
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
          onTagClick={(tag) => fetchSnippetsByTag(tag).then((arr) => handleNavigate("search", arr))}
          onFork={handleFork}
        />
      )}
    </div>
  );
}
