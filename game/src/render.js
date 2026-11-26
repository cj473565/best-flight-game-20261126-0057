// Rendering for Sunset Isles: a sunset sea, vector islands, glowing
// rings, the little aeroplane and a lit instrument panel. Everything
// is drawn with the canvas 2D API — no image assets, no network.

import { WORLD, COLORS, PLANE } from './config.js';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let view = { w: 1280, h: 800 };
  let camera = { x: 0, y: 0 };

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    view = { w: canvas.clientWidth, h: canvas.clientHeight };
    canvas.width = Math.round(view.w * dpr);
    canvas.height = Math.round(view.h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function follow(plane) {
    const tx = plane.x - view.w / 2;
    const ty = plane.y - view.h / 2;
    camera.x += (tx - camera.x) * 0.08;
    camera.y += (ty - camera.y) * 0.08;
  }

  function drawSea(t) {
    // World-space sunset: orange at the north horizon, deep blue south.
    const g = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    g.addColorStop(0, '#f7b267');
    g.addColorStop(0.25, '#e08a5a');
    g.addColorStop(0.6, '#2e6f8e');
    g.addColorStop(1, '#173a5e');
    ctx.fillStyle = g;
    ctx.fillRect(camera.x - 60, camera.y - 60, view.w + 120, view.h + 120);
    // Sun glitter on the water, fixed in the world so it scrolls along.
    ctx.fillStyle = 'rgba(255, 220, 150, 0.10)';
    for (let i = 0; i < 60; i++) {
      const x = (i * 613) % WORLD.width;
      const y = (i * 977) % WORLD.height;
      if (x < camera.x - 40 || x > camera.x + view.w + 40) continue;
      if (y < camera.y - 40 || y > camera.y + view.h + 40) continue;
      ctx.fillRect(x, y, 26, 2);
    }
  }

  function islandShape(isle, t) {
    // Layered ellipses: sand rim, grass, forest heart, rock crown.
    const layers = [
      [1.0, WORLD.sand],
      [0.86, WORLD.grass],
      [0.62, WORLD.forest],
      [0.38, WORLD.rock],
    ];
    if (isle.peak > 600) layers.push([0.16, WORLD.snow]);
    for (const [scale, color] of layers) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(isle.x, isle.y, isle.rx * scale, isle.ry * scale, 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    // A few pine dots on the forest band.
    ctx.fillStyle = 'rgba(20, 50, 20, 0.5)';
    for (let i = 0; i < 14; i++) {
      const a = (i * 2.399) % (Math.PI * 2);
      const r = 0.55 + 0.1 * Math.sin(i * 7.3);
      ctx.beginPath();
      ctx.arc(isle.x + Math.cos(a) * isle.rx * r * 0.8, isle.y + Math.sin(a) * isle.ry * r * 0.8, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawRunway(r) {
    ctx.save();
    ctx.translate(r.x, r.y);
    ctx.rotate(r.heading);
    ctx.fillStyle = '#3a3f46';
    ctx.fillRect(-310, -32, 620, 64);
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 2;
    ctx.strokeRect(-310, -32, 620, 64);
    ctx.setLineDash([26, 22]);
    ctx.beginPath();
    ctx.moveTo(-290, 0);
    ctx.lineTo(290, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(r.name.toUpperCase(), 0, -44);
    ctx.restore();
  }

  function drawRing(ring, t) {
    const bob = Math.sin(t * 1.6 + ring.phase) * 8;
    const y = ring.y + bob * 0.3;
    const squash = 0.42;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = COLORS.ring;
    ctx.lineWidth = 7;
    ctx.shadowColor = COLORS.ring;
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.ellipse(ring.x, y, 90, 90 * squash, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff3c4';
    ctx.beginPath();
    ctx.ellipse(ring.x, y, 90, 90 * squash, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fff3c4';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(ring.alt)} FT`, ring.x, y - 52);
    ctx.restore();
  }

  function drawCloud(c, t) {
    const x = ((c.x + t * c.speed) % (WORLD.width + 400)) - 200;
    ctx.save();
    ctx.globalAlpha = 0.22 * c.shade + 0.18;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x, c.y, c.r, c.r * 0.42, 0, 0, Math.PI * 2);
    ctx.ellipse(x + c.r * 0.5, c.y + 8, c.r * 0.6, c.r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPlane(plane) {
    const shadowLift = plane.altitude * 0.12;
    // Soft shadow on the ground or sea below.
    ctx.save();
    ctx.translate(plane.x + shadowLift * 0.6, plane.y + shadowLift * 0.6);
    ctx.rotate(plane.heading);
    ctx.globalAlpha = Math.max(0.08, 0.3 - plane.altitude / 3000);
    ctx.fillStyle = '#06283f';
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // The aeroplane itself, top-down, nose to the right.
    ctx.save();
    ctx.translate(plane.x, plane.y);
    ctx.rotate(plane.heading);
    const bank = 0;
    ctx.rotate(bank);
    ctx.fillStyle = '#f4f1e6';
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    // Fuselage.
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.quadraticCurveTo(18, -7, -6, -6);
    ctx.lineTo(-26, -5);
    ctx.lineTo(-26, 5);
    ctx.lineTo(-6, 6);
    ctx.quadraticCurveTo(18, 7, 30, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Main wing.
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.moveTo(6, -4);
    ctx.lineTo(-4, -34);
    ctx.lineTo(-12, -34);
    ctx.lineTo(-12, -4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, 4);
    ctx.lineTo(-4, 34);
    ctx.lineTo(-12, 34);
    ctx.lineTo(-12, 4);
    ctx.closePath();
    ctx.fill();
    // Tail.
    ctx.fillStyle = '#f4f1e6';
    ctx.beginPath();
    ctx.moveTo(-24, -3);
    ctx.lineTo(-32, -12);
    ctx.lineTo(-32, 12);
    ctx.lineTo(-24, 3);
    ctx.closePath();
    ctx.fill();
    // Cockpit.
    ctx.fillStyle = '#173a5e';
    ctx.beginPath();
    ctx.ellipse(14, 0, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Prop blur when the engine runs.
    if (plane.throttle > 0.05 && !plane.crashed) {
      ctx.save();
      ctx.translate(plane.x + Math.cos(plane.heading) * 32, plane.y + Math.sin(plane.heading) * 32);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.25 + plane.throttle * 0.4})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawMinimap(world, plane, t) {
    const mw = 190;
    const mh = 138;
    const x0 = view.w - mw - 16;
    const y0 = 16;
    ctx.save();
    ctx.fillStyle = COLORS.hudPanel;
    roundRect(x0, y0, mw, mh, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.stroke();
    const sx = mw / WORLD.width;
    const sy = mh / WORLD.height;
    ctx.fillStyle = '#2e6f8e';
    ctx.fillRect(x0 + 4, y0 + 4, mw - 8, mh - 8);
    for (const isle of world.islands) {
      ctx.fillStyle = '#5d8a4a';
      ctx.beginPath();
      ctx.ellipse(x0 + isle.x * sx, y0 + isle.y * sy, Math.max(3, isle.rx * sx), Math.max(2, isle.ry * sy), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const r of world.runways) {
      ctx.strokeStyle = '#e8e8e8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0 + (r.x - Math.cos(r.heading) * 200) * sx, y0 + (r.y - Math.sin(r.heading) * 200) * sy);
      ctx.lineTo(x0 + (r.x + Math.cos(r.heading) * 200) * sx, y0 + (r.y + Math.sin(r.heading) * 200) * sy);
      ctx.stroke();
    }
    for (const ring of world.rings) {
      if (ring.passed) continue;
      ctx.fillStyle = COLORS.ring;
      ctx.beginPath();
      ctx.arc(x0 + ring.x * sx, y0 + ring.y * sy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x0 + plane.x * sx, y0 + plane.y * sy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawHud(plane, mission, world, t) {
    const pad = 16;
    // Top-left instrument cluster.
    const hx = pad;
    const hy = pad;
    const hw = 300;
    const hh = 118;
    ctx.fillStyle = COLORS.hudPanel;
    roundRect(hx, hy, hw, hh, 10);
    ctx.fill();
    ctx.fillStyle = COLORS.hudText;
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = COLORS.hudAmber;
    ctx.fillText('ALTITUDE', hx + 14, hy + 22);
    ctx.fillText('SPEED', hx + 118, hy + 22);
    ctx.fillText('HEADING', hx + 212, hy + 22);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 24px monospace';
    ctx.fillText(String(Math.round(plane.altitude)).padStart(3, '0'), hx + 14, hy + 52);
    ctx.fillText(String(Math.round(plane.speed)).padStart(3, '0'), hx + 118, hy + 52);
    const deg = ((plane.heading * 180) / Math.PI % 360 + 360) % 360;
    ctx.fillText(String(Math.round(deg)).padStart(3, '0') + '°', hx + 212, hy + 52);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = 'rgba(234,246,255,0.65)';
    ctx.fillText('FEET', hx + 14, hy + 70);
    ctx.fillText('KNOTS', hx + 118, hy + 70);
    ctx.fillText('DEGREES', hx + 212, hy + 70);
    // Throttle + fuel bars, stacked with their labels.
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(hx + 52, hy + 82, 150, 10);
    ctx.fillStyle = COLORS.hudGreen;
    ctx.fillRect(hx + 52, hy + 82, 150 * plane.throttle, 10);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('THR', hx + 14, hy + 91);
    const fuelColor = plane.fuel < 25 ? COLORS.hudRed : COLORS.hudAmber;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(hx + 52, hy + 100, 150, 10);
    ctx.fillStyle = fuelColor;
    ctx.fillRect(hx + 52, hy + 100, 150 * (plane.fuel / PLANE.fuelCapacity), 10);
    ctx.fillStyle = COLORS.hudText;
    ctx.fillText('FUEL', hx + 14, hy + 109);
    ctx.fillText(`${Math.round(plane.fuel)}%`, hx + 210, hy + 109);

    // Score + mission, top centre.
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.hudPanel;
    roundRect(view.w / 2 - 190, pad, 380, 64, 10);
    ctx.fill();
    ctx.fillStyle = COLORS.hudAmber;
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(mission.name.toUpperCase(), view.w / 2, pad + 22);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`SCORE ${plane.score}   ·   RINGS ${plane.ringsPassed}/${world.rings.length}`, view.w / 2, pad + 48);

    // Damage bar, bottom left.
    if (plane.damage > 0) {
      ctx.textAlign = 'left';
      ctx.fillStyle = COLORS.hudPanel;
      roundRect(pad, view.h - 44, 220, 28, 8);
      ctx.fill();
      ctx.fillStyle = COLORS.hudRed;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('DAMAGE', pad + 10, view.h - 25);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(pad + 74, view.h - 35, 130, 10);
      ctx.fillStyle = COLORS.hudRed;
      ctx.fillRect(pad + 74, view.h - 35, 130 * (plane.damage / 100), 10);
    }

    // Nearest runway hint, bottom centre.
    const near = world.nearestRunway(plane.x, plane.y);
    if (near.distance < 1400 && !plane.landed) {
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(8, 18, 32, 0.6)';
      roundRect(view.w / 2 - 150, view.h - 44, 300, 28, 8);
      ctx.fill();
      ctx.fillStyle = COLORS.hudText;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`${near.runway.name.toUpperCase()} — ${Math.round(near.distance)} FT`, view.w / 2, view.h - 25);
    }

    // Message banner.
    if (plane.message && t - plane.messageAt < 4) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 22px sans-serif';
      const w = ctx.measureText(plane.message).width + 36;
      ctx.fillStyle = 'rgba(8, 18, 32, 0.75)';
      roundRect(view.w / 2 - w / 2, view.h - 118, w, 40, 10);
      ctx.fill();
      ctx.fillStyle = plane.crashed ? COLORS.hudRed : COLORS.hudText;
      ctx.fillText(plane.message, view.w / 2, view.h - 91);
    }
  }

  function drawTitle(missions, selected, t) {
    ctx.fillStyle = 'rgba(6, 16, 30, 0.55)';
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcf7d';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('SUNSET ISLES', view.w / 2, view.h / 2 - 150);
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('Fly the island chain. Thread the rings. Bring her home.', view.w / 2, view.h / 2 - 108);
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('ARROWS / WASD — throttle and turn  ·  MOUSE — pick a mission  ·  P — pause  ·  R — restart', view.w / 2, view.h / 2 - 72);
    missions.forEach((m, i) => {
      const y = view.h / 2 - 8 + i * 62;
      const hot = i === selected;
      ctx.fillStyle = hot ? 'rgba(255, 209, 102, 0.92)' : 'rgba(8, 18, 32, 0.72)';
      roundRect(view.w / 2 - 340, y, 680, 48, 10);
      ctx.fill();
      ctx.fillStyle = hot ? '#1a1a2e' : '#eaf6ff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`${i + 1}. ${m.name} — ${m.blurb}`, view.w / 2, y + 30);
    });
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '14px sans-serif';
    ctx.fillText('Click a mission, or press 1–3, then Enter. Land slow, low and lined up.', view.w / 2, view.h / 2 + 196);
  }

  function drawBanner(title, sub, hint) {
    ctx.fillStyle = 'rgba(6, 16, 30, 0.6)';
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px Georgia, serif';
    ctx.fillText(title, view.w / 2, view.h / 2 - 20);
    ctx.font = '22px Georgia, serif';
    ctx.fillStyle = '#ffcf7d';
    ctx.fillText(sub, view.w / 2, view.h / 2 + 22);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(hint, view.w / 2, view.h / 2 + 62);
  }

  return {
    resize,
    follow,
    render(state, t) {
      const { world, plane, mission, mode } = state;
      ctx.save();
      ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
      drawSea(t);
      for (const isle of world.islands) islandShape(isle, t);
      for (const r of world.runways) drawRunway(r);
      for (const ring of world.rings) {
        if (!ring.passed) drawRing(ring, t);
      }
      for (const c of world.clouds) drawCloud(c, t);
      if (mode !== 'menu') drawPlane(plane);
      ctx.restore();
      if (mode !== 'menu') {
        drawMinimap(world, plane, t);
        drawHud(plane, mission, world, t);
      }
      if (mode === 'menu') drawTitle(state.missions, state.selected, t);
      if (mode === 'paused') drawBanner('PAUSED', 'The isles wait for you.', 'Press P or click to keep flying');
      if (mode === 'crashed') drawBanner('CRASHED', plane.message, 'Press R to fly again');
      if (mode === 'landed') drawBanner('TOUCHDOWN!', plane.message, 'Press Enter for the next mission, or R to fly again');
      if (mode === 'complete') drawBanner('ISLAND HOP COMPLETE!', `Final score ${plane.score} — you flew all three missions.`, 'Press R to fly the chain again');
    },
    setCamera(x, y) {
      camera.x = x;
      camera.y = y;
    },
  };
}
