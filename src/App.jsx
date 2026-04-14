import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import "prismjs/themes/prism-tomorrow.css";

// User pages
import LoginForm from "./pages/LoginForm";
import SignupForm from "./pages/SignupForm";
import CodeSharingPage from "./pages/CodeSharingPage";
import SnippetDetail from "./pages/SnippetDetail";
import SandboxPreview from "./pages/SandboxPreview";

// Admin pages
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminSnippetsPage from "./pages/AdminSnippetsPage";
import AdminGithubUsersPage from "./pages/AdminGithubUsersPage";

// Public pages
import Docs from "./pages/Docs";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

// Existing admin protector
import AdminRoute from "./components/AdminRoute";

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function safeStorageGet(type, key) {
  try {
    return window?.[type]?.getItem(key) ?? null;
  } catch (err) {
    console.warn(`Unable to read ${key} from ${type}:`, err);
    return null;
  }
}

function safeStorageSet(type, key, value) {
  try {
    window?.[type]?.setItem(key, value);
  } catch (err) {
    console.warn(`Unable to write ${key} to ${type}:`, err);
  }
}

function safeStorageRemove(type, key) {
  try {
    window?.[type]?.removeItem(key);
  } catch (err) {
    console.warn(`Unable to remove ${key} from ${type}:`, err);
  }
}

function AppLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060816] px-6 text-slate-300">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500/70 border-t-transparent" />
        <p className="text-sm font-medium tracking-wide text-slate-400">
          Preparing your workspace...
        </p>
      </div>
    </div>
  );
}

function UserProtectedRoute({ token, children }) {
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function PublicOnlyRoute({ token, children }) {
  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AdminLoginRoute({ adminAuth, children }) {
  if (adminAuth) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

export default function App() {
  const [token, setToken] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [adminAuth, setAdminAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = safeStorageGet("localStorage", "token");
    const savedUser = safeParse(safeStorageGet("localStorage", "user"));
    const savedAdmin = safeStorageGet("sessionStorage", "adminAuth") === "true";
    const savedKey = safeStorageGet("sessionStorage", "adminKey");

    if (savedToken) setToken(savedToken);
    if (savedUser) setCurrentUser(savedUser);
    if (savedAdmin && savedKey) setAdminAuth(true);

    setLoading(false);
  }, []);

  const handleLogin = useCallback((user, newToken) => {
    safeStorageSet("localStorage", "token", newToken);
    safeStorageSet("localStorage", "user", JSON.stringify(user));
    setToken(newToken);
    setCurrentUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    safeStorageRemove("localStorage", "token");
    safeStorageRemove("localStorage", "user");
    setToken(null);
    setCurrentUser(null);
  }, []);

  const handleAdminLogin = useCallback((adminKey) => {
    safeStorageSet("sessionStorage", "adminAuth", "true");
    safeStorageSet("sessionStorage", "adminKey", adminKey);
    setAdminAuth(true);
  }, []);

  const handleAdminLogout = useCallback(() => {
    safeStorageRemove("sessionStorage", "adminAuth");
    safeStorageRemove("sessionStorage", "adminKey");
    setAdminAuth(false);
  }, []);

  const appState = useMemo(
    () => ({
      token,
      currentUser,
      adminAuth,
      isAuthenticated: Boolean(token),
      hasUser: Boolean(currentUser),
    }),
    [token, currentUser, adminAuth]
  );

  if (loading) {
    return <AppLoader />;
  }

  return (
    <Router>
      <Routes>
        {/* Sandbox / frontend preview */}
        <Route path="/sandbox" element={<SandboxPreview />} />

        {/* Public info pages */}
        <Route path="/docs" element={<Docs />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* User auth routes */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute token={appState.token}>
              <LoginForm onLogin={handleLogin} />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <PublicOnlyRoute token={appState.token}>
              <SignupForm onSignup={handleLogin} />
            </PublicOnlyRoute>
          }
        />

        {/* User protected routes */}
        <Route
          path="/"
          element={
            <UserProtectedRoute token={appState.token}>
              <CodeSharingPage
                onLogout={handleLogout}
                currentUser={appState.currentUser}
              />
            </UserProtectedRoute>
          }
        />

        <Route
          path="/snippets/:id"
          element={
            <UserProtectedRoute token={appState.token}>
              <SnippetDetail currentUser={appState.currentUser} />
            </UserProtectedRoute>
          }
        />

        {/* Admin auth */}
        <Route
          path="/admin/login"
          element={
            <AdminLoginRoute adminAuth={appState.adminAuth}>
              <AdminLoginPage onAdminLogin={handleAdminLogin} />
            </AdminLoginRoute>
          }
        />

        {/* Protected admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute adminAuth={appState.adminAuth}>
              <AdminDashboardPage
                onAdminLogout={handleAdminLogout}
                currentUser={appState.currentUser}
              />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute adminAuth={appState.adminAuth}>
              <AdminUsersPage currentUser={appState.currentUser} />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/snippets"
          element={
            <AdminRoute adminAuth={appState.adminAuth}>
              <AdminSnippetsPage currentUser={appState.currentUser} />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/github-users"
          element={
            <AdminRoute adminAuth={appState.adminAuth}>
              <AdminGithubUsersPage currentUser={appState.currentUser} />
            </AdminRoute>
          }
        />

        {/* Fallback */}
        <Route
          path="*"
          element={
            <Navigate
              to={appState.isAuthenticated ? "/" : "/login"}
              replace
            />
          }
        />
      </Routes>
    </Router>
  );
}