// Sound for Sunset Isles, synthesized live with WebAudio — no audio
// files, no network. A soft engine hum that follows the throttle,
// a chime for a ring, a thud for a touchdown and a crunch for a crash.

export function createAudio() {
  let ctx = null;
  let engineOsc = null;
  let engineGain = null;
  let enabled = true;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    engineOsc = ctx.createOscillator();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 55;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    engineGain = ctx.createGain();
    engineGain.gain.value = 0;
    engineOsc.connect(filter);
    filter.connect(engineGain);
    engineGain.connect(ctx.destination);
    engineOsc.start();
    return ctx;
  }

  function blip(freq, dur, type, vol, when = 0) {
    if (!enabled || !ensure()) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    unlock() {
      ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },
    engine(throttle, flying) {
      if (!ensure()) return;
      const target = flying ? 0.015 + throttle * 0.05 : 0;
      engineGain.gain.setTargetAtTime(target, ctx.currentTime, 0.1);
      engineOsc.frequency.setTargetAtTime(48 + throttle * 70, ctx.currentTime, 0.1);
    },
    ring() {
      blip(880, 0.35, 'sine', 0.16);
      blip(1318, 0.4, 'sine', 0.12, 0.09);
    },
    land() {
      blip(180, 0.25, 'triangle', 0.2);
      blip(523, 0.3, 'sine', 0.12, 0.08);
    },
    crash() {
      blip(90, 0.5, 'sawtooth', 0.22);
      blip(60, 0.7, 'square', 0.12, 0.1);
    },
    click() {
      blip(660, 0.07, 'sine', 0.08);
    },
    toggle() {
      enabled = !enabled;
      if (!enabled && engineGain) engineGain.gain.value = 0;
      return enabled;
    },
  };
}
