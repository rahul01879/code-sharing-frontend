export const getBadgeColor = (lang) => {
  const l = String(lang || "").trim().toLowerCase();

  switch (l) {
    case "javascript":
    case "js":
      return "bg-yellow-500/20 text-yellow-300";

    case "typescript":
    case "ts":
      return "bg-sky-500/20 text-sky-300";

    case "css":
      return "bg-blue-500/20 text-blue-300";

    case "html":
    case "markup":
      return "bg-orange-500/20 text-orange-300";

    case "php":
      return "bg-purple-500/20 text-purple-300";

    case "python":
    case "py":
      return "bg-green-500/20 text-green-300";

    case "c":
      return "bg-red-500/20 text-red-300";

    case "cpp":
    case "c++":
      return "bg-rose-500/20 text-rose-300";

    case "csharp":
    case "cs":
    case "c#":
      return "bg-fuchsia-500/20 text-fuchsia-300";

    case "java":
      return "bg-amber-500/20 text-amber-300";

    case "go":
    case "golang":
      return "bg-cyan-500/20 text-cyan-300";

    case "ruby":
    case "rb":
      return "bg-pink-500/20 text-pink-300";

    default:
      return "bg-gray-600/30 text-gray-300";
  }
};

export const formatDate = (d, locale = undefined) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleDateString(locale);
};

export function timeAgo(date) {
  if (!date) return "—";

  const now = Date.now();
  const then = new Date(date).getTime();

  if (!Number.isFinite(then)) return "—";

  const diffSeconds = Math.floor((now - then) / 1000);
  if (diffSeconds <= 0) return "just now";

  const intervals = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, value] of intervals) {
    const count = Math.floor(diffSeconds / value);
    if (count > 0) return `${count}${unit[0]} ago`;
  }

  return "just now";
}

/**
 * Debounce with cancel support:
 * const d = debounce(fn, 300);
 * d(...args);
 * d.cancel(); // cleanup
 */
export function debounce(func, delay = 300) {
  let timer = null;

  const debounced = (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };

  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  return debounced;
}
