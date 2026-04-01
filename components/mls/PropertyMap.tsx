import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { PropertyDisplayData } from '../../lib/mls/types';
import { Link } from 'react-router-dom';

// Fix Leaflet default marker icons for Vite bundler
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface PropertyMapProps {
  properties: PropertyDisplayData[];
}

export default function PropertyMap({ properties }: PropertyMapProps) {
  const mappable = properties.filter(p => p.latitude && p.longitude);
  const center: [number, number] = mappable.length > 0
    ? [mappable[0].latitude!, mappable[0].longitude!]
    : [31.7619, -106.4850]; // El Paso center

  return (
    <MapContainer center={center} zoom={11} className="h-full w-full rounded-lg" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mappable.map(property => (
        <Marker key={property.id} position={[property.latitude!, property.longitude!]} icon={defaultIcon}>
          <Popup>
            <div className="min-w-[200px]">
              {property.images?.[0] && (
                <img src={property.images[0]} alt={property.address} className="w-full h-24 object-cover rounded mb-2" loading="lazy" />
              )}
              <p className="font-bold text-sm">${property.price.toLocaleString()}</p>
              <p className="text-xs text-gray-600 mt-0.5">{property.address}</p>
              <p className="text-xs text-gray-500 mt-0.5">{property.beds} bed &middot; {property.baths} bath &middot; {property.sqft.toLocaleString()} sqft</p>
              {/* GEPAR Rule 18.3.4 + 18.2.12: Listing agent + office required */}
              <p className="text-xs text-gray-400 mt-1 border-t border-gray-100 pt-1">
                {property.listOfficeName} &middot; {property.listAgentName}
              </p>
              <p className="text-[10px] text-gray-400 font-mono">MLS# {property.mlsNumber}</p>
              <Link to={`/property/${property.id}`} className="text-xs text-blue-600 hover:underline mt-1 inline-block">View Details</Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
