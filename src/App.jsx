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
            if (language && (!f.language || f.language !== language))
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
          }));

        if (withDistance.length === 0) {
          setError(
            "No facilities match your selected filters. Try broadening your search criteria."
          );
          setIsLoading(false);
          return;
        }

        withDistance.sort(
          (a, b) => a.straightLineDistance - b.straightLineDistance
        );

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
          if (i < closestN.length - 1) {
            await new Promise((r) => setTimeout(r, 100));
          }
        }

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
      {/* ===== TOP NAV ===== */}
      <nav className="topnav">
        <div className="topnav-inner">
          <a href="https://aphealthcare.org" className="topnav-logo-link">
            <img src="/logo.png" alt="AP Healthcare" className="topnav-logo" />
          </a>
          <div className="topnav-links">
            <a href="https://aphealthcare.org/services/attorneys/">Attorneys</a>
            <a href="https://aphealthcare.org/services/medica-providers/">Medical Providers</a>
            <a href="https://aphealthcare.org/services/injured-patients/">Injured Patients</a>
            <a href="https://aphealthcare.org/about/">About</a>
            <a href="https://aphealthcare.org/contact-us/">Contact Us</a>
          </div>
          <div className="topnav-actions">
            <a href="tel:4048509600" className="topnav-phone">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
              (404) 850-9600
            </a>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">Provider Map</h1>
          <p className="hero-sub">
            Find your nearest healthcare facility based on driving distance,
            language spoken, and facility ratings.
          </p>
        </div>
      </section>

      {/* ===== MAIN ===== */}
      <main className="main">
        <div className="container">
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />

          {isLoading && (
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

          {searched &&
            !isLoading &&
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
        <div className="footer-top">
          <div className="footer-inner">
            <div className="footer-col footer-col--brand">
              <img src="/logo.png" alt="AP Healthcare" className="footer-logo" />
              <p className="footer-brand-text">
                AP Healthcare supports more efficient case resolutions by
                streamlining communication between Providers and Legal Teams.
              </p>
              <div className="footer-social">
                <a href="https://www.facebook.com" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://www.instagram.com" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://www.linkedin.com" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Quick Links</h4>
              <ul className="footer-links">
                <li><a href="https://aphealthcare.org/services/attorneys/">Attorney Services</a></li>
                <li><a href="https://aphealthcare.org/services/medica-providers/">Provider Services</a></li>
                <li><a href="https://aphealthcare.org/services/injured-patients/">Client Services</a></li>
                <li><a href="https://aphealthcare.org/about/">About AP Healthcare</a></li>
                <li><a href="https://aphealthcare.org/contact-us/">Contact Us</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Contact Us</h4>
              <ul className="footer-contact">
                <li>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                  <a href="tel:4048509600">(404) 850-9600</a>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>
                  <a href="mailto:info@aphealthcare.org">info@aphealthcare.org</a>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
                  <span>7000 Peachtree Dunwoody Rd.<br/>Atlanta, GA 30328</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>COPYRIGHT &copy; {new Date().getFullYear()} AP HEALTHCARE &mdash; ALL RIGHTS RESERVED.</p>
          <p className="footer-disclaimer">
            All facility data sourced exclusively from the AP Healthcare knowledge base.
            This tool does not collect or store your address beyond the current session.
          </p>
        </div>
      </footer>
    </div>
  );
}
