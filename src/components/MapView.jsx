import { useCallback, useRef, useEffect, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { getGoogleMapsDirectionsUrl } from "../utils/geocoding";

const MAP_CONTAINER = { height: "420px", width: "100%" };

const MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: "poi",
      stylers: [{ visibility: "off" }],
    },
  ],
};

const DEFAULT_CENTER = { lat: 33.749, lng: -84.388 };

export default function MapView({ userLocation, facilities, userAddress }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  const mapRef = useRef(null);
  const [activeMarker, setActiveMarker] = useState(null);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  // Fit bounds when data changes
  useEffect(() => {
    if (!mapRef.current) return;
    if (!userLocation && facilities.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();

    if (userLocation) {
      bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
    }

    facilities.forEach((f) => {
      if (f.geocoded) {
        bounds.extend({ lat: f.geocoded.lat, lng: f.geocoded.lng });
      }
    });

    mapRef.current.fitBounds(bounds, 50);

    // Don't zoom in too far for single markers
    const listener = window.google.maps.event.addListener(
      mapRef.current,
      "idle",
      () => {
        if (mapRef.current.getZoom() > 14) {
          mapRef.current.setZoom(14);
        }
        window.google.maps.event.removeListener(listener);
      }
    );
  }, [userLocation, facilities]);

  if (!userLocation && facilities.length === 0) return null;

  if (!isLoaded) {
    return (
      <div className="map-section">
        <div className="map-wrap" style={{ height: "420px", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f6f5" }}>
          <p style={{ color: "#6b7280" }}>Loading map...</p>
        </div>
      </div>
    );
  }

  const center = userLocation
    ? { lat: userLocation.lat, lng: userLocation.lng }
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
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER}
          center={center}
          zoom={10}
          onLoad={onLoad}
          options={MAP_OPTIONS}
        >
          {/* User location marker */}
          {userLocation && (
            <Marker
              position={{ lat: userLocation.lat, lng: userLocation.lng }}
              icon={{
                url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                scaledSize: new window.google.maps.Size(40, 40),
              }}
              onClick={() => setActiveMarker("user")}
            >
              {activeMarker === "user" && (
                <InfoWindow onCloseClick={() => setActiveMarker(null)}>
                  <div>
                    <strong>Your Location</strong>
                    <br />
                    <span style={{ fontSize: "0.85em", color: "#555" }}>
                      {userLocation.displayName || "Your address"}
                    </span>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          )}

          {/* Facility markers */}
          {facilities.map((facility) =>
            facility.geocoded ? (
              <Marker
                key={facility.id}
                position={{
                  lat: facility.geocoded.lat,
                  lng: facility.geocoded.lng,
                }}
                icon={{
                  url: facility.markedGreen
                    ? "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
                    : "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  scaledSize: new window.google.maps.Size(36, 36),
                }}
                onClick={() => setActiveMarker(facility.id)}
              >
                {activeMarker === facility.id && (
                  <InfoWindow onCloseClick={() => setActiveMarker(null)}>
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
                  </InfoWindow>
                )}
              </Marker>
            ) : null
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
