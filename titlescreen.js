"use strict";

const DIFFICULTIES = {
    easy: { label: "Easy", enemyDamageMult: 0.7, enemyHpMult: 0.8, playerDamageMult: 1.25 },
    normal: { label: "Normal", enemyDamageMult: 1, enemyHpMult: 1, playerDamageMult: 1 },
    hard: { label: "Hard", enemyDamageMult: 1.35, enemyHpMult: 1.3, playerDamageMult: 0.9 },
};

let currentDifficulty = "normal";

const titleScreenEl = document.getElementById("titleScreen");
const titleNarrationEl = document.getElementById("titleNarration");
const titleHintEl = document.getElementById("titleHint");
const newGameBtn = document.getElementById("newGameBtn");
const continueBtnTitle = document.getElementById("continueBtnTitle");
const difficultyOptionsEl = document.getElementById("difficultyOptions");
const muteToggleBtn = document.getElementById("muteToggleBtn");

titleNarrationEl.innerHTML = OPENING_NARRATION.map((line) => `<p>${line}</p>`).join("");

const saveIsAvailable = typeof hasSave === "function" && hasSave();
if (saveIsAvailable) {
    continueBtnTitle.classList.remove("hidden");
    titleHintEl.textContent = "Press Enter to continue your journey";
} else {
    titleHintEl.textContent = "Press Enter to begin";
}

difficultyOptionsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".diff-btn");
    if (!btn) return;
    currentDifficulty = btn.dataset.difficulty;
    for (const child of difficultyOptionsEl.children) child.classList.toggle("active", child === btn);
});

function updateMuteButtonLabel() {
    const muted = typeof audioMuted !== "undefined" && audioMuted;
    muteToggleBtn.textContent = muted ? "🔇 Sound Off" : "🔊 Sound On";
}
updateMuteButtonLabel();

muteToggleBtn.addEventListener("click", () => {
    if (typeof toggleMute === "function") toggleMute();
    updateMuteButtonLabel();
});

function closeTitleScreen() {
    titleScreenEl.classList.add("fading");
    setTimeout(() => titleScreenEl.classList.add("hidden"), 600);
}

function launchGame() {
    if (typeof ensureAudio === "function") ensureAudio();
    if (typeof startMusicForZone === "function" && typeof currentZone !== "undefined" && currentZone) {
        startMusicForZone(currentZone.corruption.alpha);
    }
    if (typeof startAutosave === "function") startAutosave();
}

function beginNewGame() {
    if (UI.gameStarted) return;
    if (typeof deleteSave === "function") deleteSave();
    if (typeof applyDifficultyToWorld === "function") applyDifficultyToWorld();
    UI.gameStarted = true;
    closeTitleScreen();
    launchGame();
}

function beginContinue() {
    if (UI.gameStarted) return;
    const loaded = typeof loadGame === "function" && loadGame();
    UI.gameStarted = true;
    closeTitleScreen();
    launchGame();
    if (loaded && typeof showToast === "function") showToast("Welcome back.");
}

newGameBtn.addEventListener("click", beginNewGame);
continueBtnTitle.addEventListener("click", beginContinue);

window.addEventListener("keydown", (e) => {
    if (UI.gameStarted) return;
    const k = e.key.toLowerCase();
    if (k === "enter" || k === " ") {
        e.preventDefault();
        if (!continueBtnTitle.classList.contains("hidden")) beginContinue();
        else beginNewGame();
    }
});