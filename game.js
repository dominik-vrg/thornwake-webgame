"use strict";

const TILE_SIZE = 32;
const MAP_COLS = 30;
const MAP_ROWS = 20;
const VIEW_W = 800;
const VIEW_H = 600;

const TILE = {
    GRASS: 0,
    WALL: 1,
    WATER: 2,
    PATH: 3,
    TREE: 4,
};

function hashTile(col, row, salt) {
    let h = (col * 374761393 + row * 668265263 + salt * 2246822519) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = (h ^ (h >>> 16)) >>> 0;
    return h / 4294967296;
}

function flatTileDraw(color, edge) {
    return function (ctx, sx, sy) {
        ctx.fillStyle = color;
        ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = edge;
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 0.5, sy + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
    };
}

function drawGrassTile(ctx, sx, sy, col, row) {
    const shade = hashTile(col, row, 1) > 0.5 ? "#3f6a34" : "#375c2d";
    ctx.fillStyle = shade;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

    const tuftCount = 3 + Math.floor(hashTile(col, row, 2) * 3);
    ctx.lineWidth = 1.4;
    for (let i = 0; i < tuftCount; i++) {
        const tx = sx + 4 + hashTile(col, row, 10 + i) * (TILE_SIZE - 8);
        const ty = sy + 8 + hashTile(col, row, 20 + i) * (TILE_SIZE - 12);
        const lean = (hashTile(col, row, 30 + i) - 0.5) * 6;
        const bladeH = 4 + hashTile(col, row, 40 + i) * 4;
        const phase = hashTile(col, row, 50 + i) * Math.PI * 2;
        const sway = Math.sin(worldTime * 1.6 + phase) * 1.1;

        ctx.strokeStyle = hashTile(col, row, 60 + i) > 0.5 ? "#6fae4c" : "#5a9440";
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.quadraticCurveTo(tx + lean * 0.5 + sway, ty - bladeH * 0.6, tx + lean + sway, ty - bladeH);
        ctx.stroke();
    }
}

function drawWallTile(ctx, sx, sy, col, row) {
    ctx.fillStyle = "#453f38";
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

    const cx = sx + TILE_SIZE / 2, cy = sy + TILE_SIZE / 2;
    const pts = 7;
    ctx.beginPath();
    for (let i = 0; i < pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const rad = 12 + hashTile(col, row, 70 + i) * 3;
        const px = cx + Math.cos(a) * rad;
        const py = cy + Math.sin(a) * rad * 0.9;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();

    const g = ctx.createLinearGradient(cx - 14, cy - 14, cx + 14, cy + 14);
    g.addColorStop(0, "#8b9299");
    g.addColorStop(0.55, "#666d75");
    g.addColorStop(1, "#454b52");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(30,32,36,0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();
}

function drawWaterTile(ctx, sx, sy, col, row) {
    const g = ctx.createLinearGradient(sx, sy, sx, sy + TILE_SIZE);
    g.addColorStop(0, "#4a93ad");
    g.addColorStop(1, "#2c6884");
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

    const wave = Math.sin(col * 0.6 + row * 0.4 + worldTime * 1.4);
    if (wave > 0.35) {
        ctx.strokeStyle = `rgba(255,255,255,${(wave - 0.35) * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx + 3, sy + TILE_SIZE * 0.5 - wave * 4);
        ctx.quadraticCurveTo(sx + TILE_SIZE / 2, sy + TILE_SIZE * 0.5 - wave * 8, sx + TILE_SIZE - 3, sy + TILE_SIZE * 0.5 - wave * 4);
        ctx.stroke();
    }
}

function drawPathTile(ctx, sx, sy, col, row) {
    const g = ctx.createLinearGradient(sx, sy, sx, sy + TILE_SIZE);
    g.addColorStop(0, "#8a6a45");
    g.addColorStop(1, "#6e5133");
    ctx.fillStyle = g;
    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);

    const pebbleCount = 3 + Math.floor(hashTile(col, row, 4) * 3);
    for (let i = 0; i < pebbleCount; i++) {
        const px = sx + 3 + hashTile(col, row, 80 + i) * (TILE_SIZE - 6);
        const py = sy + 3 + hashTile(col, row, 90 + i) * (TILE_SIZE - 6);
        const pr = 1 + hashTile(col, row, 100 + i) * 1.6;
        ctx.fillStyle = `rgba(50,35,20,${0.2 + hashTile(col, row, 110 + i) * 0.15})`;
        ctx.beginPath();
        ctx.ellipse(px, py, pr, pr * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawTreeTile(ctx, sx, sy, col, row) {
    drawGrassTile(ctx, sx, sy, col, row);

    const cx = sx + TILE_SIZE / 2;
    const groundY = sy + TILE_SIZE - 4;
    const phase = hashTile(col, row, 5) * Math.PI * 2;
    const sway = Math.sin(worldTime * 1.1 + phase) * 0.06;

    ctx.beginPath();
    ctx.ellipse(cx, groundY, 11, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fill();

    ctx.fillStyle = "#4a3320";
    ctx.fillRect(cx - 2.5, groundY - 10, 5, 10);

    ctx.save();
    ctx.translate(cx, groundY - 12);
    ctx.rotate(sway);
    const canopy = [{ dx: -5, dy: -2, r: 8 }, { dx: 5, dy: -3, r: 7 }, { dx: 0, dy: -9, r: 8 }];
    for (const b of canopy) {
        const bg = ctx.createRadialGradient(b.dx - b.r * 0.3, b.dy - b.r * 0.3, 1, b.dx, b.dy, b.r);
        bg.addColorStop(0, "#6fae4c");
        bg.addColorStop(1, "#2f5f24");
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(b.dx, b.dy, b.r, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

let TILE_DEFS = {
    [TILE.GRASS]: { name: "grass", walkable: true, draw: drawGrassTile },
    [TILE.WALL]: { name: "wall", walkable: false, draw: drawWallTile },
    [TILE.WATER]: { name: "water", walkable: false, draw: drawWaterTile },
    [TILE.PATH]: { name: "path", walkable: true, draw: drawPathTile },
    [TILE.TREE]: { name: "tree", walkable: false, draw: drawTreeTile },
};

function buildDemoMap(cols, rows) {
    const tiles = new Array(cols * rows).fill(TILE.GRASS);
    const at = (c, r) => r * cols + c;

    //border walls
    for (let c = 0; c < cols; c++) {
        tiles[at(c, 0)] = TILE.WALL;
        tiles[at(c, rows - 1)] = TILE.WALL;
    }
    for (let r = 0; r < rows; r++) {
        tiles[at(0, r)] = TILE.WALL;
        tiles[at(cols - 1, r)] = TILE.WALL;
    }

    //pond
    for (let r = 4; r <= 7; r++) {
        for (let c = 5; c <= 9; c++) {
            tiles[at(c, r)] = TILE.WATER;
        }
    }

    //treeline
    for (let r = 2; r <= 12; r++) {
        tiles[at(14, r)] = TILE.TREE;
    }
    for (let c = 14; c <= 20; c++) {
        tiles[at(c, 12)] = TILE.TREE;
    }

    //interior wall obstacles
    const obstacles = [[20,4],[21,4],[22,4],[20,5],[24,8],[25,8],[25,9],[25,10],[6,14],[7,14],[8,14],[6,15]];
    for (const [c, r] of obstacles) tiles[at(c, r)] = TILE.WALL;

    //dirt path
    for (let c = 1; c < cols - 1; c++) tiles[at(c, 16)] = TILE.PATH;
    for (let r = 12; r < 17; r++) tiles[at(2, r)] = TILE.PATH;

    return {
        width: cols,
        height: rows,
        tileSize: TILE_SIZE,
        tiles,
        spawn: { x: 3, y: 13 },
    };
}

let map = buildDemoMap(MAP_COLS, MAP_ROWS);

function tileAt(map, col, row) {
    if (col < 0 || row < 0 || col >= map.width || row >= map.height) return TILE.WALL;
    return map.tiles[row * map.width + col];
}

function isWalkable(map, col, row) {
    const id = tileAt(map, col, row);
    const def = TILE_DEFS[id];
    return def ? def.walkable : false;
}

//collision system
function rectCollidesWithMap(map, x, y, w, h) {
    const inset = 0.01;
    const left = Math.floor((x + inset) / TILE_SIZE);
    const right = Math.floor((x + w - inset) / TILE_SIZE);
    const top = Math.floor((y + inset) / TILE_SIZE);
    const bottom = Math.floor((y + h - inset) / TILE_SIZE);

    for (let r = top; r <= bottom; r++) {
        for (let c = left; c <= right; c++) {
            if (!isWalkable(map, c, r)) return true;
        }
    }
    return false;
}

function moveWithCollision(map, entity, dx, dy) {
    if (dx !== 0) {
        const newX = entity.x + dx;
        if (!rectCollidesWithMap(map, newX, entity.y, entity.w, entity.h)) {
            entity.x = newX;
        } else {
            if (dx > 0) entity.x = Math.floor((entity.x + entity.w + dx) / TILE_SIZE) * TILE_SIZE - entity.w;
            else if (dx < 0) entity.x = Math.ceil((entity.x + dx) / TILE_SIZE) * TILE_SIZE;
        }
    }
    //let the player slide along a wall
    if (dy !== 0) {
        const newY = entity.y + dy;
        if (!rectCollidesWithMap(map, entity.x, newY, entity.w, entity.h)) {
            entity.y = newY;
        } else {
            if (dy > 0) entity.y = Math.floor((entity.y + entity.h + dy) / TILE_SIZE) * TILE_SIZE - entity.h;
            else if (dy < 0) entity.y = Math.ceil((entity.y + dy) / TILE_SIZE) * TILE_SIZE;
        }
    }
}

const UI = { inventoryOpen: false, journalOpen: false, dialogueOpen: false, craftingOpen: false, shopOpen: false, blacksmithOpen: false, gameStarted: false, gameOverOpen: false, victoryOpen: false };

//player
const player = {
    x: map.spawn.x * TILE_SIZE + 4,
    y: map.spawn.y * TILE_SIZE + 4,
    w: 24,
    h: 24,
    speed: 160,
    facing: "down",
};

//camera
const camera = { x: 0, y: 0 };

function updateCamera() {
    const mapPxW = map.width * TILE_SIZE;
    const mapPxH = map.height * TILE_SIZE;

    const targetX = (player.x + player.w / 2) - VIEW_W / 2;
    const targetY = (player.y + player.h / 2) - VIEW_H / 2;

    camera.x = Math.max(0, Math.min(targetX, Math.max(0, mapPxW - VIEW_W)));
    camera.y = Math.max(0, Math.min(targetY, Math.max(0, mapPxH - VIEW_H)));
}

//input
const keys = new Set();
let debugOn = true;

window.addEventListener("keydown", (e) => {
    keys.add(e.key.toLowerCase());
    if (UI.gameStarted && e.key.toLowerCase() === "i") debugOn = !debugOn;
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key.toLowerCase())) e.preventDefault();
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));

function readMovementInput() {
    let dx = 0, dy = 0;
    if (keys.has("w") || keys.has("arrowup")) dy -= 1;
    if (keys.has("s") || keys.has("arrowdown")) dy += 1;
    if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
    if (keys.has("d") || keys.has("arrowright")) dx += 1;

    if (dx !== 0 && dy !== 0) {
        const inv = 1 / Math.sqrt(2);
        dx *= inv; dy *= inv;
    }

    return { dx, dy };
}

//render
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let mouseX = VIEW_W / 2, mouseY = VIEW_H / 2;

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top) * scaleY;
});

function updateFacingToCursor() {
    const screenX = player.x - camera.x + player.w / 2;
    const screenY = player.y - camera.y + player.h / 2;
    const dx = mouseX - screenX, dy = mouseY - screenY;

    if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;

    if (Math.abs(dx) > Math.abs(dy)) player.facing = dx > 0 ? "right" : "left";
    else player.facing = dy > 0 ? "down" : "up";
}

function drawMap() {
    const startCol = Math.floor(camera.x / TILE_SIZE);
    const endCol = Math.ceil((camera.x + VIEW_W) / TILE_SIZE);
    const startRow = Math.floor(camera.y / TILE_SIZE);
    const endRow = Math.ceil((camera.y + VIEW_H) / TILE_SIZE);

    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            const id = tileAt(map, c, r);
            const def = TILE_DEFS[id];
            if (!def || !def.draw) continue;
            const sx = c * TILE_SIZE - camera.x;
            const sy = r * TILE_SIZE - camera.y;
            def.draw(ctx, sx, sy, c, r);
        }
    }
}

function drawPlayer() {
    const sx = player.x - camera.x;
    const sy = player.y - camera.y;

    //body
    ctx.fillStyle = "#d9b45c";
    ctx.strokeStyle = "#6b5324";
    ctx.lineWidth = 2;
    roundRect(ctx, sx, sy, player.w, player.h, 5);
    ctx.fill();
    ctx.stroke();

    //facing indicator
    ctx.fillStyle = "#6b5324";
    const cx = sx + player.w / 2, cy = sy + player.h / 2;
    const n = 4;
    if (player.facing === "up") ctx.fillRect(cx - n/2, sy + 2, n, n);
    if (player.facing === "down") ctx.fillRect(cx - n/2, sy + player.h - 6, n, n);
    if (player.facing === "left") ctx.fillRect(sx + 2, cy - n/2, n, n);
    if (player.facing === "right") ctx.fillRect(sx + player.w - 6, cy - n/2, n, n);
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath();
}

function drawDebug(fps) {
    if (!debugOn) return;
    const col = Math.floor((player.x + player.w / 2) / TILE_SIZE);
    const row = Math.floor((player.y + player.h / 2) / TILE_SIZE);
    document.getElementById("debugLine").textContent = 
    `x:${player.x.toFixed(1)} y:${player.y.toFixed(1)} tile:(${col},${row}) fps:${fps.toFixed(0)}`;

    ctx.strokeStyle = "rgba(255, 80, 80, 0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(player.x - camera.x + 0.5, player.y - camera.y + 0.5, player.w - 1, player.h - 1);
}

//game loop
let lastTime = performance.now();
let fps = 0;

function tick(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    fps = 1 / Math.max(dt, 0.0001);

    if (typeof updateHitStop === "function" && updateHitStop(dt)) {
        render();
        requestAnimationFrame(tick);
        return;
    }

    update(dt);
    render();

    requestAnimationFrame(tick);
}

function update(dt) {
    const menuOpen = UI.inventoryOpen || UI.journalOpen || UI.dialogueOpen || UI.craftingOpen || UI.shopOpen || UI.blacksmithOpen || UI.gameOverOpen || UI.victoryOpen;

    if (UI.gameStarted && !menuOpen) {
        const { dx, dy } = readMovementInput();
        moveWithCollision(map, player, dx * player.speed * dt, dy * player.speed * dt);
        updateCamera();
        updateFacingToCursor();
    }
    if (UI.gameStarted && !menuOpen && typeof updateWorldPickups === "function") updateWorldPickups(dt);
    if (UI.gameStarted && typeof updateNPCs === "function") updateNPCs(dt);
    if (UI.gameStarted && !menuOpen && typeof updateZonePortals === "function") updateZonePortals(dt);
    if (UI.gameStarted && typeof updateAltar === "function") updateAltar();
    if (UI.gameStarted && !menuOpen && typeof updateEnemies === "function") updateEnemies(dt);
    if (UI.gameStarted && !menuOpen && typeof updateBoss === "function") updateBoss(dt);
    if (UI.gameStarted && typeof updateShake === "function") updateShake(dt);
    if (UI.gameStarted && typeof updateAmbience === "function") updateAmbience(dt);
}

function render() {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    const shake = typeof getShakeOffset === "function" ? getShakeOffset() : { x: 0, y: 0 };
    camera.x += shake.x;
    camera.y += shake.y;

    drawMap();
    if (typeof drawCorruptionOverlay === "function") drawCorruptionOverlay(ctx);
    if (typeof drawAmbience === "function") drawAmbience(ctx, camera);
    if (typeof drawWorldPickups === "function") drawWorldPickups(ctx, camera);
    if (typeof drawZonePortals === "function") drawZonePortals(ctx, camera);
    if (typeof drawNPCs === "function") drawNPCs(ctx, camera);
    if (typeof drawEnemies === "function") drawEnemies(ctx, camera);
    if (typeof drawBoss === "function") drawBoss(ctx, camera);
    drawPlayer();
    if (typeof drawPlayerAttack === "function") drawPlayerAttack(ctx, camera);
    if (typeof drawDamagePopups === "function") drawDamagePopups(ctx, camera);
    if (typeof drawThornCreep === "function") drawThornCreep(ctx);

    camera.x -= shake.x;
    camera.y -= shake.y;

    if (typeof drawHud === "function") drawHud(ctx);
    if (typeof drawBossHud === "function") drawBossHud(ctx);
    if (typeof drawZoneLabel === "function") drawZoneLabel(ctx);
    drawDebug(fps);
}

requestAnimationFrame(tick);