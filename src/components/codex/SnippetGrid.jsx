import { useState } from "react";
import SnippetCard from "./SnippetCard";

export default function SnippetGrid({ snippets, onSelect, onTagClick }) {
  const [currentPage, setCurrentPage] = useState(1);
  const snippetsPerPage = 8;

  if (!snippets || snippets.length === 0) {
    return (
      <p className="text-center text-gray-400 text-lg w-full mt-12">
        No snippets to show.
      </p>
    );
  }

  const totalPages = Math.ceil(snippets.length / snippetsPerPage);
  const indexOfLast = currentPage * snippetsPerPage;
  const indexOfFirst = indexOfLast - snippetsPerPage;
  const currentSnippets = snippets.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full">
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentSnippets.map((s) => (
          <SnippetCard key={s._id} snippet={s} onSelect={onSelect} onTagClick={onTagClick} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap justify-center items-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={`px-4 py-2 rounded-lg transition ${
                currentPage === i + 1
                  ? "bg-blue-500 text-white shadow-lg scale-105"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-700 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
