import { Link } from "react-router-dom";
import { Home, PlusSquare, FileText, User, Shield, LogOut } from "lucide-react";

function Header({ current, onNavigate, onLogout }) {
  const navItems = [
    { id: "home", label: "Home", icon: <Home size={18} />, path: "/" },
    { id: "add", label: "Add Snippet", icon: <PlusSquare size={18} />, path: "/add" },
    { id: "my-snippets", label: "My Snippets", icon: <FileText size={18} />, path: "/my-snippets" },
    { id: "profile", label: "Profile", icon: <User size={18} />, path: "/profile" },
    { id: "admin", label: "Admin", icon: <Shield size={18} />, path: "/admin/login" }, 
  ];

  return (
    <header className="bg-gray-900/70 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-800 w-full">
      <div className="flex justify-between items-center px-8 py-4">
        <Link
          to="/"
          className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight"
        >
          CodeShare
        </Link>

        <nav>
          <ul className="flex items-center gap-3">
            {navItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 text-sm font-medium ${
                    current === item.id
                      ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}

            {onLogout && (
              <li>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 px-4 py-2 rounded-full text-white shadow-lg hover:scale-105 transition-all duration-300 text-sm font-medium"
                >
                  <LogOut size={18} /> Logout
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
