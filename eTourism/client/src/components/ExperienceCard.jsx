import { useNavigate } from "react-router-dom";
import { formatDate } from "../utils/formatDate";

export const ExperienceCard = ({ experience, linkState }) => {
  const navigate = useNavigate();
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const isPast =
    experience?.date_time &&
    new Date(experience.date_time).getTime() <= nowMs;

  return (
    <div
      className={`tour-card${isPast ? " tour-card--past" : ""}`}
      onClick={() => navigate(`/DetailPage?id=${experience.id}`, { state: linkState })}
      style={{ cursor: "pointer" }}
    >
      <div className="tour-image">
        <img src={experience.cover_image} alt={experience.title} />
        <div className="image-overlay">
          <h3>{experience.title}</h3>
        </div>
      </div>
      <div className="tour-info">
        <p>{formatDate(experience.date_time)}</p>
        <p>£{experience.price} / per ticket</p>
        <button className="book-btn">
          {isPast ? "Event ended — view details" : "Click to book >>"}
        </button>
      </div>
    </div>
  );
};
