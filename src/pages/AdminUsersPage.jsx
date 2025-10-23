import React, { useEffect, useState } from "react";
import axios from "axios";
const API = import.meta.env.VITE_API_BASE_URL;
function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const adminKey = sessionStorage.getItem("adminKey");

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/api/admin/users`, {
        headers: {
          "x-admin-key": adminKey, // ✅ REQUIRED
        },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`${API}/api/admin/users/${userId}`, {
          headers: {
            "x-admin-key": adminKey, // ✅ REQUIRED
          },
        });
        setUsers((prev) => prev.filter((user) => user._id !== userId));
      } catch (err) {
        console.error("Error deleting user:", err);
      }
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 min-h-screen bg-gray-900 text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">👥 Manage Users</h1>
        <input
          type="text"
          placeholder="🔍 Search by username or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto bg-gray-800 rounded-xl shadow-lg border border-gray-700">
        <table className="w-full text-left">
          <thead className="bg-gray-700 text-gray-300 uppercase text-sm">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Username</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-700 transition">
                  <td className="px-6 py-3 text-gray-400 truncate">{user._id}</td>
                  <td className="px-6 py-3">{user.username}</td>
                  <td className="px-6 py-3">{user.email}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="px-3 py-1 text-sm rounded bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-6 text-gray-400">
                  🚫 No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsersPage;
