import { useState, useCallback } from "react";
import SearchForm from "./components/SearchForm";
import FacilityList from "./components/FacilityList";
import MapView from "./components/MapView";
import facilitiesData from "./data/facilities.json";
import {
  geocodeAddress,
  getDrivingDistance,
  haversineDistance,
} from "./utils/geocoding";
import "./App.css";

// Only compute driving distance for the N closest (by straight line)
const MAX_DRIVING_CALC = 12;
const MAX_RESULTS = 10;

export default function App() {
  const [results, setResults] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(
    async ({ address, category, language, rating }) => {
      setIsLoading(true);
      setError("");
      setResults(null);
      setSearched(true);
      setUserAddress(address);
      setLoadingStatus("Locating your address...");

      try {
        // Step 1: Geocode ONLY the user's address (single request)
        const userGeo = await geocodeAddress(address);
        if (!userGeo) {
          setError(
            "We could not locate that address. Please double-check and include the city and state (e.g., '123 Main St, Atlanta, GA 30301')."
          );
          setIsLoading(false);
          return;
        }
        setUserLocation(userGeo);

        // Step 2: Filter facilities + use PRE-STORED lat/lng (no geocoding!)
        setLoadingStatus("Finding nearest facilities...");

        const withDistance = facilitiesData
          .filter((f) => {
            // Must have a geocoded address
            if (f.lat == null || f.lng == null) return false;
            // Category filter
            if (category && f.category !== category) return false;
            // Language filter
            if (language && (!f.language || f.language !== language))
              return false;
            // Rating filter
            if (rating !== null && rating !== undefined && f.rating !== rating)
              return false;
            return true;
          })
          .map((f) => ({
            ...f,
            geocoded: { lat: f.lat, lng: f.lng },
            straightLineDistance: haversineDistance(
              userGeo.lat,
              userGeo.lng,
              f.lat,
              f.lng
            ),
          }));

        if (withDistance.length === 0) {
          setError(
            "No facilities match your selected filters. Try broadening your search criteria."
          );
          setIsLoading(false);
          return;
        }

        // Step 3: Sort by straight-line distance (instant — no API calls)
        withDistance.sort(
          (a, b) => a.straightLineDistance - b.straightLineDistance
        );

        // Step 4: Compute actual driving distance for closest N only
        const closestN = withDistance.slice(0, MAX_DRIVING_CALC);
        const withDriving = [];

        for (let i = 0; i < closestN.length; i++) {
          const facility = closestN[i];
          setLoadingStatus(
            `Calculating driving route ${i + 1} of ${closestN.length}...`
          );
          const driving = await getDrivingDistance(
            userGeo.lat,
            userGeo.lng,
            facility.geocoded.lat,
            facility.geocoded.lng
          );
          withDriving.push({ ...facility, drivingDistance: driving });
          // Small delay between OSRM requests
          if (i < closestN.length - 1) {
            await new Promise((r) => setTimeout(r, 100));
          }
        }

        // Step 5: Final sort by driving distance
        withDriving.sort((a, b) => {
          const aDist = a.drivingDistance
            ? a.drivingDistance.distanceMeters
            : Infinity;
          const bDist = b.drivingDistance
            ? b.drivingDistance.distanceMeters
            : Infinity;
          return aDist - bDist;
        });

        setResults({
          facilities: withDriving.slice(0, MAX_RESULTS),
          totalFiltered: withDistance.length,
        });
      } catch (err) {
        console.error("Search error:", err);
        setError("An error occurred while searching. Please try again.");
      } finally {
        setIsLoading(false);
        setLoadingStatus("");
      }
    },
    []
  );

  return (
    <div className="app">
      {/* ===== HEADER ===== */}
      <header className="header">
        <div className="header-inner">
          <img src="/logo.png" alt="AP Healthcare — Focus on Treatment" className="header-logo" />
        </div>
        <div className="header-bar">
          <div className="header-bar-inner">
            Find the nearest healthcare facility by driving distance, language,
            and rating
          </div>
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className="main">
        <div className="container">
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />

          {/* Loading state */}
          {isLoading && (
            <div className="loading-card">
              <div className="loading-spinner"></div>
              <p className="loading-text">{loadingStatus}</p>
              <p className="loading-sub">
                Computing driving routes for the closest facilities...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="error-card">
              <div className="error-icon-wrap">!</div>
              <div>
                <p className="error-title">Could not complete search</p>
                <p className="error-text">{error}</p>
              </div>
            </div>
          )}

          {/* Results */}
          {!isLoading && results && results.facilities.length > 0 && (
            <>
              <MapView
                userLocation={userLocation}
                facilities={results.facilities}
                userAddress={userAddress}
              />
              <FacilityList
                facilities={results.facilities}
                userAddress={userAddress}
                totalFiltered={results.totalFiltered}
              />
            </>
          )}

          {/* No results */}
          {searched &&
            !isLoading &&
            !error &&
            (!results || results.facilities.length === 0) && (
              <div className="empty-card">
                <p>No results found. Try a different address or filters.</p>
              </div>
            )}
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="container">
          <img
            src="/logo.png"
            alt="AP Healthcare"
            className="footer-logo"
          />
          <p>
            All facility data sourced exclusively from the AP Healthcare
            knowledge base.
          </p>
          <p className="footer-sub">
            This tool does not collect or store your address beyond the current
            session. If information is not available in the knowledge base, it is
            clearly indicated.
          </p>
        </div>
      </footer>
    </div>
  );
}
