import {useState } from "react";
import arrowRight from "../icon/arrow-right.png";
import backIcon from "../icon/back.png";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { StepProgress } from "../EhostRegistarte/Step.jsx";

export const Eregistrate1 = () => {
  const navigate = useNavigate();

  return (
    <div className="join-e-host-page">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/")}
        aria-label="Back"
      >
        <img src={backIcon} alt="Back" className="back-icon" />
      </button>

      <div className="join-e-host-step">
        {/* NEW: flow layout container */}
        <form className="join-box">
          <h1 className="text-wrapper">Ready to become &nbsp;e-host?</h1>

          <StepProgress step={1} />

          <label className="p">Please tell us your name*</label>
          <input className="div" type="text" placeholder="Enter your name" />

          <label className="text-wrapper-3">Please tell us your birthday*</label>
          <input className="rectangle-2" type="date"/>

          <label className="text-wrapper-4">Please tell us your nationality*</label>
          <input className="rectangle-3" type="text" placeholder="Enter nationality" />

          <label className="text-wrapper-5">Please tell us your E-mail</label>
          <div className="email-wrapper">
            <input className="rectangle-4" type="email" placeholder="Enter email" />
            <button type="submit" className="next-btn" onClick={() => navigate("/Eregistrate2")}>
            <img src={arrowRight} alt="Back" className="next-icon" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};