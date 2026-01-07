import { Edit2, FolderOpen, Trash2 } from "lucide-react";
import { formatDate } from "../../utils/codexUtils";

export default function CollectionsPage({
  collections,
  onSelectCollection,
  onEditCollection,
  onDeleteCollection,
}) {
  return (
    <div className="p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-blue-400 mb-6">My Collections</h2>

      {!collections || collections.length === 0 ? (
        <p className="text-gray-500">No collections yet. Create one by adding a snippet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((c) => (
            <div
              key={c._id}
              onClick={() => onSelectCollection?.(c._id)}
              className="relative group bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700 rounded-2xl p-6 shadow-md hover:shadow-blue-500/30 hover:border-blue-500 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-600/20 rounded-xl p-3 group-hover:bg-blue-600/30 transition">
                  <FolderOpen className="text-blue-400 w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-blue-300">{c.name}</h4>
                  {c.description ? (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{c.description}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex justify-between text-xs text-gray-400">
                <span>{c.snippets?.length || 0} snippets</span>
                <span>{formatDate(c.createdAt)}</span>
              </div>

              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditCollection?.(c);
                  }}
                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                  title="Edit"
                >
                  <Edit2 size={14} className="text-yellow-400" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCollection?.(c._id);
                  }}
                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
                  title="Delete"
                >
                  <Trash2 size={14} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
