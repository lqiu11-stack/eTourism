import { useState } from "react";
import arrowRight from "../icon/arrow-right.png";
import backIcon from "../icon/back.png";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { StepProgress } from "../EhostRegistarte/Step.jsx";

export const Eregistrate3 = () => {
  const navigate = useNavigate();

  const options = [
    "Cultural Tourism",
    "Historical Tourism",
    "Art Tourism",
    "Eco Tourism",
    "Luxury Tourism",
    "Culinary Tourism",
    "Wellness Tourism",
    "Religious Tourism"
  ];

  const [selectedTags, setSelectedTags] = useState([]);

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((item) => item !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="join-e-host-page">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/Eregistrate2")}
        aria-label="Back"
      >
        <img src={backIcon} alt="Back" className="back-icon" />
      </button>

      <div className="join-e-host-step">
        <form className="join-box">
          <h1 className="text-wrapper">Ready to become &nbsp;e-host?</h1>

          <StepProgress step={3} />

          <label className="p">
            What kind of the tourist spot will you prefer to hold the stream?
          </label>

          <div className="tag-container">
            {options.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-button ${selectedTags.includes(tag) ? "active" : ""}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <label className="text-wrapper-3">
            Give us a short description about yourself*
          </label>
          <textarea
            className="rectangle-6"
            />

          <label className="text-wrapper-4">Provide us a video about you and your past journey*</label>
          <div className="email-wrapper">
            <input
              className="rectangle-4"
              type="link"
              placeholder="Link only"
            />
            <button type="submit" className="next-btn">
              <img src={arrowRight} alt="Next" className="next-icon" onClick={() => navigate("/Eregistrate4")}/>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};