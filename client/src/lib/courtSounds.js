let sharedContext = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!sharedContext || sharedContext.state === "closed") {
    sharedContext = new AudioContext();
  }
  return sharedContext;
}

function rampGain(gainNode, value, at, duration = 0.02) {
  gainNode.gain.cancelScheduledValues(at);
  gainNode.gain.setValueAtTime(gainNode.gain.value, at);
  gainNode.gain.linearRampToValueAtTime(value, at + duration);
}

function playTone(context, destination, { frequency, type = "sine", start, duration, gain, detune = 0 }) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.detune.setValueAtTime(detune, start);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(gain, start + 0.03);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope).connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function playFilteredNoise(context, destination, start) {
  const bufferSize = Math.floor(context.sampleRate * 0.25);
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < bufferSize; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / bufferSize);
  }

  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  noise.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(320, start);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.2, start + 0.01);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
  noise.connect(filter).connect(envelope).connect(destination);
  noise.start(start);
}

function playGavelHit(context, destination, start) {
  const woodBody = context.createOscillator();
  const woodClick = context.createBufferSource();
  const clickFilter = context.createBiquadFilter();
  const bodyEnvelope = context.createGain();
  const clickEnvelope = context.createGain();

  woodBody.type = "triangle";
  woodBody.frequency.setValueAtTime(118, start);
  woodBody.frequency.exponentialRampToValueAtTime(58, start + 0.18);
  bodyEnvelope.gain.setValueAtTime(0.0001, start);
  bodyEnvelope.gain.exponentialRampToValueAtTime(0.5, start + 0.006);
  bodyEnvelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.36);

  const bufferSize = Math.floor(context.sampleRate * 0.06);
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < bufferSize; index += 1) {
    data[index] = (Math.random() * 2 - 1) * Math.exp(-index / (bufferSize * 0.18));
  }

  woodClick.buffer = buffer;
  clickFilter.type = "bandpass";
  clickFilter.frequency.setValueAtTime(900, start);
  clickFilter.Q.setValueAtTime(1.8, start);
  clickEnvelope.gain.setValueAtTime(0.0001, start);
  clickEnvelope.gain.exponentialRampToValueAtTime(0.7, start + 0.004);
  clickEnvelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.08);

  woodBody.connect(bodyEnvelope).connect(destination);
  woodClick.connect(clickFilter).connect(clickEnvelope).connect(destination);
  woodBody.start(start);
  woodBody.stop(start + 0.42);
  woodClick.start(start);
}

export function createCourtIntroSound() {
  const context = getAudioContext();
  if (!context) {
    return {
      startSummon() {},
      stopSummon() {},
      playReady() {},
      playGavel() {},
      dispose() {},
    };
  }

  let summon = null;
  let unlocked = false;

  const unlock = () => {
    if (unlocked) return;
    if (context.state !== "suspended") {
      unlocked = true;
      return;
    }
    context.resume()
      .then(() => {
        unlocked = context.state === "running";
      })
      .catch(() => {});
  };

  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);

  function startSummon() {
    unlock();
    if (summon) return;

    const now = context.currentTime;
    const master = context.createGain();
    const filter = context.createBiquadFilter();
    const drone = context.createOscillator();
    const undertone = context.createOscillator();
    const shimmer = context.createOscillator();
    const shimmerGain = context.createGain();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();

    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.12, now + 0.6);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(620, now);
    filter.Q.setValueAtTime(0.8, now);

    drone.type = "sine";
    drone.frequency.setValueAtTime(82.41, now);
    undertone.type = "triangle";
    undertone.frequency.setValueAtTime(123.47, now);
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(329.63, now);
    shimmerGain.gain.setValueAtTime(0.02, now);
    lfo.frequency.setValueAtTime(0.18, now);
    lfoGain.gain.setValueAtTime(160, now);

    lfo.connect(lfoGain).connect(filter.frequency);
    drone.connect(filter);
    undertone.connect(filter);
    shimmer.connect(shimmerGain).connect(filter);
    filter.connect(master).connect(context.destination);

    drone.start(now);
    undertone.start(now);
    shimmer.start(now);
    lfo.start(now);

    summon = {
      master,
      nodes: [drone, undertone, shimmer, lfo],
    };
  }

  function stopSummon() {
    if (!summon) return;
    const now = context.currentTime;
    rampGain(summon.master, 0.0001, now, 0.45);
    summon.nodes.forEach((node) => {
      try {
        node.stop(now + 0.5);
      } catch {
        // Already stopped.
      }
    });
    summon = null;
  }

  function playReady() {
    unlock();
    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.42, now);
    master.connect(context.destination);

    playFilteredNoise(context, master, now);
    playTone(context, master, { frequency: 196, type: "triangle", start: now + 0.03, duration: 0.7, gain: 0.12 });
    playTone(context, master, { frequency: 246.94, type: "sine", start: now + 0.08, duration: 0.65, gain: 0.09 });
    playTone(context, master, { frequency: 392, type: "sine", start: now + 0.13, duration: 0.8, gain: 0.08 });

    window.setTimeout(() => master.disconnect(), 1200);
  }

  function playGavel() {
    unlock();
    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.38, now);
    master.connect(context.destination);

    playGavelHit(context, master, now + 0.02);
    playGavelHit(context, master, now + 0.22);

    window.setTimeout(() => master.disconnect(), 900);
  }

  function dispose() {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    stopSummon();
  }

  return { startSummon, stopSummon, playReady, playGavel, dispose };
}
