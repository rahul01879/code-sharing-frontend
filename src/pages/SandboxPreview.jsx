import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Eye,
  Trash2,
  LogOut,
} from "lucide-react";
import CodeSharingPage from "./CodeSharingPage";

function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`Unable to read ${key} from localStorage:`, err);
    return null;
  }
}

function safeStorageRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`Unable to remove ${key} from localStorage:`, err);
  }
}

function safeParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function PreviewStatusPill({ icon, label, tone = "slate" }) {
  const toneMap = {
    slate: "border-white/10 bg-white/[0.05] text-slate-300",
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    red: "border-red-500/20 bg-red-500/10 text-red-300",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
        toneMap[tone] || toneMap.slate
      }`}
    >
      {icon}
      {label}
    </span>
  );
}

function PreviewToolbar({
  storageAvailable,
  hasToken,
  hasUser,
  onReload,
  onResetSession,
  onLogout,
}) {
  return (
    <div className="sticky top-0 z-[60] border-b border-white/10 bg-[#050816]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <PreviewStatusPill
                icon={<Eye size={12} />}
                label="Sandbox preview"
                tone="blue"
              />
              <PreviewStatusPill
                icon={<ShieldAlert size={12} />}
                label={storageAvailable ? "Storage available" : "Storage restricted"}
                tone={storageAvailable ? "emerald" : "amber"}
              />
              <PreviewStatusPill
                icon={<LogOut size={12} />}
                label={hasToken ? "User session found" : "Guest mode"}
                tone={hasToken ? "emerald" : "slate"}
              />
              <PreviewStatusPill
                icon={<AlertTriangle size={12} />}
                label={hasUser ? "User profile loaded" : "No user object"}
                tone={hasUser ? "blue" : "amber"}
              />
            </div>

            <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              Frontend sandbox shell
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-400">
              Use this wrapper to preview the Codex app safely inside constrained
              environments. It protects startup from storage-related issues and gives
              you quick recovery controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onReload}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/15"
            >
              <RefreshCw size={15} />
              Reload preview
            </button>

            <button
              type="button"
              onClick={onResetSession}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/15"
            >
              <Trash2 size={15} />
              Reset session
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/15"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewErrorCard({ errorMessage, onReload }) {
  return (
    <div className="mx-auto my-8 w-full max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-red-500/20 bg-red-500/5 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-md sm:p-8">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
          <AlertTriangle size={24} />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white">
          Sandbox preview hit an error
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          The wrapper rendered correctly, but the inner app failed during runtime.
          This usually means one of the imported components, storage access, or API
          bootstrap logic crashed while loading.
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Error
          </p>
          <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-red-200">
            {errorMessage || "Unknown runtime error"}
          </pre>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onReload}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/15"
          >
            <RefreshCw size={15} />
            Reload preview
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SandboxPreview() {
  const [runtimeError, setRuntimeError] = useState("");
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    try {
      const testKey = "__sandbox_preview_test__";
      localStorage.setItem(testKey, "ok");
      localStorage.removeItem(testKey);
      setStorageAvailable(true);
    } catch (err) {
      console.warn("Sandbox storage is restricted:", err);
      setStorageAvailable(false);
    }
  }, []);

  useEffect(() => {
    const handleWindowError = (event) => {
      const message =
        event?.error?.message ||
        event?.message ||
        "An unexpected error occurred while rendering the preview.";
      setRuntimeError(message);
    };

    const handleUnhandledRejection = (event) => {
      const reason = event?.reason;
      const message =
        reason?.message ||
        (typeof reason === "string" ? reason : "Unhandled promise rejection.");
      setRuntimeError(message);
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  const currentUser = useMemo(() => {
    const parsed = safeParse(safeStorageGet("user"));
    return (
      parsed || {
        name: "Sandbox User",
        username: "sandbox-user",
        email: "sandbox@example.com",
        role: "developer",
      }
    );
  }, []);

  const hasToken = Boolean(safeStorageGet("token"));
  const hasUser = Boolean(safeParse(safeStorageGet("user")));

  const reloadPreview = useCallback(() => {
    window.location.reload();
  }, []);

  const resetSession = useCallback(() => {
    safeStorageRemove("token");
    safeStorageRemove("user");
    window.location.reload();
  }, []);

  const handleLogout = useCallback(() => {
    safeStorageRemove("token");
    safeStorageRemove("user");
    window.location.reload();
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_22%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.10),transparent_18%),linear-gradient(180deg,#040714_0%,#070b18_35%,#050816_100%)] text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.18]" />

      <div className="relative z-10">
        <PreviewToolbar
          storageAvailable={storageAvailable}
          hasToken={hasToken}
          hasUser={hasUser}
          onReload={reloadPreview}
          onResetSession={resetSession}
          onLogout={handleLogout}
        />

        {runtimeError ? (
          <PreviewErrorCard errorMessage={runtimeError} onReload={reloadPreview} />
        ) : (
          <CodeSharingPage
            onLogout={handleLogout}
            currentUser={currentUser}
            sandboxMode
          />
        )}
      </div>
    </div>
  );
}