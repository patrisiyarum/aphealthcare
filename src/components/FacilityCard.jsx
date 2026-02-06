import { getGoogleMapsDirectionsUrl } from "../utils/geocoding";

function RatingStars({ rating }) {
  if (rating === null || rating === undefined) {
    return <span className="rating-na">Not available in knowledge base</span>;
  }
  return (
    <span className="rating-wrap">
      <span className="rating-num">{rating}/3</span>
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
    <div className={`fcard ${markedGreen ? "fcard--green" : ""}`}>
      {/* Top row: rank + name */}
      <div className="fcard-top">
        <div className="fcard-rank">{rank}</div>
        <div className="fcard-heading">
          <div className="fcard-name">{name}</div>
          <div className="fcard-badges">
            <span className="badge badge--category">{category}</span>
            {markedGreen && (
              <span className="badge badge--green">Preferred</span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="fcard-body">
        {/* Distance banner */}
        {drivingDistance && (
          <div className="fcard-distance">
            <span className="fcard-miles">
              {drivingDistance.distanceMiles} miles
            </span>
            <span className="fcard-duration">
              ~{drivingDistance.durationMinutes} min driving
            </span>
          </div>
        )}

        {/* Details */}
        <div className="fcard-details">
          <div className="fcard-row">
            <span className="fcard-label">Address</span>
            <span className="fcard-value">
              {isVirtual ? <em>Virtual / Telehealth</em> : address}
            </span>
          </div>

          <div className="fcard-row">
            <span className="fcard-label">Services</span>
            <span className="fcard-value">{services || "Not specified"}</span>
          </div>

          <div className="fcard-row">
            <span className="fcard-label">Hours</span>
            <span className="fcard-value">
              {hours || "Not available in knowledge base"}
            </span>
          </div>

          <div className="fcard-row">
            <span className="fcard-label">Language</span>
            <span className="fcard-value">
              {language || "Not specified in knowledge base"}
            </span>
          </div>

          <div className="fcard-row">
            <span className="fcard-label">Rating</span>
            <span className="fcard-value">
              <RatingStars rating={rating} />
            </span>
          </div>

          <div className="fcard-row">
            <span className="fcard-label">Insurance</span>
            <span className="fcard-value">
              {insurance
                ? insurance.toLowerCase() === "lien"
                  ? "Insurance accepted is Lien"
                  : insurance
                : "Not available in knowledge base"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="fcard-actions">
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
              Get Driving Directions
            </a>
          )}
        </div>

        {isVirtual && (
          <div className="virtual-banner">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            Virtual / Telehealth — no physical visit required
          </div>
        )}
      </div>
    </div>
  );
}
