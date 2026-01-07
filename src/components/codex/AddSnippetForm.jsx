import { useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

export default function AddSnippetForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in.");
        return;
      }

      const res = await axios.post(
        `${API}/api/snippets`,
        {
          title,
          description,
          language,
          code,
          isPublic: privacy === "public",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onAdd?.(res.data);

      setTitle("");
      setDescription("");
      setLanguage("javascript");
      setCode("");
      setPrivacy("public");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error || "Error adding snippet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-3xl mx-auto bg-gray-900/60 backdrop-blur-lg p-8 sm:p-10 rounded-2xl shadow-2xl border border-gray-700"
    >
      <h2 className="text-3xl sm:text-4xl font-extrabold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-8">
        Add a New Snippet
      </h2>

      <div className="space-y-5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Snippet Title"
          className="w-full border border-gray-600 bg-gray-800/70 text-gray-200 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />

        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder="Short Description"
          className="w-full border border-gray-600 bg-gray-800/70 text-gray-200 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          required
          className="w-full border border-gray-600 bg-gray-800/70 text-gray-200 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        >
          <option value="javascript">JavaScript</option>
          <option value="css">CSS</option>
          <option value="html">HTML</option>
          <option value="php">PHP</option>
          <option value="python">Python</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="ruby">Ruby</option>
          <option value="typescript">TypeScript</option>
          <option value="go">Go</option>
          <option value="csharp">C#</option>
        </select>

        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          placeholder="Paste your code here..."
          className="w-full border border-gray-600 bg-gray-800/70 text-gray-200 rounded-xl px-5 py-4 min-h-[180px] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />

        <div className="flex gap-6 text-gray-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={privacy === "public"}
              onChange={() => setPrivacy("public")}
              className="accent-blue-500"
            />
            <span className="text-sm">Public</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={privacy === "private"}
              onChange={() => setPrivacy("private")}
              className="accent-purple-500"
            />
            <span className="text-sm">Private</span>
          </label>
        </div>

        <div className="text-center">
          <button
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white px-10 py-3 rounded-xl font-semibold shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            {loading ? "Adding..." : "Add Snippet"}
          </button>
        </div>
      </div>
    </form>
  );
}
