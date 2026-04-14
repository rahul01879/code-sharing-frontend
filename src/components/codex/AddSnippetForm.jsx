import { useMemo, useState, useCallback, useRef } from "react";
import axios from "axios";
import {
  Code2,
  FileText,
  Tag,
  Globe,
  Lock,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Hash,
  Eye,
  EyeOff,
  Braces,
  AlignLeft,
  Type,
  Layers,
  Wand2,
  Shield,
  Rocket,
  TerminalSquare,
} from "lucide-react";

const API =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITEAPIBASEURL ||
  "";

/* ─────────────────────────────────────────
   One-time CSS
───────────────────────────────────────── */
const CSS = `
  @keyframes asf-fade-up {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes asf-shimmer {
    from { transform:translateX(-100%); }
    to   { transform:translateX(250%); }
  }
  @keyframes asf-shake {
    0%,100% { transform:translateX(0); }
    20%     { transform:translateX(-6px); }
    40%     { transform:translateX(6px); }
    60%     { transform:translateX(-4px); }
    80%     { transform:translateX(4px); }
  }
  @keyframes asf-success-pop {
    0%   { opacity:0; transform:scale(.6); }
    60%  { transform:scale(1.15); }
    100% { opacity:1; transform:scale(1); }
  }
  @keyframes asf-spin {
    to { transform: rotate(360deg); }
  }

  .asf-fade-up { animation: asf-fade-up .25s ease both; }
  .asf-shake { animation: asf-shake .4s ease; }
  .asf-success { animation: asf-success-pop .35s ease both; }
  .asf-spin { animation: asf-spin 1s linear infinite; }

  .asf-shimmer::after {
    content:'';
    position:absolute;
    inset:0;
    border-radius:inherit;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent);
    animation: asf-shimmer 2.4s ease-in-out infinite;
  }

  .asf-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
  .asf-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(148,163,184,.22);
    border-radius: 999px;
  }
  .asf-scrollbar::-webkit-scrollbar-track {
    background: rgba(15,23,42,.3);
  }
`;

let _css = false;
function ensureCSS() {
  if (_css || typeof document === "undefined") return;
  const s = document.createElement("style");
  s.textContent = CSS;
  document.head.appendChild(s);
  _css = true;
}

/* ─────────────────────────────────────────
   Language config
───────────────────────────────────────── */
const LANGUAGES = [
  { value: "javascript", label: "JavaScript", dot: "#fbbf24", preview: true },
  { value: "typescript", label: "TypeScript", dot: "#60a5fa", preview: false },
  { value: "python", label: "Python", dot: "#34d399", preview: false },
  { value: "java", label: "Java", dot: "#fb923c", preview: false },
  { value: "c", label: "C", dot: "#94a3b8", preview: false },
  { value: "cpp", label: "C++", dot: "#f472b6", preview: false },
  { value: "csharp", label: "C#", dot: "#818cf8", preview: false },
  { value: "go", label: "Go", dot: "#22d3ee", preview: false },
  { value: "rust", label: "Rust", dot: "#ea580c", preview: false },
  { value: "php", label: "PHP", dot: "#818cf8", preview: false },
  { value: "ruby", label: "Ruby", dot: "#f87171", preview: false },
  { value: "swift", label: "Swift", dot: "#fb923c", preview: false },
  { value: "kotlin", label: "Kotlin", dot: "#c084fc", preview: false },
  { value: "dart", label: "Dart", dot: "#38bdf8", preview: false },
  { value: "html", label: "HTML", dot: "#f97316", preview: true },
  { value: "css", label: "CSS", dot: "#8b5cf6", preview: true },
  { value: "sql", label: "SQL", dot: "#2dd4bf", preview: false },
  { value: "bash", label: "Bash", dot: "#94a3b8", preview: false },
];

const DIFFICULTIES = [
  { value: "", label: "Not set" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const FRAMEWORKS = [
  "",
  "react",
  "nextjs",
  "node",
  "express",
  "vue",
  "nuxt",
  "angular",
  "svelte",
  "solid",
  "tailwind",
  "mongodb",
  "mysql",
  "postgresql",
  "firebase",
];

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
function sanitizeTag(value = "") {
  return value
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/[^\w-]/g, "")
    .slice(0, 24);
}

function buildSandbox(language, code) {
  const lang = String(language || "").toLowerCase();
  const source = typeof code === "string" ? code : "";

  if (lang === "html") {
    return {
      enabled: true,
      type: "preview",
      mode: "client",
      environment: "browser",
      entryFile: "index.html",
      preview: {
        html: source,
        css: "",
        js: "",
      },
      command: "",
      dependencies: [],
      setupInstructions: "",
      autoRun: true,
      showConsole: true,
      allowExternalAssets: false,
      allowNetwork: false,
      allowFileSystem: false,
      installDependencies: false,
      timeoutMs: 8000,
      memoryLimitMb: 128,
      maxOutputChars: 50000,
      sandboxVersion: "v1",
    };
  }

  if (lang === "css") {
    return {
      enabled: true,
      type: "preview",
      mode: "client",
      environment: "browser",
      entryFile: "styles.css",
      preview: {
        html: "<!DOCTYPE html><html><head></head><body><div class='preview-root'>Preview</div></body></html>",
        css: source,
        js: "",
      },
      command: "",
      dependencies: [],
      setupInstructions: "",
      autoRun: true,
      showConsole: true,
      allowExternalAssets: false,
      allowNetwork: false,
      allowFileSystem: false,
      installDependencies: false,
      timeoutMs: 8000,
      memoryLimitMb: 128,
      maxOutputChars: 50000,
      sandboxVersion: "v1",
    };
  }

  if (lang === "javascript") {
    return {
      enabled: true,
      type: "preview",
      mode: "client",
      environment: "browser",
      entryFile: "index.js",
      preview: {
        html: "<!DOCTYPE html><html><head></head><body><div id='app'></div></body></html>",
        css: "",
        js: source,
      },
      command: "",
      dependencies: [],
      setupInstructions: "",
      autoRun: true,
      showConsole: true,
      allowExternalAssets: false,
      allowNetwork: false,
      allowFileSystem: false,
      installDependencies: false,
      timeoutMs: 8000,
      memoryLimitMb: 128,
      maxOutputChars: 50000,
      sandboxVersion: "v1",
    };
  }

  return {
    enabled: false,
    type: "none",
    mode: "client",
    environment: "",
    entryFile: "",
    preview: { html: "", css: "", js: "" },
    command: "",
    dependencies: [],
    setupInstructions: "",
    autoRun: true,
    showConsole: true,
    allowExternalAssets: false,
    allowNetwork: false,
    allowFileSystem: false,
    installDependencies: false,
    timeoutMs: 8000,
    memoryLimitMb: 128,
    maxOutputChars: 50000,
    sandboxVersion: "v1",
  };
}

function getStarterCode(language) {
  const starters = {
    javascript: `function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet("world"));`,
    typescript: `type User = {
  id: number;
  name: string;
};

const user: User = { id: 1, name: "Ava" };

console.log(user);`,
    python: `def greet(name):
    return f"Hello, {name}!"

print(greet("world"))`,
    java: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello, world!");
  }
}`,
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: Inter, sans-serif;
        background: #0f172a;
        color: #e2e8f0;
      }
      .card {
        padding: 24px;
        border-radius: 16px;
        background: rgba(30, 41, 59, 0.9);
        border: 1px solid rgba(148, 163, 184, 0.2);
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Hello Preview</h1>
      <p>Your HTML snippet is ready.</p>
    </div>
  </body>
</html>`,
    css: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #0f172a, #111827);
  color: #e5e7eb;
  font-family: Inter, sans-serif;
}

.preview-root {
  padding: 24px 28px;
  border-radius: 18px;
  background: rgba(17, 24, 39, 0.88);
  border: 1px solid rgba(96, 165, 250, 0.25);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}`,
    bash: `#!/bin/bash
echo "Hello, world!"`,
    sql: `SELECT id, name
FROM users
ORDER BY created_at DESC
LIMIT 10;`,
  };

  return starters[language] || "";
}

/* ─────────────────────────────────────────
   Field wrapper
───────────────────────────────────────── */
function Field({ label, icon, error, hint, children, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {icon}
          {label}
          {required && <span className="text-red-400 text-[10px]">*</span>}
        </label>

        {hint && !error && <div className="text-[10px] text-gray-600">{hint}</div>}

        {error && (
          <span className="asf-fade-up flex items-center gap-1 text-[10px] text-red-400 font-medium">
            <AlertCircle size={10} /> {error}
          </span>
        )}
      </div>

      {children}
    </div>
  );
}

function StyledInput({ error, className = "", ...props }) {
  return (
    <input
      {...props}
      className={`
        w-full px-4 py-3 rounded-xl text-sm text-gray-200
        bg-gray-900/80 border outline-none
        placeholder-gray-600 transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:ring-2 focus:ring-blue-500/25
        ${error
          ? "border-red-500/60 focus:border-red-500/80"
          : "border-gray-700/60 hover:border-gray-600/70 focus:border-blue-500/60"}
        ${className}
      `}
    />
  );
}

function CharCount({ value, max, warn = 0.8 }) {
  const ratio = value.length / max;
  const color =
    ratio >= 1
      ? "text-red-400"
      : ratio >= warn
      ? "text-yellow-400"
      : "text-gray-600";

  return (
    <span className={`text-[10px] tabular-nums transition-colors ${color}`}>
      {value.length}/{max}
    </span>
  );
}

function TagChip({ tag, onRemove, disabled }) {
  return (
    <span
      className="asf-fade-up flex items-center gap-1 px-2.5 py-1 rounded-full
                 bg-blue-500/15 border border-blue-500/30 text-blue-300
                 text-[11px] font-semibold"
    >
      <Hash size={9} />
      {tag}
      {!disabled && (
        <button
          type="button"
          onClick={() => onRemove(tag)}
          className="ml-0.5 text-blue-400/60 hover:text-red-400 transition-colors"
          aria-label={`Remove tag ${tag}`}
        >
          <X size={10} />
        </button>
      )}
    </span>
  );
}

const STEPS = ["Info", "Code", "Settings"];

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const active = i === current;
        const complete = i < current;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold
                  border-2 transition-all duration-300
                  ${
                    complete
                      ? "bg-blue-500 border-blue-500 text-white"
                      : active
                      ? "bg-blue-500/20 border-blue-500 text-blue-400"
                      : "bg-gray-800 border-gray-700 text-gray-600"
                  }
                `}
              >
                {complete ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  active
                    ? "text-blue-400"
                    : complete
                    ? "text-blue-500/70"
                    : "text-gray-600"
                }`}
              >
                {label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-[2px] mx-2 mb-4 rounded transition-all duration-500 ${
                  i < current ? "bg-blue-500" : "bg-gray-800"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   Main AddSnippetForm
───────────────────────────────────────── */
export default function AddSnippetForm({ onAdd, onCancel }) {
  ensureCSS();

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [framework, setFramework] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [code, setCode] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [tagsInput, setTagsInput] = useState("");
  const [tags, setTags] = useState([]);
  const [showCode, setShowCode] = useState(true);
  const [useStarter, setUseStarter] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const formRef = useRef(null);
  const tagInputRef = useRef(null);

  const langMeta = useMemo(
    () => LANGUAGES.find((l) => l.value === language) || LANGUAGES[0],
    [language]
  );

  const codeStats = useMemo(() => {
    const lines = code ? code.split("\n").length : 0;
    const words = code.trim() ? code.trim().split(/\s+/).filter(Boolean).length : 0;
    const chars = code.length;
    return { lines, words, chars };
  }, [code]);

  const previewAvailable = useMemo(() => !!langMeta?.preview, [langMeta]);

  const resetForm = useCallback(() => {
    setStep(0);
    setTitle("");
    setDescription("");
    setLanguage("javascript");
    setFramework("");
    setDifficulty("");
    setCode("");
    setPrivacy("public");
    setTagsInput("");
    setTags([]);
    setShowCode(true);
    setUseStarter(false);
    setErrors({});
    setSubmitError("");
  }, []);

  const addTag = useCallback(() => {
    const raw = sanitizeTag(tagsInput);
    if (!raw || tags.includes(raw) || tags.length >= 8) return;
    setTags((t) => [...t, raw]);
    setTagsInput("");
  }, [tagsInput, tags]);

  const removeTag = useCallback((tag) => {
    setTags((t) => t.filter((x) => x !== tag));
  }, []);

  const handleTagKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag();
      }

      if (e.key === "Backspace" && !tagsInput && tags.length) {
        setTags((t) => t.slice(0, -1));
      }
    },
    [addTag, tagsInput, tags]
  );

  const validateStep = useCallback(
    (s) => {
      const errs = {};

      if (s === 0) {
        if (!title.trim()) errs.title = "Required";
        if (!description.trim()) errs.description = "Required";
        if (title.trim().length < 3) errs.title = "Min 3 chars";
        if (description.trim().length < 8) errs.description = "Min 8 chars";
      }

      if (s === 1) {
        if (!code.trim()) errs.code = "Required";
        else if (code.trim().length < 4) errs.code = "Too short";
      }

      return errs;
    },
    [title, description, code]
  );

  const next = useCallback(() => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) {
      setErrors(errs);
      formRef.current?.classList.add("asf-shake");
      setTimeout(() => formRef.current?.classList.remove("asf-shake"), 450);
      return;
    }

    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, validateStep]);

  const prev = useCallback(() => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const applyStarterTemplate = useCallback(() => {
    const starter = getStarterCode(language);
    if (!starter) return;
    setCode(starter);
    setUseStarter(true);
    setErrors((p) => ({ ...p, code: "" }));
  }, [language]);

  const submit = useCallback(
    async (e) => {
      e.preventDefault();
      if (loading || success) return;

      const allErrs = { ...validateStep(0), ...validateStep(1) };
      if (Object.keys(allErrs).length) {
        setErrors(allErrs);
        setStep(allErrs.title || allErrs.description ? 0 : 1);
        formRef.current?.classList.add("asf-shake");
        setTimeout(() => formRef.current?.classList.remove("asf-shake"), 450);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setSubmitError("You must be logged in.");
        return;
      }

      setLoading(true);
      setSubmitError("");

      try {
        const payload = {
          title: title.trim(),
          description: description.trim(),
          language,
          code,
          tags,
          visibility: privacy,
          framework: framework || undefined,
          difficulty: difficulty || undefined,
          status: "published",
          sandbox: buildSandbox(language, code),
        };

        const res = await axios.post(`${API}/api/snippets`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setSuccess(true);
        onAdd?.(res.data);

        setTimeout(() => {
          resetForm();
          setSuccess(false);
        }, 1800);
      } catch (err) {
        if (err?.response?.status === 401) localStorage.removeItem("token");

        setSubmitError(
          err?.response?.data?.error ||
            "Failed to add snippet. Please try again."
        );

        formRef.current?.classList.add("asf-shake");
        setTimeout(() => formRef.current?.classList.remove("asf-shake"), 450);
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      success,
      validateStep,
      title,
      description,
      language,
      code,
      tags,
      privacy,
      framework,
      difficulty,
      onAdd,
      resetForm,
    ]
  );

  if (success) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div
          className="relative overflow-hidden rounded-3xl border border-emerald-500/30
                     bg-gradient-to-b from-[#0d1f18] to-[#0a1510] p-16 text-center"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/10 blur-3xl rounded-full" />
          </div>

          <div className="relative z-10 flex flex-col items-center gap-4">
            <span
              className="asf-success flex items-center justify-center w-16 h-16 rounded-full
                         bg-emerald-500/20 border-2 border-emerald-500/50"
            >
              <CheckCircle2 size={32} className="text-emerald-400" />
            </span>

            <h3 className="text-xl font-black text-white">Snippet Added!</h3>
            <p className="text-sm text-gray-400">
              Your snippet has been published successfully.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={formRef} className="w-full max-w-3xl mx-auto asf-fade-up">
      <form
        onSubmit={submit}
        className="relative overflow-hidden rounded-3xl border border-gray-700/40
                   bg-[radial-gradient(circle_at_top,rgba(59,130,246,.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(168,85,247,.09),transparent_28%),linear-gradient(to_bottom,#12131f,#0b0d16)]"
        noValidate
      >
        <div className="relative h-[3px] w-full bg-gradient-to-r from-blue-500 via-violet-500 to-cyan-400 overflow-hidden asf-shimmer" />

        <div className="absolute top-0 left-1/4 w-64 h-32 bg-blue-600/8 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-64 h-32 bg-violet-600/8 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <span
                className="flex items-center justify-center w-11 h-11 rounded-2xl
                           bg-blue-500/15 border border-blue-500/25 shadow-lg shadow-blue-500/10"
              >
                <Sparkles size={18} className="text-blue-400" />
              </span>

              <div>
                <h2 className="text-xl font-black text-white tracking-tight leading-none">
                  New Snippet
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Create a polished snippet with metadata, visibility, and preview-ready config
                </p>
              </div>
            </div>

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center justify-center w-9 h-9 rounded-xl
                           border border-gray-700/50 text-gray-500
                           hover:text-white hover:border-gray-600 transition-all"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <StepBar current={step} />

          {step === 0 && (
            <div className="space-y-5 asf-fade-up">
              <Field
                label="Title"
                icon={<Type size={11} />}
                required
                error={errors.title}
                hint={<CharCount value={title} max={80} />}
              >
                <StyledInput
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value.slice(0, 80));
                    setErrors((p) => ({ ...p, title: "" }));
                  }}
                  placeholder="e.g. Custom React useFetch hook"
                  disabled={loading}
                  error={errors.title}
                  maxLength={80}
                  autoFocus
                />
              </Field>

              <Field
                label="Description"
                icon={<AlignLeft size={11} />}
                required
                error={errors.description}
                hint={<CharCount value={description} max={250} />}
              >
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value.slice(0, 250));
                    setErrors((p) => ({ ...p, description: "" }));
                  }}
                  placeholder="What does this snippet do, where is it useful, and what makes it helpful?"
                  disabled={loading}
                  rows={4}
                  maxLength={250}
                  className={`
                    w-full px-4 py-3 rounded-xl text-sm text-gray-200
                    bg-gray-900/80 border outline-none resize-none
                    placeholder-gray-600 transition-all duration-200
                    disabled:opacity-50 focus:ring-2 focus:ring-blue-500/25
                    ${
                      errors.description
                        ? "border-red-500/60 focus:border-red-500/80"
                        : "border-gray-700/60 hover:border-gray-600/70 focus:border-blue-500/60"
                    }
                  `}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Language" icon={<Braces size={11} />} required>
                  <div className="relative">
                    <div
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none"
                      style={{ background: langMeta.dot }}
                    />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      disabled={loading}
                      className="w-full pl-8 pr-10 py-3 rounded-xl text-sm text-gray-200
                                 bg-gray-900/80 border border-gray-700/60
                                 hover:border-gray-600/70 focus:border-blue-500/60
                                 outline-none focus:ring-2 focus:ring-blue-500/25
                                 appearance-none transition-all duration-200
                                 disabled:opacity-50 cursor-pointer"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l.value} value={l.value}>
                          {l.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                  </div>
                </Field>

                <Field
                  label="Difficulty"
                  icon={<Shield size={11} />}
                  hint="Optional"
                >
                  <div className="relative">
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 pr-10 py-3 rounded-xl text-sm text-gray-200
                                 bg-gray-900/80 border border-gray-700/60
                                 hover:border-gray-600/70 focus:border-blue-500/60
                                 outline-none focus:ring-2 focus:ring-blue-500/25
                                 appearance-none transition-all duration-200
                                 disabled:opacity-50 cursor-pointer"
                    >
                      {DIFFICULTIES.map((item) => (
                        <option key={item.value || "unset"} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                  </div>
                </Field>
              </div>

              <Field
                label="Framework"
                icon={<Rocket size={11} />}
                hint="Optional"
              >
                <div className="relative">
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 pr-10 py-3 rounded-xl text-sm text-gray-200
                               bg-gray-900/80 border border-gray-700/60
                               hover:border-gray-600/70 focus:border-blue-500/60
                               outline-none focus:ring-2 focus:ring-blue-500/25
                               appearance-none transition-all duration-200
                               disabled:opacity-50 cursor-pointer"
                  >
                    <option value="">None</option>
                    {FRAMEWORKS.filter(Boolean).map((fw) => (
                      <option key={fw} value={fw}>
                        {fw}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 asf-fade-up">
              <Field
                label="Code"
                icon={<Code2 size={11} />}
                required
                error={errors.code}
                hint={
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCode((v) => !v)}
                      className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showCode ? <EyeOff size={10} /> : <Eye size={10} />}
                      {showCode ? "Hide" : "Show"}
                    </button>

                    <button
                      type="button"
                      onClick={applyStarterTemplate}
                      disabled={loading}
                      className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-40"
                    >
                      <Wand2 size={10} />
                      Starter
                    </button>
                  </div>
                }
              >
                <div
                  className="rounded-2xl overflow-hidden border border-gray-700/60 hover:border-gray-600/70
                             focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20
                             transition-all duration-200"
                >
                  <div
                    className="flex items-center justify-between px-4 py-2.5
                               bg-gray-900/80 border-b border-gray-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: langMeta.dot }}
                      />
                      <span className="text-[10px] font-mono font-semibold text-gray-400 capitalize">
                        {langMeta.label}
                      </span>

                      {previewAvailable && (
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[9px] font-bold
                                     bg-emerald-500/15 border border-emerald-500/25 text-emerald-300"
                        >
                          Preview
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] tabular-nums text-gray-600">
                      {codeStats.lines} lines
                    </span>
                  </div>

                  {showCode && (
                    <textarea
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value);
                        setErrors((p) => ({ ...p, code: "" }));
                      }}
                      placeholder={
                        language === "html"
                          ? "<!-- Paste your HTML here -->"
                          : language === "css"
                          ? "/* Paste your CSS here */"
                          : language === "python"
                          ? "# Paste your code here"
                          : "// Paste your code here..."
                      }
                      disabled={loading}
                      rows={16}
                      spellCheck={false}
                      autoCapitalize="off"
                      autoCorrect="off"
                      className="w-full px-4 py-3 text-[12.5px] font-mono text-gray-200
                                 bg-[#070810]/90 outline-none resize-none
                                 placeholder-gray-700 leading-relaxed
                                 disabled:opacity-50 asf-scrollbar"
                    />
                  )}
                </div>
              </Field>

              <div className="flex flex-wrap gap-2 asf-fade-up">
                {[
                  { label: "Lines", value: codeStats.lines },
                  { label: "Characters", value: codeStats.chars.toLocaleString() },
                  { label: "Words", value: codeStats.words },
                  { label: "Starter", value: useStarter ? "Yes" : "No" },
                ].map(({ label, value }) => (
                  <span
                    key={label}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                               bg-gray-800/60 border border-gray-700/40
                               text-[10px] font-semibold text-gray-500 tabular-nums"
                  >
                    <Layers size={9} className="text-blue-400" />
                    {value} {label}
                  </span>
                ))}
              </div>

              {previewAvailable && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-emerald-400">
                      <TerminalSquare size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-300">
                        Preview-ready snippet
                      </h4>
                      <p className="text-xs text-emerald-200/75 mt-1">
                        This language will automatically get a client-side preview sandbox when published.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 asf-fade-up">
              <Field
                label="Tags"
                icon={<Tag size={11} />}
                hint={`${tags.length}/8 tags`}
              >
                <div
                  className={`
                    rounded-2xl border bg-gray-900/80 p-3
                    transition-all duration-200
                    focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20
                    ${
                      tags.length >= 8
                        ? "border-yellow-500/40"
                        : "border-gray-700/60 hover:border-gray-600/70"
                    }
                  `}
                >
                  <div className="flex flex-wrap gap-1.5 mb-2 min-h-[26px]">
                    {tags.map((tag) => (
                      <TagChip
                        key={tag}
                        tag={tag}
                        onRemove={removeTag}
                        disabled={loading}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      ref={tagInputRef}
                      value={tagsInput}
                      onChange={(e) => setTagsInput(sanitizeTag(e.target.value))}
                      onKeyDown={handleTagKeyDown}
                      placeholder={
                        tags.length >= 8
                          ? "Max 8 tags reached"
                          : "Type and press Enter or comma…"
                      }
                      disabled={loading || tags.length >= 8}
                      maxLength={24}
                      className="flex-1 text-sm text-gray-200 bg-transparent outline-none
                                 placeholder-gray-600 disabled:opacity-40"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      disabled={!tagsInput.trim() || tags.length >= 8 || loading}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
                                 bg-blue-500/20 border border-blue-500/30 text-blue-300
                                 hover:bg-blue-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Plus size={11} /> Add
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-gray-600 mt-1">
                  Press{" "}
                  <kbd className="px-1 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-500 font-mono">
                    Enter
                  </kbd>{" "}
                  or{" "}
                  <kbd className="px-1 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-500 font-mono">
                    ,
                  </kbd>{" "}
                  to add a tag
                </p>
              </Field>

              <Field label="Visibility" icon={<Globe size={11} />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      value: "public",
                      label: "Public",
                      desc: "Visible to everyone",
                      icon: <Globe size={16} />,
                      active:
                        "border-emerald-500/50 bg-emerald-500/10 text-emerald-300",
                      inactive:
                        "border-gray-700/50 bg-gray-900/60 text-gray-400",
                    },
                    {
                      value: "private",
                      label: "Private",
                      desc: "Only visible to you",
                      icon: <Lock size={16} />,
                      active:
                        "border-violet-500/50 bg-violet-500/10 text-violet-300",
                      inactive:
                        "border-gray-700/50 bg-gray-900/60 text-gray-400",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPrivacy(opt.value)}
                      disabled={loading}
                      className={`
                        flex flex-col items-center gap-2 p-4 rounded-2xl border text-center
                        transition-all duration-200 disabled:opacity-50
                        ${privacy === opt.value ? opt.active : opt.inactive}
                        hover:border-gray-500/60
                      `}
                    >
                      {opt.icon}
                      <span className="text-sm font-bold">{opt.label}</span>
                      <span className="text-[10px] opacity-70">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <div className="rounded-2xl border border-gray-700/40 bg-gray-900/50 p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Review
                </h4>

                {[
                  { label: "Title", value: title || "—", icon: <FileText size={12} /> },
                  { label: "Language", value: langMeta.label, icon: <Braces size={12} /> },
                  {
                    label: "Framework",
                    value: framework || "None",
                    icon: <Rocket size={12} />,
                  },
                  {
                    label: "Difficulty",
                    value:
                      difficulty
                        ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
                        : "Not set",
                    icon: <Shield size={12} />,
                  },
                  {
                    label: "Lines",
                    value: code ? `${codeStats.lines} lines` : "—",
                    icon: <Code2 size={12} />,
                  },
                  {
                    label: "Tags",
                    value: tags.length ? tags.map((t) => `#${t}`).join(", ") : "None",
                    icon: <Tag size={12} />,
                  },
                  {
                    label: "Visibility",
                    value: privacy === "public" ? "Public" : "Private",
                    icon: privacy === "public" ? <Globe size={12} /> : <Lock size={12} />,
                  },
                  {
                    label: "Sandbox",
                    value: previewAvailable ? "Preview enabled" : "Disabled",
                    icon: <TerminalSquare size={12} />,
                  },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600">
                      {icon}
                      {label}
                    </span>
                    <span className="text-xs text-gray-300 font-medium text-right max-w-[62%] break-words">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {submitError && (
            <div
              className="asf-fade-up flex items-start gap-2.5 mt-4 p-3.5 rounded-2xl
                         bg-red-500/10 border border-red-500/30"
            >
              <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{submitError}</p>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-700/40">
            <button
              type="button"
              onClick={prev}
              disabled={step === 0 || loading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold
                         border border-gray-700/60 text-gray-400
                         hover:text-white hover:border-gray-600/70 hover:bg-gray-800/60
                         transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Back
            </button>

            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i === step
                      ? "w-4 h-1.5 bg-blue-500"
                      : i < step
                      ? "w-1.5 h-1.5 bg-blue-500/50"
                      : "w-1.5 h-1.5 bg-gray-700"
                  }`}
                />
              ))}
            </div>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white
                           bg-gradient-to-r from-blue-500 to-violet-600
                           hover:from-blue-400 hover:to-violet-500
                           shadow-lg shadow-blue-500/20
                           transition-all duration-200"
              >
                Next →
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white
                           bg-gradient-to-r from-blue-500 to-violet-600
                           hover:from-blue-400 hover:to-violet-500
                           shadow-lg shadow-blue-500/25
                           transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="asf-spin" /> Publishing…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Publish Snippet
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}