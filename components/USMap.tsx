"use client";

import { useEffect } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, Marker, Popup } from "react-leaflet";
import { useMap } from "react-leaflet";
import type { Feature, FeatureCollection } from "geojson";
import usStates from "@/data/us-states.json";

const parks = [
  { name: "Yosemite", position: [37.8651, -119.5383] as [number, number] },
  { name: "Yellowstone", position: [44.428, -110.5885] as [number, number] },
  { name: "Zion", position: [37.2982, -113.0263] as [number, number] },
];

const allStates = usStates as FeatureCollection;

function filterStates(
  predicate: (feature: Feature) => boolean
): FeatureCollection {
  return {
    ...allStates,
    features: allStates.features.filter((feature) =>
      predicate(feature as Feature)
    ),
  };
}

const isAlaska = (feature: Feature) =>
  feature.properties?.name === "Alaska" || feature.id === "02";

const isHawaii = (feature: Feature) =>
  feature.properties?.name === "Hawaii" || feature.id === "15";

const lower48 = filterStates(
  (feature) => !isAlaska(feature) && !isHawaii(feature)
);
const alaska = filterStates(isAlaska);
const hawaii = filterStates(isHawaii);

const stateStyle = () => ({
  color: "#444",
  weight: 1,
  fillColor: "#d6d3d1",
  fillOpacity: 1,
});

type InsetMapProps = {
  center: [number, number];
  zoom: number;
  data: FeatureCollection;
  padding?: [number, number];
};

function FitInsetBounds({
  data,
  padding = [8, 8],
}: {
  data: FeatureCollection;
  padding?: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.geoJSON(data).getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding, animate: false });
    }
  }, [data, map, padding]);

  return null;
}

function InsetMap({ center, zoom, data, padding }: InsetMapProps) {
  return (
    <div className="h-36 w-44 overflow-visible bg-transparent p-0">
      <MapContainer
        center={center}
        zoom={zoom}
        dragging={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomControl={false}
        attributionControl={false}
        className="inset-map h-full w-full border-none bg-transparent outline-none shadow-none"
      >
        <FitInsetBounds data={data} padding={padding} />
        <GeoJSON data={data} style={stateStyle} />
      </MapContainer>
    </div>
  );
}

export default function USMap() {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[38, -98.6]}
        zoom={5}
        scrollWheelZoom={true}
        zoomControl={false}
        className="h-full w-full bg-[#f5f1ea]"
        maxBounds={[
          [15, -170],
          [72, -50],
        ]}
      >
        <GeoJSON data={lower48} style={stateStyle} />

        {parks.map((park) => (
          <Marker key={park.name} position={park.position}>
            <Popup>{park.name}</Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-6 right-6 z-[500] flex flex-col gap-4">
        <div className="pointer-events-auto">
          <InsetMap center={[63, -152]} zoom={2} data={alaska} padding={[2, 2]} />
        </div>
        <div className="pointer-events-auto">
          <InsetMap center={[20.5, -157.5]} zoom={6} data={hawaii} />
        </div>
      </div>
    </div>
  );
}
