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

const PER_PAGE = 10;
const ROUTE_TIMEOUT_MS = 5000;

/** Wraps getDrivingDistance with a timeout so one slow request can't hang the search */
async function getDrivingDistanceWithTimeout(fromLat, fromLng, toLat, toLng) {
  try {
    const result = await Promise.race([
      getDrivingDistance(fromLat, fromLng, toLat, toLng),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), ROUTE_TIMEOUT_MS)
      ),
    ]);
    return result;
  } catch {
    return null;
  }
}

export default function App() {
  const [allFiltered, setAllFiltered] = useState([]);
  const [results, setResults] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  /** Calculate driving distances for a slice of facilities */
  const calcDrivingForPage = useCallback(
    async (facilities, userGeo, statusPrefix) => {
      const withDriving = [];
      for (let i = 0; i < facilities.length; i++) {
        const facility = facilities[i];
        if (statusPrefix) {
          setLoadingStatus(
            `${statusPrefix} ${i + 1} of ${facilities.length}...`
          );
        }
        if (userGeo) {
          const driving = await getDrivingDistanceWithTimeout(
            userGeo.lat,
            userGeo.lng,
            facility.geocoded.lat,
            facility.geocoded.lng
          );
          withDriving.push({ ...facility, drivingDistance: driving });
        } else {
          withDriving.push({ ...facility, drivingDistance: null });
        }
      }
      return withDriving;
    },
    []
  );

  const handleViewAll = useCallback(() => {
    setError("");
    setSearched(true);
    setUserAddress("");
    setUserLocation(null);
    setCurrentPage(1);

    const allWithCoords = facilitiesData
      .filter((f) => f.lat != null && f.lng != null)
      .map((f) => ({
        ...f,
        geocoded: { lat: f.lat, lng: f.lng },
        drivingDistance: null,
      }));

    setAllFiltered(allWithCoords);
    setResults({
      facilities: allWithCoords.slice(0, PER_PAGE),
      totalFiltered: allWithCoords.length,
    });
  }, []);

  const handlePageChange = useCallback(
    async (page) => {
      setCurrentPage(page);
      const start = (page - 1) * PER_PAGE;
      const pageItems = allFiltered.slice(start, start + PER_PAGE);

      if (userLocation) {
        setIsLoadingPage(true);
        setLoadingStatus("Calculating driving routes...");
        const withDriving = await calcDrivingForPage(
          pageItems,
          userLocation,
          "Calculating driving route"
        );
        setResults({
          facilities: withDriving,
          totalFiltered: allFiltered.length,
        });
        setIsLoadingPage(false);
        setLoadingStatus("");
      } else {
        setResults({
          facilities: pageItems,
          totalFiltered: allFiltered.length,
        });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [allFiltered, userLocation, calcDrivingForPage]
  );

  const handleSearch = useCallback(
    async ({ address, category, language, rating, maxDistance }) => {
      setIsLoading(true);
      setError("");
      setResults(null);
      setAllFiltered([]);
      setSearched(true);
      setUserAddress(address);
      setCurrentPage(1);
      setLoadingStatus("Locating your address...");

      try {
        const userGeo = await geocodeAddress(address);
        if (!userGeo) {
          setError(
            "We could not locate that address. Please double-check and include the city and state (e.g., '123 Main St, Atlanta, GA 30301')."
          );
          setIsLoading(false);
          return;
        }
        setUserLocation(userGeo);
        setLoadingStatus("Finding nearest facilities...");

        const withDistance = facilitiesData
          .filter((f) => {
            if (f.lat == null || f.lng == null) return false;
            if (category && f.category !== category) return false;
            if (language && (!f.language || !f.language.includes(language)))
              return false;
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
          }))
          .filter((f) => {
            if (maxDistance !== null && maxDistance !== undefined) {
              return f.straightLineDistance <= maxDistance;
            }
            return true;
          });

        if (withDistance.length === 0) {
          setError(
            "No facilities match your selected filters. Try broadening your search criteria or increasing the distance."
          );
          setIsLoading(false);
          return;
        }

        withDistance.sort(
          (a, b) => a.straightLineDistance - b.straightLineDistance
        );

        // Store all filtered results for pagination
        setAllFiltered(withDistance);

        // Calculate driving for first page only
        const firstPage = withDistance.slice(0, PER_PAGE);
        const withDriving = await calcDrivingForPage(
          firstPage,
          userGeo,
          "Calculating driving route"
        );

        withDriving.sort((a, b) => {
          const aDist = a.drivingDistance
            ? a.drivingDistance.distanceMeters
            : a.straightLineDistance * 1609.34;
          const bDist = b.drivingDistance
            ? b.drivingDistance.distanceMeters
            : b.straightLineDistance * 1609.34;
          return aDist - bDist;
        });

        setResults({
          facilities: withDriving,
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
    [calcDrivingForPage]
  );

  return (
    <div className="app">
      {/* ===== LOGO BAR ===== */}
      <div className="logobar">
        <div className="logobar-inner">
          <img src="/logo.png" alt="AP Healthcare" className="logobar-img" />
        </div>
      </div>

      {/* ===== MAIN ===== */}
      <main className="main">
        <div className="container">
          <SearchForm onSearch={handleSearch} onViewAll={handleViewAll} isLoading={isLoading} />

          {(isLoading || isLoadingPage) && (
            <div className="status-card">
              <div className="spinner"></div>
              <p className="status-text">{loadingStatus}</p>
              <p className="status-sub">
                Computing real driving routes for the closest facilities...
              </p>
            </div>
          )}

          {error && (
            <div className="error-card">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#dc2626"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
              <div>
                <p className="error-title">Search Error</p>
                <p className="error-text">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !isLoadingPage && results && results.facilities.length > 0 && (
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
                currentPage={currentPage}
                totalPages={Math.ceil(allFiltered.length / PER_PAGE)}
                onPageChange={handlePageChange}
              />
            </>
          )}

          {searched &&
            !isLoading &&
            !isLoadingPage &&
            !error &&
            (!results || results.facilities.length === 0) && (
              <div className="empty-card">
                <p>No results found. Try a different address or adjust your filters.</p>
              </div>
            )}
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="site-footer">
        <div className="footer-bottom">
          <p>
            All facility data sourced exclusively from the AP Healthcare
            knowledge base. This tool does not collect or store your address
            beyond the current session.
          </p>
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} AP HEALTHCARE
          </p>
        </div>
      </footer>
    </div>
  );
}
