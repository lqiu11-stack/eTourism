import { useNavigate } from "react-router-dom";
import { getCountryImage } from "../utils/countryImages";
import { formatDate } from "../utils/formatDate";

export const ExperienceCard = ({ experience, linkState }) => {
  const navigate = useNavigate();

  return (
    <div
      className="tour-card"
      onClick={() => navigate(`/DetailPage?id=${experience.id}`, { state: linkState })}
      style={{ cursor: "pointer" }}
    >
      <div className="tour-image">
        {/* <img src={getCountryImage(experience.country)} alt={experience.title} /> */}
        <img src={experience.cover_image} alt={experience.title} />
        <div className="image-overlay">
          <h3>{experience.title}</h3>
        </div>
      </div>
      <div className="tour-info">
        <p>{formatDate(experience.date_time)}</p>
        <p>£{experience.price} / per ticket</p>
        <button className="book-btn">Click to book &gt;&gt;</button>
      </div>
    </div>
  );
};
