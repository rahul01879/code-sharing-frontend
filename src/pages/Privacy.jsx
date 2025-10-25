export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-gray-300 py-10 px-6">
      <div className="max-w-3xl mx-auto bg-gray-900/60 border border-gray-800 rounded-2xl shadow-lg p-8 backdrop-blur">
        <h1 className="text-3xl font-bold text-blue-400 mb-4">🔒 Privacy Policy</h1>
        <p className="text-base leading-relaxed text-gray-400">
          We respect your privacy. Your personal data (like username and email) is securely stored
          and never shared with third parties. Passwords are hashed using
          <span className="text-green-400 font-medium"> bcrypt</span>, and sensitive tokens are
          encrypted with <span className="text-green-400 font-medium">AES-256</span> to ensure
          top-level security.
        </p>
      </div>
    </div>
  );
}