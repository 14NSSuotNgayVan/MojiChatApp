const NOTIFICATION_SOUND_SRC = "/notification.mp3";

let audioEl: HTMLAudioElement | null = null;
let isInitialized = false;
let audioCtx: AudioContext | null = null;

const getAudioEl = () => {
  if (audioEl) return audioEl;
  audioEl = new Audio(NOTIFICATION_SOUND_SRC);
  audioEl.preload = "auto";
  audioEl.volume = 0.9;
  return audioEl;
};

const getAudioContext = () => {
  if (audioCtx) return audioCtx;
  const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  audioCtx = Ctx ? new Ctx() : null;
  return audioCtx;
};

const playFallbackBeep = async () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, now);

  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.2);
};

export const initNotificationAudio = async () => {
  if (isInitialized) return;

  const audio = getAudioEl();
  try {
    const ctx = getAudioContext();
    if (ctx?.state === "suspended") {
      await ctx.resume();
    }
    // Prime the element in a user-gesture context to reduce autoplay blocking.
    audio.muted = true;
    audio.currentTime = 0;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    isInitialized = true;
  } catch {
    audio.muted = false;
  }
};

export const playIncomingMessageSound = async () => {
  const audio = getAudioEl();
  try {
    const ctx = getAudioContext();
    if (ctx?.state === "suspended") {
      await ctx.resume();
    }
    audio.currentTime = 0;
    await audio.play();
  } catch {
    try {
      await playFallbackBeep();
    } catch {
      // Keep silent when both file audio and fallback beep fail.
    }
  }
};

