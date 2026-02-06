import { useRef, useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getGoogleMapsDirectionsUrl } from "../utils/geocoding";

const MAP_STYLE = { height: "420px", width: "100%" };
const DEFAULT_CENTER = [33.749, -84.388];

// Custom marker icons
const userIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const facilityIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/** Adjusts map bounds whenever markers change */
function FitBounds({ userLocation, facilities }) {
  const map = useMap();

  useEffect(() => {
    const points = [];
    if (userLocation) {
      points.push([userLocation.lat, userLocation.lng]);
    }
    facilities.forEach((f) => {
      if (f.geocoded) {
        points.push([f.geocoded.lat, f.geocoded.lng]);
      }
    });
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, userLocation, facilities]);

  return null;
}

export default function MapView({ userLocation, facilities, userAddress }) {
  if (!userLocation && facilities.length === 0) return null;

  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : DEFAULT_CENTER;

  return (
    <div className="map-section">
      <h2 className="map-section-title">
        <svg width="22" height="22" viewBox="0 0 20 20" fill="#2e7d32">
          <path
            fillRule="evenodd"
            d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM14 5.586v12.828l2.293-2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707L14 1.586v4z"
            clipRule="evenodd"
          />
        </svg>
        Facility Map &amp; Locations
      </h2>

      <div className="map-wrap">
        <MapContainer
          center={center}
          zoom={10}
          style={MAP_STYLE}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds userLocation={userLocation} facilities={facilities} />

          {/* User location marker */}
          {userLocation && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userIcon}
            >
              <Popup>
                <strong>Your Location</strong>
                <br />
                <span style={{ fontSize: "0.85em", color: "#555" }}>
                  {userLocation.displayName || "Your address"}
                </span>
              </Popup>
            </Marker>
          )}

          {/* Facility markers */}
          {facilities.map((facility) =>
            facility.geocoded ? (
              <Marker
                key={facility.id}
                position={[facility.geocoded.lat, facility.geocoded.lng]}
                icon={facility.markedGreen ? greenIcon : facilityIcon}
              >
                <Popup>
                  <div style={{ minWidth: 180, fontFamily: "Montserrat, sans-serif" }}>
                    <strong style={{ fontSize: "0.95em" }}>
                      {facility.name}
                    </strong>
                    <br />
                    <span
                      style={{
                        fontSize: "0.8em",
                        color: "#2e7d32",
                        fontWeight: 600,
                      }}
                    >
                      {facility.category}
                    </span>
                    <br />
                    <span style={{ fontSize: "0.82em", color: "#555" }}>
                      {facility.address}
                    </span>
                    {facility.drivingDistance && (
                      <>
                        <br />
                        <span
                          style={{
                            fontSize: "0.85em",
                            fontWeight: 700,
                            color: "#1b5e20",
                          }}
                        >
                          {facility.drivingDistance.distanceMiles} mi &middot;{" "}
                          {facility.drivingDistance.durationMinutes} min
                        </span>
                      </>
                    )}
                    {userAddress && facility.address && (
                      <>
                        <br />
                        <a
                          href={getGoogleMapsDirectionsUrl(
                            userAddress,
                            facility.address
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: "0.82em",
                            color: "#2e7d32",
                            fontWeight: 700,
                            textDecoration: "underline",
                          }}
                        >
                          Get Directions →
                        </a>
                      </>
                    )}
                  </div>
                </Popup>
              </Marker>
            ) : null
          )}
        </MapContainer>
      </div>
    </div>
  );
}
