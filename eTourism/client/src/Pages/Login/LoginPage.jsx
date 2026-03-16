import { useState } from "react";
import apple from "../icon/apple.png";
import facebook from "../icon/facebook.png";
import google from "../icon/google.png";
import "./style.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { auth, googleProvider } from "../../firebase";
import { signInWithPopup } from "firebase/auth";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export const LoginPage = () => {
  const [email, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [view, setView] = useState("login");
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [agreement, setAgreement] = useState({ title: "", content: "" });
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google login successful:", result.user.email);

      // await axios.post("http://localhost:5001/api/auth/google", {
      //   email: result.user.email,
      //   name: result.user.displayName
      // }); 
      
      alert("Login successful! Welcome " + result.user.displayName);
    } catch (err) {
      console.error("Login failed:", err);
      setError("Google Login Failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter username and password.");
      return;
    }
    setError("");
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/Mainpage");
    } catch (err) {
      console.error("Login failed:", err);
      const msg = err.response?.data?.message || "Login failed. Please try again.";
      setError(msg);
    }
  };

  const showRegisterForm = () => {
    setError("");
    setView("register");
    setUsername("");
    setPassword("");
    setName("");
    setDateOfBirth("");
  };

  const handleRegisterContinue = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password || !name || !dateOfBirth) {
      setError("Please fill in all fields.");
      return;
    }
    setAgreementLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/agreements`);
      setAgreement({ title: data.title || "User Agreement", content: data.content || "" });
      setView("agreement");
    } catch (err) {
      console.error("Failed to load agreement:", err);
      setError("Failed to load user agreement. Please try again.");
    } finally {
      setAgreementLoading(false);
    }
  };

  const handleAcceptAll = async () => {
    setError("");
    setRegisterLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/register`, {
        email,
        password,
        name,
        date_of_birth: dateOfBirth,
        agreeTerms: true,
      });
      if (data.user?.id) {
        try {
          await axios.post(`${API_BASE}/agreements/accept`, { userId: data.user.id });
        } catch (acceptErr) {
          console.warn("Agreement accept record failed:", acceptErr);
        }
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/Mainpage");
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleRefuseAll = () => {
    setError("You must accept the user agreement to register.");
  };

  const backToLogin = () => {
    setError("");
    setView("login");
  };

  const backToRegister = () => {
    setError("");
    setView("register");
  };

  if (view === "agreement") {
    return (
      <div className="login-page">
        <div className="rectangle" />
        <div className="top-links">
          <button type="button" className="top-btn" onClick={backToRegister}>Back</button>
          <button type="button" className="top-btn" onClick={() => navigate("/Eregistrate1")}>Join us to become an E-host</button>
          <button type="button" className="top-btn">Admin Login</button>
        </div>
        <div className="login-box agreement-box">
          <h1 className="title">{agreement.title}</h1>
          <div className="agreement-content">{agreement.content}</div>
          {error && <div className="error-text">{error}</div>}
          <div className="agreement-buttons">
            <button type="button" className="login-btn" onClick={handleAcceptAll} disabled={registerLoading}>
              {registerLoading ? "Please wait..." : "Accept All"}
            </button>
            <button type="button" className="refuse-btn" onClick={handleRefuseAll} disabled={registerLoading}>
              Refuse All
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "register") {
    return (
      <div className="login-page">
        <div className="rectangle" />
        <div className="top-links">
          <button type="button" className="top-btn" onClick={backToLogin}>Back to Login</button>
          <button type="button" className="top-btn" onClick={() => navigate("/Eregistrate1")}>Join us to become an E-host</button>
          <button type="button" className="top-btn">Admin Login</button>
        </div>
        <form className="login-box" onSubmit={handleRegisterContinue}>
          <h1 className="title">Register</h1>
          <p className="subtitle">Create your account</p>
          <input type="email" placeholder="Email" className="input-field" value={email} onChange={(e) => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="text" placeholder="Name" className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="date" placeholder="Date of birth" className="input-field" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          {error && <div className="error-text">{error}</div>}
          <button className="login-btn" type="submit" disabled={agreementLoading}>
            {agreementLoading ? "Loading..." : "Continue"}
          </button>
          <button type="button" className="forgot" onClick={backToLogin}>Back to Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="rectangle" />
      <div className="top-links">
          <button className="top-btn" type="submit" onClick={() => navigate("/Eregistrate1")}>
            Join us to become an E-host
          </button>
          <button className="top-btn" type="submit">
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

        <button type="button" className="forgot" onClick={showRegisterForm}>
          Don&apos;t have an account? Register
        </button>

        <div className="social-row">
          <button type="button" className="social-btn" onClick={handleGoogleLogin}>
            <img src={google} alt="google" />
          </button>
          <button type="button" className="social-btn" onClick={() => console.log("Facebook login")}>
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
