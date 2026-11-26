// The flight model of Sunset Isles: a forgiving arcade model with
// real trade-offs. Throttle sets target speed, banking turns the
// nose, lift needs speed, and the ground is always waiting below.
// Altitude is feet above the sea; terrain height is feet above it too.

import { PLANE, RINGS, RUNWAY } from './config.js';
import { angleDiff } from './world.js';

export function createPlane(world, runway) {
  return {
    x: runway.x - Math.cos(runway.heading) * (RUNWAY.length / 2 + 500),
    y: runway.y - Math.sin(runway.heading) * (RUNWAY.length / 2 + 500),
    heading: runway.heading,
    speed: 0,
    altitude: 0,
    throttle: 0,
    fuel: PLANE.fuelCapacity,
    damage: 0,
    lastStrikeAt: -10,
    score: 0,
    ringsPassed: 0,
    landed: false,
    crashed: false,
    message: '',
    messageAt: 0,
    flightTime: 0,
  };
}

export function stepPlane(plane, world, input, dt, mission, now) {
  if (plane.crashed || plane.landed) return;

  // Throttle: Up/W spools up, Down/S spools down.
  if (input.held('throttleUp')) plane.throttle = Math.min(1, plane.throttle + dt * 0.55);
  if (input.held('throttleDown')) plane.throttle = Math.max(0, plane.throttle - dt * 0.7);

  // Turning bleeds a little speed; banking hard at low speed stalls.
  const turning = (input.held('turnLeft') ? -1 : 0) + (input.held('turnRight') ? 1 : 0);
  const bank = turning * PLANE.turnRate * (0.55 + 0.45 * Math.min(1, plane.speed / PLANE.cruiseSpeed));
  plane.heading += bank * dt;

  // Speed chases the throttle; drag grows with the square of speed.
  const targetSpeed = PLANE.minSpeed + (PLANE.maxSpeed - PLANE.minSpeed) * plane.throttle;
  const drag = 0.35 + 0.0000045 * plane.speed * plane.speed;
  plane.speed += (targetSpeed - plane.speed) * Math.min(1, drag * dt * 2.4);
  plane.speed -= Math.abs(turning) * 14 * dt;

  // Lift: above minimum speed the plane climbs gently on its own;
  // below it, it sinks. Throttle adds climb, idle adds sink.
  const flying = plane.speed > PLANE.minSpeed + 12;
  let climb = 0;
  if (flying) climb = (plane.throttle - 0.42) * PLANE.climbRate;
  else climb = -PLANE.sinkRate * (1 - plane.speed / PLANE.maxSpeed);
  plane.altitude = Math.max(0, Math.min(PLANE.maxAltitude, plane.altitude + climb * dt));

  // Wind shoves the plane in mission 3's storm cells.
  const wind = world.windAt(plane.x, plane.y, mission);
  plane.x += (Math.cos(plane.heading) * plane.speed + wind.x) * dt;
  plane.y += (Math.sin(plane.heading) * plane.speed + wind.y) * dt;

  // Stay inside the charted sea.
  plane.x = Math.max(60, Math.min(7140, plane.x));
  plane.y = Math.max(60, Math.min(5140, plane.y));

  // Fuel: thirsty at full throttle, sipping at idle.
  const burn = PLANE.fuelBurnIdle + (PLANE.fuelBurn - PLANE.fuelBurnIdle) * plane.throttle;
  plane.fuel = Math.max(0, plane.fuel - burn * dt);
  if (plane.fuel <= 0 && plane.throttle > 0) {
    plane.throttle = 0;
    plane.message = 'OUT OF FUEL — glide to a runway!';
    plane.messageAt = now;
  }

  plane.flightTime += dt;

  // Rings: fly through the hoop at the right height.
  for (const ring of world.rings) {
    if (ring.passed) continue;
    const d = Math.hypot(plane.x - ring.x, plane.y - ring.y);
    const altOk = Math.abs(plane.altitude - ring.alt) < RINGS.altitudeBand;
    if (d < RINGS.radius && altOk) {
      ring.passed = true;
      plane.ringsPassed += 1;
      plane.score += RINGS.points;
      plane.message = `RING ${plane.ringsPassed} OF ${world.rings.length} — +${RINGS.points}`;
      plane.messageAt = now;
    }
  }

  // Landing first: slow, low, lined up over a runway beats the ground.
  const strip = world.onRunway(plane.x, plane.y, plane.heading, plane.altitude, plane.speed);
  if (strip && !plane.crashed) {
    plane.landed = true;
    plane.score += RUNWAY.points;
    plane.fuel = PLANE.fuelCapacity;
    plane.message = `TOUCHDOWN AT ${strip.name.toUpperCase()} — +${RUNWAY.points} · REFUELLED`;
    plane.messageAt = now;
    return;
  }

  // Terrain: the ground is solid. Mountains hurt; the sea swallows.
  const ground = world.heightAt(plane.x, plane.y);
  if (plane.altitude <= 0.5 && ground < 0) {
    // In the water.
    plane.crashed = true;
    plane.message = 'DITCHED IN THE SEA — press R to fly again';
    plane.messageAt = now;
  } else if (plane.altitude < ground) {
    if (ground > 40) {
      // Hit a hill or a mountain. One strike a second at most, so a
      // single ridge cannot shred the plane in one pass.
      if (now - plane.lastStrikeAt >= 1) {
        plane.lastStrikeAt = now;
        plane.damage += PLANE.damagePerHit;
        plane.altitude = ground + 30;
        plane.speed *= 0.55;
        plane.message = 'TERRAIN STRIKE — pull up!';
        plane.messageAt = now;
      }
      if (plane.damage >= 100) {
        plane.crashed = true;
        plane.message = 'CRASHED — press R to fly again';
        plane.messageAt = now;
      }
    } else {
      // Rough beach: a hard bump, not a crash. Also rate-limited.
      if (now - plane.lastStrikeAt >= 1) {
        plane.lastStrikeAt = now;
        plane.damage += 10;
        plane.altitude = ground;
        plane.speed *= 0.8;
        plane.message = 'ROUGH GROUND — watch the terrain!';
        plane.messageAt = now;
      }
      if (plane.damage >= 100) {
        plane.crashed = true;
        plane.message = 'CRASHED — press R to fly again';
        plane.messageAt = now;
      }
    }
  }

  // Out of the map's edge: turn back with a warning, never a wall.
  if (plane.x <= 70 || plane.x >= 7130 || plane.y <= 70 || plane.y >= 5130) {
    plane.message = 'EDGE OF THE CHART — turn back';
    plane.messageAt = now;
  }
}

export { angleDiff };
