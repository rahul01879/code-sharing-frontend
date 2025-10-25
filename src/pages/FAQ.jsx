export default function FAQ() {
  const faqs = [
    {
      q: "How do I add a snippet?",
      a: "Click the 'Add Snippet' button in the header. You can paste your code, add a title, tags, and choose visibility (public/private).",
    },
    {
      q: "Is CODEX free to use?",
      a: "Yes. All core features including snippet creation, sharing, and GitHub sync are completely free.",
    },
    {
      q: "Can I collaborate with others?",
      a: "You can share your public snippets via link, and future updates will support real-time group editing.",
    },
    {
      q: "How do I sync with GitHub?",
      a: "Connect your GitHub account in settings, then use the 'Sync GitHub' button in each snippet modal.",
    },
  ];

  return (
    <section className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-300 py-20 px-6">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          ❓ Frequently Asked Questions
        </h1>
        <p className="text-gray-400 text-base mt-3">
          Quick answers to common questions about CODEX.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {faqs.map((item, i) => (
          <div
            key={i}
            className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-blue-500/40 transition shadow-lg backdrop-blur"
          >
            <p className="font-semibold text-blue-300">Q: {item.q}</p>
            <p className="text-gray-400 text-sm mt-2">A: {item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
