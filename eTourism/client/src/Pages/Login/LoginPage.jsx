import { useState } from "react";
import apple from "../icon/apple.png";
import facebook from "../icon/facebook.png";
import google from "../icon/google.png";
import "./style.css";
// naviagtion for the password reset
import { useNavigate } from "react-router-dom";

import { auth, googleProvider } from "../../firebase";
import { signInWithPopup } from "firebase/auth";
import { apiClient } from "../../api/apiClient";

export const LoginPage = () => {
  const [email, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
      const res = await apiClient.post("/auth/login", {
        email,
        password,
      });
      const token = res.data?.token;
      const user = res.data?.user;
      if (!token || !user) {
        setError("Login failed.");
        return;
      }
      localStorage.setItem("authToken", token);
      localStorage.setItem("authUser", JSON.stringify(user));
      if (user.role === "ehost") {
        navigate("/ehost/meeting-links");
        return;
      }
      navigate("/visitor/bookings");
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed.");
    }
  };

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
          placeholder="Email"
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
