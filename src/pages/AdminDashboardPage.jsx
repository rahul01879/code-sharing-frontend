import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { LogOut, Users, FileCode2, BarChart3, Github } from "lucide-react";

export default function AdminDashboardPage({ onAdminLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSnippets: 0,
    activeToday: 0,
  });
  const [userGrowth, setUserGrowth] = useState([]);
  const [snippetActivity, setSnippetActivity] = useState([]);
  const [githubUsers, setGithubUsers] = useState([]);
  const [githubChartData, setGithubChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const adminKey = sessionStorage.getItem("adminKey");

  const handleLogout = () => {
    sessionStorage.removeItem("adminKey");
    sessionStorage.removeItem("adminAuth");
    onAdminLogout?.();
    navigate("/admin/login");
  };

  useEffect(() => {
    if (!adminKey) {
      navigate("/admin/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const headers = { "x-admin-key": adminKey };

        const [statsRes, growthRes, activityRes, githubRes] = await Promise.all([
          axios.get(`${API}/api/admin/stats`, { headers }),
          axios.get(`${API}/api/admin/user-growth`, { headers }),
          axios.get(`${API}/api/admin/snippet-activity`, { headers }),
          axios.get(`${API}/api/admin/github-users`, { headers }),
        ]);

        setStats(statsRes.data);
        setUserGrowth(growthRes.data);
        setSnippetActivity(activityRes.data);
        setGithubUsers(Array.isArray(githubRes.data) ? githubRes.data : []);

        // 🔹 Build chart dataset based on GitHub user creation/connection dates
        const countsByDate = {};
        (githubRes.data || []).forEach((user) => {
          const date = new Date(user.createdAt).toLocaleDateString();
          countsByDate[date] = (countsByDate[date] || 0) + 1;
        });

        const formatted = Object.entries(countsByDate)
          .map(([date, count]) => ({ date, connections: count }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setGithubChartData(formatted);
      } catch (err) {
        console.error("Admin data fetch error:", err);
        if (err.response?.status === 403) {
          alert("Unauthorized access. Please log in again.");
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [adminKey, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-300">
        <p className="text-lg animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-gray-800/70 backdrop-blur-md shadow-lg p-4 rounded-xl border border-gray-700 mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Admin Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600/90 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-300"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          onClick={() => navigate("/admin/users")}
          className="bg-gray-800/70 border border-gray-700 rounded-2xl p-6 hover:border-blue-500/50 hover:bg-gray-800 cursor-pointer transition-all duration-300 shadow-md hover:shadow-blue-500/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-blue-400" size={22} />
            <h2 className="text-lg font-semibold">Manage Users</h2>
          </div>
          <p className="text-gray-400 text-sm">View and manage registered users.</p>
        </div>

        <div
          onClick={() => navigate("/admin/snippets")}
          className="bg-gray-800/70 border border-gray-700 rounded-2xl p-6 hover:border-green-500/50 hover:bg-gray-800 cursor-pointer transition-all duration-300 shadow-md hover:shadow-green-500/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <FileCode2 className="text-green-400" size={22} />
            <h2 className="text-lg font-semibold">Manage Snippets</h2>
          </div>
          <p className="text-gray-400 text-sm">Review and moderate all code snippets.</p>
        </div>

        <div
          onClick={() => navigate("/admin/github-users")}
          className="bg-gray-800/70 border border-gray-700 rounded-2xl p-6 hover:border-yellow-500/50 hover:bg-gray-800 cursor-pointer transition-all duration-300 shadow-md hover:shadow-yellow-500/10"
        >
          <div className="flex items-center gap-3 mb-2">
            <Github className="text-yellow-400" size={22} />
            <h2 className="text-lg font-semibold">GitHub Connections</h2>
          </div>
          <p className="text-gray-400 text-sm">View users connected with GitHub.</p>
        </div>
      </div>

      {/* Reports & Analytics */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Reports & Analytics</h2>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/70 p-6 rounded-2xl border border-gray-700 hover:border-blue-500/40 transition-all duration-300 shadow-md hover:shadow-blue-500/10">
            <h2 className="text-gray-400 text-sm">Total Users</h2>
            <p className="text-4xl font-extrabold mt-2 text-blue-400">{stats.totalUsers}</p>
          </div>
          <div className="bg-gray-800/70 p-6 rounded-2xl border border-gray-700 hover:border-green-500/40 transition-all duration-300 shadow-md hover:shadow-green-500/10">
            <h2 className="text-gray-400 text-sm">Total Snippets</h2>
            <p className="text-4xl font-extrabold mt-2 text-green-400">{stats.totalSnippets}</p>
          </div>
          <div className="bg-gray-800/70 p-6 rounded-2xl border border-gray-700 hover:border-purple-500/40 transition-all duration-300 shadow-md hover:shadow-purple-500/10">
            <h2 className="text-gray-400 text-sm">Active Today</h2>
            <p className="text-4xl font-extrabold mt-2 text-purple-400">{stats.activeToday}</p>
          </div>
          <div className="bg-gray-800/70 p-6 rounded-2xl border border-gray-700 hover:border-yellow-500/40 transition-all duration-300 shadow-md hover:shadow-yellow-500/10">
            <h2 className="text-gray-400 text-sm">GitHub Linked Users</h2>
            <p className="text-4xl font-extrabold mt-2 text-yellow-400">{githubUsers.length}</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* User Growth */}
          <div className="bg-gray-800/70 p-6 rounded-2xl border border-gray-700 shadow-md hover:shadow-blue-500/10 transition-all duration-300">
            <h2 className="font-semibold mb-4 text-blue-400">📈 User Growth (30 Days)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Snippet Activity */}
          <div className="bg-gray-800/70 p-6 rounded-2xl border border-gray-700 shadow-md hover:shadow-green-500/10 transition-all duration-300">
            <h2 className="font-semibold mb-4 text-green-400">📝 Snippet Activity (30 Days)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={snippetActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Bar dataKey="snippets" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* GitHub Activity */}
          <div className="bg-gray-800/70 p-6 rounded-2xl border border-gray-700 shadow-md hover:shadow-yellow-500/10 transition-all duration-300">
            <h2 className="font-semibold mb-4 text-yellow-400">🐙 GitHub Connections (Real Data)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={githubChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="date" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Bar dataKey="connections" fill="#facc15" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
