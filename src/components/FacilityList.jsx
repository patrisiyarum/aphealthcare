import FacilityCard from "./FacilityCard";

export default function FacilityList({
  facilities,
  userAddress,
  totalFiltered,
}) {
  if (!facilities || facilities.length === 0) return null;

  return (
    <div className="results-section">
      <div className="results-bar">
        <h2 className="results-title">Nearest Facilities</h2>
        {totalFiltered > facilities.length && (
          <span className="results-count">
            Showing {facilities.length} of {totalFiltered} matches
          </span>
        )}
      </div>

      <div className="results-disclaimer">
        All information is sourced exclusively from the AP Healthcare knowledge
        base. Fields marked "Not available" or "Not specified" indicate that
        data is not present in the source file. Distances are calculated as
        driving distance in miles.
      </div>

      <div className="results-cards">
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
