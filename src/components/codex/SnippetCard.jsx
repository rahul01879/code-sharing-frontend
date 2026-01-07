import { Eye, Heart, MessageSquare } from "lucide-react";
import { FaCode } from "react-icons/fa";
import { formatDate, getBadgeColor } from "../../utils/codexUtils";

export default function SnippetCard({ snippet, onSelect, onTagClick }) {
  return (
    <div
      onClick={() => onSelect?.(snippet._id)}
      className="group w-full bg-gradient-to-b from-[#1a1a2f]/90 to-[#0f0f1a]/95
                 border border-gray-800 rounded-2xl p-5 sm:p-6
                 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_25px_rgba(59,130,246,0.25)]
                 transition-all duration-300 ease-out
                 hover:-translate-y-[4px] hover:scale-[1.01] cursor-pointer
                 overflow-hidden backdrop-blur-md"
      style={{ overflowWrap: "break-word" }}
    >
      <div className="flex flex-wrap justify-between items-center mb-3">
        <h3 className="text-lg sm:text-xl font-semibold text-blue-400 group-hover:text-blue-300 transition-colors duration-300 line-clamp-1">
          {snippet.title || "Untitled"}
        </h3>

        <span
          className={`${getBadgeColor(
            snippet.language
          )} px-3 py-[3px] rounded-full text-[11px] sm:text-xs font-medium uppercase tracking-wide border border-gray-700/70`}
        >
          {snippet.language || "N/A"}
        </span>
      </div>

      <p className="text-gray-300 text-sm sm:text-base leading-snug mb-3 line-clamp-2">
        {snippet.description || "No description provided."}
      </p>

      {snippet.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4" onClick={(e) => e.stopPropagation()}>
          {snippet.tags.map((tag, idx) => (
            <span
              key={`${tag}-${idx}`}
              onClick={() => onTagClick?.(tag)}
              className="bg-gray-800/60 text-gray-300 text-[11px] sm:text-xs px-2 py-[2px] rounded-full border border-gray-700/70 hover:bg-blue-500/30 hover:text-blue-300 transition-all cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="relative bg-[#11111a]/80 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between bg-[#1b1b2f]/80 px-3 py-2 border-b border-gray-800 text-gray-400 text-xs font-mono">
          <div className="flex items-center gap-2">
            <FaCode size={12} className="text-blue-400" />
            <span className="font-medium">{snippet.language || "code"}</span>
          </div>
        </div>

        <pre className="max-h-36 overflow-hidden text-[11px] sm:text-xs p-3 font-mono text-gray-200 leading-relaxed">
          <code className={`language-${(snippet.language || "javascript").toLowerCase()}`}>
            {(snippet.code || "").length > 200 ? (snippet.code || "").slice(0, 200) + "..." : snippet.code || ""}
          </code>
        </pre>

        {(snippet.code || "").length > 200 && (
          <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-[#0f0f1a]/95 to-transparent pointer-events-none" />
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-between items-center text-gray-400 text-[12px] sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 bg-gray-800/70 px-2 py-[3px] rounded-full border border-gray-700/70">
            <Heart size={14} className="text-pink-500" />
            {snippet.likes?.length || 0}
          </span>

          <span className="flex items-center gap-1 bg-gray-800/70 px-2 py-[3px] rounded-full border border-gray-700/70">
            <MessageSquare size={14} className="text-blue-400" />
            {snippet.comments?.length || 0}
          </span>

          <span className="flex items-center gap-1 bg-gray-800/70 px-2 py-[3px] rounded-full border border-gray-700/70">
            <Eye size={14} className="text-green-400" />
            {snippet.views || 0}
          </span>
        </div>

        <div className="flex items-center gap-2 text-gray-500">
          <span className="truncate max-w-[100px] sm:max-w-[150px]">{snippet.author || "Unknown"}</span>
          <span className="text-gray-600">•</span>
          <span>{formatDate(snippet.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
