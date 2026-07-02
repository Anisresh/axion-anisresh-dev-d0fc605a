// Curated calm nature backgrounds. Unsplash direct-file URLs (CC0-ish, free to hotlink).
// Kept at ~2560w for balance of quality + load speed; browsers scale up on 4K screens.
export type BgOption = { id: string; label: string; url: string; thumb: string };

const u = (id: string, w = 2560) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const BACKGROUNDS: BgOption[] = [
  { id: "none",     label: "None",              url: "",                                 thumb: "" },
  { id: "forest",   label: "Misty forest",      url: u("1441974231531-c6227db76b6e"),    thumb: u("1441974231531-c6227db76b6e", 400) },
  { id: "mountain", label: "Alpine lake",       url: u("1506905925346-21bda4d32df4"),    thumb: u("1506905925346-21bda4d32df4", 400) },
  { id: "aurora",   label: "Aurora sky",        url: u("1483347756197-71ef80e95f73"),    thumb: u("1483347756197-71ef80e95f73", 400) },
  { id: "beach",    label: "Quiet beach",       url: u("1507525428034-b723cf961d3e"),    thumb: u("1507525428034-b723cf961d3e", 400) },
  { id: "waterfall",label: "Waterfall",         url: u("1432405972618-c60b0225b8f9"),    thumb: u("1432405972618-c60b0225b8f9", 400) },
  { id: "sunset",   label: "Golden hour",       url: u("1470071459604-3b5ec3a7fe05"),    thumb: u("1470071459604-3b5ec3a7fe05", 400) },
  { id: "starry",   label: "Starry night",      url: u("1419242902214-272b3f66ee7a"),    thumb: u("1419242902214-272b3f66ee7a", 400) },
  { id: "japan",    label: "Cherry blossoms",   url: u("1522383225653-ed111181a951"),    thumb: u("1522383225653-ed111181a951", 400) },
  { id: "desert",   label: "Warm dunes",        url: u("1509316785289-025f5b846b35"),    thumb: u("1509316785289-025f5b846b35", 400) },
  { id: "rainy",    label: "Rainy window",      url: u("1515694346937-94d85e41e6f0"),    thumb: u("1515694346937-94d85e41e6f0", 400) },
  { id: "field",    label: "Green field",       url: u("1470252649378-9c29740c9fa8"),    thumb: u("1470252649378-9c29740c9fa8", 400) },
  { id: "lake",     label: "Still lake",        url: u("1439066615861-d1af74d74000"),    thumb: u("1439066615861-d1af74d74000", 400) },
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
