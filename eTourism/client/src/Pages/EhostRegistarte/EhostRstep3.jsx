import { useState } from "react";
import { CATEGORIES } from "../../constants/enums";
import arrowRight from "../icon/arrow-right.png";
import backIcon from "../icon/back.png";
import "./style.css";
import { useNavigate } from "react-router-dom";
import { StepProgress } from "../EhostRegistarte/Step.jsx";
import { storage } from "../../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export const Eregistrate3 = () => {
  const navigate = useNavigate();

  const [selectedTags, setSelectedTags] = useState([]);
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    if (!description || !videoFile) {
      setError("Please fill in all required fields.");
      return;
    }

    setUploading(true);
    setError("");
    const storageRef = ref(storage, `videos/${Date.now()}_${videoFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, videoFile);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(progress);
      },
      () => {
        setError("Upload failed. Please try again.");
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        sessionStorage.setItem("ehost_step3", JSON.stringify({
          preferredSpotTypes: selectedTags,
          description,
          videoLink: downloadURL,
        }));
        navigate("/Eregistrate4");
      }
    );
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

          <label className="text-wrapper-4">Provide us a video about you and your past journey*</label>
          {error && <div className="error-text">{error}</div>}
          {uploading && <div className="error-text">Uploading... {uploadProgress}%</div>}
          <div className="email-wrapper">
            <input
              className="rectangle-4"
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              disabled={uploading}
            />
            <button type="submit" className="next-btn" disabled={uploading}>
              <img src={arrowRight} alt="Next" className="next-icon" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
