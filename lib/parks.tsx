import nationalParksData from "@/data/national-parks.json";

export type Park = {
  name: string;
  state: string;
  position: [number, number];
  icon?: string;
};

export const nationalParks = nationalParksData as Park[];
