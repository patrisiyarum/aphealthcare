import { getGoogleMapsDirectionsUrl } from "../utils/geocoding";

function RatingStars({ rating }) {
  if (rating === null || rating === undefined) return null;
  return (
    <span className="rating-wrap">
      <span className="stars">
        {[1, 2, 3].map((s) => (
          <span key={s} className={s <= rating ? "star-on" : "star-off"}>
            ★
          </span>
        ))}
      </span>
    </span>
  );
}

export default function FacilityCard({ facility, userAddress, rank }) {
  const {
    name,
    services,
    address,
    category,
    markedGreen,
    hours,
    language,
    rating,
    insurance,
    drivingDistance,
  } = facility;

  const isVirtual =
    !address ||
    address.toLowerCase().includes("virtual") ||
    address.toLowerCase().includes("tele-visit");

  const directionsUrl =
    userAddress && address && !isVirtual
      ? getGoogleMapsDirectionsUrl(userAddress, address)
      : null;

  return (
    <div className={`fcard${markedGreen ? " fcard--green" : ""}`}>
      <div className="fcard-header">
        <span className="fcard-rank">{rank}</span>
        <div className="fcard-title-group">
          <h3 className="fcard-name">{name}</h3>
          <div className="fcard-meta">
            <span className="badge badge--category">{category}</span>
            {markedGreen && (
              <span className="badge badge--green">Preferred</span>
            )}
            <RatingStars rating={rating} />
          </div>
        </div>
        {drivingDistance && (
          <div className="fcard-dist">
            <span className="fcard-dist-mi">{drivingDistance.distanceMiles} mi</span>
            <span className="fcard-dist-time">{drivingDistance.durationMinutes} min</span>
          </div>
        )}
      </div>

      <div className="fcard-body">
        <div className="fcard-info">
          {!isVirtual && address && (
            <span className="fcard-chip">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
              {address}
            </span>
          )}
          {isVirtual && (
            <span className="fcard-chip fcard-chip--virtual">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
              Virtual / Telehealth
            </span>
          )}
          {hours && (
            <span className="fcard-chip">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></svg>
              {hours}
            </span>
          )}
          {language && language !== "English" && (
            <span className="fcard-chip">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a18.958 18.958 0 01-3.08 2.768 1 1 0 01-1.182-1.613 16.94 16.94 0 002.726-2.476 16.876 16.876 0 01-2.063-3.566 1 1 0 011.867-.722 14.86 14.86 0 001.55 2.67c.542-.88.998-1.823 1.364-2.806H2a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd"/></svg>
              {language}
            </span>
          )}
          {insurance && (
            <span className="fcard-chip">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
              {insurance.toLowerCase() === "lien" ? "Lien" : insurance}
            </span>
          )}
        </div>

        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-directions"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Directions
          </a>
        )}
      </div>
    </div>
  );
}
