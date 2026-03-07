import {useState } from "react";
import arrowRight from "../icon/arrow-right.png";
import backIcon from "../icon/back.png";
import "./style.css";
import { useNavigate } from "react-router-dom";

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

          <div className="group">
            <div className="ellipse" />
            <div className="ellipse" />
            <div className="ellipse" />
            <div className="ellipse" />
          </div>

          <div className="text-wrapper-2">Personal detail</div>

          <label className="p">Please tell us your name*</label>
          <input className="div" type="text" placeholder="Enter your name" />

          <label className="text-wrapper-3">Please tell us your birthday*</label>
          <input className="rectangle-2" type="date"/>

          <label className="text-wrapper-4">Please tell us your nationality*</label>
          <input className="rectangle-3" type="text" placeholder="Enter nationality" />

          <label className="text-wrapper-5">Please tell us your E-mail</label>
          <div className="email-wrapper">
            <input className="rectangle-4" type="email" placeholder="Enter email" />
            <button type="submit" className="next-btn">
            <img src={arrowRight} alt="Back" className="next-icon" />
            </button>
          </div>
        </form>
      </div>
    </div>
);
};






.whole-page{
display: flex;
align-items: center;
width: 100%;
}
/* Page background */
.join-e-host-page {
position: relative;
width: 100%;
min-height: 100vh;
overflow: hidden;

background-image: url("../icon/loginback.png");
background-size: cover;
background-position: center;
background-repeat: no-repeat;

display: flex;
align-items: flex-start;
justify-content: flex-start;
padding-left: 10vw;
padding-right: 0;
}

/* Gradient overlay */
.join-e-host-page::before {
content: "";
position: absolute;
inset: 0;
background: linear-gradient(
270deg,
rgba(102,102,102,0) 0%,
rgba(43, 45, 66, 0.836) 65%
);
z-index: 1;
}

/* Keep step as a positioning context */
.join-e-host-step {
position: relative;
z-index: 2;
width: clamp(400px, 35vw, 600px);
color: white;
}

/* The form box: padding-based layout */
.join-box{
display: flex;
flex-direction: column;
gap: 1rem;                 /* spacing between items */
padding: 4rem 0rem 1.5rem 1rem;    
}

/* Title */
.text-wrapper{
font-size: clamp(28px, 3vw, 40px);
margin: 0;
}

/* Section label */
.text-wrapper-2{
font-size: clamp(14px, 1.3vw, 16px);
opacity: 0.95;
}

/* Labels (reuse your classes, but now they behave like normal text) */
.p, .text-wrapper-3, .text-wrapper-4, .text-wrapper-5{
font-size: clamp(16px, 1.4vw, 20px);
margin: 0.5rem 0 0.25rem;
}

/* Inputs (same style as reset page) */
.div, .rectangle-2, .rectangle-3{
height: clamp(40px, 3.5vw, 58px);
border-radius: 999px;
padding: 0 1.2rem;
font-size: clamp(16px, 1.1vw, 18px);

border: none;
outline: none;

background: rgba(255, 255, 255, 0.559);
color: white;
}

.rectangle-4{
height: clamp(40px, 3.5vw, 58px);
border-radius: 999px;
padding: 0 1.2rem;
font-size: clamp(16px, 1.1vw, 18px);
border: none;
outline: none;

background: rgba(255, 255, 255, 0.559);
color: white;
flex: 1;
width: 100%;
}
.email-wrapper{
position: relative;
width: 100%;
}


.join-box input::placeholder{
color: rgb(255, 255, 255);
}

/* Progress bar (now flow layout, not absolute) */
.group{
width: 100%;
height: 4px;
background: white;
border-radius: 20px;

display: flex;
justify-content: space-between;
align-items: center;

margin: 0.25rem 0 0.25rem;
}

.ellipse{
width: 14px;
height: 14px;
background: #7a0000;
border-radius: 50%;
}

/* Back button */
.back-btn {
position: absolute;
top: 40px;
left: 40px;
z-index: 3;
background: none;
border: none;
cursor: pointer;
}
.back-icon{
width: 40px;
display: block;
}

/* Optional next button */
.next-btn{
position: absolute;
top: 50%;
left: calc(100% + 80px);
transform: translateY(-50%);
width: 50px;
height: 50px;
border: none;
background: transparent;
cursor: pointer;

display: flex;
align-items: center;
justify-content: center;
}

.join-box input{
color: white;
}
input[type="date"]{
color: white;
-webkit-text-fill-color: white;
}

input[type="date"]::-webkit-datetime-edit{
color: white;
}

input[type="date"]::-webkit-calendar-picker-indicator{
filter: invert(1);
}

.next-icon{
height: clamp(60px, 4vw, 70px);
width: fit-content;
}