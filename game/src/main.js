// Sunset Isles — the game loop, the missions and the screens.
// Three sorties over one island chain: thread the rings, hop the
// runways, then do it again in a storm. Keyboard flies the plane,
// the mouse picks missions and clicks the buttons.

import { buildWorld } from './world.js';
import { createPlane, stepPlane } from './physics.js';
import { createRenderer } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { RINGS } from './config.js';

const MISSIONS = [
  {
    id: 1,
    name: 'Ring Run',
    blurb: 'thread all five rings over the sea lanes',
    goal: 'rings',
    target: 5,
  },
  {
    id: 2,
    name: 'Island Hop',
    blurb: 'land at two runways, Harbour Field then Coral Strip',
    goal: 'landings',
    target: 2,
  },
  {
    id: 3,
    name: 'Storm Run',
    blurb: 'rings again, inside the storm cells — mind the wind',
    goal: 'rings',
    target: 5,
  },
];

const LANDING_ORDER = [0, 1]; // runway indexes for mission 2

const params = new URLSearchParams(location.search);
const SEED = Number(params.get('seed') || 20261126);
const SHOT = params.get('shot') || '';

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const world = buildWorld(SEED);
const input = createInput(canvas);
const renderer = createRenderer(canvas);
const audio = createAudio();

const state = {
  world,
  plane: null,
  mission: MISSIONS[0],
  missions: MISSIONS,
  selected: 0,
  mode: 'menu', // menu | flying | paused | crashed | landed | complete
  landings: 0,
  missionDone: false,
  shot: SHOT,
};

function startMission(index) {
  const mission = MISSIONS[index];
  state.mission = mission;
  state.selected = index;
  state.landings = 0;
  state.missionDone = false;
  for (const ring of world.rings) ring.passed = false;
  const runway = world.runways[0];
  state.plane = createPlane(world, runway);
  state.plane.throttle = 0.55;
  state.plane.speed = 200;
  state.plane.altitude = 260;
  state.mode = 'flying';
  renderer.setCamera(state.plane.x - canvas.clientWidth / 2, state.plane.y - canvas.clientHeight / 2);
  audio.unlock();
  audio.click();
  announce(`${mission.name}. ${mission.blurb}.`);
}

function announce(text) {
  statusEl.textContent = text;
}

function nextMission() {
  const next = state.mission.id % MISSIONS.length;
  startMission(next);
}

function checkMissionDone(now) {
  const plane = state.plane;
  if (state.missionDone) return;
  if (state.mission.goal === 'rings' && plane.ringsPassed >= state.mission.target) {
    state.missionDone = true;
    plane.score += 500;
    plane.message = `MISSION COMPLETE — ${state.mission.name.toUpperCase()} +500`;
    plane.messageAt = now;
    audio.land();
    announce(`Mission complete: ${state.mission.name}. Score ${plane.score}.`);
    if (state.mission.id === MISSIONS.length) {
      state.mode = 'complete';
    } else {
      state.mode = 'landed';
    }
  }
}

function onLanding(now) {
  state.landings += 1;
  audio.land();
  if (state.mission.goal === 'landings') {
    const wanted = LANDING_ORDER[state.landings - 1];
    const strip = world.onRunway(state.plane.x, state.plane.y, state.plane.heading, state.plane.altitude, state.plane.speed);
    const rightStrip = strip && world.runways.indexOf(strip) === wanted;
    if (rightStrip && state.landings >= state.mission.target) {
      state.missionDone = true;
      state.plane.score += 500;
      state.plane.message = `ISLAND HOP COMPLETE — +500`;
      state.plane.messageAt = now;
      state.mode = state.mission.id === MISSIONS.length ? 'complete' : 'landed';
      announce(`Island hop complete. Score ${state.plane.score}.`);
      return;
    }
    if (!rightStrip) {
      state.plane.message = `WRONG STRIP — next stop is ${world.runways[wanted].name.toUpperCase()}`;
      state.plane.messageAt = now;
    }
    state.plane.landed = false;
    state.plane.speed = 60;
    state.plane.altitude = 0;
  } else {
    // A landing mid-mission refuels and the sortie goes on.
    state.plane.landed = false;
    state.plane.speed = 60;
    state.plane.altitude = 0;
  }
}

// Deterministic set-ups for the screenshots (?shot=cover etc.).
function applyShot() {
  if (state.shot === 'cover') {
    startMission(0);
    const p = state.plane;
    p.x = 2450;
    p.y = 1850;
    p.heading = 0.7;
    p.speed = 260;
    p.altitude = 320;
    p.throttle = 0.8;
    p.fuel = 78;
    renderer.setCamera(p.x - canvas.clientWidth / 2, p.y - canvas.clientHeight / 2);
  } else if (state.shot === 'approach') {
    startMission(1);
    const p = state.plane;
    const r = world.runways[1];
    p.x = r.x - Math.cos(r.heading) * 700;
    p.y = r.y - Math.sin(r.heading) * 700;
    p.heading = r.heading;
    p.speed = 165;
    p.altitude = 90;
    p.throttle = 0.25;
    p.fuel = 64;
    p.score = 550;
    p.ringsPassed = 2;
    renderer.setCamera(p.x - canvas.clientWidth / 2, p.y - canvas.clientHeight / 2);
  } else if (state.shot === 'menu') {
    state.mode = 'menu';
  }
}

function frame(nowMs) {
  const now = nowMs / 1000;
  const dt = Math.min(0.05, (nowMs - (frame.last || nowMs)) / 1000 || 0.016);
  frame.last = nowMs;

  if (state.mode === 'menu') {
    if (input.tapped('confirm')) startMission(state.selected);
    if (input.tapped('throttleUp') || input.tapped('throttleDown')) {
      state.selected = (state.selected + (input.tapped('throttleUp') ? 2 : 1)) % 3;
    }
  } else if (state.mode === 'flying') {
    const beforeRings = state.plane.ringsPassed;
    stepPlane(state.plane, world, input, dt, state.mission.id, now);
    if (state.plane.ringsPassed > beforeRings) audio.ring();
    if (state.plane.crashed) {
      state.mode = 'crashed';
      audio.crash();
      announce(state.plane.message);
    } else if (state.plane.landed) {
      onLanding(now);
    }
    checkMissionDone(now);
    if (input.tapped('pause')) state.mode = 'paused';
    if (input.tapped('restart')) startMission(state.selected);
    audio.engine(state.plane.throttle, !state.plane.crashed);
  } else if (state.mode === 'paused') {
    if (input.tapped('pause') || input.tapped('confirm')) state.mode = 'flying';
    if (input.tapped('restart')) startMission(state.selected);
  } else if (state.mode === 'crashed') {
    if (input.tapped('restart')) startMission(state.selected);
    audio.engine(0, false);
  } else if (state.mode === 'landed') {
    if (input.tapped('confirm')) nextMission();
    if (input.tapped('restart')) startMission(state.selected);
  } else if (state.mode === 'complete') {
    if (input.tapped('restart')) startMission(0);
  }

  if (state.mode !== 'menu' && state.plane) renderer.follow(state.plane);
  renderer.render(state, now);
  input.endFrame();
  requestAnimationFrame(frame);
}

// Menu clicks: pick a mission by clicking its row.
input.onClick((x, y) => {
  audio.unlock();
  if (state.mode !== 'menu') return;
  const top = canvas.clientHeight / 2 - 8;
  for (let i = 0; i < 3; i++) {
    const rowY = top + i * 62;
    if (x >= canvas.clientWidth / 2 - 340 && x <= canvas.clientWidth / 2 + 340 && y >= rowY && y <= rowY + 48) {
      startMission(i);
      return;
    }
  }
});

// Number keys 1-3 pick a mission from the menu.
window.addEventListener('keydown', (e) => {
  if (state.mode === 'menu' && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
    state.selected = Number(e.code.slice(-1)) - 1;
  }
});

function resize() {
  renderer.resize();
}
window.addEventListener('resize', resize);
resize();
applyShot();
requestAnimationFrame(frame);
