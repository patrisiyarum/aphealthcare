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
    if (!address.trim()) {
      return;
    }
    onSearch({
      address: address.trim(),
      category: category === "All Categories" ? "" : category,
      language: language === "All Languages" ? "" : language,
      rating: rating === "" ? null : Number(rating),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="form-header">
        <h2>Find Your Nearest Healthcare Facility</h2>
        <p className="form-subtitle">
          Enter your street address to find the closest facility. Filter by
          category, language, and rating to find the best match for your needs.
        </p>
      </div>

      <div className="form-grid">
        <div className="form-group form-group-address">
          <label htmlFor="address">
            <span className="label-icon">📍</span> Your Street Address
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Main St, Atlanta, GA 30301"
            required
            className="input-address"
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">
            <span className="label-icon">🏥</span> Treatment Type
          </label>
          <select
            id="category"
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

        <div className="form-group">
          <label htmlFor="language">
            <span className="label-icon">🗣️</span> Language
          </label>
          <select
            id="language"
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

        <div className="form-group">
          <label htmlFor="rating">
            <span className="label-icon">⭐</span> Rating
          </label>
          <select
            id="rating"
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

      <button type="submit" className="btn-search" disabled={isLoading}>
        {isLoading ? (
          <>
            <span className="spinner"></span> Calculating distances...
          </>
        ) : (
          <>🔍 Find Nearest Facilities</>
        )}
      </button>
    </form>
  );
}
