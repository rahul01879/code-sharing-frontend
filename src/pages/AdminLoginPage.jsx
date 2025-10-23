import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield } from "lucide-react";

function AdminLoginPage({ onAdminLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔒 Redirect if already logged in as admin
  useEffect(() => {
    const isAdmin = sessionStorage.getItem("adminAuth") === "true";
    const adminKey = sessionStorage.getItem("adminKey");
    if (isAdmin && adminKey) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  // ✅ Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid admin credentials");
      }

      // ✅ Save admin auth info securely in sessionStorage
      sessionStorage.setItem("adminAuth", "true");
      sessionStorage.setItem("adminKey", data.adminKey);

      onAdminLogin?.(data.adminKey);
      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-gray-100 px-4">
      <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-gray-700/50 transition-transform duration-300 hover:scale-[1.02]">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
              <Shield className="text-white w-7 h-7" />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Admin Login
          </h2>
          <p className="text-gray-400 text-sm mt-2">Authorized personnel only 🔒</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <input
              type="text"
              placeholder="👤 Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              placeholder="🔑 Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-200"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded-lg border border-red-700/50">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-blue-500/20 transition-all duration-300 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} CodeX Admin Panel
        </div>
      </div>
    </div>
  );
}

export default AdminLoginPage;
