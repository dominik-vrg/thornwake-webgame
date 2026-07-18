"use strict";

const SAVE_KEY = "thornwake_save_v1";
let autosaveIntervalId = null;

function hasSave() {
    try {
        return !!localStorage.getItem(SAVE_KEY);
    } catch (err) {
        return false;
    }
}

function deleteSave() {
    try {
        localStorage.removeItem(SAVE_KEY);
    } catch (err) {
        /*storage unavailable*/
    }
}

function serializeZoneState(zoneId) {
    const zone = ZONES[zoneId];
    if (!zone) return null;
    return {
        enemies: zone.enemies.map((e) => ({ alive: e.alive, hp: e.hp, respawnTimer: e.respawnTimer, x: e.x, y: e.y })),
        pickups: zone.pickups.map((p) => ({ id: p.id, x: p.x, y: p.y })),
    };
}

function buildSaveData() {
    return {
        version: 1,
        savedAt: Date.now(),
        difficulty: typeof currentDifficulty !== "undefined" ? currentDifficulty : "normal",
        player: {
            level: player.level,
            xp: player.xp,
            perks: Array.from(player.perks),
            hp: player.hp,
            x: player.x,
            y: player.y,
            facing: player.facing,
        },
        inventory: inventory.map((slot) => (slot ? { id: slot.id, qty: slot.qty } : null)),
        equipment: { ...equipment },
        journal: {
            quests: journal.quests.map((q) => ({ ...q })),
            lore: journal.lore.map((l) => ({ ...l })),
        },
        currentZoneId,
        bossDefeatedEver: typeof bossDefeatedEver !== "undefined" ? bossDefeatedEver : false,
        aldricMet: typeof aldricMet !== "undefined" ? aldricMet : false,
        audioMuted: typeof audioMuted !== "undefined" ? audioMuted : false,
        zones: {
            village: serializeZoneState("village"),
            grove_edge: serializeZoneState("grove_edge"),
            the_hollow: serializeZoneState("the_hollow"),
            boss_arena: serializeZoneState("boss_arena"),
        },
    };
}

function saveGame() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(buildSaveData()));
        return true;
    } catch (err) {
        console.warn("Thornwake: could not save game.", err);
        return false;
    }
}

function applyZoneState(zoneId, state) {
    const zone = ZONES[zoneId];
    if (!zone || !state) return;

    if (state.enemies) {
        state.enemies.forEach((s, i) => {
            const e = zone.enemies[i];
            if (!e) return;
            e.alive = s.alive;
            e.hp = s.hp;
            e.respawnTimer = s.respawnTimer;
            e.x = s.x;
            e.y = s.y;
        });
    }

    if (state.pickups) {
        zone.pickups = state.pickups.map((p) => ({
            id: p.id, x: p.x, y: p.y,
            blocked: false, collected: false, bobPhase: Math.random() * Math.PI * 2,
        }));
    }
}

function loadGame() {
    let data = null;
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        data = JSON.parse(raw);
    } catch (err) {
        console.warn("Thornwake: could not read save.", err);
        return false;
    }
    if (!data || data.version !== 1) return false;

    if (data.difficulty && typeof DIFFICULTIES !== "undefined" && DIFFICULTIES[data.difficulty]) {
        currentDifficulty = data.difficulty;
    }

    player.level = data.player.level || 1;
    player.xp = data.player.xp || 0;
    player.perks = new Set(data.player.perks || []);
    player.facing = data.player.facing || "down";

    for (let i = 0; i < inventory.length; i++) {
        const saved = data.inventory && data.inventory[i];
        inventory[i] = saved ? { id: saved.id, qty: saved.qty } : null;
    }

    for (const slot of SLOT_ORDER) {
        equipment[slot] = (data.equipment && data.equipment[slot]) || null;
    }

    journal.quests = (data.journal && data.journal.quests) ? data.journal.quests.map((q) => ({ ...q })) : [];
    journal.lore = (data.journal && data.journal.lore) ? data.journal.lore.map((l) => ({ ...l })) : [];

    bossDefeatedEver = !!data.bossDefeatedEver;
    aldricMet = !!data.aldricMet;

    if (typeof applyDifficultyToWorld === "function") applyDifficultyToWorld();

    for (const zoneId of Object.keys(data.zones || {})) {
        applyZoneState(zoneId, data.zones[zoneId]);
    }

    recalcPlayerStats();
    player.hp = Math.min(data.player.hp != null ? data.player.hp : player.maxHp, player.maxHp);

    enterZone(data.currentZoneId || "village", true);
    player.x = data.player.x != null ? data.player.x : player.x;
    player.y = data.player.y != null ? data.player.y : player.y;
    updateCamera();

    if (typeof toggleMute === "function") toggleMute(!!data.audioMuted);

    return true;
}

function startAutosave() {
    if (autosaveIntervalId) return;
    autosaveIntervalId = setInterval(() => {
        if (UI.gameStarted) saveGame();
    }, 15000);
}

window.addEventListener("beforeunload", () => {
    if (UI.gameStarted) saveGame();
});