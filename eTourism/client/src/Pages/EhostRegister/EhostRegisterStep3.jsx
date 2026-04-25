import { useState } from "react";
import { CATEGORIES } from "../../constants/enums";
import arrowRight from "../icon/arrow-right.png";
import backIcon from "../icon/back.png";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { StepProgress } from "./Step.jsx";
import { isYouTubeUrl } from "../../utils/youtube";

export const EhostRegisterStep3 = () => {
  const navigate = useNavigate();

  const saved = JSON.parse(sessionStorage.getItem("ehost_step3") || "{}");
  const [selectedTags, setSelectedTags] = useState(saved.selectedTags || []);
  const [description, setDescription] = useState(saved.description || "");
  const [videoLink, setVideoLink] = useState(saved.videoLink || "");
  const [error, setError] = useState("");

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((item) => item !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!description || !videoLink) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!isYouTubeUrl(videoLink)) {
      setError("Please paste a valid YouTube link (e.g. https://youtube.com/watch?v=...).");
      return;
    }

    sessionStorage.setItem("ehost_step3", JSON.stringify({
      selectedTags,
      description,
      videoLink: videoLink.trim(),
    }));
    navigate("/register/ehost/step4");
  };

  return (
    <div className="join-e-host-page">
      <button
        type="button"
        className="back-btn"
        onClick={() => navigate("/register/ehost/step2")}
        aria-label="Back"
      >
        <img src={backIcon} alt="Back" className="back-icon" />
      </button>

      <div className="join-e-host-step">
        <form className="join-box" onSubmit={handleNext}>
          <h1 className="text-wrapper">Ready to become &nbsp;e-host?</h1>

          <StepProgress step={3} />

          <label className="p">
            What kind of the tourist spot will you prefer to hold the stream?
          </label>

          <div className="tag-container">
            {CATEGORIES.map((tag) => (
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label className="text-wrapper-4">Paste a YouTube link about you and your past journey*</label>
          {error && <div className="error-text">{error}</div>}
          <div className="email-wrapper">
            <input
              className="rectangle-4"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
            />
            <button type="submit" className="next-btn">
              <img src={arrowRight} alt="Next" className="next-icon" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
