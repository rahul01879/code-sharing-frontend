import { Link } from "react-router-dom";
import { Code2, Github, Linkedin, Mail, Twitter } from "lucide-react";

const APP_NAME = "CODEX";

const quickLinks = [
  { label: "Home", to: "/" },
  { label: "Add Snippet", to: "/add" },
  { label: "Collections", to: "/collections" },
  { label: "Profile", to: "/profile" },
];

const resourceLinks = [
  { label: "Documentation", to: "/docs" },
  { label: "FAQs", to: "/faq" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
];

const SUPPORT_EMAIL = "support@codex.dev";

const socialLinks = [
  { label: "GitHub", href: import.meta.env.VITE_GITHUB_URL || "https://github.com", Icon: Github },
  { label: "Twitter", href: import.meta.env.VITE_TWITTER_URL || "https://twitter.com", Icon: Twitter },
  { label: "LinkedIn", href: import.meta.env.VITE_LINKEDIN_URL || "https://linkedin.com", Icon: Linkedin },
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 text-gray-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2 group">
              <Code2 className="text-blue-400 group-hover:text-blue-300 transition-colors" size={22} />
              <h2 className="text-xl font-bold text-white tracking-tight">
                {APP_NAME.slice(0, 4)}
                <span className="text-purple-400">{APP_NAME.slice(4)}</span>
              </h2>
            </Link>

            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              A modern code sharing platform where developers can create, organize, and showcase snippets effortlessly.
            </p>
          </div>

          {/* Quick Links */}
          <nav aria-label="Quick links">
            <h3 className="text-white font-semibold mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-gray-300 hover:text-blue-400 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources">
            <h3 className="text-white font-semibold mb-3">Resources</h3>
            <ul className="space-y-2 text-sm">
              {resourceLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-gray-300 hover:text-blue-400 transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Connect */}
          <div>
            <h3 className="text-white font-semibold mb-3">Connect</h3>
            <p className="text-sm text-gray-400 mb-3">
              Got feedback or questions? Reach out.
            </p>

            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-blue-400 transition-colors"
            >
              <Mail size={16} />
              <span>{SUPPORT_EMAIL}</span>
            </a>

            <div className="flex items-center gap-4 mt-4">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  className="text-gray-300 hover:text-blue-400 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-sm text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="font-semibold text-gray-300">{APP_NAME}</span>. All rights reserved.
          </p>
          <p>
            Built with CodeX by{" "}
            <span className="text-blue-400 font-medium hover:underline">Developers Community</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
