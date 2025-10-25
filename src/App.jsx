import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import "prismjs/themes/prism-tomorrow.css";

// ✅ User Pages
import LoginForm from "./pages/LoginForm";
import SignupForm from "./pages/SignupForm";
import CodeSharingPage from "./pages/CodeSharingPage";
import SnippetDetail from "./pages/SnippetDetail";

// ✅ Admin Pages
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminSnippetsPage from "./pages/AdminSnippetsPage";
import AdminGithubUsersPage from "./pages/AdminGithubUsersPage";

import Docs from "./pages/Docs";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";


// ✅ Route Protector
import AdminRoute from "./components/AdminRoute";

export default function App() {
  // ---------- Utility ----------
  const safeParse = (value) => {
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  };

  // ---------- State ----------
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [adminAuth, setAdminAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  // ---------- Restore session ----------
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = safeParse(localStorage.getItem("user"));
    const savedAdmin = sessionStorage.getItem("adminAuth") === "true";
    const savedKey = sessionStorage.getItem("adminKey");

    if (savedToken) setToken(savedToken);
    if (savedUser) setCurrentUser(savedUser);
    if (savedAdmin && savedKey) setAdminAuth(true);

    setLoading(false);
  }, []);

  // ---------- Auth Handlers ----------
  const handleLogin = (user, newToken) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(newToken);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setCurrentUser(null);
  };

  const handleAdminLogin = (adminKey) => {
    sessionStorage.setItem("adminAuth", "true");
    sessionStorage.setItem("adminKey", adminKey);
    setAdminAuth(true);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("adminAuth");
    sessionStorage.removeItem("adminKey");
    setAdminAuth(false);
  };

  // ---------- Loading splash ----------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-400 text-lg">
        Loading...
      </div>
    );
  }

  // ---------- Routes ----------
  return (
    <Router>
      <Routes>
        {/* USER AUTH ROUTES */}
        <Route
          path="/login"
          element={
            token ? <Navigate to="/" replace /> : <LoginForm onLogin={handleLogin} />
          }
        />

        <Route
          path="/signup"
          element={
            token ? <Navigate to="/" replace /> : <SignupForm onSignup={handleLogin} />
          }
        />

        {/* USER DASHBOARD */}
        <Route
          path="/"
          element={
            token ? (
              <CodeSharingPage onLogout={handleLogout} currentUser={currentUser} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* SNIPPET DETAIL */}
        <Route
          path="/snippets/:id"
          element={
            token ? (
              <SnippetDetail currentUser={currentUser} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ADMIN AUTH ROUTE */}
        <Route
          path="/admin/login"
          element={
            adminAuth ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <AdminLoginPage onAdminLogin={handleAdminLogin} />
            )
          }
        />

        {/* PROTECTED ADMIN ROUTES */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute adminAuth={adminAuth}>
              <AdminDashboardPage onAdminLogout={handleAdminLogout} />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute adminAuth={adminAuth}>
              <AdminUsersPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/snippets"
          element={
            <AdminRoute adminAuth={adminAuth}>
              <AdminSnippetsPage />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/github-users"
          element={
            <AdminRoute adminAuth={adminAuth}>
              <AdminGithubUsersPage />
            </AdminRoute>
          }
        />

        {/* FALLBACK */}
        <Route
          path="*"
          element={<Navigate to={token ? "/" : "/login"} replace />}
        />

        <Route path="/docs" element={<Docs />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

      </Routes>
    </Router>
  );
}
