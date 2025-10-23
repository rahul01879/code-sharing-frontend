export const getBadgeColor = (lang) => {
  switch ((lang || "").toLowerCase()) {
    case "javascript": return "bg-yellow-500/20 text-yellow-300";
    case "css": return "bg-blue-500/20 text-blue-300";
    case "html":
    case "markup": return "bg-orange-500/20 text-orange-300";
    case "php": return "bg-purple-500/20 text-purple-300";
    case "python": return "bg-green-500/20 text-green-300";
    case "c":
    case "cpp": return "bg-red-500/20 text-red-300";
    case "java": return "bg-amber-500/20 text-amber-300";
    case "ruby": return "bg-pink-500/20 text-pink-300";
    default: return "bg-gray-600/30 text-gray-300";
  }
};

export const formatDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return "—"; }
};
