import "./VisitorRegistrate.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import backIcon from "../icon/back.png";

export const VisitorRegistrate = () => {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL;
    const [searchDate, setSearchDate] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    country: "",
    language: "",
    bio: "",
    profile_image: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await axios.post(`${API_BASE}/auth/register`, form);

    alert("Registration successful!");

    setTimeout(() => {
      navigate("/login");
    }, 2000); 
  } catch (err) {
    alert("Register failed");
  }
};

const formatDate = (dt) => {
  if (!dt) return 'DD/MM/YYYY';
  const d = new Date(dt);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

  return (
    <div className="join-e-host-page">
      {/* back button */}
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/login")}
      >
        <img src={backIcon} alt="Back" className="back-icon" />
      </button>

      <div className="join-e-host-step">
        <form className="join-box" onSubmit={handleSubmit}>
          
          <h1 className="vtext-wrapper">Create Account</h1>

          {/* Email */}
          <label className="vp">Email*</label>
          <input
            className="vdiv"
            name="email"
            type="email"
            placeholder="Enter email"
            onChange={handleChange}
            required
          />

          {/* Password */}
          <label className="vtext-wrapper-3">Password*</label>
          <input
            className="vrectangle-2"
            name="password"
            type="password"
            placeholder="Enter password"
            onChange={handleChange}
            required
          />

          {/* First Name */}
          <label className="vtext-wrapper-4">First Name*</label>
          <input
            className="vrectangle-3"
            name="first_name"
            placeholder="Enter first name"
            onChange={handleChange}
            required
          />

          {/* Last Name */}
          <label className="vtext-wrapper-3">Last Name*</label>
          <input
            className="vrectangle-2"
            name="last_name"
            placeholder="Enter last name"
            onChange={handleChange}
            required
          />

          {/* Birthday */}
          <label className="vtext-wrapper-3">Date of Birth*</label>

            <div className="date-field">
            <input
                type="text"
                className="vrectangle-2"
                value={formatDate(searchDate)}
                readOnly
            />

            <input
                type="date"
                className="real-date-input"
                value={searchDate}
                onChange={(e) => {
                setSearchDate(e.target.value);
                setForm({ ...form, date_of_birth: e.target.value });
                }}
                required
            />
            </div>
        
          {/* Country */}
          <label className="vtext-wrapper-3">Country*</label>
          <input
            className="vrectangle-2"
            name="country"
            placeholder="Enter country"
            onChange={handleChange}
            required
          />
        </form>
      </div>
      <div className="join-e-host-step-right">
        <form className="join-box" onSubmit={handleSubmit}>
          {/* Language */}
          <label className="vtext-wrapper-3">Language*</label>
          <input
            className="vrectangle-2"
            name="language"
            placeholder="Enter language"
            onChange={handleChange}
            required
          />

          {/* Bio */}
          <label className="vtext-wrapper-3">Bio</label>
          <textarea
            className="vrectangle-4"
            name="bio"
            placeholder="Tell us about yourself"
            onChange={handleChange}
          />

          {/* Profile Image */}
          <label className="vtext-wrapper-3">Profile Image URL</label>
          <input
            className="vrectangle-2"
            name="profile_image"
            placeholder="Paste image URL"
            onChange={handleChange}
          />

          {/* Submit button */}
          <button type="submit" className="visitor-submit">
            Register →
          </button>

        </form>
      </div>
    </div>
  );
};