"use strict";

let audioCtx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let audioMuted = false;
let musicNodes = null;

function ensureAudio() {
    if (audioCtx) return audioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;

    audioCtx = new AC();

    masterGain = audioCtx.createGain();
    masterGain.gain.value = audioMuted ? 0 : 1;
    masterGain.connect(audioCtx.destination);

    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.12;
    musicGain.connect(masterGain);

    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 0.35;
    sfxGain.connect(masterGain);

    return audioCtx;
}

function toggleMute(force) {
    audioMuted = typeof force === "boolean" ? force : !audioMuted;
    if (masterGain && audioCtx) {
        masterGain.gain.setTargetAtTime(audioMuted ? 0 : 1, audioCtx.currentTime, 0.05);
    }
    if (typeof showToast === "function") showToast(audioMuted ? "Sound muted" : "Sound on");
}

window.addEventListener("keydown", (e) => {
    if (!UI.gameStarted) return;
    if (e.key.toLowerCase() === "m") toggleMute();
});

function playTone(freq, duration, type = "sine", gainValue = 0.3, endFreq = null) {
    const ctx = ensureAudio();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), ctx.currentTime + duration);

    gain.gain.setValueAtTime(gainValue, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + duration);
}

function playNoiseBurst(duration, gainValue = 0.3, filterFreq = 1200) {
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
    gain.gain.setValueAtTime(gainValue, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);
    src.start();
}

const SFX = {
    swing: () => playTone(440, 0.08, "square", 0.15, 200),
    hit: () => playNoiseBurst(0.08, 0.22, 2000),
    playerHit: () => playTone(160, 0.2, "sawtooth", 0.28, 60),
    enemyDeath: () => playTone(300, 0.25, "triangle", 0.22, 80),
    pickup: () => playTone(880, 0.12, "sine", 0.18, 1200),
    levelUp: () => { playTone(523, 0.15, "sine", 0.22, 660); setTimeout(() => playTone(784, 0.2, "sine", 0.22, 988), 120); },
    questComplete: () => { playTone(660, 0.15, "sine", 0.2, 880); setTimeout(() => playTone(990, 0.2, "sine", 0.2, 1320), 140); },
    travel: () => playTone(220, 0.3, "sine", 0.18, 440),
    uiOpen: () => playTone(600, 0.06, "square", 0.1, 700),
    uiClose: () => playTone(480, 0.06, "square", 0.09, 380),
    death: () => { playTone(200, 0.5, "sawtooth", 0.28, 40); playNoiseBurst(0.4, 0.18, 400); },
    bossTelegraph: () => playTone(150, 0.25, "sawtooth", 0.18, 110),
    bossHit: () => playNoiseBurst(0.1, 0.28, 1500),
    bossSlam: () => { playNoiseBurst(0.3, 0.35, 300); playTone(80, 0.3, "sine", 0.3, 40); },
    bossRanged: () => playTone(700, 0.12, "square", 0.15, 300),
    bossSummon: () => playTone(320, 0.3, "triangle", 0.18, 500),
    victory: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => playTone(f, 0.35, "sine", 0.22), i * 160)); },
};

function playSfx(name) {
    if (SFX[name]) SFX[name]();
}

function stopMusic() {
    if (musicNodes) {
        for (const node of musicNodes) {
            try { node.stop(); } catch (err) {}
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
        { mult: 1, type: "sine", gain: 0.5 },
        { mult: 1.5, type: "sine", gain: 0.18 },
        { mult: 2.005, type: "sawtooth", gain: 0.08 + corruptionAlpha * 0.1},
    ];

    const nodes = [];
    for (const layer of layers) {
        const osc = ctx.createOscillator();
        osc.type = layer.type;
        osc.frequency.value = baseFreq * layer.mult;
        const gain = ctx.createGain();
        gain.gain.value = layer.gain;
        osc.connect(gain);
        gain.connect(musicGain);
        osc.start();
        nodes.push(osc);
    }
    musicNodes = nodes;

}

function restoreMusic() {
    if (typeof currentZone !== "undefined" && currentZone) startMusicForZone(currentZone.corruption.alpha);
}

function duckMusic(factor, holdMs = 1500) {
    if (!musicGain || !audioCtx) return;
    musicGain.gain.setTargetAtTime(0.12 * factor, audioCtx.currentTime, 0.2);
    setTimeout(() => {
        if (musicGain && audioCtx) musicGain.gain.setTargetAtTime(0.12, audioCtx.currentTime, 0.6);
    }, holdMs);
}