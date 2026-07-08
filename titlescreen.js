"use strict";

const titleScreenEl = document.getElementById("titleScreen");
const titleNarrationEl = document.getElementById("titleNarration");
const beginBtn = document.getElementById("beginBtn");

titleNarrationEl.innerHTML = OPENING_NARRATION.map((line) => `<p>${line}</p>`).join("");

function beginGame() {
    if (UI.gameStarted) return;
    UI.gameStarted = true;
    titleScreenEl.classList.add("fading");
    setTimeout(() => titleScreenEl.classList.add("hidden"), 600);
}

beginBtn.addEventListener("click", beginGame);

window.addEventListener("keydown", (e) => {
    if (UI.gameStarted) return;
    const k = e.key.toLowerCase();
    if (k === "enter" || k === " ") { e.preventDefault(); beginGame(); }
});