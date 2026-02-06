import { getGoogleMapsDirectionsUrl } from "../utils/geocoding";

function RatingStars({ rating }) {
  if (rating === null || rating === undefined) {
    return <span className="rating-na">Rating: Not available</span>;
  }
  return (
    <span className="rating-display">
      Rating: <strong>{rating}</strong> / 3
      <span className="stars">
        {[1, 2, 3].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? "star-filled" : "star-empty"}`}
          >
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
    <div className={`facility-card ${markedGreen ? "facility-green" : ""}`}>
      <div className="card-header">
        <div className="card-rank">#{rank}</div>
        <div className="card-title-area">
          <h3 className="card-title">{name}</h3>
          <span className="card-category">{category}</span>
          {markedGreen && <span className="badge-green">✓ Preferred</span>}
        </div>
      </div>

      <div className="card-body">
        {drivingDistance && (
          <div className="distance-info">
            <span className="distance-value">
              🚗 {drivingDistance.distanceMiles} miles
            </span>
            <span className="distance-duration">
              ≈ {drivingDistance.durationMinutes} min drive
            </span>
          </div>
        )}

        <div className="card-details">
          <div className="detail-row">
            <span className="detail-label">📍 Address:</span>
            <span className="detail-value">
              {isVirtual ? (
                <em>Virtual / Telehealth</em>
              ) : (
                address
              )}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">🩺 Services:</span>
            <span className="detail-value">{services || "Not specified"}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">🕐 Hours:</span>
            <span className="detail-value">{hours || "Not available"}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">🗣️ Language:</span>
            <span className="detail-value">
              {language || "Not specified in knowledge base"}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">⭐ Rating:</span>
            <span className="detail-value">
              <RatingStars rating={rating} />
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">🏷️ Insurance:</span>
            <span className="detail-value">
              {insurance
                ? insurance.toLowerCase() === "lien"
                  ? "Insurance accepted is Lien"
                  : insurance
                : "Insurance information is not available in the knowledge base"}
            </span>
          </div>
        </div>

        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-directions"
          >
            🗺️ Get Driving Directions (Google Maps)
          </a>
        )}

        {isVirtual && (
          <div className="virtual-notice">
            📞 This is a virtual/telehealth facility — no physical visit
            required.
          </div>
        )}
      </div>
    </div>
  );
}
