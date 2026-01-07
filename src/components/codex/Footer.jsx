import { Link } from "react-router-dom";
import { Code2, Github, Linkedin, Mail, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 text-gray-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <Code2 className="text-blue-400" size={22} />
              <h2 className="text-xl font-bold text-white tracking-tight">
                CODE<span className="text-purple-400">X</span>
              </h2>
            </div>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              A modern code sharing platform where developers can create and organize code snippets effortlessly.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-blue-400 transition">Home</Link></li>
              <li><Link to="/add" className="hover:text-blue-400 transition">Add Snippet</Link></li>
              <li><Link to="/collections" className="hover:text-blue-400 transition">Collections</Link></li>
              <li><Link to="/profile" className="hover:text-blue-400 transition">Profile</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/docs" className="hover:text-blue-400 transition">Documentation</Link></li>
              <li><Link to="/faq" className="hover:text-blue-400 transition">FAQs</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-400 transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-blue-400 transition">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Connect</h3>
            <p className="text-sm text-gray-400 mb-3">Got feedback or questions? Reach out.</p>
            <a href="mailto:support@codex.dev" className="flex items-center gap-2 text-sm hover:text-blue-400 transition">
              <Mail size={16} /> support@codex.dev
            </a>

            <div className="flex gap-4 mt-4">
              <a href="https://github.com" className="hover:text-blue-400 transition" target="_blank" rel="noreferrer">
                <Github size={18} />
              </a>
              <a href="https://twitter.com" className="hover:text-blue-400 transition" target="_blank" rel="noreferrer">
                <Twitter size={18} />
              </a>
              <a href="https://linkedin.com" className="hover:text-blue-400 transition" target="_blank" rel="noreferrer">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-sm text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>
            © {new Date().getFullYear()} <span className="font-semibold text-gray-300">CODEX</span>. All rights reserved.
          </p>
          <p>
            Built with ❤ by <span className="text-blue-400 font-medium">Developers Community</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
