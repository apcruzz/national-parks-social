"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, Marker, Popup, useMap } from "react-leaflet";
import type { Feature, FeatureCollection } from "geojson";
import usStates from "@/data/us-states.json";
import { nationalParks } from "@/lib/parks";

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
  "09": [41.62, -72.7],
  "10": [39.05, -75.45],
  "11": [38.9, -76.95],
  "24": [39.2, -76.7],
  "25": [42.15, -71.8],
  "33": [43.8, -71.4],
  "34": [40.1, -74.7],
  "44": [41.7, -71.55],
  "50": [44.1, -72.7],
};

const fullUsCenter: [number, number] = [38, -97.5];
const fullUsZoom = 5;
const fullUsBounds = L.latLngBounds(
  [15, -170],
  [72, -50]
);
const alaskaFocusCenter: [number, number] = [63.5, -158];
const alaskaFocusZoom = 4.7;
const alaskaBounds = L.latLngBounds(
  [50, -180],
  [72, -128]
);
const parkIconCache = new Map<string, L.Icon>();
const mapColors = {
  stroke: "#465a4b",
  fill: "#d7d7d7",
  fillActive: "#9dc08b",
  water: "#c9e3ea",
  panel: "#f6efe2",
  panelBorder: "#d9ccb5",
  text: "#273229",
};
const neutralStateFills: Record<string, string> = {
  Alabama: "#c8cfae",
  Alaska: "#adc0ae",
  Arizona: "#d7bea8",
  Arkansas: "#cfd6bb",
  California: "#d5c0ae",
  Colorado: "#c2cda8",
  Connecticut: "#ead7c8",
  Delaware: "#e1d1bf",
  Florida: "#d5d7b8",
  Georgia: "#c7d1ae",
  Hawaii: "#e3ccb8",
  Idaho: "#b7c7ae",
  Illinois: "#ddd5bf",
  Indiana: "#e5dbc8",
  Iowa: "#d2d7bc",
  Kansas: "#ddcfb6",
  Kentucky: "#c2cda8",
  Louisiana: "#d5c2ab",
  Maine: "#d8ddc3",
  Maryland: "#e3d6c5",
  Massachusetts: "#e7dccc",
  Michigan: "#c4cfb3",
  Minnesota: "#c9d4ba",
  Mississippi: "#d8c7b3",
  Missouri: "#d1d4b7",
  Montana: "#bac8aa",
  Nebraska: "#dccfb8",
  Nevada: "#d2bea7",
  "New Hampshire": "#d6dbc2",
  "New Jersey": "#e4d6c6",
  "New Mexico": "#d8b79d",
  "New York": "#d8ddc5",
  "North Carolina": "#d3d6ba",
  "North Dakota": "#c5cfb5",
  Ohio: "#ddd8c3",
  Oklahoma: "#d7ccb4",
  Oregon: "#bfd0b5",
  Pennsylvania: "#e1dbc7",
  "Rhode Island": "#ebdfcf",
  "South Carolina": "#d8d7ba",
  "South Dakota": "#d3cfb1",
  Tennessee: "#ced4b8",
  Texas: "#d4c1ae",
  Utah: "#d6c2a8",
  Vermont: "#d3dac2",
  Virginia: "#d7d9bf",
  Washington: "#bfd0b4",
  "West Virginia": "#b7c5a9",
  Wisconsin: "#d0d7c0",
  Wyoming: "#cbc9ab",
};

type InsetMapProps = {
  center: [number, number];
  zoom: number;
  data: FeatureCollection;
  parks?: typeof nationalParks;
  padding?: [number, number];
  isActive?: boolean;
  onClick?: () => void;
};

function layerHasBounds(layer: L.Layer): layer is L.FeatureGroup | L.Polygon | L.Polyline {
  return "getBounds" in layer;
}

function getCollectionBounds(data: FeatureCollection) {
  return L.geoJSON(data).getBounds();
}

function getStateStyle(selectedState: string | null) {
  return function stateStyle(feature?: Feature) {
    const stateName = feature?.properties?.name;
    const fillColor = neutralStateFills[stateName ?? ""] ?? mapColors.fill;

    return {
      color: mapColors.stroke,
      weight: stateName === selectedState ? 2 : 1,
      fillColor:
        stateName === selectedState
          ? mapColors.fillActive
          : fillColor,
      fillOpacity: 1,
    };
  };
}

function getParkIcon(park: (typeof nationalParks)[number]) {
  if (!park.icon) return undefined;

  const cacheKey = JSON.stringify({
    icon: park.icon,
    iconSize: park.iconSize,
    iconAnchor: park.iconAnchor,
    popupAnchor: park.popupAnchor,
  });

  const cachedIcon = parkIconCache.get(cacheKey);
  if (cachedIcon) return cachedIcon;

  const [width, height] = park.iconSize ?? [36, 36];

  const icon = L.icon({
    iconUrl: park.icon,
    iconSize: [width, height],
    iconAnchor: park.iconAnchor ?? [width / 2, height],
    popupAnchor: park.popupAnchor ?? [0, -height],
  });

  parkIconCache.set(cacheKey, icon);

  return icon;
}

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

function UpdateMapBounds({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();

  useEffect(() => {
    map.setMaxBounds(bounds);
  }, [bounds, map]);

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
              html: `<div>${abbreviation}</div>`,
              iconSize: [24, 12],
              iconAnchor: [12, 6],
            })}
          />
        );
      })}
    </>
  );
}

function ParkMarker({
  markerKey,
  park,
}: {
  markerKey: string;
  park: (typeof nationalParks)[number];
}) {
  const icon = getParkIcon(park);

  if (icon) {
    return (
      <Marker key={markerKey} position={park.position} icon={icon}>
        <Popup>{park.name}</Popup>
      </Marker>
    );
  }

  return (
    <Marker key={markerKey} position={park.position}>
      <Popup>{park.name}</Popup>
    </Marker>
  );
}

function InsetMap({
  center,
  zoom,
  data,
  parks = [],
  padding,
  isActive = false,
  onClick,
}: InsetMapProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-36 w-44 overflow-visible bg-transparent p-0 text-left transition ${
        isActive ? "opacity-100" : "opacity-100"
      }`}
    >
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
        <GeoJSON data={data} style={() => ({
          color: mapColors.stroke,
          weight: 1,
          fillColor: isActive ? mapColors.fillActive : mapColors.fill,
          fillOpacity: 1,
        })} />
        <StateLabels data={data} />
        {parks.map((park) => (
          <ParkMarker key={`${park.name}-inset`} markerKey={`${park.name}-inset`} park={park} />
        ))}
      </MapContainer>
    </button>
  );
}

export default function USMap() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const alaskaParks = nationalParks.filter((park) => park.state.includes("AK"));
  const hawaiiParks = nationalParks.filter((park) => park.state.includes("HI"));
  const activeBounds =
    selectedState === "Alaska"
      ? alaskaBounds
      : fullUsBounds;

  const focusState = (name: string, bounds: L.LatLngBounds) => {
    if (!mapRef.current || !bounds.isValid()) return;

    setSelectedState(name);
    mapRef.current.fitBounds(bounds, { padding: [20, 20] });
  };

  const focusAlaska = () => {
    if (!mapRef.current) return;

    setSelectedState("Alaska");
    mapRef.current.setView(alaskaFocusCenter, alaskaFocusZoom);
  };

  const resetMap = () => {
    if (!mapRef.current) return;

    setSelectedState(null);
    mapRef.current.setView(fullUsCenter, fullUsZoom);
  };

  const handleStateClick = (feature: Feature, layer: L.Layer) => {
    const stateName = feature.properties?.name;
    if (!stateName || !layerHasBounds(layer)) return;

    if (stateName === "Alaska") {
      focusAlaska();
      return;
    }

    focusState(stateName, layer.getBounds());
  };

  return (
    <div className="relative h-full w-full">
      {selectedState && (
        <div
          className="absolute left-6 top-6 z-[500] flex items-center gap-3 rounded-lg px-4 py-2 shadow"
          style={{
            backgroundColor: mapColors.panel,
            border: `1px solid ${mapColors.panelBorder}`,
            color: mapColors.text,
          }}
        >
          <span>{selectedState}</span>
          <button
            type="button"
            onClick={resetMap}
            className="rounded px-2 py-1 text-sm"
            style={{ border: `1px solid ${mapColors.panelBorder}` }}
          >
            Back to US
          </button>
        </div>
      )}

      <MapContainer
        center={fullUsCenter}
        zoom={fullUsZoom}
        ref={mapRef}
        scrollWheelZoom={true}
        zoomControl={false}
        className="h-full w-full"
        style={{ backgroundColor: mapColors.water }}
        maxBounds={activeBounds}
      >
        <UpdateMapBounds bounds={activeBounds} />
        {selectedState !== "Alaska" && (
          <>
            <GeoJSON
              data={lower48}
              style={getStateStyle(selectedState)}
              onEachFeature={(feature, layer) => {
                layer.on({
                  click: () => handleStateClick(feature, layer),
                });
              }}
            />
            <GeoJSON
              data={hawaii}
              style={getStateStyle(selectedState)}
              onEachFeature={(feature, layer) => {
                layer.on({
                  click: () => handleStateClick(feature, layer),
                });
              }}
            />
            <StateLabels data={lower48} />
            <StateLabels data={hawaii} />
          </>
        )}

        <GeoJSON
          data={alaska}
          style={getStateStyle(selectedState)}
          onEachFeature={(feature, layer) => {
            layer.on({
              click: () => handleStateClick(feature, layer),
            });
          }}
        />

        <StateLabels data={alaska} />

        {nationalParks.map((park) => (
          <ParkMarker key={park.name} markerKey={park.name} park={park} />
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute bottom-6 right-6 z-[500] flex flex-col gap-4">
        <div className="pointer-events-auto">
          <InsetMap
            center={[63, -152]}
            zoom={2}
            data={alaska}
            parks={alaskaParks}
            padding={[2, 2]}
            isActive={selectedState === "Alaska"}
            onClick={focusAlaska}
          />
        </div>
        <div className="pointer-events-auto">
          <InsetMap
            center={[20.5, -157.5]}
            zoom={6}
            data={hawaii}
            parks={hawaiiParks}
            isActive={selectedState === "Hawaii"}
            onClick={() => focusState("Hawaii", getCollectionBounds(hawaii))}
          />
        </div>
      </div>
    </div>
  );
}
