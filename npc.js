"use strict";

let NPCS = [
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
        getLines: getMirelaLines,
    },
    {
        id: "bram",
        name: "Bram",
        title: "Peddler",
        x: 25 * TILE_SIZE + 4,
        y: 3 * TILE_SIZE + 4,
        w: 24,
        h: 24,
        color: "#8a7048",
        icon: "🪙",
        getLines: getBramLines,
    },
    {
        id: "dorn",
        name: "Dorn",
        title: "Blacksmith",
        x: 10 * TILE_SIZE + 4,
        y: 15 * TILE_SIZE + 4,
        w: 24,
        h: 24,
        color: "#6a5a52",
        icon: "🔨",
        getLines: getDornLines,
    },
];

const MIRELA_INTRO_LINES = [
    "Oh - it's you. I heard someone was poking around near the old grove.",
    "The thorns aren't just overgrown. They're changing. Moving, when nothing's touching them.",
    "I can smell the corruption on the air already, and it's not coming from the ridge like the elders think. It's coming from underneath us.",
    "I need Wild Herb to prepare anything that might slow this down - the ordinary kind, not the corrupted growth near the crack.",
    "Bring me what you can find. And watch yourself out there.",
];

const MIRELA_HERB_TURNIN_LINES = [
    "Wild Herb - perfect, this is exactly what I needed.",
    "There's another problem, though. Those Thornlings keep trampling the beds faster than they regrow.",
    "If you could thin out six of them near the grove, I could actually keep a steady supply.",
    "Here - this is for the herbs. Consider the Thornling work a favor for both of us.",
];

const MIRELA_THORNLING_TURNIN_LINES = [
    "You actually did it. Six fewer thorned things skulking around the grove.",
    "That should buy us some real time. Thank you - truly.",
    "Here. You've earned this.",
];

const MIRELA_ALL_DONE_LINES = [
    "Still in one piece, I see.",
    "The grove's a little quieter thanks to you.",
    "I'll let you know if anything else comes up.",
];

function pickRandomLine(lines) {
    return lines[Math.floor(Math.random() * lines.length)];
}

function getMirelaLines() {
    const herbStatus = getQuestStatus("mirela-herbs");

    if (herbStatus === "inactive") {
        return {
            lines: MIRELA_INTRO_LINES,
            onEnd: () => {
                startQuest("mirela-herbs");
                addLoreEntry("mirelas-warning", "Mirela's Warning", [
                    "Mirela says the corruption isn't coming from the ridge, like the elders believe - it's coming from beneath the grove itself.",
                    "She's asked for Wild Herb to prepare something that might slow the spread. Ordinary herbs, not the corrupted growth near the crack.",
                ]);
            },
        };
    }

    if (herbStatus === "active") {
        const need = QUEST_DEFS["mirela-herbs"].objective.need;
        const have = getQuestInstance("mirela-herbs").progress;
        return { lines: [`I still need Wild Herb - you have ${have} of ${need} so far. Look through the grass and thickets.`], onEnd: null };
    }

    if (herbStatus === "ready") {
        return {
            lines: MIRELA_HERB_TURNIN_LINES,
            onEnd: () => {
                turnInQuest("mirela-herbs");
                startQuest("mirela-thornlings");
            },
        };
    }

    const thornlingStatus = getQuestStatus("mirela-thornlings");

    if (thornlingStatus === "active") {
        const instance = getQuestInstance("mirela-thornlings");
        const need = QUEST_DEFS["mirela-thornlings"].objective.need;
        return { lines: [`${instance.progress} of ${need} Thornlings dealt with. They're thickest near the tree line.`], onEnd: null };
    }

    if (thornlingStatus === "ready") {
        return { lines: MIRELA_THORNLING_TURNIN_LINES, onEnd: () => turnInQuest("mirela-thornlings") };
    }

    return { lines: [pickRandomLine(MIRELA_ALL_DONE_LINES)], onEnd: null };
}

const BRAM_LINES = [
    "Wares, if you've got the coin for them.",
    "Everything's fresher than it looks. Mostly.",
    "Careful out there - everything's on edge since the ground split.",
    "Gold's gold, corruption or no. Let's trade.",
];

function getBramLines() {
    return { lines: [pickRandomLine(BRAM_LINES)], onEnd: () => toggleShop(true) };
}
const DORN_LINES = [
    "Bring me good steel, or don't bother.",
    "The corruption's in the ore now too, I'd wager. Explains a lot.",
    "I can make good gear better. Can't make bad gear good, mind.",
    "Gold and grit - that's what upgrades cost.",
];

function getDornLines() {
    return { lines: [pickRandomLine(DORN_LINES)], onEnd: () => toggleBlacksmith(true) };
}

const ALDRIC_INTRO_LINES = [
    "You shouldn't be out here without a reason. Then again, neither should I.",
    "Aldric. I used to log this treeline before the ground split. Now I just... watch it.",
    "The corruption gets worse the deeper you go. Past the grove there's something old down there, and it isn't sleeping anymore.",
    "If you're set on going further, get stronger first. Whatever's down there won't care how brave you are.",
];

const ALDRIC_REPEAT_LINES = [
    "Watch the tree line. Things move in it that shouldn't.",
    "Still standing, I see. Good.",
    "The deeper you go, the less this forest remembers being a forest.",
];

let aldricMet = false;

function getAldricLines() {
    if (!aldricMet) {
        aldricMet = true;
        return {
            lines: ALDRIC_INTRO_LINES,
            onEnd: () => addLoreEntry("aldrics-warning", "Aldric's Warning", [
                "A warden named Aldric still watches the treeline at the grove's edge, long after everyone else pulled back.",
                "He warns that something old lies deeper in the corruption, and that it isn't sleeping anymore.",
            ]),
        };
    }
    return { lines: [pickRandomLine(ALDRIC_REPEAT_LINES)], onEnd: null };
}

const ALDRIC_NPC = {
    id: "aldric",
    name: "Aldric",
    title: "Warden",
    x: 5 * TILE_SIZE + 4,
    y: 12 * TILE_SIZE + 4,
    w: 24,
    h: 24,
    color: "#4a5a3d",
    icon: "🪓",
    getLines: getAldricLines,
};

const INTERACT_RANGE = 44;
let nearbyNPC = null;

const dialogue = { active: false, npc: null, lines: [], lineIndex: 0, onEnd: null };

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
    const result = npc.getLines();

    dialogue.active = true;
    dialogue.npc = npc;
    dialogue.lines = result.lines;
    dialogue.lineIndex = 0;
    dialogue.onEnd = result.onEnd || null;

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
    const onEnd = dialogue.onEnd;

    dialogue.active = false;
    dialogue.npc = null;
    dialogue.onEnd = null;
    UI.dialogueOpen = false;
    dialogueBoxEl.classList.add("hidden");

    if (onEnd) onEnd();
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
    if (!UI.gameStarted || UI.gameOverOpen || UI.victoryOpen) return;
    const k = e.key.toLowerCase();

    if (UI.dialogueOpen) {
        if (k === "e" || k === "enter" || k === " ") { e.preventDefault(); advanceDialogue(); }
        else if (k === "escape") endDialogue();
        return;
    }

    if (k === "e" && nearbyNPC && !UI.inventoryOpen && !UI.journalOpen && !UI.craftingOpen && !UI.shopOpen && !UI.blacksmithOpen) {
        startDialogue(nearbyNPC);
    }
});