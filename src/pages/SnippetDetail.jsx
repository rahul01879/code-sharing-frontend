import { useState, useEffect } from "react";
import axios from "axios";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markup";
import "prismjs/themes/prism-tomorrow.css";
import "../App.css";

// ---------------- HEADER ----------------
function Header({ current, onNavigate, onLogout }) {
  return (
    <header className="bg-gray-900/80 backdrop-blur-md shadow sticky top-0 z-50 border-b border-gray-800 w-full">
      <div className="flex justify-between items-center px-6 py-4 w-full">
        <a className="text-3xl font-extrabold text-blue-400 tracking-tight">CodeShare</a>
        <nav>
          <ul className="flex gap-4">
            {["home", "add", "my-snippets", "profile"].map((id) => (
              <li key={id}>
                <button
                  onClick={() => onNavigate(id)}
                  className={`px-4 py-2 rounded-full transition-all duration-200 ${
                    current === id
                      ? "bg-blue-500 text-white shadow-lg"
                      : "text-gray-300 hover:bg-blue-900 hover:text-white"
                  }`}
                >
                  {id.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={onLogout}
                className="bg-red-500 px-4 py-2 rounded-full text-white"
              >
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

// ---------------- SNIPPET CARD ----------------
function SnippetCard({ snippet, onSelect }) {
  return (
    <div
      onClick={() => onSelect(snippet)}
      className="bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-transform transform hover:-translate-y-1 p-6 border border-gray-700 cursor-pointer"
    >
      <h3 className="text-xl font-bold text-blue-400 mb-2">{snippet.title}</h3>
      <p className="text-sm text-gray-300 mb-4">{snippet.description}</p>
      <div className="flex justify-between text-xs text-gray-400">
        <span>By: {snippet.author}</span>
        <span className="bg-yellow-500 text-gray-900 px-2 py-0.5 rounded-full">
          {snippet.language}
        </span>
      </div>
    </div>
  );
}

// ---------------- SNIPPET GRID ----------------
function SnippetGrid({ snippets, onSelect }) {
  if (!snippets || snippets.length === 0) {
    return <p className="text-center text-gray-400 text-lg w-full">No snippets to show.</p>;
  }
  return (
    <div className="grid gap-8 grid-cols-[repeat(auto-fill,minmax(280px,1fr))] w-full">
      {snippets.map((s) => (
        <SnippetCard key={s._id} snippet={s} onSelect={onSelect} />
      ))}
    </div>
  );
}

// ---------------- SELECTED SNIPPET VIEW ----------------
function SelectedSnippet({ snippet, onClose, onDelete }) {
  useEffect(() => {
    Prism.highlightAll();
  }, [snippet]);

  if (!snippet) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet.code);
    alert("Code copied to clipboard!");
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-blue-400">{snippet.title}</h3>
        <button
          onClick={onClose}
          className="text-red-400 hover:text-red-500 font-bold"
        >
          ✕ Close
        </button>
      </div>
      <p className="text-sm text-gray-300 mb-4">{snippet.description}</p>
      <pre className="rounded-lg overflow-x-auto">
        <code className={`language-${snippet.language?.toLowerCase() || "javascript"}`}>
          {snippet.code}
        </code>
      </pre>
      <div className="flex gap-4 mt-4">
        <button
          onClick={handleCopy}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg text-white"
        >
          Copy
        </button>
        <button
          onClick={() => onDelete(snippet._id)}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-white"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ---------------- MAIN PAGE ----------------
export default function CodeSharingPage({ onLogout }) {
  const [page, setPage] = useState("home");
  const [publicSnippets, setPublicSnippets] = useState([]);
  const [userSnippets, setUserSnippets] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/snippets/public")
      .then((res) => setPublicSnippets(res.data))
      .catch((err) => console.error(err));

    const token = localStorage.getItem("token");
    if (token) {
      axios
        .get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setCurrentUser(res.data))
        .catch(() => {
          localStorage.removeItem("token");
          onLogout();
        });
    }
  }, []);

  const handleDeleteSnippet = async (id) => {
    if (!window.confirm("Delete this snippet?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/snippets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPublicSnippets((prev) => prev.filter((s) => s._id !== id));
      setUserSnippets((prev) => prev.filter((s) => s._id !== id));
      setSelectedSnippet(null);
    } catch (err) {
      console.error(err);
      alert("Error deleting snippet");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-900">
      <Header current={page} onNavigate={setPage} onLogout={onLogout} />
      <main className="w-full px-6 py-10 space-y-12">
        {page === "home" && (
          <>
            <SnippetGrid snippets={publicSnippets} onSelect={setSelectedSnippet} />
            <SelectedSnippet
              snippet={selectedSnippet}
              onClose={() => setSelectedSnippet(null)}
              onDelete={handleDeleteSnippet}
            />
          </>
        )}
        {page === "my-snippets" && (
          <>
            <SnippetGrid snippets={userSnippets} onSelect={setSelectedSnippet} />
            <SelectedSnippet
              snippet={selectedSnippet}
              onClose={() => setSelectedSnippet(null)}
              onDelete={handleDeleteSnippet}
            />
          </>
        )}
      </main>
    </div>
  );
}
