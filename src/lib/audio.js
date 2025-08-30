// client/src/lib/audio.js
let ctx,
  masterGain,
  unlocked = false;

function ensureCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.4; // master volume (0..1)
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

export async function unlockAudio() {
  ensureCtx();
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {}
  }
  unlocked = true;
}

function beep({ freq = 800, dur = 0.06, type = "square", vol = 0.35 }) {
  ensureCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const now = ctx.currentTime;

  osc.type = type;
  osc.frequency.value = freq;

  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(vol, now + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  osc.connect(g);
  g.connect(masterGain);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

export function startSpinSound() {
  if (!unlocked) return;
  ensureCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const now = ctx.currentTime;

  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(500, now + 0.25);

  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

  osc.connect(g);
  g.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.3);
}

export function tickSound(step = 0) {
  if (!unlocked) return;
  const base = 650;
  const freq = base + (step % 7) * 40; // ไล่ pitch ให้รู้สึกเคลื่อน
  beep({ freq, dur: 0.035, type: "square", vol: 0.25 });
}

export function winSound() {
  if (!unlocked) return;
  [880, 1175, 1568].forEach((f, i) => {
    setTimeout(
      () => beep({ freq: f, dur: 0.12, type: "triangle", vol: 0.35 }),
      i * 120
    );
  });
}

export function errorSound() {
  if (!unlocked) return;
  beep({ freq: 220, dur: 0.15, type: "sawtooth", vol: 0.3 });
  setTimeout(
    () => beep({ freq: 180, dur: 0.15, type: "sawtooth", vol: 0.25 }),
    120
  );
}

export function setMasterVolume(v) {
  ensureCtx();
  masterGain.gain.value = Math.max(0, Math.min(1, v));
}
export function mute(b = true) {
  setMasterVolume(b ? 0 : 0.4);
}
