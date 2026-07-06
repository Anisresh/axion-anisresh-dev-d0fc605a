// Curated calm nature backgrounds. Unsplash direct-file URLs, free to hotlink.
// ~2560w for balance of quality + load speed; browsers scale up on 4K screens.
export type BgOption = { id: string; label: string; url: string; thumb: string };

const u = (id: string, w = 2560) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const b = (id: string, label: string, photo: string): BgOption => ({
  id,
  label,
  url: u(photo),
  thumb: u(photo, 400),
});

export const BACKGROUNDS: BgOption[] = [
  { id: "none", label: "None", url: "", thumb: "" },

  // Forests & woods
  b("forest",       "Misty forest",      "1441974231531-c6227db76b6e"),
  b("pines",        "Pine cathedral",    "1448375240586-882707db888b"),
  b("mossy",        "Mossy woods",       "1500534314209-a25ddb2bd429"),
  b("fern",         "Fern floor",        "1476231682828-37e571bc172f"),
  b("autumn",       "Autumn path",       "1507783548227-544c3b8fc065"),
  b("redwoods",     "Redwoods",          "1470114716159-e389f8712fda"),

  // Mountains & lakes
  b("mountain",     "Alpine lake",       "1506905925346-21bda4d32df4"),
  b("dolomites",    "Dolomite peaks",    "1464822759023-fed622ff2c3b"),
  b("reflection",   "Mirror lake",       "1454496522488-7a8e488e8606"),
  b("valley",       "Green valley",      "1418065460487-3e41a6c84dc5"),
  b("fjord",        "Nordic fjord",      "1493246507139-91e8fad9978e"),
  b("lake",         "Still lake",        "1439066615861-d1af74d74000"),

  // Skies & weather
  b("aurora",       "Aurora sky",        "1483347756197-71ef80e95f73"),
  b("starry",       "Starry night",      "1419242902214-272b3f66ee7a"),
  b("milkyway",     "Milky Way",         "1534796636912-3b95b3ab5986"),
  b("clouds",       "Sea of clouds",     "1441829266145-6d4bfb46b1e5"),
  b("stormy",       "Soft storm",        "1499346030926-9a72daac6c63"),

  // Water
  b("beach",        "Quiet beach",       "1507525428034-b723cf961d3e"),
  b("waterfall",    "Waterfall",         "1432405972618-c60b0225b8f9"),
  b("ocean",        "Deep ocean",        "1439405326854-014607f694d7"),
  b("river",        "River bend",        "1465056836041-7f43ac27dcb5"),
  b("tropical",     "Turquoise cove",    "1507525428034-b723cf961d3e"),

  // Warm hours
  b("sunset",       "Golden hour",       "1470071459604-3b5ec3a7fe05"),
  b("sunrise",      "First light",       "1502082553048-f009c37129b9"),
  b("dusk",         "Warm dusk",         "1444080748397-f442aa95c3e5"),

  // Seasons & flora
  b("japan",        "Cherry blossoms",   "1522383225653-ed111181a951"),
  b("lavender",     "Lavender fields",   "1499002238440-d264edd596ec"),
  b("tulip",        "Tulip meadow",      "1493514789931-586cb221d7a7"),
  b("field",        "Green field",       "1470252649378-9c29740c9fa8"),
  b("wheat",        "Golden wheat",      "1500382017468-9049fed747ef"),

  // Desert & rock
  b("desert",       "Warm dunes",        "1509316785289-025f5b846b35"),
  b("canyon",       "Red canyon",        "1469854523086-cc02fe5d8800"),

  // Cozy
  b("rainy",        "Rainy window",      "1515694346937-94d85e41e6f0"),
  b("fireplace",    "Fireplace glow",    "1544207240-c37b7cebfec2"),
  b("cabin",        "Snow cabin",        "1483728642387-6c3bdd6c93e5"),
  b("cafe",         "Warm café",         "1445116572660-236099ec97a0"),
];

export function applyBackground(url: string | null | undefined) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (url) {
    root.style.setProperty("--app-bg-url", `url("${url}")`);
    root.classList.add("has-bg");
  } else {
    root.style.removeProperty("--app-bg-url");
    root.classList.remove("has-bg");
  }
}
