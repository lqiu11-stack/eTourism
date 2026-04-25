import { useState } from "react";

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

export const logout = (navigate) => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  navigate("/login");
};

export const useAuth = () => {
  const [token] = useState(() => localStorage.getItem("token"));
  const [user] = useState(getStoredUser);

  return {
    token,
    user,
    isLoggedIn: !!token,
    isEhost: user.role === "ehost",
    logout,
  };
};
