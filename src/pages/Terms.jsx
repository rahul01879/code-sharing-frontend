export default function Privacy() {
  return (
    <section className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-300 py-20 px-6">
      <div className="max-w-3xl mx-auto bg-gray-900/60 border border-gray-800 rounded-2xl p-8 backdrop-blur shadow-lg">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent mb-6">
          🔒 Privacy Policy
        </h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          We value your privacy. Your personal information — such as username, email, and saved
          snippets — is stored securely using industry-standard encryption.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed mb-4">
          Passwords are hashed with <span className="text-green-400 font-medium">bcrypt</span>, and
          sensitive tokens are encrypted using
          <span className="text-green-400 font-medium"> AES-256</span> encryption.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed">
          We never sell or share your data with third parties. CODEX complies with modern data
          protection standards to ensure your information remains private and secure.
        </p>
      </div>
    </section>
  );
}
