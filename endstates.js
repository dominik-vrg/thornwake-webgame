"use strict";

const gameOverEl = document.getElementById("gameOverScreen");
const gameOverTextEl = document.getElementById("gameOverText");
const respawnBtn = document.getElementById("respawnBtn");

const victoryEl = document.getElementById("victoryScreen");
const victoryNarrationEl = document.getElementById("victoryNarration");
const continueBtn = document.getElementById("continueBtn");

const DEATH_LINES = [
    "The thorns close over you before you can react.",
    "Your legs give out, and the corruption creeps in at the edges of your sight.",
    "You go down hard, and the forest doesn't stop for you.",
    "Everything goes quiet, then dark, then quiet again.",    
];

function triggerGameOver() {
    if (UI.gameOverOpen) return;
    UI.gameOverOpen = true;

    if (typeof triggerShake === "function") triggerShake(10, 0.4);
    if (typeof triggerHitStop === "function") triggerHitStop(0.15);
    if (typeof playSfx === "function") playSfx("death");
    if (typeof duckMusic === "function") duckMusic(0.25, 2200);

    gameOverTextEl.textContent = DEATH_LINES[Math.floor(Math.random() * DEATH_LINES.length)];
    gameOverEl.classList.remove("hidden");
}

function respawnFromGameOver() {
    if (!UI.gameOverOpen) return;
    UI.gameOverOpen = false;
    gameOverEl.classList.add("hidden");

    player.x = map.spawn.x * TILE_SIZE + 4;
    player.y = map.spawn.y * TILE_SIZE + 4;
    player.hp = player.maxHp;
    playerInvulnTimer = 1.2;
    updateCamera();
    if (typeof saveGame === "function") saveGame();
}

respawnBtn.addEventListener("click", respawnFromGameOver);

window.addEventListener("keydown", (e) => {
    if (!UI.gameOverOpen) return;
    const k = e.key.toLowerCase();
    if (k === "enter" || k === " ") { e.preventDefault(); respawnFromGameOver(); }
});

function buildVictoryNarration() {
    return [
        "The Heart of Thornwake goes still beneath your hands, and for the first time in three nights, the ground stops trembling.",
        "The thorns nearest you wilt and curl, brittle, harmless. Whatever finds Thornwake now will find a forest again — slowly, but surely.",
        `You made it here as a level ${player.level} survivor of the grove, carrying home a charm still warm to the touch.`,
        "Thornwake is safe. For now.",
    ];
}

function triggerVictory() {
    if (UI.victoryOpen) return;
    UI.victoryOpen = true;

    if (typeof playSfx === "function") playSfx("victory");
    if (typeof stopMusic === "function") stopMusic();

    victoryNarrationEl.innerHTML = buildVictoryNarration().map((p) => `<p>${p}</p>`).join("");
    victoryEl.classList.remove("hidden");
}

function closeVictoryScreen() {
    if (!UI.victoryOpen) return;
    UI.victoryOpen = false;
    victoryEl.classList.add("hidden");
    if (typeof restoreMusic === "function") restoreMusic();
}

continueBtn.addEventListener("click", closeVictoryScreen);

window.addEventListener("keydown", (e) => {
    if (!UI.victoryOpen) return;
    const k = e.key.toLowerCase();
    if (k === "enter" || k === " " || k === "escape") { e.preventDefault(); closeVictoryScreen(); }
});