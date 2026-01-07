import { ArrowLeft } from "lucide-react";
import SnippetGrid from "./SnippetGrid";

export default function CollectionDetailPage({ collection, onBack, onSelectSnippet }) {
  if (!collection) return null;

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <h2 className="text-2xl font-bold text-blue-400">{collection.name}</h2>
        {collection.description ? <p className="text-gray-400 mt-2">{collection.description}</p> : null}
      </div>

      <SnippetGrid snippets={collection.snippets || []} onSelect={onSelectSnippet} />
    </div>
  );
}
