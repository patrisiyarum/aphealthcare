import { useState, useCallback } from "react";
import SearchForm from "./components/SearchForm";
import FacilityList from "./components/FacilityList";
import MapView from "./components/MapView";
import facilitiesData from "./data/facilities.json";
import {
  geocodeAddress,
  getDrivingDistance,
  haversineDistance,
  geocodeFacility,
} from "./utils/geocoding";
import "./App.css";

const MAX_DRIVING_CALC = 15;
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
        // Step 1: Geocode user address
        const userGeo = await geocodeAddress(address);
        if (!userGeo) {
          setError(
            "We could not locate that address. Please double-check and include the city and state (e.g., '123 Main St, Atlanta, GA 30301')."
          );
          setIsLoading(false);
          return;
        }
        setUserLocation(userGeo);
        setLoadingStatus("Filtering facilities...");

        // Step 2: Filter facilities
        let filtered = facilitiesData.filter((f) => {
          const hasAddress =
            f.address &&
            !f.address.toLowerCase().includes("virtual") &&
            f.address.trim().length > 10;
          if (!hasAddress) return false;
          if (category && f.category !== category) return false;
          if (language && (!f.language || f.language !== language)) return false;
          if (rating !== null && rating !== undefined && f.rating !== rating)
            return false;
          return true;
        });

        if (filtered.length === 0) {
          setError(
            "No facilities match your selected filters. Try broadening your search criteria."
          );
          setIsLoading(false);
          return;
        }

        setLoadingStatus(
          `Found ${filtered.length} facilities. Calculating distances...`
        );

        // Step 3: Geocode facilities + straight-line distance
        const geocodedFacilities = [];
        for (let i = 0; i < filtered.length; i++) {
          const facility = filtered[i];
          const cached = sessionStorage.getItem(`geo_${facility.address}`);
          let geo = cached ? JSON.parse(cached) : null;

          if (!geo) {
            geo = await geocodeFacility(facility.address);
            await new Promise((r) => setTimeout(r, 200));
          }

          if (geo) {
            const straightDist = haversineDistance(
              userGeo.lat,
              userGeo.lng,
              geo.lat,
              geo.lng
            );
            geocodedFacilities.push({
              ...facility,
              geocoded: geo,
              straightLineDistance: straightDist,
            });
          } else {
            geocodedFacilities.push({
              ...facility,
              geocoded: null,
              straightLineDistance: Infinity,
            });
          }
        }

        // Step 4: Sort by straight-line distance
        geocodedFacilities.sort(
          (a, b) => a.straightLineDistance - b.straightLineDistance
        );

        // Step 5: Driving distance for closest N
        const closestN = geocodedFacilities.slice(0, MAX_DRIVING_CALC);
        const withDriving = [];

        for (let i = 0; i < closestN.length; i++) {
          const facility = closestN[i];
          setLoadingStatus(
            `Calculating driving route ${i + 1} of ${closestN.length}...`
          );
          if (facility.geocoded) {
            const driving = await getDrivingDistance(
              userGeo.lat,
              userGeo.lng,
              facility.geocoded.lat,
              facility.geocoded.lng
            );
            withDriving.push({ ...facility, drivingDistance: driving });
            await new Promise((r) => setTimeout(r, 150));
          } else {
            withDriving.push(facility);
          }
        }

        // Step 6: Sort by driving distance
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
          totalFiltered: filtered.length,
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
          <div className="header-brand">
            <img src="/logo.png" alt="AP Healthcare" className="header-logo" />
            <div className="header-text">
              <h1>AP Healthcare</h1>
              <span className="header-tagline">FOCUS ON TREATMENT</span>
            </div>
          </div>
          <p className="header-description">
            Find the nearest healthcare facility by driving distance, language,
            and rating
          </p>
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
                Computing real driving routes — this may take a moment.
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
