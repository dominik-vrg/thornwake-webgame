"use strict";

function carveRect(tiles, cols, x0, y0, w, h, tileId) {
    for (let y = y0; y < y0 + h; y++) {
        for (let x = x0; x < x0 + w; x++) {
            tiles[y * cols + x] = tileId;
        }
    }
}

function buildGroveEdgeMap() {
    const cols = 22, rows = 15;
    const tiles = new Array(cols * rows).fill(TILE.WALL);
    const at = (c, r) => r * cols + c;

    carveRect(tiles, cols, 1, 5, 6, 6, TILE.GRASS);
    carveRect(tiles, cols, 7, 7, 3, 2, TILE.PATH);
    carveRect(tiles, cols, 10, 2, 7, 11, TILE.GRASS);
    carveRect(tiles, cols, 12, 8, 3, 3, TILE.WATER);
    carveRect(tiles, cols, 17, 7, 2, 2, TILE.PATH);
    carveRect(tiles, cols, 19, 5, 2, 6, TILE.GRASS);

    const pillars = [[11, 4], [15, 4], [11, 10]];
    for (const [c, r] of pillars) tiles[at(c, r)] = TILE.TREE;

    return { width: cols, height: rows, tileSize: TILE_SIZE, tiles, spawn: { x: 2, y: 7 } };
}

function buildHollowMap() {
    const cols = 26, rows = 16;
    const tiles = new Array(cols * rows).fill(TILE.WALL);
    const at = (c, r) => r * cols + c;

    carveRect(tiles, cols, 1, 6, 5, 5, TILE.GRASS);
    carveRect(tiles, cols, 6, 8, 3, 2, TILE.PATH);
    carveRect(tiles, cols, 9, 2, 10, 13, TILE.GRASS);
    carveRect(tiles, cols, 11, 6, 5, 5, TILE.WATER);
    carveRect(tiles, cols, 19, 8, 2, 2, TILE.PATH);
    carveRect(tiles, cols, 21, 5, 4, 7, TILE.GRASS);

    const growths = [[10, 3], [17, 3], [10, 13], [17, 13]];
    for (const [c, r] of growths) tiles[at(c, r)] = TILE.TREE;

    return { width: cols, height: rows, tileSize: TILE_SIZE, tiles, spawn: { x: 2, y: 8 } };
}

function buildBossArenaMap() {
    const cols = 17, rows = 13;
    const tiles = new Array(cols * rows).fill(TILE.WALL);

    carveRect(tiles, cols, 2, 2, 13, 9, TILE.GRASS);
    carveRect(tiles, cols, 5, 7, 2, 2, TILE.WATER);
    carveRect(tiles, cols, 10, 7, 2, 2, TILE.WATER);
    const at = (c, r) => r * cols + c;
    const spikes = [[4, 4], [12, 4], [4, 8], [12, 8]];
    for (const [c, r] of spikes) tiles[at(c, r)] = TILE.TREE;

    return { width: cols, height: rows, tileSize: TILE_SIZE, tiles, spawn: { x: 2, y: 4 } };
}

const TILE_DEFS_VILLAGE = TILE_DEFS;

function makeRockWallDraw(colors) {
    return function (ctx, sx, sy, col, row) {
        ctx.fillStyle = colors.base;
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

        const cx = sx + TILE_SIZE / 2, cy = sy + TILE_SIZE / 2;
        const pts = 7;
        ctx.beginPath();
        for (let i = 0; i < pts; i++) {
            const a = (i / pts) * Math.PI * 2;
            const rad = 12 + hashTile(col, row, 70 + i) * 3;
            const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad * 0.9;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();

        const g = ctx.createLinearGradient(cx - 14, cy - 14, cx + 14, cy + 14);
        g.addColorStop(0, colors.g0);
        g.addColorStop(0.55, colors.g1);
        g.addColorStop(1, colors.g2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
    };
}

function makeFloorDraw(colors) {
    return function (ctx, sx, sy, col, row) {
        ctx.fillStyle = hashTile(col, row, 1) > 0.5 ? colors.a : colors.b;
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

        const specks = 2 + Math.floor(hashTile(col, row, 2) * 3);
        for (let i = 0; i < specks; i++) {
            const px = sx + 4 + hashTile(col, row, 10 + i) * (TILE_SIZE - 8);
            const py = sy + 4 + hashTile(col, row, 20 + i) * (TILE_SIZE - 8);
            const r = 1 + hashTile(col, row, 30 + i) * 1.6;
            const rot = hashTile(col, row, 40 + i) * Math.PI;
            ctx.fillStyle = colors.speck;
            ctx.beginPath();
            ctx.ellipse(px, py, r, r * 0.55, rot, 0, Math.PI * 2);
            ctx.fill();
        }
    };
}

function makeCorridorDraw(colors) {
    return function (ctx, sx, sy, col, row) {
        const g = ctx.createLinearGradient(sx, sy, sx, sy + TILE_SIZE);
        g.addColorStop(0, colors.top);
        g.addColorStop(1, colors.bottom);
        ctx.fillStyle = g;
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

        const pebbleCount = 3 + Math.floor(hashTile(col, row, 4) * 3);
        for (let i = 0; i < pebbleCount; i++) {
            const px = sx + 3 + hashTile(col, row, 80 + i) * (TILE_SIZE - 6);
            const py = sy + 3 + hashTile(col, row, 90 + i) * (TILE_SIZE - 6);
            const pr = 1 + hashTile(col, row, 100 + i) * 1.6;
            ctx.fillStyle = colors.pebble;
            ctx.beginPath();
            ctx.ellipse(px, py, pr, pr * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    };
}

function makeIchorDraw(colors) {
    return function (ctx, sx, sy, col, row) {
        const g = ctx.createLinearGradient(sx, sy, sx, sy + TILE_SIZE);
        g.addColorStop(0, colors.top);
        g.addColorStop(1, colors.bottom);
        ctx.fillStyle = g;
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

        const pulse = Math.sin(col * 0.5 + row * 0.5 + worldTime * 1.1);
        if (pulse > 0.2) {
            ctx.fillStyle = colors.glow((pulse - 0.2) * 0.4);
            ctx.beginPath();
            ctx.ellipse(sx + TILE_SIZE / 2, sy + TILE_SIZE / 2, 7 + pulse * 3, 5 + pulse * 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    };
}

const TILE_DEFS_GROVE_EDGE = {
    [TILE.GRASS]: { name: "cracked stone floor", walkable: true, draw: makeFloorDraw({ a: "#463f52", b: "#3c3646", speck: "rgba(120,105,150,0.28)" }) },
    [TILE.WALL]:  { name: "root-cracked wall", walkable: false, draw: makeRockWallDraw({ base: "#2c2733", g0: "#7a7188", g1: "#544c63", g2: "#342e40", stroke: "rgba(20,18,25,0.6)" }) },
    [TILE.WATER]: { name: "tainted pool", walkable: false, draw: makeIchorDraw({ top: "#4a3d66", bottom: "#2c2340", glow: (a) => `rgba(200,180,255,${a})` }) },
    [TILE.PATH]:  { name: "worn walkway", walkable: true, draw: makeCorridorDraw({ top: "#544258", bottom: "#402f45", pebble: "rgba(30,20,38,0.35)" }) },
    [TILE.TREE]:  { name: "thorn-wrapped pillar", walkable: false, draw: drawRootPillar },
};

const TILE_DEFS_HOLLOW = {
    [TILE.GRASS]: { name: "hewn cave floor", walkable: true, draw: makeFloorDraw({ a: "#2e2024", b: "#26191d", speck: "rgba(150,50,60,0.22)" }) },
    [TILE.WALL]:  { name: "jagged cave wall", walkable: false, draw: makeRockWallDraw({ base: "#241a1d", g0: "#6b4a52", g1: "#472f36", g2: "#281a1e", stroke: "rgba(15,10,12,0.65)" }) },
    [TILE.WATER]: { name: "black ichor", walkable: false, draw: makeIchorDraw({ top: "#2a1520", bottom: "#160a12", glow: (a) => `rgba(140,220,120,${a})` }) },
    [TILE.PATH]:  { name: "worn walkway", walkable: true, draw: makeCorridorDraw({ top: "#402633", bottom: "#2e1a24", pebble: "rgba(20,10,14,0.35)" }) },
    [TILE.TREE]:  { name: "corrupted growth", walkable: false, draw: drawGrowthMass },
};

const TILE_DEFS_BOSS = {
    [TILE.GRASS]: { name: "ashen floor", walkable: true, draw: makeFloorDraw({ a: "#3a1418", b: "#301014", speck: "rgba(220,110,60,0.3)" }) },
    [TILE.WALL]:  { name: "blood-stone wall", walkable: false, draw: makeRockWallDraw({ base: "#200d10", g0: "#7a3038", g1: "#4a1a20", g2: "#280c10", stroke: "rgba(10,5,6,0.65)" }) },
    [TILE.WATER]: { name: "glowing ichor", walkable: false, draw: makeIchorDraw({ top: "#5c1018", bottom: "#30070c", glow: (a) => `rgba(255,140,80,${a})` }) },
    [TILE.PATH]:  { name: "worn walkway", walkable: true, draw: makeCorridorDraw({ top: "#4a1f28", bottom: "#33131a", pebble: "rgba(70,25,18,0.4)" }) },
    [TILE.TREE]:  { name: "bone-thorn cluster", walkable: false, draw: drawSpikeCluster },
};

function drawRootPillar(ctx, sx, sy, col, row) {
    ctx.fillStyle = "#3c3646";
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

    const cx = sx + TILE_SIZE / 2, groundY = sy + TILE_SIZE - 5;
    ctx.beginPath();
    ctx.ellipse(cx, groundY, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    const pg = ctx.createLinearGradient(cx - 6, sy + 4, cx + 6, groundY);
    pg.addColorStop(0, "#8b8598");
    pg.addColorStop(1, "#524b60");
    ctx.fillStyle = pg;
    ctx.fillRect(cx - 5, sy + 4, 10, groundY - sy - 4);

    const phase = hashTile(col, row, 6) * Math.PI * 2;
    ctx.strokeStyle = "#5a3d6e";
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 2; i++) {
        const wob = Math.sin(worldTime * 0.9 + phase + i) * 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 5, sy + 8 + i * 8);
        ctx.quadraticCurveTo(cx + wob, sy + 12 + i * 8, cx + 5, sy + 16 + i * 8);
        ctx.stroke();
    }
}

function drawGrowthMass(ctx, sx, sy, col, row) {
    ctx.fillStyle = "#26191d";
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

    const cx = sx + TILE_SIZE / 2, cy = sy + TILE_SIZE / 2 + 2;
    const phase = hashTile(col, row, 7) * Math.PI * 2;
    const pulse = 0.9 + Math.sin(worldTime * 1.4 + phase) * 0.1;

    ctx.beginPath();
    ctx.ellipse(cx, sy + TILE_SIZE - 5, 11, 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    const blobs = [{ dx: -4, dy: 2, r: 8 }, { dx: 4, dy: 1, r: 7 }, { dx: 0, dy: -4, r: 7 }];
    for (const b of blobs) {
        const bx = cx + b.dx, by = cy + b.dy;
        const br = b.r * pulse;
        const g = ctx.createRadialGradient(bx - br * 0.3, by - br * 0.3, 1, bx, by, br);
        g.addColorStop(0, "#8a3350");
        g.addColorStop(1, "#421a2a");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawSpikeCluster(ctx, sx, sy, col, row) {
    ctx.fillStyle = "#301014";
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

    const cx = sx + TILE_SIZE / 2, groundY = sy + TILE_SIZE - 5;
    ctx.beginPath();
    ctx.ellipse(cx, groundY, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fill();

    const spikes = [{ dx: -6, h: 12 }, { dx: -1, h: 17 }, { dx: 4, h: 13 }, { dx: 8, h: 9 }];
    for (const s of spikes) {
        const bx = cx + s.dx;
        const g = ctx.createLinearGradient(bx, groundY, bx, groundY - s.h);
        g.addColorStop(0, "#5a1c22");
        g.addColorStop(1, "#c96a3a");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(bx - 2.2, groundY);
        ctx.lineTo(bx, groundY - s.h);
        ctx.lineTo(bx + 2.2, groundY);
        ctx.closePath();
        ctx.fill();
    }

    const glowPhase = hashTile(col, row, 8) * Math.PI * 2;
    const glow = 0.15 + Math.max(0, Math.sin(worldTime * 2 + glowPhase)) * 0.2;
    ctx.fillStyle = `rgba(255,120,60,${glow})`;
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 1, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
}

const GROVE_EDGE_SPAWNS = [
    { type: "corruptedThornling", c: 13, r: 3 },
    { type: "corruptedThornling", c: 15, r: 3 },
    { type: "corruptedThornling", c: 13, r: 11 },
    { type: "corruptedThornling", c: 19, r: 6 },
    { type: "corruptedThornling", c: 19, r: 9 },
];

const HOLLOW_SPAWNS = [
    { type: "hollowStalker", c: 12, r: 3 },
    { type: "hollowStalker", c: 16, r: 3 },
    { type: "hollowStalker", c: 12, r: 13 },
    { type: "thornBrute",    c: 16, r: 13 },
    { type: "thornBrute",    c: 22, r: 6 },
    { type: "thornBrute",    c: 22, r: 10 },
];

const GROVE_EDGE_PICKUP_TILES = [
    { id: "corruptedSap", c: 11, r: 3 },
    { id: "silverLeaf",   c: 15, r: 11 },
    { id: "goldCoin",     c: 20, r: 6 },
];

const HOLLOW_PICKUP_TILES = [
    { id: "corruptedSap", c: 14, r: 3 },
    { id: "corruptedSap", c: 14, r: 13 },
    { id: "goldCoin",     c: 23, r: 6 },
    { id: "silverLeaf",   c: 9,  r: 11 },
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
        corruption: { alpha: 0, color: "#000000" },
        firstEntryLore: {
            id: "grove-edge-corruption", title: "The Grove's Edge",
            paragraphs: [
                "Past the crack, the stone changes first - cracked, root-split, older than it should be.",
                "Whatever is spreading from below has clearly been here a while.",
            ],
        },
        portals: [
            { x: 2 * TILE_SIZE + 4, y: 7 * TILE_SIZE + 4, toZone: "village", label: "Back to the Village", icon: "🕳️", gate: null },
            {
                x: 19 * TILE_SIZE + 4, y: 7 * TILE_SIZE + 4, toZone: "the_hollow",
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
        corruption: { alpha: 0, color: "#000000" },
        firstEntryLore: {
            id: "the-hollow-corruption", title: "The Hollow",
            paragraphs: [
                "The walls stop pretending to be stone down here. What's left just... waits.",
                "The air is thick, and something enormous feels close.",
            ],
        },
        portals: [
            { x: 2 * TILE_SIZE + 4, y: 8 * TILE_SIZE + 4, toZone: "grove_edge", label: "Back to the Grove", icon: "🕳️", gate: null },
            {
                x: 22 * TILE_SIZE + 4, y: 8 * TILE_SIZE + 4, toZone: "boss_arena",
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
        corruption: { alpha: 0, color: "#000000" },
        firstEntryLore: {
            id: "heart-chamber", title: "The Heart's Chamber",
            paragraphs: ["This is where it all comes from. The ground here doesn't just feel wrong - it feels awake."],
        },
        portals: [
            { x: 2 * TILE_SIZE + 4, y: 3 * TILE_SIZE + 4, toZone: "the_hollow", label: "Retreat", icon: "🕳️", gate: null },
        ],
        altar: { x: 8 * TILE_SIZE + 4, y: 6 * TILE_SIZE + 4, w: 26, h: 26, label: "The Heart of Thornwake" },
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