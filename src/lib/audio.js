// client/src/lib/audio.js
const Audio = (() => {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let unlocked = false;
  const ensure = async () => {
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {}
    }
    unlocked = true;
  };

  function env(duration = 0.3, gain = 0.2) {
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.linearRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    return { g, now };
  }

  function tick() {
    if (!unlocked) return;
    const { g, now } = env(0.08, 0.35);
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(1300, now);
    o.connect(g);
    o.start(now);
    o.stop(now + 0.09);
  }

  function startWhoosh() {
    if (!unlocked) return;
    const { g, now } = env(0.6, 0.25);
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(220, now);
    o.frequency.exponentialRampToValueAtTime(880, now + 0.5);
    o.connect(g);
    o.start(now);
    o.stop(now + 0.55);
  }

  function stopThump() {
    if (!unlocked) return;
    const { g, now } = env(0.12, 0.35);
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(120, now);
    o.connect(g);
    o.start(now);
    o.stop(now + 0.13);
  }

  function winJingle() {
    if (!unlocked) return;
    const seq = [880, 1174, 1567, 2093]; // ascending
    let t = ctx.currentTime;
    seq.forEach((f) => {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(ctx.destination);
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.linearRampToValueAtTime(0.18, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.25);
      t += 0.12;
    });
  }

  // helper สำหรับเรียกปลดล็อกเสียงจาก user interaction
  async function unlock() {
    await ensure();
  }

  return { tick, startWhoosh, stopThump, winJingle, unlock, ctx };
})();
export default Audio;
