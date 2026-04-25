import { useEffect, useState } from "react";

const readToken = () => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

export const useAuthToken = () => {
  const [token, setToken] = useState(readToken);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token" || e.key === null) setToken(readToken());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return token;
};
