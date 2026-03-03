import { useState } from "react";
import apple from "./apple.png";
import facebook from "./facebook.png";
import google from "./google.png";
import "./style.css";

// naviagtion for the password reset
import { useNavigate } from "react-router-dom";


import { auth, googleProvider } from "../../firebase";
import { signInWithPopup } from "firebase/auth";


export const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google login successful:", result.user.email);

      //await axios.post("http://localhost:5000/api/auth/google", {
        //email: result.user.email,
        //name: result.user.displayName
      //}); 
      
      alert("Login successful! Welcome " + result.user.displayName);
    } catch (err) {
      console.error("Login failed:", err);
      setError("Google Login Failed");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please enter username and password.");
      return;
    }
    setError("");
    console.log("Normal Login:", { username, password });
  };

  return (
    <div className="login-page">
      <div className="rectangle" />
      <form className="login-box" onSubmit={handleSubmit}>
        <h1 className="title">Login</h1>
        <p className="subtitle">Begin your journey with a single login</p>
        <input
          type="text"
          placeholder="Username"
          className="input-field"
          value={username}
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

        <button type="button" className="forgot" onClick={() => console.log("Forgot password")}>
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