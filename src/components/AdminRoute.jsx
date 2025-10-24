
import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children, adminAuth }) {
  const storedAuth = sessionStorage.getItem("adminAuth") === "true";
  const adminKey = sessionStorage.getItem("adminKey");

  const isAdmin = (adminAuth || storedAuth) && !!adminKey;

  if (!isAdmin) {
    // 🚫 Redirect to login if not logged in as admin
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
