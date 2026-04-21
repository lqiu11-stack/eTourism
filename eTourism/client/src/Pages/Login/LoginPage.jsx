import { useState } from "react";
import apple from "../icon/apple.png";
import facebook from "../icon/facebook.png";
import google from "../icon/google.png";
import "./style.css";
import axios from "axios";
// naviagtion for the password reset
import { useNavigate, useSearchParams } from "react-router-dom";

import { auth, googleProvider, facebookProvider } from "../../firebase";
import { signInWithPopup } from "firebase/auth";

const API_BASE = import.meta.env.VITE_API_URL;

export const LoginPage = () => {
  const [email, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const getRedirectPath = (role) => {
    if (redirectTo) return redirectTo;
    if (role === "admin") return "/Dashboard";
    return "/MainPage";
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google login successful:", result.user.email);

      const { data } = await axios.post(`${API_BASE}/auth/google`, {
        email: result.user.email,
        name: result.user.displayName
      }); 
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate(getRedirectPath(data.user.role));

    } catch (err) {
      console.error("Login failed:", err);
      const msg = err.response?.data?.error || "Google Login Failed";
      setError(msg);
    }
  };
  
  const handleFacebookLogin = async () => {
    try {
      setError("");
      const result = await signInWithPopup(auth, facebookProvider);
      console.log("Facebook login successful:", result.user.email);

      const { data } = await axios.post(`${API_BASE}/auth/facebook`, {
        email: result.user.email,
        name: result.user.displayName
      }); 
      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate(getRedirectPath(data.user.role));

    } catch (err) {
      console.error("Facebook Login failed:", err);
      const msg = err.response?.data?.error || "Facebook Login Failed";
      setError(msg);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter username and password.");
      return;
    }
    setError("");
    console.log("Normal Login:", { email, password });
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate(getRedirectPath(data.user.role));
    } catch (err) {
      console.error("Login failed:", err);
      const msg = err.response?.data?.message || "Login failed. Please try again.";
      setError(msg);
    }
  };

  return (
    <div className="login-page">
      <div className="rectangle" />
      <div className="top-links">
          <button className="top-btn" type="submit" onClick={() => navigate("/Eregistrate1")}>
            Join us to become an E-host
          </button>
          <button className="top-btn" type="submit" onClick={() => navigate("/DashBoard")}>
            Admin Login
          </button>
        </div>
      <form className="login-box" onSubmit={handleSubmit}>
        <h1 className="title">Login</h1>
        <p className="subtitle">Begin your journey with a single login</p>
        <input
          type="email"
          placeholder="Username"
          className="input-field"
          value={email}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <div className="error-text">{error}</div>}

        <button className="login-btn" type="submit">
          Start your journey
        </button>

        <button type="button" className="forgot" onClick={() => navigate("/reset")}>
          Forget your password?
        </button>

        <div className="social-row">
          <button type="button" className="social-btn" onClick={handleGoogleLogin}>
            <img src={google} alt="google" />
          </button>
          <button type="button" className="social-btn" onClick={handleFacebookLogin}>
            <img src={facebook} alt="facebook" />
          </button>
          <button type="button" className="social-btn" onClick={() => console.log("Apple login")}>
            <img src={apple} alt="apple" />
          </button>
        </div>
      </form>
    </div>
  );
};
