export default function FAQ() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-gray-300 py-10 px-6">
      <div className="max-w-3xl mx-auto bg-gray-900/60 border border-gray-800 rounded-2xl shadow-lg p-8 backdrop-blur">
        <h1 className="text-3xl font-bold text-blue-400 mb-6">❓ FAQs</h1>
        <ul className="space-y-5 text-base text-gray-400">
          <li>
            <b className="text-blue-300">Q:</b> How do I add a snippet? <br />
            <b className="text-green-400">A:</b> Go to “Add Snippet” in the header.
          </li>
          <li>
            <b className="text-blue-300">Q:</b> Is CODEX free to use? <br />
            <b className="text-green-400">A:</b> Yes, it’s completely free.
          </li>
          <li>
            <b className="text-blue-300">Q:</b> Can I sync with GitHub? <br />
            <b className="text-green-400">A:</b> Yes! Use the “Sync GitHub” button in each snippet modal.
          </li>
        </ul>
      </div>
    </div>
  );
}