import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../App.css";

export default function SignupForm({ onSignup }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/signup", {
        username,
        email,
        password
      });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      onSignup(user, token);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
        {/* Title */}
        <h2 className="text-3xl font-bold text-center text-blue-400 mb-2">
          Create Your Account
        </h2>
        <p className="text-gray-400 text-center mb-6 text-sm">
          Join <span className="text-blue-400 font-semibold">CODE X</span> and start sharing code snippets.
        </p>

        {/* Form */}
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              required
              className="w-full border border-gray-600 bg-gray-900 text-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              required
              className="w-full border border-gray-600 bg-gray-900 text-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              required
              className="w-full border border-gray-600 bg-gray-900 text-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>
          <button
            disabled={loading}
            className={`w-full bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold shadow-md transition transform hover:-translate-y-0.5 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        {/* Link to login */}
        <p className="text-gray-400 text-center mt-6 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
