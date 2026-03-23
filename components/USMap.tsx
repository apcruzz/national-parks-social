"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import type { GeoJsonObject } from "geojson";
import usStates from "@/data/us-states.json";

const parks = [
  { name: "Yosemite", position: [37.8651, -119.5383] as [number, number] },
  { name: "Yellowstone", position: [44.428, -110.5885] as [number, number] },
  { name: "Zion", position: [37.2982, -113.0263] as [number, number] },
];

export default function USMap() {
  return (
    <MapContainer
      center={[39.8283, -98.5795]}
      zoom={4}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <GeoJSON
        data={usStates as GeoJsonObject}
        style={() => ({
          color: "#444",
          weight: 1,
          fillColor: "#d6d3d1",
          fillOpacity: 0.7,
        })}
      />

      {parks.map((park) => (
        <Marker key={park.name} position={park.position}>
          <Popup>{park.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}