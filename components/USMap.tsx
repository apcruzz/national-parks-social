"use client";

import { useEffect } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, Marker, Popup } from "react-leaflet";
import { useMap } from "react-leaflet";
import type { Feature, FeatureCollection } from "geojson";
import usStates from "@/data/us-states.json";
import { nationalParks } from "@/lib/parks";

// const parks = [
//   { name: "Yosemite", position: [37.8651, -119.5383] as [number, number] },
//   { name: "Yellowstone", position: [44.428, -110.5885] as [number, number] },
//   { name: "Zion", position: [37.2982, -113.0263] as [number, number] },
// ];

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

const stateAbbreviations: Record<string, string> = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
  "72": "PR",
};

const stateLabelPositions: Record<string, [number, number]> = {
  "09": [41.62, -72.7], // CT
  "10": [39.05, -75.45], // DE
  "11": [38.9, -76.95], // DC
  "24": [39.2, -76.7], // MD
  "25": [42.15, -71.8], // MA
  "33": [43.8, -71.4], // NH
  "34": [40.1, -74.7], // NJ
  "44": [41.7, -71.55], // RI
  "50": [44.1, -72.7], // VT
};

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

function StateLabels({ data }: { data: FeatureCollection }) {
  return (
    <>
      {data.features.map((feature, index) => {
        if (!feature.geometry) return null;

        const bounds = L.geoJSON(feature).getBounds();
        if (!bounds.isValid()) return null;

        const abbreviation =
          stateAbbreviations[String(feature.id ?? "")] ??
          feature.properties?.name?.slice(0, 2).toUpperCase();
        const labelPosition =
          stateLabelPositions[String(feature.id ?? "")] ?? [
            bounds.getCenter().lat,
            bounds.getCenter().lng,
          ];

        return (
          <Marker
            key={`${feature.id ?? feature.properties?.name ?? index}-label`}
            position={labelPosition}
            interactive={false}
            icon={L.divIcon({
              className: "state-label",
              html: abbreviation,
            })}
          />
        );
      })}
    </>
  );
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
        <StateLabels data={data} />
      </MapContainer>
    </div>
  );
}

export default function USMap() {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[38, -97.5]}
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
        <StateLabels data={lower48} />

        {nationalParks.map((park) => (
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
