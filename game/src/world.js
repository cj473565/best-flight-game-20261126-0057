// The world of Sunset Isles: one island chain, its terrain, its
// runways, its target rings and its weather. Everything is derived
// from the seed, so the map never changes between runs.

import { WORLD, RUNWAY } from './config.js';
import { makeFbm, makeRng } from './random.js';

// Island blobs: centre, radii and peak height. Hand-placed on the map
// so the chain reads as a place: a big home island, a long middle
// island and a scatter of small ones, with open sea lanes between.
const ISLANDS = [
  { x: 1500, y: 1300, rx: 950, ry: 700, peak: 620 },
  { x: 3600, y: 2600, rx: 1250, ry: 820, peak: 760 },
  { x: 5900, y: 1500, rx: 800, ry: 620, peak: 540 },
  { x: 5200, y: 4100, rx: 700, ry: 520, peak: 430 },
  { x: 2400, y: 4100, rx: 560, ry: 430, peak: 380 },
  { x: 4300, y: 900, rx: 420, ry: 330, peak: 300 },
  { x: 6500, y: 3300, rx: 480, ry: 360, peak: 330 },
];

const RUNWAYS = [
  { x: 1500, y: 1300, heading: 0.35, name: 'Harbour Field' },
  { x: 3600, y: 2600, heading: -0.5, name: 'Coral Strip' },
  { x: 5900, y: 1500, heading: 1.2, name: 'North Point' },
  { x: 5200, y: 4100, heading: 2.4, name: 'Palm Bay' },
];

export function buildWorld(seed) {
  const fbm = makeFbm(seed);
  const rng = makeRng(seed ^ 0x9e3779b9);

  // Terrain height at a point: island blobs plus fbm detail.
  // Below zero is sea; 0..80 is beach; higher is land, rock, snow.
  function heightAt(x, y) {
    let h = -60;
    for (const isle of ISLANDS) {
      const dx = (x - isle.x) / isle.rx;
      const dy = (y - isle.y) / isle.ry;
      const d2 = dx * dx + dy * dy;
      if (d2 < 1) {
        const fall = Math.cos(d2 * Math.PI * 0.5);
        h = Math.max(h, isle.peak * fall * fall);
      }
    }
    if (h > -60) {
      h += (fbm(x / 420, y / 420) - 0.5) * 130;
    }
    // Flatten the ground around every runway so a strip is landable:
    // blend the height toward a flat 8 ft pad near the tarmac.
    for (const r of RUNWAYS) {
      const dx = x - r.x;
      const dy = y - r.y;
      const along = Math.abs(dx * Math.cos(r.heading) + dy * Math.sin(r.heading));
      const across = Math.abs(-dx * Math.sin(r.heading) + dy * Math.cos(r.heading));
      const innerAlong = RUNWAY.length / 2 + 700;
      const innerAcross = RUNWAY.width / 2 + 60;
      const outerAlong = RUNWAY.length / 2 + 1200;
      const outerAcross = RUNWAY.width / 2 + 260;
      if (along < outerAlong && across < outerAcross) {
        const fa = along < innerAlong ? 1 : 1 - (along - innerAlong) / (outerAlong - innerAlong);
        const fc = across < innerAcross ? 1 : 1 - (across - innerAcross) / (outerAcross - innerAcross);
        const w = Math.max(0, fa) * Math.max(0, fc);
        h = h * (1 - w) + 8 * w;
      }
    }
    return h;
  }

  // Rings hang in the air over the sea lanes between islands.
  const rings = [];
  const ringSpots = [
    [2600, 1900, 320],
    [4600, 2100, 420],
    [4800, 3300, 260],
    [3800, 4300, 380],
    [6200, 2600, 300],
  ];
  for (const [x, y, alt] of ringSpots) {
    rings.push({ x, y, alt, passed: false, phase: rng() * Math.PI * 2 });
  }

  // Drifting clouds: soft blobs the plane can fly under or through.
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    clouds.push({
      x: rng() * WORLD.width,
      y: rng() * WORLD.height,
      r: 90 + rng() * 190,
      speed: 6 + rng() * 14,
      shade: 0.5 + rng() * 0.5,
    });
  }

  // Storm cells for the third mission: wind that shoves the plane.
  const storms = [
    { x: 4600, y: 2100, r: 700 },
    { x: 6200, y: 2600, r: 600 },
  ];

  function windAt(x, y, mission) {
    if (mission !== 3) return { x: 0, y: 0 };
    let wx = 0;
    let wy = 0;
    for (const s of storms) {
      const dx = x - s.x;
      const dy = y - s.y;
      const d = Math.hypot(dx, dy);
      if (d < s.r) {
        const push = (1 - d / s.r) * 55;
        wx += (-dy / (d || 1)) * push;
        wy += (dx / (d || 1)) * push;
      }
    }
    return { x: wx, y: wy };
  }

  function nearestRunway(x, y) {
    let best = null;
    let bestD = Infinity;
    for (const r of RUNWAYS) {
      const d = Math.hypot(x - r.x, y - r.y);
      if (d < bestD) {
        bestD = d;
        best = r;
      }
    }
    return { runway: best, distance: bestD };
  }

  function onRunway(x, y, heading, altitude, speed) {
    for (const r of RUNWAYS) {
      const dx = x - r.x;
      const dy = y - r.y;
      const along = dx * Math.cos(r.heading) + dy * Math.sin(r.heading);
      const across = -dx * Math.sin(r.heading) + dy * Math.cos(r.heading);
      if (Math.abs(along) < RUNWAY.length / 2 && Math.abs(across) < RUNWAY.width / 2) {
        const align = Math.abs(angleDiff(heading, r.heading));
        const aligned = Math.min(align, Math.PI - align) < RUNWAY.alignTolerance ||
          Math.abs(angleDiff(heading, r.heading + Math.PI)) < RUNWAY.alignTolerance;
        if (altitude < RUNWAY.landingAltMax && speed < RUNWAY.landingSpeedMax && aligned) {
          return r;
        }
      }
    }
    return null;
  }

  return {
    islands: ISLANDS,
    runways: RUNWAYS,
    rings,
    clouds,
    storms,
    heightAt,
    windAt,
    nearestRunway,
    onRunway,
  };
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
