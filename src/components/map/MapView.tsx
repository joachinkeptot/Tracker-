import { useEffect, useRef, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useApp } from "../../context";
import { Person } from "../../types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GeoPoint {
  lat: number;
  lng: number;
}

interface AreaPin {
  area: string;
  coords: GeoPoint;
  people: string[];
}

interface ActivityPin {
  area: string;
  coords: GeoPoint;
  activities: string[];
}

interface GeoCache {
  [area: string]: GeoPoint | null;
}

interface RaceBreakdown {
  label: string;
  count: number;
}

interface CensusData {
  tractPop: number;
  races: RaceBreakdown[]; // sorted descending by count, filtered to count > 0
  medianIncome: number | null; // null if census returns -666666666 (N/A)
  medianAge: number | null;
  povertyRate: number | null; // 0–100 percentage
  bachelorsOrHigherPct: number | null; // 0–100 percentage (pop 25+)
  employmentRate: number | null; // 0–100 percentage (of labor force)
  // New fields
  medianRent: number | null;
  hispanicPct: number | null;
  foreignBornPct: number | null;
  spanishSpeakingPct: number | null;
  under18Pct: number | null;
}

type CensusCache = { [area: string]: CensusData | null };

export interface MapViewProps {
  people: Person[]; // filtered people from App.tsx
}

// ── Constants ──────────────────────────────────────────────────────────────────

const AURORA_CENTER: [number, number] = [39.7294, -104.8319];
const AURORA_ZOOM = 12;
const GEO_CACHE_KEY = "roommap_geo_cache";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const ACTIVITY_COLOR = "#0d9488";

// ── Geocoding helpers ──────────────────────────────────────────────────────────

async function geocodeArea(area: string): Promise<GeoPoint | null> {
  const query = `${area}, Aurora, CO, USA`;
  try {
    const res = await fetch(
      `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`,
      { headers: { "User-Agent": "RoomMapOps/1.0" } }
    );
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {
    // network error or parse failure — return null
  }
  return null;
}

function loadGeoCache(): GeoCache {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    return raw ? (JSON.parse(raw) as GeoCache) : {};
  } catch {
    return {};
  }
}

function saveGeoCache(cache: GeoCache) {
  try {
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // quota exceeded — skip
  }
}

const CENSUS_CACHE_KEY = "roommap_census_cache_v3";

function loadCensusCache(): CensusCache {
  try {
    const raw = localStorage.getItem(CENSUS_CACHE_KEY);
    return raw ? (JSON.parse(raw) as CensusCache) : {};
  } catch {
    return {};
  }
}

function saveCensusCache(cache: CensusCache) {
  try {
    localStorage.setItem(CENSUS_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Resolves lat/lng → { state, county, tract } FIPS codes via Census Geocoder
async function fetchCensusTract(
  lat: number,
  lng: number
): Promise<{ state: string; county: string; tract: string } | null> {
  try {
    const url =
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates` +
      `?x=${lng}&y=${lat}` +
      `&benchmark=Public_AR_Current` +
      `&vintage=Current_Current` +
      `&format=json`;
    const res = await fetch(url);
    const json = await res.json();
    const geos = json?.result?.geographies ?? {};
    // Key name differs by vintage: "Census Tracts" (Current) or "2020 Census Tracts" (Census2020)
    const tracts: any[] =
      geos["Census Tracts"] ?? geos["2020 Census Tracts"] ?? [];
    if (tracts.length === 0) return null;
    const t = tracts[0];
    return { state: t.STATE, county: t.COUNTY, tract: t.TRACT };
  } catch {
    return null;
  }
}

// Fetches ACS 5-year demographics for a given census tract
async function fetchACSData(
  state: string,
  county: string,
  tract: string
): Promise<CensusData | null> {
  const fields = [
    "B01003_001E", // total pop
    "B01002_001E", // median age
    "B02001_002E", // white alone
    "B02001_003E", // black alone
    "B02001_004E", // AIAN alone
    "B02001_005E", // asian alone
    "B02001_006E", // NHPI alone
    "B02001_007E", // other race alone
    "B02001_008E", // two or more races
    "B19013_001E", // median household income
    "B17001_001E", // poverty status universe
    "B17001_002E", // below poverty level
    "B15003_001E", // education universe (25+)
    "B15003_022E", // bachelor's degree
    "B15003_023E", // master's degree
    "B15003_024E", // professional school degree
    "B15003_025E", // doctorate degree
    "B23025_002E", // in labor force
    "B23025_004E", // employed
    "B25064_001E", // median gross rent
    "B03002_001E", // Hispanic/Latino universe
    "B03002_012E", // Hispanic or Latino
    "B05001_001E", // nativity universe
    "B05001_005E", // naturalized citizen (foreign born)
    "B05001_006E", // not a citizen (foreign born)
    "B16001_001E", // language spoken at home universe (5+)
    "B16001_002E", // speaks Spanish
    "B09001_001E", // population under 18
  ].join(",");
  try {
    const url =
      `https://api.census.gov/data/2023/acs/acs5` +
      `?get=${fields}` +
      `&for=tract:${tract}` +
      `&in=state:${state}+county:${county}`;
    const res = await fetch(url);
    const json: string[][] = await res.json();
    if (!Array.isArray(json) || json.length < 2) return null;
    const [header, row] = [json[0], json[1]];
    const getInt = (field: string) =>
      parseInt(row[header.indexOf(field)] ?? "-1", 10);
    const getFloat = (field: string) =>
      parseFloat(row[header.indexOf(field)] ?? "-1");

    const tractPop = getInt("B01003_001E");
    const income = getInt("B19013_001E");
    const medianAge = getFloat("B01002_001E");

    // Poverty rate
    const povertyUniverse = getInt("B17001_001E");
    const belowPoverty = getInt("B17001_002E");
    const povertyRate =
      povertyUniverse > 0 ? (belowPoverty / povertyUniverse) * 100 : null;

    // Education: bachelor's or higher (pop 25+)
    const eduUniverse = getInt("B15003_001E");
    const bachelorsPlus =
      getInt("B15003_022E") +
      getInt("B15003_023E") +
      getInt("B15003_024E") +
      getInt("B15003_025E");
    const bachelorsOrHigherPct =
      eduUniverse > 0 ? (bachelorsPlus / eduUniverse) * 100 : null;

    // Employment rate (% of labor force employed)
    const laborForce = getInt("B23025_002E");
    const employed = getInt("B23025_004E");
    const employmentRate =
      laborForce > 0 ? (employed / laborForce) * 100 : null;

    // Median rent
    const rentRaw = getInt("B25064_001E");
    const medianRent = rentRaw > 0 ? rentRaw : null;

    // Hispanic/Latino %
    const hispUniverse = getInt("B03002_001E");
    const hispanic = getInt("B03002_012E");
    const hispanicPct = hispUniverse > 0 ? Math.round((hispanic / hispUniverse) * 1000) / 10 : null;

    // Foreign born %
    const nativityUniverse = getInt("B05001_001E");
    const foreignBorn = getInt("B05001_005E") + getInt("B05001_006E");
    const foreignBornPct = nativityUniverse > 0 ? Math.round((foreignBorn / nativityUniverse) * 1000) / 10 : null;

    // Spanish speaking %
    const langUniverse = getInt("B16001_001E");
    const spanishSpeakers = getInt("B16001_002E");
    const spanishSpeakingPct = langUniverse > 0 ? Math.round((spanishSpeakers / langUniverse) * 1000) / 10 : null;

    // Under 18 %
    const under18 = getInt("B09001_001E");
    const under18Pct = tractPop > 0 ? Math.round((under18 / tractPop) * 1000) / 10 : null;

    const RACE_LABELS: { field: string; label: string }[] = [
      { field: "B02001_002E", label: "White" },
      { field: "B02001_003E", label: "Black / African American" },
      { field: "B02001_004E", label: "American Indian / Alaska Native" },
      { field: "B02001_005E", label: "Asian" },
      { field: "B02001_006E", label: "Native Hawaiian / Pacific Islander" },
      { field: "B02001_007E", label: "Other race" },
      { field: "B02001_008E", label: "Two or more races" },
    ];
    const races: RaceBreakdown[] = RACE_LABELS.map(({ field, label }) => ({
      label,
      count: Math.max(0, getInt(field)),
    }))
      .filter((r) => r.count > 0)
      .sort((a, b) => b.count - a.count);

    return {
      tractPop: Math.max(0, tractPop),
      races,
      medianIncome: income > 0 ? income : null,
      medianAge: medianAge > 0 ? medianAge : null,
      povertyRate: povertyRate !== null && povertyUniverse > 0 ? Math.round(povertyRate * 10) / 10 : null,
      bachelorsOrHigherPct: bachelorsOrHigherPct !== null && eduUniverse > 0 ? Math.round(bachelorsOrHigherPct * 10) / 10 : null,
      employmentRate: employmentRate !== null && laborForce > 0 ? Math.round(employmentRate * 10) / 10 : null,
      medianRent,
      hispanicPct,
      foreignBornPct,
      spanishSpeakingPct,
      under18Pct,
    };
  } catch {
    return null;
  }
}

// ── Coord parsing ──────────────────────────────────────────────────────────────

// Accepts a Google Maps URL or a plain "lat, lng" string.
// Returns { lat, lng } or null if nothing parseable is found.
function parseCoordsFromInput(input: string): GeoPoint | null {
  const text = input.trim();

  // Try patterns from Google Maps URLs
  // e.g. @39.7294,-104.8319 or @39.7294,-104.8319,15z
  const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };

  // e.g. ?q=39.7294,-104.8319 or &q=39.7294,-104.8319
  const qMatch = text.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };

  // e.g. ll=39.7294,-104.8319
  const llMatch = text.match(/ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (llMatch) return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };

  // Plain "lat, lng"
  const plainMatch = text.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
  if (plainMatch) return { lat: parseFloat(plainMatch[1]), lng: parseFloat(plainMatch[2]) };

  return null;
}

// ── Color helpers ──────────────────────────────────────────────────────────────

function peopleColor(count: number): string {
  if (count >= 6) return "#e05252";
  if (count >= 3) return "#e08c2e";
  return "#3b82f6";
}

// ── Auto-fit component ─────────────────────────────────────────────────────────

function FitBounds({
  peoplePins,
  activityPins,
  showActivities,
}: {
  peoplePins: AreaPin[];
  activityPins: ActivityPin[];
  showActivities: boolean;
}) {
  const map = useMap();
  const hasFitted = useRef(false);

  // Fit once when we first get pins after geocoding
  useEffect(() => {
    const all = [...peoplePins, ...(showActivities ? activityPins : [])];
    if (all.length === 0 || hasFitted.current) return;
    const coords = all.map(
      (p) => [p.coords.lat, p.coords.lng] as [number, number]
    );
    map.fitBounds(coords, { padding: [50, 50], maxZoom: 15 });
    hasFitted.current = true;
  }, [peoplePins.length + activityPins.length]);

  // Re-fit when activities layer is toggled on
  useEffect(() => {
    if (!showActivities) return;
    const all = [...peoplePins, ...activityPins];
    if (all.length === 0) return;
    const coords = all.map(
      (p) => [p.coords.lat, p.coords.lng] as [number, number]
    );
    map.fitBounds(coords, { padding: [50, 50], maxZoom: 15 });
  }, [showActivities]);

  return null;
}

// ── MapView ────────────────────────────────────────────────────────────────────

export function MapView({ people: filteredPeople }: MapViewProps) {
  const { people: allPeople, activities, updatePerson, updateActivity, areaNicknames, updateAreaNickname } = useApp();

  // Inline area rename state: area name being edited → draft value
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  // Nickname edit state
  const [nicknameEditArea, setNicknameEditArea] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState("");

  // Manual pin state: area being pinned → draft input + error
  const [pinningArea, setPinningArea] = useState<string | null>(null);
  const [pinDraft, setPinDraft] = useState("");
  const [pinError, setPinError] = useState("");

  const [showActivities, setShowActivities] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // GeoCache held in state so derived pins update reactively
  const [geoCache, setGeoCache] = useState<GeoCache>(() => loadGeoCache());
  const [geocodingStatus, setGeocodingStatus] = useState<
    "idle" | "loading" | "done"
  >("idle");
  const [geocodedCount, setGeocodedCount] = useState(0);
  const [censusCache, setCensusCache] = useState<CensusCache>(() => loadCensusCache());
  const [censusStatus, setCensusStatus] = useState<"idle" | "loading" | "done">("idle");

  // All unique areas to geocode (all people + activities)
  const allUniqueAreas = useMemo(() => {
    const areas = new Set<string>();
    for (const p of allPeople) {
      if (p.area?.trim()) areas.add(p.area.trim());
    }
    for (const a of activities) {
      if (a.area?.trim()) areas.add(a.area.trim());
    }
    return [...areas];
  }, [allPeople, activities]);

  // Filtered people: area → names (for pin display)
  const filteredAreaPeopleMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const person of filteredPeople) {
      const area = person.area?.trim();
      if (!area) continue;
      if (!map[area]) map[area] = [];
      map[area].push(person.name);
    }
    return map;
  }, [filteredPeople]);

  // Activities: area → activity names
  const activityAreaMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const act of activities) {
      const area = act.area?.trim();
      if (!area) continue;
      if (!map[area]) map[area] = [];
      map[area].push(act.name);
    }
    return map;
  }, [activities]);

  // Derived pins from geocache + filtered data
  const peoplePins = useMemo<AreaPin[]>(() => {
    return Object.entries(filteredAreaPeopleMap)
      .filter(([area]) => geoCache[area] != null)
      .map(([area, people]) => ({ area, coords: geoCache[area]!, people }));
  }, [filteredAreaPeopleMap, geoCache]);

  const activityPins = useMemo<ActivityPin[]>(() => {
    return Object.entries(activityAreaMap)
      .filter(([area]) => geoCache[area] != null)
      .map(([area, acts]) => ({ area, coords: geoCache[area]!, activities: acts }));
  }, [activityAreaMap, geoCache]);

  // Areas in current filtered people that failed geocoding
  const unresolvedAreas = useMemo(() => {
    return Object.keys(filteredAreaPeopleMap).filter(
      (area) => area in geoCache && geoCache[area] === null
    );
  }, [filteredAreaPeopleMap, geoCache]);

  // Geocoding effect — runs on mount and on manual refresh
  useEffect(() => {
    const uncached = allUniqueAreas.filter((a) => !(a in geoCache));
    if (uncached.length === 0) {
      setGeocodingStatus("done");
      return;
    }

    let aborted = false;
    let localCache = { ...geoCache };

    async function run() {
      setGeocodingStatus("loading");
      for (let i = 0; i < uncached.length; i++) {
        if (aborted) return;
        const area = uncached[i];
        if (i > 0) await sleep(1100); // respect Nominatim rate limit
        if (aborted) return;
        const coords = await geocodeArea(area);
        localCache = { ...localCache, [area]: coords };
        saveGeoCache(localCache);
        setGeoCache({ ...localCache });
        setGeocodedCount(i + 1);
      }
      if (!aborted) setGeocodingStatus("done");
    }

    run();
    return () => {
      aborted = true;
    };
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Census-fetch effect: runs after geo cache has coordinates
  useEffect(() => {
    const areasToFetch = peoplePins
      .map((p) => p.area)
      .filter((area) => !(area in censusCache));

    if (areasToFetch.length === 0) {
      setCensusStatus("done");
      return;
    }

    let aborted = false;
    let localCache = { ...censusCache };

    async function run() {
      setCensusStatus("loading");
      for (const area of areasToFetch) {
        if (aborted) return;
        const coords = geoCache[area];
        if (!coords) {
          localCache = { ...localCache, [area]: null };
          continue;
        }
        const tractInfo = await fetchCensusTract(coords.lat, coords.lng);
        if (aborted) return;
        if (!tractInfo) {
          localCache = { ...localCache, [area]: null };
          saveCensusCache(localCache);
          setCensusCache({ ...localCache });
          continue;
        }
        const data = await fetchACSData(tractInfo.state, tractInfo.county, tractInfo.tract);
        if (aborted) return;
        localCache = { ...localCache, [area]: data };
        saveCensusCache(localCache);
        setCensusCache({ ...localCache });
      }
      if (!aborted) setCensusStatus("done");
    }

    run();
    return () => { aborted = true; };
  }, [peoplePins.length, geoCache]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manually pin an unresolved area using coords from a Google Maps URL or "lat,lng"
  const handleManualPin = (area: string, input: string) => {
    const coords = parseCoordsFromInput(input);
    if (!coords) {
      setPinError("Couldn't find coordinates. Paste a Google Maps link or enter lat, lng.");
      return;
    }
    const newGeo = { ...geoCache, [area]: coords };
    saveGeoCache(newGeo);
    setGeoCache(newGeo);
    setPinningArea(null);
    setPinDraft("");
    setPinError("");
  };

  // Rename all people + activities in an area, then re-geocode the new name
  const handleRenameArea = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingArea(null);
      return;
    }
    // Update every person in that area
    for (const p of allPeople) {
      if (p.area?.trim() === oldName) {
        updatePerson(p.id, { area: trimmed });
      }
    }
    // Update every activity in that area
    for (const a of activities) {
      if (a.area?.trim() === oldName) {
        updateActivity(a.id, { area: trimmed });
      }
    }
    // Move geo/census cache entries to the new name, drop the old key
    const newGeo = { ...geoCache, [trimmed]: geoCache[oldName] ?? null };
    delete newGeo[oldName];
    saveGeoCache(newGeo);
    setGeoCache(newGeo);

    const newCensus = { ...censusCache, [trimmed]: censusCache[oldName] ?? null };
    delete newCensus[oldName];
    saveCensusCache(newCensus);
    setCensusCache(newCensus);

    setEditingArea(null);
  };

  // Refresh: clear cache and re-geocode everything
  const handleRefresh = () => {
    localStorage.removeItem(GEO_CACHE_KEY);
    localStorage.removeItem(CENSUS_CACHE_KEY);
    setGeoCache({});
    setCensusCache({});
    setGeocodedCount(0);
    setGeocodingStatus("idle");
    setCensusStatus("idle");
    // Small delay so state flushes before the new effect reads geoCache
    setTimeout(() => setRefreshKey((k) => k + 1), 50);
  };

  const totalOnMap = peoplePins.reduce((sum, p) => sum + p.people.length, 0);
  const totalFiltered = filteredPeople.length;
  const totalAll = allPeople.length;
  const isFiltered = totalFiltered < totalAll;

  // Aggregate app stats across all visible (filtered) people
  const ageGroupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of filteredPeople) {
      counts[p.ageGroup] = (counts[p.ageGroup] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredPeople]);

  const homeVisitCoverage = useMemo(() => {
    const withVisits = filteredPeople.filter((p) => p.homeVisits && p.homeVisits.length > 0).length;
    return { withVisits, total: filteredPeople.length };
  }, [filteredPeople]);

  const visibleAreaActivityCount = useMemo(() => {
    const visibleAreaSet = new Set(filteredPeople.map((p) => p.area?.trim()).filter(Boolean));
    return activities.filter((a) => a.area?.trim() && visibleAreaSet.has(a.area.trim())).length;
  }, [filteredPeople, activities]);

  // Aggregate census stats across all people pins that have census data
  const neighborhoodOverview = useMemo(() => {
    const entries = peoplePins
      .map((p) => censusCache[p.area])
      .filter((c): c is CensusData => c != null);
    if (entries.length === 0) return null;

    const totalPop = entries.reduce((s, c) => s + c.tractPop, 0);
    if (totalPop === 0) return null;

    const wavg = (get: (c: CensusData) => number | null) => {
      let num = 0, den = 0;
      for (const c of entries) {
        const v = get(c);
        if (v !== null) { num += v * c.tractPop; den += c.tractPop; }
      }
      return den > 0 ? Math.round((num / den) * 10) / 10 : null;
    };

    // Race totals across all tracts
    const raceTotals: Record<string, number> = {};
    for (const c of entries) {
      for (const r of c.races) {
        raceTotals[r.label] = (raceTotals[r.label] ?? 0) + r.count;
      }
    }
    const topRaces = Object.entries(raceTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([label, count]) => ({ label, pct: Math.round((count / totalPop) * 100) }));

    return {
      areas: entries.length,
      totalPop,
      medianIncome: wavg((c) => c.medianIncome),
      povertyRate: wavg((c) => c.povertyRate),
      medianRent: wavg((c) => c.medianRent),
      hispanicPct: wavg((c) => c.hispanicPct),
      foreignBornPct: wavg((c) => c.foreignBornPct),
      spanishSpeakingPct: wavg((c) => c.spanishSpeakingPct),
      under18Pct: wavg((c) => c.under18Pct),
      topRaces,
    };
  }, [peoplePins, censusCache]);

  return (
    <div
      style={{ display: "flex", height: "calc(100vh - 160px)", overflow: "hidden" }}
    >
      {/* ── Map ───────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={AURORA_CENTER}
          zoom={AURORA_ZOOM}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            maxZoom={20}
          />

          <FitBounds
            peoplePins={peoplePins}
            activityPins={activityPins}
            showActivities={showActivities}
          />

          {/* People pins */}
          {peoplePins.map((pin) => (
            <CircleMarker
              key={`p:${pin.area}`}
              center={[pin.coords.lat, pin.coords.lng]}
              radius={Math.max(10, Math.min(30, 8 + pin.people.length * 2.5))}
              pathOptions={{
                color: peopleColor(pin.people.length),
                fillColor: peopleColor(pin.people.length),
                fillOpacity: 0.75,
                weight: 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <strong>{areaNicknames[pin.area] || pin.area}</strong>
                {areaNicknames[pin.area] && (
                  <span style={{ fontWeight: "normal", opacity: 0.7 }}> ({pin.area})</span>
                )}
                {" · "}
                {pin.people.length}{" "}
                {pin.people.length === 1 ? "person" : "people"}
              </Tooltip>
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <strong style={{ fontSize: 14 }}>
                    {areaNicknames[pin.area] || pin.area}
                  </strong>
                  {areaNicknames[pin.area] && (
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>{pin.area}</div>
                  )}

                  {/* Nickname editor */}
                  {nicknameEditArea === pin.area ? (
                    <div style={{ marginTop: 6, display: "flex", gap: 4, alignItems: "center" }}>
                      <input
                        autoFocus
                        value={nicknameDraft}
                        onChange={(e) => setNicknameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateAreaNickname(pin.area, nicknameDraft);
                            setNicknameEditArea(null);
                          } else if (e.key === "Escape") {
                            setNicknameEditArea(null);
                          }
                        }}
                        placeholder="Area nickname…"
                        style={{ flex: 1, fontSize: 12, padding: "2px 6px", border: "1px solid #6366f1", borderRadius: 4, outline: "none" }}
                      />
                      <button
                        onClick={() => { updateAreaNickname(pin.area, nicknameDraft); setNicknameEditArea(null); }}
                        style={{ fontSize: 11, padding: "2px 6px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                      >Save</button>
                      <button
                        onClick={() => setNicknameEditArea(null)}
                        style={{ fontSize: 11, padding: "2px 6px", background: "#e5e7eb", border: "none", borderRadius: 4, cursor: "pointer" }}
                      >✕</button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 4, display: "flex", gap: 4 }}>
                      <button
                        onClick={() => { setNicknameEditArea(pin.area); setNicknameDraft(areaNicknames[pin.area] || ""); }}
                        style={{ fontSize: 11, padding: "2px 6px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", color: "#374151" }}
                      >{areaNicknames[pin.area] ? "Edit nickname" : "Add nickname"}</button>
                      {areaNicknames[pin.area] && (
                        <button
                          onClick={() => updateAreaNickname(pin.area, "")}
                          style={{ fontSize: 11, padding: "2px 6px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", color: "#6b7280" }}
                        >Clear</button>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: 12, color: "#666", marginBottom: 6, marginTop: 8 }}>
                    {pin.people.length}{" "}
                    {pin.people.length === 1 ? "person" : "people"} in your database
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, lineHeight: 1.7 }}>
                    {pin.people.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>

                  {/* Age groups */}
                  {(() => {
                    const areapeople = allPeople.filter((p) => p.area?.trim() === pin.area);
                    const grouped: Record<string, number> = {};
                    for (const p of areapeople) {
                      grouped[p.ageGroup] = (grouped[p.ageGroup] ?? 0) + 1;
                    }
                    const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
                    if (entries.length === 0) return null;
                    return (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #eee" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                          Age groups
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {entries.map(([group, count]) => (
                            <span key={group} style={{ background: "#f3f4f6", borderRadius: 4, padding: "1px 6px", fontSize: 11, color: "#374151" }}>
                              {group}: {count}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Activities in this area */}
                  {(() => {
                    const areaActivities = activities.filter((a) => a.area?.trim() === pin.area);
                    if (areaActivities.length === 0) return null;
                    return (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #eee" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
                          Activities ({areaActivities.length})
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          {areaActivities.map((a) => a.name).join(", ")}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Census demographics */}
                  {(() => {
                    const census = censusCache[pin.area];
                    if (census === undefined) {
                      return (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #eee", fontSize: 11, color: "#9ca3af" }}>
                          Loading neighborhood demographics…
                        </div>
                      );
                    }
                    if (census === null) {
                      return (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #eee", fontSize: 11, color: "#9ca3af" }}>
                          No census data available for this area
                        </div>
                      );
                    }
                    const topRaces = census.races.slice(0, 4);
                    return (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #eee" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                          Census tract demographics
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>
                          Population:{" "}
                          <strong style={{ color: "#374151" }}>{census.tractPop.toLocaleString()}</strong>
                          {census.medianAge !== null && (
                            <span> · Median age: <strong style={{ color: "#374151" }}>{census.medianAge}</strong></span>
                          )}
                        </div>
                        {census.medianIncome !== null && (
                          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>
                            Median income:{" "}
                            <strong style={{ color: "#374151" }}>${census.medianIncome.toLocaleString()}</strong>
                          </div>
                        )}
                        {census.povertyRate !== null && (
                          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>
                            Poverty rate:{" "}
                            <strong style={{ color: "#374151" }}>{census.povertyRate}%</strong>
                          </div>
                        )}
                        {census.bachelorsOrHigherPct !== null && (
                          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>
                            Bachelor's or higher:{" "}
                            <strong style={{ color: "#374151" }}>{census.bachelorsOrHigherPct}%</strong>
                          </div>
                        )}
                        {census.employmentRate !== null && (
                          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>
                            Employment rate:{" "}
                            <strong style={{ color: "#374151" }}>{census.employmentRate}%</strong>
                          </div>
                        )}
                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>Race breakdown:</div>
                        {topRaces.map((r) => {
                          const pct = census.tractPop > 0 ? Math.round((r.count / census.tractPop) * 100) : 0;
                          return (
                            <div key={r.label} style={{ marginBottom: 4 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#374151" }}>
                                <span>{r.label}</span>
                                <span style={{ fontWeight: 600 }}>{pct}%</span>
                              </div>
                              <div style={{ background: "#e5e7eb", borderRadius: 3, height: 4, marginTop: 2 }}>
                                <div style={{ background: "#6366f1", borderRadius: 3, height: 4, width: `${pct}%`, transition: "width 0.3s" }} />
                              </div>
                            </div>
                          );
                        })}
                        {census.races.length > 4 && (
                          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                            +{census.races.length - 4} more groups
                          </div>
                        )}
                        {/* New stats row */}
                        <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                          {census.medianRent !== null && (
                            <div style={{ fontSize: 11, color: "#6b7280" }}>
                              Median rent:{" "}
                              <strong style={{ color: "#374151" }}>${census.medianRent.toLocaleString()}/mo</strong>
                            </div>
                          )}
                          {census.hispanicPct !== null && (
                            <div style={{ fontSize: 11, color: "#6b7280" }}>
                              Hispanic / Latino:{" "}
                              <strong style={{ color: "#374151" }}>{census.hispanicPct}%</strong>
                            </div>
                          )}
                          {census.foreignBornPct !== null && (
                            <div style={{ fontSize: 11, color: "#6b7280" }}>
                              Foreign born:{" "}
                              <strong style={{ color: "#374151" }}>{census.foreignBornPct}%</strong>
                            </div>
                          )}
                          {census.spanishSpeakingPct !== null && (
                            <div style={{ fontSize: 11, color: "#6b7280" }}>
                              Spanish-speaking:{" "}
                              <strong style={{ color: "#374151" }}>{census.spanishSpeakingPct}%</strong>
                            </div>
                          )}
                          {census.under18Pct !== null && (
                            <div style={{ fontSize: 11, color: "#6b7280" }}>
                              Under 18:{" "}
                              <strong style={{ color: "#374151" }}>{census.under18Pct}%</strong>
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: 9, color: "#d1d5db", marginTop: 4 }}>
                          Source: ACS 5-yr estimates (2019–2023)
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Activity pins */}
          {showActivities &&
            activityPins.map((pin) => (
              <CircleMarker
                key={`a:${pin.area}`}
                center={[pin.coords.lat, pin.coords.lng]}
                radius={Math.max(8, Math.min(24, 6 + pin.activities.length * 3))}
                pathOptions={{
                  color: ACTIVITY_COLOR,
                  fillColor: ACTIVITY_COLOR,
                  fillOpacity: 0.6,
                  weight: 2,
                  dashArray: "5 3",
                }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  <strong>{pin.area}</strong>
                  {" · "}
                  {pin.activities.length}{" "}
                  {pin.activities.length === 1 ? "activity" : "activities"}
                </Tooltip>
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <strong style={{ fontSize: 14 }}>{pin.area}</strong>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#666",
                        marginBottom: 6,
                        marginTop: 2,
                      }}
                    >
                      {pin.activities.length}{" "}
                      {pin.activities.length === 1 ? "activity" : "activities"}
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 16,
                        fontSize: 13,
                        lineHeight: 1.7,
                      }}
                    >
                      {pin.activities.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
        </MapContainer>

        {/* Legend */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: 12,
            zIndex: 1000,
            background: "rgba(255,255,255,0.95)",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>People per area</div>
          {[
            { color: "#3b82f6", label: "1–2 people" },
            { color: "#e08c2e", label: "3–5 people" },
            { color: "#e05252", label: "6+ people" },
          ].map(({ color, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: color,
                  border: "2px solid rgba(0,0,0,0.2)",
                  flexShrink: 0,
                }}
              />
              <span>{label}</span>
            </div>
          ))}
          {showActivities && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 6,
                paddingTop: 6,
                borderTop: "1px solid #eee",
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: ACTIVITY_COLOR,
                  border: "2px dashed rgba(0,0,0,0.3)",
                  flexShrink: 0,
                }}
              />
              <span>Activities</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <div
        style={{
          width: 264,
          flexShrink: 0,
          borderLeft: "1px solid var(--border, #e3d9cf)",
          background: "var(--panel, #fffdf9)",
          overflowY: "auto",
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontSize: 13,
          color: "var(--text)",
        }}
      >
        {/* Title */}
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            borderBottom: "1px solid var(--border, #e3d9cf)",
            paddingBottom: 10,
          }}
        >
          Aurora, CO — Map
        </div>

        {/* Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ color: "var(--text)" }}>
            <span style={{ fontWeight: 600 }}>{totalOnMap}</span> of{" "}
            <span style={{ fontWeight: 600 }}>{totalFiltered}</span>{" "}
            {isFiltered ? "filtered " : ""}
            people on map
          </div>
          {isFiltered && (
            <div style={{ fontSize: 11, color: "var(--muted, #64748b)" }}>
              {totalAll} total in database
            </div>
          )}
          <div style={{ color: "var(--text)" }}>
            <span style={{ fontWeight: 600 }}>{peoplePins.length}</span> area
            {peoplePins.length !== 1 ? "s" : ""} located
          </div>
        </div>

        {/* Community snapshot */}
        {filteredPeople.length > 0 && (
          <div
            style={{
              background: "var(--panel-2, #f4efea)",
              borderRadius: 8,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text)", marginBottom: 2 }}>
              Community snapshot
            </div>
            {ageGroupCounts.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>Age groups</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                  {ageGroupCounts.map(([group, count]) => (
                    <span
                      key={group}
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: 10,
                        padding: "1px 7px",
                        fontSize: 11,
                        color: "var(--text)",
                        fontWeight: 500,
                      }}
                    >
                      {group}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              Home visits:{" "}
              <strong style={{ color: "var(--text)" }}>
                {homeVisitCoverage.withVisits}/{homeVisitCoverage.total}
              </strong>{" "}
              people
              {homeVisitCoverage.total > 0 && (
                <span style={{ color: "var(--muted, #64748b)" }}>
                  {" "}({Math.round((homeVisitCoverage.withVisits / homeVisitCoverage.total) * 100)}%)
                </span>
              )}
            </div>
            {visibleAreaActivityCount > 0 && (
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                Activities in view:{" "}
                <strong style={{ color: "var(--text)" }}>{visibleAreaActivityCount}</strong>
              </div>
            )}
          </div>
        )}

        {/* Neighborhood overview */}
        {neighborhoodOverview && (
          <div
            style={{
              background: "var(--panel-2, #f4efea)",
              borderRadius: 8,
              padding: "10px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text)", marginBottom: 2 }}>
              Neighborhood overview
              <span style={{ fontWeight: 400, color: "var(--muted, #64748b)", marginLeft: 6 }}>
                ({neighborhoodOverview.areas} tract{neighborhoodOverview.areas !== 1 ? "s" : ""})
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>
              Total tract pop:{" "}
              <strong style={{ color: "var(--text)" }}>{neighborhoodOverview.totalPop.toLocaleString()}</strong>
            </div>
            {neighborhoodOverview.medianIncome !== null && (
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                Median income:{" "}
                <strong style={{ color: "var(--text)" }}>${Math.round(neighborhoodOverview.medianIncome).toLocaleString()}</strong>
              </div>
            )}
            {neighborhoodOverview.medianRent !== null && (
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                Median rent:{" "}
                <strong style={{ color: "var(--text)" }}>${Math.round(neighborhoodOverview.medianRent).toLocaleString()}/mo</strong>
              </div>
            )}
            {neighborhoodOverview.povertyRate !== null && (
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                Poverty rate:{" "}
                <strong style={{ color: "var(--text)" }}>{neighborhoodOverview.povertyRate}%</strong>
              </div>
            )}
            {neighborhoodOverview.hispanicPct !== null && (
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                Hispanic / Latino:{" "}
                <strong style={{ color: "var(--text)" }}>{neighborhoodOverview.hispanicPct}%</strong>
              </div>
            )}
            {neighborhoodOverview.foreignBornPct !== null && (
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                Foreign born:{" "}
                <strong style={{ color: "var(--text)" }}>{neighborhoodOverview.foreignBornPct}%</strong>
              </div>
            )}
            {neighborhoodOverview.spanishSpeakingPct !== null && (
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                Spanish-speaking:{" "}
                <strong style={{ color: "var(--text)" }}>{neighborhoodOverview.spanishSpeakingPct}%</strong>
              </div>
            )}
            {neighborhoodOverview.under18Pct !== null && (
              <div style={{ fontSize: 11, color: "var(--muted)" }}>
                Under 18:{" "}
                <strong style={{ color: "var(--text)" }}>{neighborhoodOverview.under18Pct}%</strong>
              </div>
            )}
            {neighborhoodOverview.topRaces.length > 0 && (
              <div style={{ marginTop: 3 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>Race breakdown:</div>
                {neighborhoodOverview.topRaces.map(({ label, pct }) => (
                  <div key={label} style={{ marginBottom: 3 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text)" }}>
                      <span>{label}</span>
                      <span style={{ fontWeight: 600 }}>{pct}%</span>
                    </div>
                    <div style={{ background: "var(--border)", borderRadius: 3, height: 3, marginTop: 1 }}>
                      <div style={{ background: "#6366f1", borderRadius: 3, height: 3, width: `${pct}%`, transition: "width 0.3s" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ fontSize: 9, color: "var(--muted, #64748b)", marginTop: 2 }}>
              ACS 5-yr estimates (2019–2023) · weighted avg
            </div>
          </div>
        )}

        {/* Activity toggle */}
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            userSelect: "none",
            padding: "8px 10px",
            borderRadius: 7,
            background: showActivities
              ? "rgba(13, 148, 136, 0.08)"
              : "var(--panel-2, #f4efea)",
            border: `1px solid ${showActivities ? ACTIVITY_COLOR : "var(--border, #e3d9cf)"}`,
            transition: "all 0.15s",
          }}
        >
          <input
            type="checkbox"
            checked={showActivities}
            onChange={(e) => setShowActivities(e.target.checked)}
            style={{ accentColor: ACTIVITY_COLOR }}
          />
          <span style={{ color: showActivities ? ACTIVITY_COLOR : "var(--text)", fontWeight: 500 }}>
            Show activity pins
          </span>
        </label>

        {/* Geocoding progress */}
        {geocodingStatus === "loading" && (
          <div
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid #bfdbfe",
              borderRadius: 7,
              padding: "8px 10px",
              color: "var(--accent)",
              fontSize: 12,
            }}
          >
            Locating areas… ({geocodedCount} / {allUniqueAreas.length})
          </div>
        )}

        {/* Census loading progress */}
        {censusStatus === "loading" && geocodingStatus === "done" && (
          <div
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid #ddd6fe",
              borderRadius: 7,
              padding: "8px 10px",
              color: "var(--accent)",
              fontSize: 12,
            }}
          >
            Loading neighborhood demographics…
          </div>
        )}

        {/* Refresh button */}
        <button
          className="btn btn--sm"
          onClick={handleRefresh}
          style={{ alignSelf: "flex-start" }}
        >
          Refresh geocoding
        </button>

        {/* Mapped areas list */}
        {peoplePins.length > 0 && (
          <div>
            <div
              style={{ fontWeight: 600, marginBottom: 8, color: "var(--text)" }}
            >
              Mapped areas
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {[...peoplePins]
                .sort((a, b) => b.people.length - a.people.length)
                .map((pin) => (
                  <div key={pin.area}>
                    {editingArea === pin.area ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleRenameArea(pin.area, editDraft);
                        }}
                        style={{ display: "flex", gap: 4, alignItems: "center" }}
                      >
                        <input
                          autoFocus
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          style={{
                            flex: 1,
                            fontSize: 12,
                            padding: "2px 6px",
                            border: "1px solid #6366f1",
                            borderRadius: 4,
                            outline: "none",
                          }}
                        />
                        <button
                          type="submit"
                          className="btn btn--sm btn--primary"
                          style={{ padding: "2px 7px", fontSize: 11 }}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm"
                          style={{ padding: "2px 7px", fontSize: 11 }}
                          onClick={() => setEditingArea(null)}
                        >
                          ✕
                        </button>
                      </form>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "3px 0",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 160,
                          }}
                        >
                          {pin.area}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0, marginLeft: 4 }}>
                          <button
                            title="Rename area"
                            onClick={() => {
                              setEditingArea(pin.area);
                              setEditDraft(pin.area);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: "0 2px",
                              color: "var(--muted, #64748b)",
                              fontSize: 12,
                              lineHeight: 1,
                            }}
                          >
                            ✏️
                          </button>
                          <span
                            style={{
                              background: peopleColor(pin.people.length),
                              color: "#fff",
                              borderRadius: 10,
                              padding: "1px 7px",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {pin.people.length}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Unresolved areas */}
        {unresolvedAreas.length > 0 && (
          <div>
            <div
              style={{
                fontWeight: 600,
                marginBottom: 6,
                color: "var(--text)",
                display: "flex",
                alignItems: "baseline",
                gap: 6,
              }}
            >
              Unresolved
              <span style={{ fontWeight: 400, color: "var(--muted, #64748b)", fontSize: 11 }}>
                (not found on map)
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {unresolvedAreas.map((area) => (
                <div key={area}>
                  <div style={{ color: "var(--muted, #64748b)", fontStyle: "italic", marginBottom: 2 }}>
                    {area}
                  </div>
                  <div style={{ color: "var(--muted)", paddingLeft: 8, fontSize: 12, marginBottom: 4 }}>
                    {filteredAreaPeopleMap[area].join(", ")}
                  </div>
                  {pinningArea === area ? (
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleManualPin(area, pinDraft); }}
                      style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 8 }}
                    >
                      <input
                        autoFocus
                        value={pinDraft}
                        onChange={(e) => { setPinDraft(e.target.value); setPinError(""); }}
                        placeholder="Paste Google Maps link or lat, lng"
                        style={{
                          fontSize: 11,
                          padding: "3px 6px",
                          border: `1px solid ${pinError ? "#ef4444" : "#6366f1"}`,
                          borderRadius: 4,
                          outline: "none",
                        }}
                      />
                      {pinError && (
                        <div style={{ fontSize: 10, color: "#ef4444" }}>{pinError}</div>
                      )}
                      <div style={{ display: "flex", gap: 4 }}>
                        <button type="submit" className="btn btn--sm btn--primary" style={{ padding: "2px 7px", fontSize: 11 }}>
                          Pin
                        </button>
                        <button type="button" className="btn btn--sm" style={{ padding: "2px 7px", fontSize: 11 }} onClick={() => { setPinningArea(null); setPinDraft(""); setPinError(""); }}>
                          ✕
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      className="btn btn--sm"
                      style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px" }}
                      onClick={() => { setPinningArea(area); setPinDraft(""); setPinError(""); }}
                    >
                      Set location
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {geocodingStatus === "done" &&
          peoplePins.length === 0 &&
          unresolvedAreas.length === 0 && (
            <div
              style={{
                color: "var(--muted, #64748b)",
                textAlign: "center",
                marginTop: 40,
                lineHeight: 1.6,
              }}
            >
              No area data found.
              <br />
              Add areas to people to see them on the map.
            </div>
          )}
      </div>
    </div>
  );
}
