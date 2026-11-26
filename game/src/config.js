// Sunset Isles — tuning constants for the flight game.
// One place for every number the flight model, the world and the
// renderer share, so a tweak here retunes the whole game at once.

export const WORLD = {
  width: 7200,
  height: 5200,
  seaDeep: '#173a5e',
  seaShallow: '#2e6f8e',
  sand: '#e8d9a0',
  grass: '#5d8a4a',
  forest: '#3e6b34',
  rock: '#7a7a72',
  snow: '#eef2f2',
};

export const PLANE = {
  maxSpeed: 420, // knots-ish units per second at full throttle
  minSpeed: 90, // below this the wings stop flying
  cruiseSpeed: 240,
  turnRate: 1.9, // radians per second at full bank
  climbRate: 55, // altitude units per second
  sinkRate: 70,
  maxAltitude: 900,
  fuelCapacity: 100,
  fuelBurn: 2.6, // per second at full throttle
  fuelBurnIdle: 0.5,
  damagePerHit: 34,
};

export const RINGS = {
  count: 5,
  radius: 90,
  altitudeBand: 70, // how close in altitude the plane must be
  points: 150,
};

export const RUNWAY = {
  length: 620,
  width: 64,
  landingSpeedMax: 190,
  landingAltMax: 46,
  alignTolerance: 0.45, // radians off the runway heading
  points: 400,
};

export const CAMERA = {
  zoom: 1.0,
  smoothing: 0.08,
};

export const COLORS = {
  hudPanel: 'rgba(8, 18, 32, 0.72)',
  hudText: '#eaf6ff',
  hudAmber: '#ffb454',
  hudRed: '#ff5d5d',
  hudGreen: '#7be495',
  ring: '#ffd166',
  ringGlow: 'rgba(255, 209, 102, 0.35)',
  sun: '#ffcf7d',
  sky: '#ffe3b3',
};
