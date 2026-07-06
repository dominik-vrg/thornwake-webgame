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

const TILE_DEFS = {
    [TILE.GRASS]: { name: "grass", walkable: true, color: "#3c5e33", edge: "#345228" },
    [TILE.WALL]: { name: "wall", walkable: false, color: "#5b5750", edge: "#3f3c37" },
    [TILE.WATER]: { name: "water", walkable: false, color: "#2f5c78", edge: "#254a61" },
    [TILE.PATH]: { name: "path", walkable: true, color: "#7a5d3f", edge: "#664e35" },
    [TILE.TREE]: { name: "tree", walkable: false, color: "#2c4423", edge: "#213419" },
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

const map = buildDemoMap(MAP_COLS, MAP_ROWS);

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
    if (e.key.toLowerCase() === "i") debugOn = !debugOn;
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
    if (dy < 0) player.facing = "up";
    else if (dy > 0) player.facing = "down";
    else if (dx < 0) player.facing = "left";
    else if (dx > 0) player.facing = "right";

    return { dx, dy };
}

//render
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function drawMap() {
    const startCol = Math.floor(camera.x / TILE_SIZE);
    const endCol = Math.ceil((camera.x + VIEW_W) / TILE_SIZE);
    const startRow = Math.floor(camera.y / TILE_SIZE);
    const endRow = Math.ceil((camera.y + VIEW_H) / TILE_SIZE);

    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            const id = tileAt(map, c, r);
            const def = TILE_DEFS[id];
            if (!def) continue;
            const sx = c * TILE_SIZE - camera.x;
            const sy = r * TILE_SIZE - camera.y;
            ctx.fillStyle = def.color;
            ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = def.edge;
            ctx.lineWidth = 1;
            ctx.strokeRect(sx + 0.5, sy + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
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

    update(dt);
    render();

    requestAnimationFrame(tick);
}

function update(dt) {
    const { dx, dy } = readMovementInput();
    moveWithCollision(map, player, dx * player.speed * dt, dy * player.speed * dt);
    updateCamera();
}

function render() {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    drawMap();
    drawPlayer();
    drawDebug(fps);
}

requestAnimationFrame(tick);