import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Standard Leaflet Icon Fix
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// This component makes the map move when you search
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], 16); // Zoom level 16 is close enough to see streets
    }
  }, [lat, lng, map]);
  return null;
}

export default function LocationPicker({ selectedLocation, onLocationSelect }) {
  if (
    !selectedLocation ||
    selectedLocation.lat === undefined ||
    selectedLocation.lng === undefined
  ) {
    return (
      <div className="h-64 bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400">
        Waiting for valid coordinates...
      </div>
    );
  }

  function ClickHandler() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        onLocationSelect(lat, lng);
      },
    });
    return null;
  }

  return (
    <div className="h-72 w-full rounded-2xl overflow-hidden border-2 border-blue-100 dark:border-slate-700 z-0">
      <MapContainer
        center={[selectedLocation.lat, selectedLocation.lng]}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
        <RecenterMap lat={selectedLocation.lat} lng={selectedLocation.lng} />
        <ClickHandler />
        <Marker
          position={[selectedLocation.lat, selectedLocation.lng]}
          icon={DefaultIcon}
        />
      </MapContainer>
    </div>
  );
}
