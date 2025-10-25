export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-gray-300">
      <h1 className="text-2xl font-bold text-blue-400 mb-4">🔒 Privacy Policy</h1>
      <p className="text-sm leading-relaxed">
        We respect your privacy. Your personal data (like username, email) is stored securely and
        never shared with third parties. Passwords are hashed using bcrypt and sensitive tokens are
        encrypted with AES-256.
      </p>
    </div>
  );
}
