import { useEffect, useMemo, useState } from "react";
import { FaGithub, FaHeart, FaEye, FaCodeBranch } from "react-icons/fa";

const API = import.meta.env.VITE_API_BASE_URL;

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [user, setUser] = useState(null);
  const [snippets, setSnippets] = useState([]);
  const [activity, setActivity] = useState([]);

  const [githubConnected, setGithubConnected] = useState(false);
  const [githubProfile, setGithubProfile] = useState(null);
  const [githubToken, setGithubToken] = useState("");

  const token = localStorage.getItem("token");

  const insights = useMemo(() => {
    const totalLikes = snippets.reduce((sum, s) => sum + (s.likes?.length || 0), 0);
    const totalViews = snippets.reduce((sum, s) => sum + (s.views || 0), 0);
    return { totalSnippets: snippets.length, totalLikes, totalViews };
  }, [snippets]);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setError("Not logged in");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [meRes, mineRes, activityRes, ghRes] = await Promise.all([
          fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/snippets/mine`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/activity/mine`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/api/user/github-token`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (meRes.ok) {
          const me = await meRes.json();
          setUser(me.user);
        }

        if (mineRes.ok) setSnippets(await mineRes.json());
        if (activityRes.ok) setActivity(await activityRes.json());

        if (ghRes.ok) {
          const gh = await ghRes.json();
          if (gh.connected && !gh.expired) {
            setGithubConnected(true);
            setGithubProfile({
              login: gh.githubUsername,
              avatar_url: gh.githubAvatar,
              html_url: gh.githubUsername ? `https://github.com/${gh.githubUsername}` : "",
            });
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  const handleConnectGithub = async () => {
    if (!githubToken.trim()) return alert("Enter your GitHub Personal Access Token");
    if (!token) return alert("Not logged in");

    try {
      // verify token
      const verify = await fetch("https://api.github.com/user", {
        headers: { Authorization: `token ${githubToken}` },
      });
      if (!verify.ok) throw new Error("Invalid GitHub token");

      const profile = await verify.json();

      const res = await fetch(`${API}/api/user/github-token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: githubToken }),
      });

      if (!res.ok) throw new Error("Failed to save token");

      setGithubConnected(true);
      setGithubProfile(profile);
      setGithubToken("");
      alert(`✅ Connected as ${profile.login}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to connect GitHub");
    }
  };

  const handleDisconnectGithub = async () => {
    if (!token) return;
    if (!window.confirm("Disconnect GitHub?")) return;

    try {
      await fetch(`${API}/api/user/github-token`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setGithubConnected(false);
      setGithubProfile(null);
      alert("✅ GitHub disconnected");
    } catch (err) {
      console.error(err);
      alert("Failed to disconnect GitHub");
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[50vh] text-gray-400 animate-pulse">Loading profile...</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center min-h-[50vh] text-red-400">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 py-10 px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-10">
        <div className="space-y-6">
          <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800 text-center">
            <img
              src={githubProfile?.avatar_url || "https://avatars.githubusercontent.com/u/9919?v=4"}
              className="w-28 h-28 rounded-full border-4 border-blue-500 mx-auto"
              alt="Profile"
            />
            <h2 className="text-2xl font-bold mt-4">{user?.username || "User"}</h2>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <p className="text-xs text-gray-500 mt-2">
              Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
            </p>
          </div>

          <div className="bg-[#161b22] p-5 rounded-2xl border border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <FaGithub className="text-white text-xl" />
              <h3 className="text-lg font-semibold text-white">GitHub</h3>
            </div>

            {githubConnected && githubProfile ? (
              <div className="space-y-3">
                <p className="text-green-400">
                  Connected as{" "}
                  <a
                    href={githubProfile.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {githubProfile.login}
                  </a>
                </p>
                <button
                  onClick={handleDisconnectGithub}
                  className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg text-sm text-white transition font-medium"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm">Connect GitHub to enable syncing.</p>
                <input
                  type="password"
                  placeholder="GitHub Personal Access Token"
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700/70 text-white rounded-lg border border-gray-600"
                />
                <button
                  onClick={handleConnectGithub}
                  className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-sm text-white font-medium"
                >
                  Connect GitHub
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">Profile Insights</h3>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <FaCodeBranch className="text-purple-400 text-2xl mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Snippets</p>
                <p className="text-2xl font-bold">{insights.totalSnippets}</p>
              </div>
              <div>
                <FaHeart className="text-pink-400 text-2xl mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Likes</p>
                <p className="text-2xl font-bold">{insights.totalLikes}</p>
              </div>
              <div>
                <FaEye className="text-blue-400 text-2xl mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Views</p>
                <p className="text-2xl font-bold">{insights.totalViews}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-semibold text-green-400 mb-4">Recent Snippets</h3>
            {snippets?.length ? (
              <div className="space-y-3">
                {snippets.slice(0, 5).map((s) => (
                  <div key={s._id} className="p-4 rounded-lg bg-[#0d1117]/60 border border-gray-800">
                    <h4 className="text-white font-semibold">{s.title}</h4>
                    <p className="text-gray-400 text-sm">
                      {s.language || "Unknown"} • {s.likes?.length || 0} likes • {s.views || 0} views
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No snippets yet.</p>
            )}
          </div>

          <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-semibold text-cyan-400 mb-4">Recent Activity</h3>
            {activity?.length ? (
              <ul className="space-y-2">
                {activity.slice(0, 10).map((a) => (
                  <li key={a._id} className="p-3 bg-[#0d1117]/60 rounded-lg border border-gray-800">
                    <p className="text-gray-300 text-sm">
                      {a.type} • <span className="text-blue-400">{a.snippetTitle}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">No recent activity yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
