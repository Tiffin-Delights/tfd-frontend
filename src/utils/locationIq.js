const LOCATIONIQ_AUTOCOMPLETE_URL = "https://api.locationiq.com/v1/autocomplete";
const LOCATIONIQ_REVERSE_URL = "https://us1.locationiq.com/v1/reverse";

export function getLocationIqApiKey() {
  return import.meta.env.VITE_LOCATIONIQ_KEY || "";
}

function ensureApiKey() {
  const apiKey = getLocationIqApiKey();
  if (!apiKey) {
    throw new Error("Missing LocationIQ API key. Set VITE_LOCATIONIQ_KEY in your frontend environment.");
  }
  return apiKey;
}

export async function searchLocations(query) {
  const trimmedQuery = String(query ?? "").trim();
  if (!trimmedQuery) {
    return [];
  }

  const apiKey = ensureApiKey();
  const url = new URL(LOCATIONIQ_AUTOCOMPLETE_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", trimmedQuery);
  url.searchParams.set("limit", "5");
  url.searchParams.set("format", "json");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("normalizecity", "1");

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to fetch location suggestions.");
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item) => ({
      label: item.display_name || "",
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      placeId: String(item.place_id || item.osm_id || ""),
    }))
    .filter((item) => item.label && Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
}

export async function reverseGeocodeLocation(latitude, longitude) {
  const apiKey = ensureApiKey();
  const url = new URL(LOCATIONIQ_REVERSE_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to read the selected location.");
  }

  const data = await response.json();
  const nextLocation = {
    label: data.display_name || "Current location",
    latitude: Number(latitude),
    longitude: Number(longitude),
    placeId: String(data.place_id || data.osm_id || ""),
  };

  if (!nextLocation.label || !Number.isFinite(nextLocation.latitude) || !Number.isFinite(nextLocation.longitude)) {
    throw new Error("Selected location did not return valid coordinates.");
  }

  return nextLocation;
}
