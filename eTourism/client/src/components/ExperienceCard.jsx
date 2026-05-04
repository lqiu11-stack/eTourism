import { Link, useNavigate } from "react-router-dom";
import { formatDate } from "../utils/formatDate";

export const ExperienceCard = ({ experience, linkState }) => {
  const navigate = useNavigate();
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const isPast =
    experience?.date_time &&
    new Date(experience.date_time).getTime() <= nowMs;

  const goToDetail = () =>
    navigate(`/DetailPage?id=${experience.id}`, { state: linkState });

  return (
    <div
      className={`follow-card follow-card--with-footer${isPast ? " follow-card--past" : ""}`}
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToDetail();
        }
      }}
    >
      <div
        className="follow-card-cover"
        style={experience.cover_image ? { backgroundImage: `url(${experience.cover_image})` } : undefined}
      />
      <div className="follow-card-body">
        <div className="follow-card-host">
          {experience.ehost_profile_image
            ? <img src={experience.ehost_profile_image} alt="" className="follow-card-avatar" />
            : <span className="follow-card-avatar follow-card-avatar--placeholder">
                {(experience.ehost_display_name?.[0] || "?").toUpperCase()}
              </span>}
          {experience.ehost_id ? (
            <Link
              to={`/ehost/${experience.ehost_id}`}
              className="follow-card-name follow-card-name--link"
              onClick={(e) => e.stopPropagation()}
            >
              {experience.ehost_display_name || "Host"}
            </Link>
          ) : (
            <span className="follow-card-name">{experience.ehost_display_name || "Host"}</span>
          )}
        </div>
        <div className="follow-card-title">{experience.title}</div>
        <div className="follow-card-meta">
          {formatDate(experience.date_time)}
          {experience.country ? ` · ${experience.country}` : ""}
        </div>
      </div>
      <div className="follow-card-footer">
        <p>£{experience.price} / per ticket</p>
        <button className="book-btn">
          {isPast ? "Event ended — view details" : "Click to book >>"}
        </button>
      </div>
    </div>
  );
};
