import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import { t } from "@lingui/macro";

// Fix for Leaflet default icon markers in React
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapSearch({ properties }) {
  const navigate = useNavigate();

  return (
    <div className="h-[500px] w-full rounded-3xl overflow-hidden shadow-xl border-4 border-white dark:border-slate-800 z-0">
      <MapContainer
        center={[13.0827, 80.2707]} // Center of Chennai
        zoom={11}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        {/* Modern Map Style (CartoDB Voyager) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {properties.map((item) => (
          <Marker
            key={item._id}
            position={[item.latitude || 0, item.longitude || 0]}
          >
            <Popup className="custom-popup">
              <div className="w-48 p-1">
                <img
                  src={item.images[0]}
                  className="w-full h-24 object-cover rounded-lg mb-2"
                  alt={item.title}
                />
                <h4 className="font-bold text-sm line-clamp-1">{item.title}</h4>
                <p className="text-blue-600 font-black text-sm">
                  ₹{item.price.toLocaleString()}
                </p>
                <button
                  onClick={() => navigate(`/property/${item._id}`)}
                  className="w-full mt-2 bg-slate-900 text-white py-1.5 rounded-md text-xs font-bold"
                >
                  {t`View All`}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
