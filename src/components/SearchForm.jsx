import { useState, useCallback, useRef, useEffect } from "react";

const CATEGORIES = [
  "All Categories",
  "Chiropractic Care",
  "Imaging Facility",
  "Mental Health",
  "Neurology",
  "Pain Management",
  "Physical Therapy",
  "Virtual Pharmacy",
  "Initial Visit Virtual MD",
];

const LANGUAGES = ["All Languages", "English", "Spanish", "Russian"];

const RATINGS = [
  { label: "All Ratings", value: "" },
  { label: "Rating 1", value: 1 },
  { label: "Rating 2", value: 2 },
  { label: "Rating 3", value: 3 },
];

const DISTANCES = [
  { label: "5 Miles", value: 5 },
  { label: "10 Miles", value: 10 },
  { label: "25 Miles", value: 25 },
  { label: "All Locations", value: "" },
];

export default function SearchForm({ onSearch, isLoading }) {
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [language, setLanguage] = useState("All Languages");
  const [rating, setRating] = useState("");
  const [maxDistance, setMaxDistance] = useState("");
  const [locating, setLocating] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback((query) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(query);
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encoded}&limit=5&lang=en&lat=33.75&lon=-84.39`
        );
        const data = await res.json();
        if (data && data.features) {
          const items = data.features.map((f) => {
            const p = f.properties;
            const parts = [
              p.housenumber,
              p.street,
              p.city || p.name,
              p.state,
              p.postcode,
              p.country,
            ].filter(Boolean);
            return parts.join(", ");
          });
          setSuggestions(items);
          setShowSuggestions(items.length > 0);
          setActiveSuggestion(-1);
        }
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  }, []);

  const handleAddressChange = (e) => {
    const val = e.target.value;
    setAddress(val);
    fetchSuggestions(val);
  };

  const selectSuggestion = (suggestion) => {
    setAddress(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && activeSuggestion >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[activeSuggestion]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "User-Agent": "APHealthcareFacilityFinder/1.0" } }
          );
          const data = await res.json();
          if (data && data.address) {
            const a = data.address;
            const parts = [
              a.house_number,
              a.road,
              a.city || a.town || a.village || a.hamlet,
              a.state,
              a.postcode,
            ].filter(Boolean);
            setAddress(parts.join(", "));
          } else {
            setAddress(`${latitude}, ${longitude}`);
          }
        } catch {
          alert("Could not determine your address. Please enter it manually.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        alert("Location access denied. Please enter your address manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    onSearch({
      address: address.trim(),
      category: category === "All Categories" ? "" : category,
      language: language === "All Languages" ? "" : language,
      rating: rating === "" ? null : Number(rating),
      maxDistance: maxDistance === "" ? null : Number(maxDistance),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <h2 className="form-title">Find Your Nearest Provider</h2>
      <p className="form-subtitle">
        Enter your street address below. Use the filters to narrow results by
        treatment type, language spoken, or facility rating.
      </p>

      <div className="form-fields">
        {/* Address */}
        <div className="field">
          <label className="field-label" htmlFor="address">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            Your Street Address
          </label>
          <div className="address-row" ref={wrapperRef}>
            <div className="address-input-wrap">
              <input
                id="address"
                type="text"
                className="field-input"
                value={address}
                onChange={handleAddressChange}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="e.g. 123 Peachtree St, Atlanta, GA 30301"
                autoComplete="off"
                required
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="autocomplete-list">
                  {suggestions.map((s, i) => (
                    <li
                      key={i}
                      className={`autocomplete-item${i === activeSuggestion ? " autocomplete-item--active" : ""}`}
                      onMouseDown={() => selectSuggestion(s)}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              type="button"
              className="btn-locate"
              onClick={useMyLocation}
              disabled={locating || isLoading}
              title="Use my current location"
            >
              {locating ? (
                <span className="btn-spinner btn-spinner--sm"></span>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="filters-row">
          <div className="field">
            <label className="field-label" htmlFor="category">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-3.488 1.495 2.7 1.157a1 1 0 00.788 0l7-3a1 1 0 000-1.838l-7-3.001zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
              </svg>
              Treatment Type
            </label>
            <select
              id="category"
              className="field-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="language">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a18.958 18.958 0 01-3.08 2.768 1 1 0 01-1.182-1.613 16.94 16.94 0 002.726-2.476 16.876 16.876 0 01-2.063-3.566 1 1 0 011.867-.722 14.86 14.86 0 001.55 2.67c.542-.88.998-1.823 1.364-2.806H2a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z"
                  clipRule="evenodd"
                />
              </svg>
              Language
            </label>
            <select
              id="language"
              className="field-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="rating">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Rating
            </label>
            <select
              id="rating"
              className="field-select"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            >
              {RATINGS.map((r) => (
                <option key={r.label} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="distance">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Distance
            </label>
            <select
              id="distance"
              className="field-select"
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
            >
              {DISTANCES.map((d) => (
                <option key={d.label} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="btn-row">
        <button type="submit" className="btn-search" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="btn-spinner"></span>
              Searching...
            </>
          ) : (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
              Find Nearest Facilities
            </>
          )}
        </button>
      </div>
    </form>
  );
}
