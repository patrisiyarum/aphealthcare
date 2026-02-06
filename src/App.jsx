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

// Maximum facilities to calculate driving distance for (OSRM rate limits)
const MAX_DRIVING_CALC = 15;
// Maximum results to display
const MAX_RESULTS = 10;

export default function App() {
  const [results, setResults] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async ({ address, category, language, rating }) => {
    setIsLoading(true);
    setError("");
    setResults([]);
    setSearched(true);
    setUserAddress(address);

    try {
      // Step 1: Geocode user's address
      const userGeo = await geocodeAddress(address);
      if (!userGeo) {
        setError(
          "We could not locate that address. Please double-check the address and try again. Make sure to include the city and state (e.g., '123 Main St, Atlanta, GA')."
        );
        setIsLoading(false);
        return;
      }
      setUserLocation(userGeo);

      // Step 2: Filter facilities based on criteria
      let filtered = facilitiesData.filter((f) => {
        // Exclude facilities without usable addresses for distance search
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
          "No facilities match your selected filters. Please try broadening your search criteria."
        );
        setIsLoading(false);
        return;
      }

      // Step 3: Geocode all filtered facilities and calculate straight-line distance
      const geocodedFacilities = [];
      for (const facility of filtered) {
        const cached = sessionStorage.getItem(`geo_${facility.address}`);
        let geo = cached ? JSON.parse(cached) : null;

        if (!geo) {
          geo = await geocodeFacility(facility.address);
          // Small delay to respect Nominatim rate limit
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
          // Include facility without geocoding — it won't have distance
          geocodedFacilities.push({
            ...facility,
            geocoded: null,
            straightLineDistance: Infinity,
          });
        }
      }

      // Step 4: Sort by straight-line distance first
      geocodedFacilities.sort(
        (a, b) => a.straightLineDistance - b.straightLineDistance
      );

      // Step 5: Calculate actual driving distance for the closest N
      const closestN = geocodedFacilities.slice(0, MAX_DRIVING_CALC);
      const withDriving = [];

      for (const facility of closestN) {
        if (facility.geocoded) {
          const driving = await getDrivingDistance(
            userGeo.lat,
            userGeo.lng,
            facility.geocoded.lat,
            facility.geocoded.lng
          );
          withDriving.push({
            ...facility,
            drivingDistance: driving,
          });
          // Small delay to avoid hammering OSRM
          await new Promise((r) => setTimeout(r, 150));
        } else {
          withDriving.push(facility);
        }
      }

      // Step 6: Sort by driving distance (those with driving data first)
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
      setError(
        "An error occurred while searching. Please try again in a moment."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>
            <span className="logo-icon">🏥</span> AP Healthcare Facility Finder
          </h1>
          <p className="header-tagline">
            Find the nearest healthcare facility based on driving distance,
            language spoken, and facility ratings
          </p>
        </div>
      </header>

      <main className="app-main">
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span> {error}
          </div>
        )}

        {results.facilities && results.facilities.length > 0 && (
          <>
            <MapView
              userLocation={userLocation}
              facilities={results.facilities}
            />
            <FacilityList
              facilities={results.facilities}
              userAddress={userAddress}
              totalFiltered={results.totalFiltered}
              isLoading={isLoading}
            />
          </>
        )}

        {searched && !isLoading && !error && (!results.facilities || results.facilities.length === 0) && (
          <div className="no-results">
            <p>No results to display. Please enter your address and search.</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>
          AP Healthcare Facility Finder — All facility data sourced exclusively
          from the AP Healthcare knowledge base.
        </p>
        <p className="footer-disclaimer">
          This tool does not collect or store your address beyond the current
          session. Information not present in the knowledge base is clearly
          indicated.
        </p>
      </footer>
    </div>
  );
}
