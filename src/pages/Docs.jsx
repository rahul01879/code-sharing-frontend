export default function Docs() {
  return (
    <section className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-300 py-20 px-6">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          📘 CODEX Documentation
        </h1>
        <p className="mt-3 text-gray-400 text-base">
          Everything you need to know about creating, managing, and sharing code snippets.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid gap-8 md:grid-cols-2">
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur shadow-lg hover:border-blue-500/50 transition">
          <h2 className="text-xl font-semibold text-blue-400 mb-2">🚀 Getting Started</h2>
          <p className="text-gray-400 text-sm">
            Learn how to create, edit, and share your first snippet within CODEX. Start coding faster
            with our clean, developer-friendly interface.
          </p>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur shadow-lg hover:border-blue-500/50 transition">
          <h2 className="text-xl font-semibold text-blue-400 mb-2">🔗 GitHub Integration</h2>
          <p className="text-gray-400 text-sm">
            Sync your snippets with GitHub repositories instantly. Connect your account in settings
            and push updates directly from CODEX.
          </p>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur shadow-lg hover:border-blue-500/50 transition">
          <h2 className="text-xl font-semibold text-blue-400 mb-2">📁 Collections</h2>
          <p className="text-gray-400 text-sm">
            Organize your snippets into personal or shared collections to keep your workspace clean
            and collaborative.
          </p>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur shadow-lg hover:border-blue-500/50 transition">
          <h2 className="text-xl font-semibold text-blue-400 mb-2">⚙️ Customization</h2>
          <p className="text-gray-400 text-sm">
            Customize themes, syntax highlighting, and editor preferences to match your coding style.
          </p>
        </div>
      </div>
    </section>
  );
}
