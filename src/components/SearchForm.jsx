import { useState } from "react";

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

const LANGUAGES = ["All Languages", "Russian"];

const RATINGS = [
  { label: "All Ratings", value: "" },
  { label: "Rating 1", value: 1 },
  { label: "Rating 2", value: 2 },
  { label: "Rating 3", value: 3 },
];

export default function SearchForm({ onSearch, isLoading }) {
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [language, setLanguage] = useState("All Languages");
  const [rating, setRating] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    onSearch({
      address: address.trim(),
      category: category === "All Categories" ? "" : category,
      language: language === "All Languages" ? "" : language,
      rating: rating === "" ? null : Number(rating),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <h2 className="form-title">Find Your Nearest Facility</h2>
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
          <input
            id="address"
            type="text"
            className="field-input"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Peachtree St, Atlanta, GA 30301"
            required
          />
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
        </div>
      </div>

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
    </form>
  );
}
