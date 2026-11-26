// Seeded randomness for Sunset Isles: the same seed always builds the
// same islands, rings and weather, so a screenshot can be reproduced
// exactly and a run can be replayed fair and square.

// mulberry32 — small, fast, deterministic.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Smooth 2D value noise from a seeded grid, for terrain height.
export function makeNoise(seed) {
  const rand = makeRng(seed);
  const size = 64;
  const grid = new Float32Array(size * size);
  for (let i = 0; i < grid.length; i++) grid[i] = rand();
  const at = (ix, iy) => grid[((iy % size + size) % size) * size + ((ix % size + size) % size)];
  const smooth = (t) => t * t * (3 - 2 * t);
  return function noise(x, y) {
    const fx = Math.floor(x);
    const fy = Math.floor(y);
    const tx = smooth(x - fx);
    const ty = smooth(y - fy);
    const a = at(fx, fy);
    const b = at(fx + 1, fy);
    const c = at(fx, fy + 1);
    const d = at(fx + 1, fy + 1);
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
}

// Fractal brownian motion: a few octaves of value noise layered up.
export function makeFbm(seed) {
  const noise = makeNoise(seed);
  return function fbm(x, y) {
    let value = 0;
    let amp = 0.55;
    let freq = 1;
    for (let o = 0; o < 4; o++) {
      value += amp * noise(x * freq, y * freq);
      amp *= 0.5;
      freq *= 2.03;
    }
    return value;
  };
}
