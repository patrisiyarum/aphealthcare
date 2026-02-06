import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Fix default marker icons in Leaflet + bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const userIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const greenIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitBounds({ userLocation, facilities }) {
  const map = useMap();

  useEffect(() => {
    if (!userLocation && facilities.length === 0) return;

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
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [userLocation, facilities, map]);

  return null;
}

export default function MapView({ userLocation, facilities }) {
  const mapRef = useRef(null);

  if (!userLocation && facilities.length === 0) {
    return null;
  }

  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [33.749, -84.388]; // Default: Atlanta, GA

  return (
    <div className="map-container">
      <h2>🗺️ Facility Map</h2>
      <MapContainer
        center={center}
        zoom={10}
        ref={mapRef}
        style={{ height: "450px", width: "100%", borderRadius: "12px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <strong>📍 Your Location</strong>
              <br />
              {userLocation.displayName || "Your address"}
            </Popup>
          </Marker>
        )}

        {facilities.map((facility) =>
          facility.geocoded ? (
            <Marker
              key={facility.id}
              position={[facility.geocoded.lat, facility.geocoded.lng]}
              icon={facility.markedGreen ? greenIcon : new L.Icon.Default()}
            >
              <Popup>
                <strong>{facility.name}</strong>
                <br />
                {facility.category}
                <br />
                {facility.address}
                {facility.drivingDistance && (
                  <>
                    <br />
                    🚗 {facility.drivingDistance.distanceMiles} mi (
                    {facility.drivingDistance.durationMinutes} min)
                  </>
                )}
              </Popup>
            </Marker>
          ) : null
        )}

        <FitBounds userLocation={userLocation} facilities={facilities} />
      </MapContainer>
    </div>
  );
}
