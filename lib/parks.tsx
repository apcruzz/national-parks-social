import nationalParksData from "@/data/national-parks.json";

export type Park = {
  name: string;
  state: string;
  position: [number, number];
};

export const nationalParks = nationalParksData as Park[];
