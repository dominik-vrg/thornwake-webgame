"use strict";

let audioCtx = null;
let masterGain = null;
let limiter = null;
let musicGain = null;
let sfxGain = null;
let audioMuted = false;
let musicNodes = null;

function ensureAudio() {
    if (audioCtx) return audioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;

    audioCtx = new AC();

    limiter = audioCtx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 12;
    limiter.ratio.value = 16;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.15;
    limiter.connect(audioCtx.destination);

    masterGain = audioCtx.createGain();
    masterGain.gain.value = audioMuted ? 0 : 0.8;
    masterGain.connect(limiter);

    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.07;
    musicGain.connect(masterGain);

    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 0.22;
    sfxGain.connect(masterGain);

    return audioCtx;
}

function toggleMute(force) {
    audioMuted = typeof force === "boolean" ? force : !audioMuted;
    if (masterGain && audioCtx) {
        masterGain.gain.setTargetAtTime(audioMuted ? 0 : 0.8, audioCtx.currentTime, 0.05);
    }
    if (typeof showToast === "function") showToast(audioMuted ? "Sound muted" : "Sound on");
}

window.addEventListener("keydown", (e) => {
    if (!UI.gameStarted) return;
    if (e.key.toLowerCase() === "m") toggleMute();
})
const ATTACK_TIME = 0.008;

function playTone(freq, duration, type = "sine", gainValue = 0.2, endFreq = null) {
    const ctx = ensureAudio();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2600;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), ctx.currentTime + duration);

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(gainValue, 0.001), ctx.currentTime + ATTACK_TIME);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
}

function playNoiseBurst(duration, gainValue = 0.18, filterFreq = 900) {
    const ctx = ensureAudio();
    if (!ctx) return;

    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(gainValue, 0.001), ctx.currentTime + ATTACK_TIME);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    src.start();
}

const SFX = {
    swing: () => playTone(420, 0.08, "triangle", 0.12, 220),
    hit: () => playNoiseBurst(0.07, 0.16, 1400),
    playerHit: () => playTone(150, 0.2, "triangle", 0.2, 60),
    enemyDeath: () => playTone(280, 0.25, "triangle", 0.16, 80),
    pickup: () => playTone(820, 0.12, "sine", 0.14, 1150),
    levelUp: () => { playTone(523, 0.16, "sine", 0.16, 660); setTimeout(() => playTone(784, 0.22, "sine", 0.16, 988), 130); },
    questComplete: () => { playTone(660, 0.16, "sine", 0.15, 880); setTimeout(() => playTone(990, 0.22, "sine", 0.15, 1320), 150); },
    travel: () => playTone(220, 0.3, "sine", 0.13, 420),
    uiOpen: () => playTone(580, 0.07, "triangle", 0.08, 680),
    uiClose: () => playTone(460, 0.07, "triangle", 0.07, 360),
    death: () => { playTone(190, 0.5, "triangle", 0.2, 40); playNoiseBurst(0.35, 0.12, 350); },
    bossTelegraph: () => playTone(140, 0.25, "triangle", 0.14, 100),
    bossHit: () => playNoiseBurst(0.09, 0.2, 1100),
    bossSlam: () => { playNoiseBurst(0.28, 0.24, 260); playTone(75, 0.3, "sine", 0.22, 38); },
    bossRanged: () => playTone(680, 0.12, "triangle", 0.11, 300),
    bossSummon: () => playTone(300, 0.3, "triangle", 0.13, 480),
    victory: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => playTone(f, 0.35, "sine", 0.16), i * 160)); },
};

function playSfx(name) {
    if (SFX[name]) SFX[name]();
}

function stopMusic() {
    if (musicNodes) {
        const now = audioCtx ? audioCtx.currentTime : 0;
        for (const { osc, gain } of musicNodes) {
            try {
                if (gain && audioCtx) gain.gain.setTargetAtTime(0.0001, now, 0.08);
                osc.stop(now + 0.2);
            } catch (err) {  }
        }
        musicNodes = null;
    }
}

function startMusicForZone(corruptionAlpha) {
    const ctx = ensureAudio();
    if (!ctx) return;
    stopMusic();

    const baseFreq = 110 - corruptionAlpha * 40;
    const layers = [
        { mult: 1, type: "sine", gain: 0.45 },
        { mult: 1.5, type: "sine", gain: 0.15 },
        { mult: 2.005, type: "triangle", gain: 0.05 + corruptionAlpha * 0.06},
    ];

    const nodes = [];
    for (const layer of layers) {
        const osc = ctx.createOscillator();
        osc.type = layer.type;
        osc.frequency.value = baseFreq * layer.mult;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(layer.gain, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(musicGain);
        osc.start();
        nodes.push({ osc, gain });
    }
    musicNodes = nodes;
}

function restoreMusic() {
    if (typeof currentZone !== "undefined" && currentZone) startMusicForZone(currentZone.corruption.alpha);
}

function duckMusic(factor, holdMs = 1500) {
    if (!musicGain || !audioCtx) return;
    musicGain.gain.setTargetAtTime(0.07 * factor, audioCtx.currentTime, 0.2);
    setTimeout(() => {
        if (musicGain && audioCtx) musicGain.gain.setTargetAtTime(0.07, audioCtx.currentTime, 0.6);
    }, holdMs);
}