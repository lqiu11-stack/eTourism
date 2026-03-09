// import {useState } from "react";
import arrowRight from "../icon/arrow-right.png";
import backIcon from "../icon/back.png";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { StepProgress } from "../EhostRegistarte/Step.jsx";

export const Eregistrate2 = () => {
  const navigate = useNavigate();

  return (
    <div className="join-e-host-page">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/Eregistrate1")}
        aria-label="Back"
      >
        <img src={backIcon} alt="Back" className="back-icon" />
      </button>

      <div className="join-e-host-step">
        {/* NEW: flow layout container */}
        <form className="join-box">
          <h1 className="text-wrapper">Ready to become &nbsp;e-host?</h1>

          <StepProgress step={2} />

          <label className="p"> Have you ever have any tourism experience?*</label>
          <div className="checkbox-group">

            <label className="checkbox-item">
                <input
                type="radio"
                name="experience"
                value="yes"
                />
                Yes, I have working experience
            </label>

            <label className="checkbox-item">
                <input
                type="radio"
                name="experience"
                value="no"
                />
                No, I don't have relative working experience
            </label>

            </div>

          <label className="text-wrapper-3">How long have you been working as a tour guide?*</label>
          <div className="input-with-text">
          <input className="rectangle-5" type="text"/>
          <span className="suffix-text">year</span>
          </div>

          <label className="text-wrapper-5">Which country will you prefer to work in?*</label>
          <input className="rectangle-3" type="text" placeholder="Enter country name" />

          <label className="text-wrapper-4">Tell us your past journey</label>
          <div className="email-wrapper">
             <input className="rectangle-4" type="text" placeholder="Tell us more" />
            <button type="submit" className="next-btn" onClick={() => navigate("/Eregistrate3")}>
            <img src={arrowRight} alt="Back" className="next-icon" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};