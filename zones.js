"use strict";

function buildGroveEdgeMap() {
    const cols = 26, rows = 16;
    const tiles = new Array(cols * rows).fill(TILE.GRASS);
    const at = (c, r) => r * cols + c;

    for (let c = 0; c < cols; c++) { tiles[at(c, 0)] = TILE.WALL; tiles[at(c, rows - 1)] = TILE.WALL; }
    for (let r = 0; r < rows; r++) { tiles[at(0, r)] = TILE.WALL; tiles[at(cols - 1, r)] = TILE.WALL; }

    const trees = [[6,3],[6,4],[6,5],[6,6],[10,8],[10,9],[10,10],[14,3],[14,4],[14,5],[18,7],[18,8],[18,9],[18,10],[3,10],[3,11],[3,12]];
    for (const [c, r] of trees) tiles[at(c, r)] = TILE.TREE;

    for (let r = 6; r <= 8; r++) for (let c = 20; c <= 23; c++) tiles[at(c, r)] = TILE.WATER;

    for (let c = 1; c < cols - 1; c++) tiles[at(c, 13)] = TILE.PATH;

    return { width: cols, height: rows, tileSize: TILE_SIZE, tiles, spawn: { x: 2, y: 13 } };
}

function buildHollowMap() {
    const cols = 28, rows = 18;
    const tiles = new Array(cols * rows).fill(TILE.GRASS);
    const at = (c, r) => r * cols + c;

    for (let c = 0; c < cols; c++) { tiles[at(c, 0)] = TILE.WALL; tiles[at(c, rows - 1)] = TILE.WALL; }
    for (let r = 0; r < rows; r++) { tiles[at(0, r)] = TILE.WALL; tiles[at(cols - 1, r)] = TILE.WALL; }

    const rocks = [[4,4],[4,5],[23,4],[23,5],[4,13],[4,14],[23,13],[23,14]];
    for (const [c, r] of rocks) tiles[at(c, r)] = TILE.WALL;

    for (let r = 7; r <= 11; r++) for (let c = 10; c <= 17; c++) tiles[at(c, r)] = TILE.WATER;

    return { width: cols, height: rows, tileSize: TILE_SIZE, tiles, spawn: { x: 2, y: 9 } };
}

function buildBossArenaMap() {
    const cols = 16, rows = 14;
    const tiles = new Array(cols * rows).fill(TILE.GRASS);
    const at = (c, r) => r * cols + c;

    for (let c = 0; c < cols; c++) { tiles[at(c, 0)] = TILE.WALL; tiles[at(c, rows - 1)] = TILE.WALL; }
    for (let r = 0; r < rows; r++) { tiles[at(0, r)] = TILE.WALL; tiles[at(cols - 1, r)] = TILE.WALL; }

    const pillars = [[5,4],[5,10],[11,4],[11,10]];
    for (const [c, r] of pillars) tiles[at(c, r)] = TILE.WALL;

    return { width: cols, height: rows, tileSize: TILE_SIZE, tiles, spawn: { x: 2, y: 7 } };
}

const TILE_DEFS_VILLAGE = TILE_DEFS;

const TILE_DEFS_GROVE_EDGE = {
    [TILE.GRASS]: { name: "corrupted grass", walkable: true, color: "#3f3550", edge: "#2f2740" },
    [TILE.WALL]:  { name: "wall", walkable: false, color: "#544f5c", edge: "#3a3640" },
    [TILE.WATER]: { name: "tainted pool", walkable: false, color: "#3a2f52", edge: "#291f3d" },
    [TILE.PATH]:  { name: "path", walkable: true, color: "#544258", edge: "#402f45" },
    [TILE.TREE]:  { name: "blighted tree", walkable: false, color: "#2a2036", edge: "#1c1526" },
};

const TILE_DEFS_HOLLOW = {
    [TILE.GRASS]: { name: "withered ground", walkable: true, color: "#331f2c", edge: "#26161f" },
    [TILE.WALL]:  { name: "rock", walkable: false, color: "#4a2f38", edge: "#331f27" },
    [TILE.WATER]: { name: "black ichor", walkable: false, color: "#1c0f14", edge: "#120a0d" },
    [TILE.PATH]:  { name: "path", walkable: true, color: "#402633", edge: "#2e1a24" },
    [TILE.TREE]:  { name: "husk", walkable: false, color: "#231018", edge: "#170a10" },
};

const TILE_DEFS_BOSS = {
    [TILE.GRASS]: { name: "ashen floor", walkable: true, color: "#2e1015", edge: "#20090d" },
    [TILE.WALL]:  { name: "stone", walkable: false, color: "#4a1f28", edge: "#33131a" },
    [TILE.WATER]: { name: "ichor", walkable: false, color: "#1a0509", edge: "#110306" },
    [TILE.PATH]:  { name: "path", walkable: true, color: "#3a151c", edge: "#280e13" },
    [TILE.TREE]:  { name: "stone", walkable: false, color: "#4a1f28", edge: "#33131a" },
};

const GROVE_EDGE_SPAWNS = [
    { type: "corruptedThornling", c: 8,  r: 4 },
    { type: "corruptedThornling", c: 12, r: 10 },
    { type: "corruptedThornling", c: 16, r: 5 },
    { type: "corruptedThornling", c: 9,  r: 11 },
    { type: "corruptedThornling", c: 19, r: 12 },
];

const HOLLOW_SPAWNS = [
    { type: "hollowStalker", c: 5,  r: 5 },
    { type: "hollowStalker", c: 22, r: 5 },
    { type: "hollowStalker", c: 14, r: 4 },
    { type: "thornBrute",    c: 5,  r: 13 },
    { type: "thornBrute",    c: 22, r: 13 },
    { type: "thornBrute",    c: 14, r: 14 },
];

const GROVE_EDGE_PICKUP_TILES = [
    { id: "corruptedSap", c: 14, r: 9 },
    { id: "silverLeaf",   c: 6,  r: 9 },
    { id: "goldCoin",     c: 21, r: 4 },
];

const HOLLOW_PICKUP_TILES = [
    { id: "corruptedSap", c: 14, r: 6 },
    { id: "corruptedSap", c: 14, r: 12 },
    { id: "goldCoin",     c: 8,  r: 9 },
    { id: "silverLeaf",   c: 20, r: 9 },
];

const ZONES = {
    village: {
        id: "village", name: "Thornwake Village",
        map, tileDefs: TILE_DEFS_VILLAGE,
        enemies, npcs: NPCS, pickups: worldPickups,
        corruption: { alpha: 0, color: "#000000" },
        portals: [
            {
                x: 27 * TILE_SIZE + 4, y: 9 * TILE_SIZE + 4, toZone: "grove_edge",
                label: "The Crack in the Earth", icon: "🕳️",
                gate: { type: "quest", questId: "mirela-herbs", status: ["active", "ready", "completed"],
                    message: "The crack pulses ominously. Perhaps Mirela would know more about it before you go further." },
            },
        ],
    },

    grove_edge: {
        id: "grove_edge", name: "The Grove's Edge",
        map: buildGroveEdgeMap(), tileDefs: TILE_DEFS_GROVE_EDGE,
        enemies: buildEnemiesFromSpawns(GROVE_EDGE_SPAWNS),
        npcs: [ALDRIC_NPC],
        pickups: buildPickups(GROVE_EDGE_PICKUP_TILES),
        corruption: { alpha: 0.14, color: "#3d1f4a" },
        firstEntryLore: {
            id: "grove-edge-corruption", title: "The Grove's Edge",
            paragraphs: [
                "Past the crack, the grass loses its color first - then the light itself seems to sour.",
                "Whatever is spreading from below has clearly been here a while.",
            ],
        },
        portals: [
            { x: 2 * TILE_SIZE + 4, y: 12 * TILE_SIZE + 4, toZone: "village", label: "Back to the Village", icon: "🕳️", gate: null },
            {
                x: 23 * TILE_SIZE + 4, y: 3 * TILE_SIZE + 4, toZone: "the_hollow",
                label: "Deeper In", icon: "🕳️",
                gate: { type: "level", value: 4, message: "The path beyond twists violently - you're not strong enough to survive it yet. (Reach level 4)" },
            },
        ],
    },

    the_hollow: {
        id: "the_hollow", name: "The Hollow",
        map: buildHollowMap(), tileDefs: TILE_DEFS_HOLLOW,
        enemies: buildEnemiesFromSpawns(HOLLOW_SPAWNS),
        npcs: [],
        pickups: buildPickups(HOLLOW_PICKUP_TILES),
        corruption: { alpha: 0.24, color: "#2a0f1f" },
        firstEntryLore: {
            id: "the-hollow-corruption", title: "The Hollow",
            paragraphs: [
                "The trees stop pretending to be trees down here. What's left just... waits.",
                "The air is thick, and something enormous feels close.",
            ],
        },
        portals: [
            { x: 2 * TILE_SIZE + 4, y: 8 * TILE_SIZE + 4, toZone: "grove_edge", label: "Back to the Grove", icon: "🕳️", gate: null },
            {
                x: 25 * TILE_SIZE + 4, y: 9 * TILE_SIZE + 4, toZone: "boss_arena",
                label: "The Innermost Dark", icon: "🕳️",
                gate: [
                    { type: "quest", questId: "mirela-thornlings", status: ["completed"],
                        message: "Something enormous stirs beyond. You feel you should finish what Mirela asked of you above before facing it." },
                    { type: "level", value: 6, message: "You feel the weight of what's ahead. Grow stronger first. (Reach level 6)" },
                ],
            },
        ],
    },

    boss_arena: {
        id: "boss_arena", name: "The Heart's Chamber",
        map: buildBossArenaMap(), tileDefs: TILE_DEFS_BOSS,
        enemies: [], npcs: [], pickups: [],
        corruption: { alpha: 0.32, color: "#3a0510" },
        firstEntryLore: {
            id: "heart-chamber", title: "The Heart's Chamber",
            paragraphs: ["This is where it all comes from. The ground here doesn't just feel wrong - it feels awake."],
        },
        portals: [
            { x: 2 * TILE_SIZE + 4, y: 6 * TILE_SIZE + 4, toZone: "the_hollow", label: "Retreat", icon: "🕳️", gate: null },
        ],
        altar: { x: 12 * TILE_SIZE + 4, y: 7 * TILE_SIZE + 4, w: 26, h: 26, label: "The Heart of Thornwake" },
    },
};

let currentZoneId = "village";
let currentZone = ZONES.village;

// gating

function applyDifficultyToWorld() {
    ZONES.village.enemies = buildEnemiesFromSpawns(ENEMY_SPAWNS);
    ZONES.grove_edge.enemies = buildEnemiesFromSpawns(GROVE_EDGE_SPAWNS);
    ZONES.the_hollow.enemies = buildEnemiesFromSpawns(HOLLOW_SPAWNS);
    if (currentZone) enemies = currentZone.enemies;
    if (typeof resetBossEncounter === "function") resetBossEncounter();
}

function checkGate(gate) {
    if (!gate) return { ok: true };
    const gates = Array.isArray(gate) ? gate : [gate];
    for (const g of gates) {
        if (g.type === "level" && player.level < g.value) {
            return { ok: false, message: g.message || `You'll need to be at least level ${g.value} for this.` };
        }
        if (g.type === "quest") {
            const status = getQuestStatus(g.questId);
            const allowed = g.status || ["completed"];
            if (!allowed.includes(status)) {
                return { ok: false, message: g.message || "Something holds you back here." };
            }
        }
    }
    return { ok: true };
}

function enterZone(zoneId, silent, fromZoneId) {
    const zone = ZONES[zoneId];
    if (!zone) return;

    if (currentZone && currentZone.id === "boss_arena" && typeof boss !== "undefined") {
        boss.active = false;
    }

    currentZoneId = zoneId;
    currentZone = zone;

    map = zone.map;
    TILE_DEFS = zone.tileDefs;
    enemies = zone.enemies;
    NPCS = zone.npcs;
    worldPickups = zone.pickups;

    const landingPortal = fromZoneId ? (zone.portals || []).find((p) => p.toZone === fromZoneId) : null;
    if (landingPortal) {
        player.x = landingPortal.x;
        player.y = landingPortal.y + TILE_SIZE;
    } else {
        player.x = zone.map.spawn.x * TILE_SIZE + 4;
        player.y = zone.map.spawn.y * TILE_SIZE + 4;
    }
    updateCamera();

    nearbyNPC = null;
    nearbyPortal = null;

    if (zone.firstEntryLore) addLoreEntry(zone.firstEntryLore.id, zone.firstEntryLore.title, zone.firstEntryLore.paragraphs);

    if (!silent) {
        showToast(`Entered ${zone.name}`);
        if (typeof playSfx === "function") playSfx("travel");
        if (typeof saveGame === "function") saveGame();
    }
    if (typeof startMusicForZone === "function") startMusicForZone(zone.corruption.alpha);

    if (zone.id === "boss_arena" && typeof resetBossEncounter === "function") resetBossEncounter();

    if (UI.inventoryOpen) renderInventoryUI();
}

function attemptTravel(portal) {
    const result = checkGate(portal.gate);
    if (!result.ok) { showToast(result.message); return; }
    enterZone(portal.toZone, false, currentZoneId);
}

let nearbyPortal = null;

function updateZonePortals() {
    if (UI.dialogueOpen) { nearbyPortal = null; return; }

    const pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;
    let closest = null, closestDist = Infinity;
    for (const portal of currentZone.portals || []) {
        const d = Math.hypot(pcx - (portal.x + 13), pcy - (portal.y + 13));
        if (d <= INTERACT_RANGE && d < closestDist) { closest = portal; closestDist = d; }
    }
    nearbyPortal = closest;
}

function drawZonePortals(ctx, camera) {
    for (const portal of currentZone.portals || []) {
        const sx = portal.x - camera.x, sy = portal.y - camera.y;
        if (sx < -40 || sx > VIEW_W + 40 || sy < -40 || sy > VIEW_H + 40) continue;

        ctx.save();
        ctx.fillStyle = "rgba(40,10,30,0.55)";
        ctx.strokeStyle = "#8a3d5c";
        ctx.lineWidth = 2;
        roundRect(ctx, sx, sy, 26, 26, 6);
        ctx.fill();
        ctx.stroke();

        ctx.font = "15px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(portal.icon || "🕳️", sx + 13, sy + 14);

        ctx.font = "10px 'Courier New', monospace";
        ctx.fillStyle = "rgba(232,220,200,0.85)";
        ctx.fillText(portal.label, sx + 13, sy - 8);

        if (nearbyPortal === portal) {
            const bob = Math.sin(worldTime * 4) * 2;
            const bx = sx + 13, by = sy - 22 + bob;
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

window.addEventListener("keydown", (e) => {
    if (!UI.gameStarted) return;
    const menuOpen = UI.dialogueOpen || UI.inventoryOpen || UI.journalOpen || UI.craftingOpen || UI.shopOpen || UI.blacksmithOpen || UI.gameOverOpen || UI.victoryOpen;
    if (menuOpen) return;
    if (e.key.toLowerCase() === "e" && nearbyPortal && !nearbyNPC) {
        e.preventDefault();
        attemptTravel(nearbyPortal);
    }
});

function drawCorruptionOverlay(ctx) {
    const c = currentZone && currentZone.corruption;
    if (!c || !c.alpha) return;
    ctx.save();
    ctx.fillStyle = c.color;
    ctx.globalAlpha = c.alpha;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.globalAlpha = 1;
    ctx.restore();
}

function drawZoneLabel(ctx) {
    if (!currentZone || currentZone.id === "village") return;
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "11px 'Courier New', monospace";
    ctx.fillStyle = "rgba(232,220,200,0.55)";
    ctx.fillText(currentZone.name, VIEW_W / 2, VIEW_H - 12);
    ctx.restore();
}