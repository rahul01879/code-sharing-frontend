import { useCallback, useState } from "react";
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
} from "lucide-react";
import { debounce } from "../../utils/codexUtils";

export default function Header({
  current,
  onNavigate,
  onLogout,
  fetchSnippetsByTag,
  fetchExploreSnippets,
}) {
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const [activeFilters, setActiveFilters] = useState([]);
  const [loading, setLoading] = useState(false);

  const navItems = [
    { id: "home", label: "Home", icon: <Home size={18} /> },
    { id: "add", label: "Add Snippet", icon: <PlusSquare size={18} /> },
    { id: "my-snippets", label: "My Snippets", icon: <FileText size={18} /> },
    { id: "collections", label: "Collections", icon: <Folder size={18} /> },
    { id: "profile", label: "Profile", icon: <User size={18} /> },
    { id: "explore", label: "Explore", icon: <Compass size={18} /> },
  ];

  const handleNavigate = (id, value) => {
    onNavigate?.(id, value);
    setMenuOpen(false);
    setShowSearch(false);
  };

  const applyFilters = async (filters) => {
    if (!filters || filters.length === 0) {
      handleNavigate("home");
      return;
    }
    setLoading(true);
    try {
      const allResults = [];
      for (const f of filters) {
        const data = await fetchSnippetsByTag?.(f);
        if (Array.isArray(data)) allResults.push(...data);
      }
      const unique = Array.from(new Map(allResults.map((s) => [s._id, s])).values());
      onNavigate?.("search", unique);
    } catch (err) {
      console.error("Filter apply error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterClick = async (lang) => {
    const updated = activeFilters.includes(lang)
      ? activeFilters.filter((f) => f !== lang)
      : [...activeFilters, lang];
    setActiveFilters(updated);
    await applyFilters(updated);
  };

  const removeFilter = async (lang) => {
    const updated = activeFilters.filter((f) => f !== lang);
    setActiveFilters(updated);
    await applyFilters(updated);
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    handleNavigate("home");
  };

  const handleSearch = useCallback(
    debounce((query) => {
      if (!query.trim()) {
        onNavigate?.("home");
        return;
      }
      onNavigate?.("search", query);
    }, 400),
    [onNavigate]
  );

  const filterColors = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-teal-500",
    "from-orange-500 to-yellow-500",
    "from-rose-500 to-pink-500",
    "from-indigo-500 to-purple-500",
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-gray-950/90 backdrop-blur-md border-b border-gray-800 shadow-md">
      <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4">
        <button
          onClick={() => handleNavigate("home")}
          className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight hover:scale-105 transition-transform"
        >
          CODE<span className="text-gray-300">X</span>
        </button>

        <nav className="hidden md:flex items-center gap-3 lg:gap-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                handleNavigate(item.id);
                if (item.id === "explore") fetchExploreSnippets?.();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                current === item.id
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg scale-105"
                  : "text-gray-300 hover:text-white hover:bg-gray-800/70 hover:scale-105"
              }`}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}

          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-gray-300 hover:bg-gray-800/70 hover:text-white transition-all"
            >
              <Shield size={18} /> Admin
            </Link>
          )}

          <div className="relative ml-3">
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search snippets..."
              className="pl-9 pr-4 py-2 rounded-full bg-gray-800/80 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 lg:w-64 transition-all"
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                handleSearch(value);
              }}
            />
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 ml-3 px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium text-sm shadow-md hover:scale-105 transition-all"
            >
              <LogOut size={18} /> Logout
            </button>
          )}
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setShowSearch((prev) => !prev)}
            className="text-gray-300 hover:text-white p-1.5 rounded-full transition"
          >
            <Search size={22} />
          </button>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="text-gray-300 hover:text-white p-1.5 rounded-full transition"
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search snippets..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                handleSearch(value);
              }}
            />
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                handleNavigate(item.id);
                if (item.id === "explore") fetchExploreSnippets?.();
              }}
              className={`w-full flex items-center gap-2 px-6 py-3 text-sm font-medium text-left transition-all duration-300 ${
                current === item.id
                  ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 shadow-md"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-6 py-3 text-sm text-red-400 hover:bg-gray-800 transition"
            >
              <LogOut size={18} /> Logout
            </button>
          )}
        </div>
      )}

      {(current === "home" || current === "search") && (
        <div className="border-t border-gray-800 bg-gray-950/80 backdrop-blur-sm">
          <div className="flex items-center overflow-x-auto gap-3 px-4 sm:px-8 py-3">
            <span className="text-sm text-gray-400 flex-shrink-0 font-medium">
              Quick filters:
            </span>

            {["javascript", "python", "java", "php", "typescript", "go", "ruby", "csharp"].map(
              (lang, i) => (
                <button
                  key={lang}
                  onClick={() => handleFilterClick(lang)}
                  className={`flex-shrink-0 px-4 py-1.5 text-xs rounded-full font-semibold transition-all duration-300 ${
                    activeFilters.includes(lang)
                      ? `bg-gradient-to-r ${filterColors[i % filterColors.length]} text-white shadow-md scale-105`
                      : "bg-gray-800/70 border border-gray-700 text-gray-300 hover:bg-blue-600/30 hover:text-blue-300"
                  }`}
                >
                  {lang}
                </button>
              )
            )}

            {loading && <span className="text-sm text-gray-400 ml-2 animate-pulse">Loading…</span>}

            {activeFilters.length > 0 && (
              <button onClick={clearAllFilters} className="ml-auto text-xs text-red-400 hover:underline">
                Clear all
              </button>
            )}
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 sm:px-8 pb-3">
              {activeFilters.map((f) => (
                <span
                  key={f}
                  className="flex items-center gap-2 px-3 py-1 text-xs rounded-full border border-blue-500 bg-gray-800 text-blue-300 shadow-sm"
                >
                  {f}
                  <button onClick={() => removeFilter(f)} className="text-gray-400 hover:text-red-400 transition ml-1">
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
