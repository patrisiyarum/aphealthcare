import FacilityCard from "./FacilityCard";

export default function FacilityList({
  facilities,
  userAddress,
  totalFiltered,
  isLoading,
}) {
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-large"></div>
        <p>Calculating driving distances to facilities...</p>
        <p className="loading-subtitle">
          This may take a moment as we compute real driving routes.
        </p>
      </div>
    );
  }

  if (!facilities || facilities.length === 0) {
    return null;
  }

  return (
    <div className="facility-list">
      <div className="results-header">
        <h2>
          📋 Results — {facilities.length} Nearest Facilit
          {facilities.length === 1 ? "y" : "ies"}
        </h2>
        {totalFiltered > facilities.length && (
          <p className="results-subtitle">
            Showing closest {facilities.length} of {totalFiltered} matching
            facilities, sorted by driving distance.
          </p>
        )}
        <p className="results-disclaimer">
          ⚠️ All information shown is sourced exclusively from the AP Healthcare
          knowledge base. If a field states "Not available" or "Not specified," that
          information is not present in the source data.
        </p>
      </div>
      <div className="cards-container">
        {facilities.map((facility, index) => (
          <FacilityCard
            key={facility.id}
            facility={facility}
            userAddress={userAddress}
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}
