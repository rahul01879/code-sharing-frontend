import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, RefreshCw, Trash2, Github } from "lucide-react";

export default function AdminGithubUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);
  const [verifying, setVerifying] = useState({}); // store verification state per user

  const adminKey = sessionStorage.getItem("adminKey");

  useEffect(() => {
    if (!adminKey) {
      alert("You must log in as admin first.");
      navigate("/admin/login");
      return;
    }
    fetchGithubUsers();
  }, [adminKey, navigate]);

  // ✅ Fetch GitHub-connected users
  const fetchGithubUsers = async () => {
    try {
      setLoading(true);
      const headers = { "x-admin-key": adminKey };
      const res = await axios.get(`${API}/api/admin/github-users`, { headers });
      const fetchedUsers = res.data || [];

      // verify GitHub usernames
      await Promise.all(fetchedUsers.map(verifyGithubUsername));
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Error fetching GitHub users:", err);

      if (err.response?.status === 403 || err.response?.status === 401) {
        alert("Session expired or unauthorized. Please log in again.");
        sessionStorage.clear();
        navigate("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Verify GitHub username for each user
  const verifyGithubUsername = async (user) => {
    if (!user.githubToken) return;

    setVerifying((prev) => ({ ...prev, [user._id]: true }));
    try {
      const ghRes = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `token ${user.githubToken}` },
      });

      if (ghRes.data?.login) {
        user.githubUsername = ghRes.data.login;
        // optional: update backend cached username
        await axios.post(
          `${API}/api/admin/github-users/update/${user._id}`,
          { githubUsername: ghRes.data.login },
          { headers: { "x-admin-key": adminKey } }
        );
      } else {
        user.githubUsername = "Invalid token";
      }
    } catch (err) {
      console.warn(`GitHub verification failed for ${user.username}:`, err.message);
      user.githubUsername = "Invalid / expired";
    } finally {
      setVerifying((prev) => ({ ...prev, [user._id]: false }));
    }
  };

  // ✅ Revoke a user’s GitHub token
  const handleRevokeToken = async (userId) => {
    if (!window.confirm("Are you sure you want to revoke this user's GitHub token?")) return;
    try {
      setRevoking(userId);
      const headers = { "x-admin-key": adminKey };
      const res = await axios.post(
        `${API}/api/admin/github-users/revoke/${userId}`,
        {},
        { headers }
      );

      alert(`✅ ${res.data?.message || "GitHub token revoked successfully."}`);
      fetchGithubUsers();
    } catch (err) {
      console.error("Error revoking token:", err);
      alert("❌ Failed to revoke token.");
    } finally {
      setRevoking(null);
    }
  };

  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-300">
        <p className="text-lg animate-pulse">Loading GitHub users...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-gray-800/70 backdrop-blur-md shadow-lg p-4 rounded-xl border border-gray-700 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300 transition-all duration-300"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400">
            GitHub Connected Users
          </h1>
        </div>
        <button
          onClick={fetchGithubUsers}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500/90 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-all duration-300"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Users Table */}
      {users.length === 0 ? (
        <div className="text-center text-gray-400 mt-20">
          <p className="text-lg">No GitHub-connected users found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-gray-800/70 rounded-2xl shadow-lg border border-gray-700">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-800/80 text-gray-300 text-sm uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Username</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">GitHub Username</th>
                <th className="px-6 py-3 text-left">Token (partial)</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-gray-300">
              {users.map((user, idx) => (
                <tr key={user._id} className="hover:bg-gray-800/50 transition-all duration-200">
                  <td className="px-6 py-3">{idx + 1}</td>
                  <td className="px-6 py-3 font-semibold text-blue-400">{user.username}</td>
                  <td className="px-6 py-3">{user.email || "—"}</td>
                  <td className="px-6 py-3 flex items-center gap-2">
                    <Github className="text-gray-400" size={16} />
                    {verifying[user._id]
                      ? "Verifying..."
                      : user.githubUsername || "—"}
                  </td>
                  <td className="px-6 py-3 font-mono text-sm">
                    {user.githubToken
                      ? `••••••${user.githubToken.slice(-6)}`
                      : "No token"}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => handleRevokeToken(user._id)}
                      disabled={revoking === user._id}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm transition-all duration-300 ${
                        revoking === user._id
                          ? "bg-red-800/60 cursor-not-allowed"
                          : "bg-red-600/80 hover:bg-red-700"
                      }`}
                    >
                      <Trash2 size={14} />
                      {revoking === user._id ? "Revoking..." : "Revoke"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
