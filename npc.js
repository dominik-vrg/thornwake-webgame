"use strict";

const NPCS = [
    {
        id: "mirela",
        name: "Mirela",
        title: "Herbalist",
        x: 4 * TILE_SIZE + 4,
        y: 11 * TILE_SIZE + 4,
        w: 24,
        h: 24,
        color: "#7a5c8e",
        icon: "🌿",
        met: false,
        firstLines: [
            "Oh — it's you. I heard someone was poking around near the old grove.",
            "The thorns aren't just overgrown. They're changing. Moving, when nothing's touching them.",
            "I can smell the corruption on the air already, and it's not coming from the ridge like the elders think. It's coming from underneath us.",
            "I need Wild Herb to prepare anything that might slow this down — the ordinary kind, not the corrupted growth near the crack.",
            "Bring me what you can find. And watch yourself out there.",
        ],
        repeatLines: [
            "Still in one piece, I see.",
            "Any luck out there?",
            "The forest's not getting any quieter.",
            "Come back when you've got herbs, or trouble.",
        ],
    },
];

//interaction state
const INTERACT_RANGE = 44;
let nearbyNPC = null;

const dialogue = { active: false, npc: null, lines: [], lineIndex: 0 };

function updateNPCs() {
    if (UI.dialogueOpen) return;

    const pcx = player.x + player.w / 2;
    const pcy = player.y + player.h / 2;

    let closest = null;
    let closestDist = Infinity;
    for (const npc of NPCS) {
        const ncx = npc.x + npc.w / 2;
        const ncy = npc.y + npc.h / 2;
        const d = Math.hypot(pcx - ncx, pcy - ncy);
        if (d <= INTERACT_RANGE && d < closestDist) {
            closest = npc;
            closestDist = d;
        }
    }
    nearbyNPC = closest;
}

function drawNPCs(ctx, camera) {
    for (const npc of NPCS) {
        const sx = npc.x - camera.x;
        const sy = npc.y - camera.y;
        if (sx < -40 || sx > VIEW_W + 40 || sy < -40 || sy > VIEW_H + 40) continue;

        ctx.save();
        ctx.fillStyle = npc.color;
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 2;
        roundRect(ctx, sx, sy, npc.w, npc.h, 5);
        ctx.fill();
        ctx.stroke();

        ctx.font = "13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(npc.icon, sx + npc.w / 2, sy + npc.h / 2 + 1);

        //name label
        ctx.font = "10px 'Courier New', monospace";
        ctx.fillStyle = "rgba(232,220,200,0.85)";
        ctx.fillText(npc.name, sx + npc.w / 2, sy - 8);

        //interact prompt
        if (nearbyNPC === npc && !UI.dialogueOpen) {
            const bob = Math.sin(worldTime * 4) * 2;
            const bx = sx + npc.w / 2, by = sy - 22 + bob;
            ctx.fillStyle = "rgba(20,16,15,0.85)";
            ctx.strokeStyle = "#c98a3e";
            roundRect(ctx, bx - 12, by - 10, 24, 20, 4);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#c98a3e";
            ctx.font = "bold 11px 'Courier New', monospace";
            ctx.fillText("E", bx, by + 1);
        }
        ctx.restore();
    }
}

//dialogue UI
const dialogueBoxEl = document.getElementById("dialogueBox");
const dialogueNameEl = document.getElementById("dialogueName");
const dialogueTextEl = document.getElementById("dialogueText");

function startDialogue(npc) {
    dialogue.active = true;
    dialogue.npc = npc;
    dialogue.lines = npc.met
        ? [npc.repeatLines[Math.floor(Math.random() * npc.repeatLines.length)]]
        : npc.firstLines;
    dialogue.lineIndex = 0;

    UI.dialogueOpen = true;
    dialogueBoxEl.classList.remove("hidden");
    renderDialogue();
}

function advanceDialogue() {
    dialogue.lineIndex++;
    if (dialogue.lineIndex >= dialogue.lines.length) {
        endDialogue();
        return;
    }
    renderDialogue();
}

function endDialogue() {
    const npc = dialogue.npc;
    const wasFirstMeeting = npc && !npc.met;
    if (npc) npc.met = true;

    dialogue.active = false;
    dialogue.npc = null;
    UI.dialogueOpen = false;
    dialogueBoxEl.classList.add("hidden");

    if (wasFirstMeeting && npc.id === "mirela" && typeof addLoreEntry === "function") {
        addLoreEntry("mirelas-warning", "Mirela's Warning", [
            "Mirela says the corruption isn't coming from the ridge, like the elders believe — it's coming from beneath the grove itself.",
            "She's asked for Wild Herb to prepare something that might slow the spread. Ordinary herbs, not the corrupted growth near the crack.",
        ]);
    }
}

function renderDialogue() {
    const npc = dialogue.npc;
    dialogueNameEl.innerHTML = `<span class="dialogue-icon" style="background:${npc.color}">${npc.icon}</span>${npc.name} <span class="dialogue-role">· ${npc.title}</span>`;
    dialogueTextEl.textContent = dialogue.lines[dialogue.lineIndex];
}

dialogueBoxEl.addEventListener("click", () => {
    if (UI.dialogueOpen) advanceDialogue();
});

window.addEventListener("keydown", (e) => {
    if (!UI.gameStarted) return;
    const k = e.key.toLowerCase();

    if (UI.dialogueOpen) {
        if (k === "e" || k === "enter" || k === " ") { e.preventDefault(); advanceDialogue(); }
        else if (k === "escape") endDialogue();
        return;
    }

    if (k === "e" && nearbyNPC && !UI.inventoryOpen && !UI.journalOpen) {
        startDialogue(nearbyNPC);
    }
});