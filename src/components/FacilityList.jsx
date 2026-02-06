import FacilityCard from "./FacilityCard";

export default function FacilityList({
  facilities,
  userAddress,
  totalFiltered,
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (!facilities || facilities.length === 0) return null;

  const startIdx = (currentPage - 1) * 10;

  return (
    <div className="results-section">
      <div className="results-bar">
        <h2 className="results-title">Nearest Providers</h2>
        <span className="results-count">
          Showing {startIdx + 1}–{startIdx + facilities.length} of{" "}
          {totalFiltered} matches
        </span>
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
            rank={startIdx + index + 1}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
