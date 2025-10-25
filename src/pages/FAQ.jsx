export default function FAQ() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-gray-300">
      <h1 className="text-2xl font-bold text-blue-400 mb-4">❓ FAQs</h1>
      <ul className="space-y-3 text-sm">
        <li><b>Q:</b> How do I add a snippet? <br/> <b>A:</b> Go to “Add Snippet” in the header.</li>
        <li><b>Q:</b> Is CODEX free to use? <br/> <b>A:</b> Yes, it’s completely free.</li>
        <li><b>Q:</b> Can I sync with GitHub? <br/> <b>A:</b> Yes! Use the “Sync GitHub” button in each snippet modal.</li>
      </ul>
    </div>
  );
}
