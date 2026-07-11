"use strict";

const DETECTION_RADIUS = 110;
const CHASE_GIVEUP_RADIUS = 200;
const MAX_CHASE_TILES = 6;
const PATH_RECALC_INTERVAL = 0.35;
const WAYPOINT_ARRIVAL_PX = 4;
const RETURN_ARRIVAL_PX = 6;

function tileCenter(col, row) {
    return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 };
}

function toTile(x, y, w, h) {
    return { col: Math.floor((x + w / 2) / TILE_SIZE), row: Math.floor((y + h / 2) / TILE_SIZE) };
}

function updateEnemyAI(enemy, dt) {
    const pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;
    const ecx = enemy.x + enemy.w / 2, ecy = enemy.y + enemy.h / 2;
    const distToPlayer = Math.hypot(pcx - ecx, pcy - ecy);
    const distFromSpawn = Math.hypot(ecx - (enemy.spawnX + enemy.w / 2), ecy - (enemy.spawnY + enemy.h / 2));

    if (enemy.aiState === "wander" && distToPlayer <= DETECTION_RADIUS) {
        enterChase(enemy);
    } else if (enemy.aiState === "chase") {
        if (distToPlayer > CHASE_GIVEUP_RADIUS || distFromSpawn > MAX_CHASE_TILES * TILE_SIZE) {
            enterReturn(enemy);
        }
    } else if (enemy.aiState === "return" && distToPlayer <= DETECTION_RADIUS) {
        enterChase(enemy);
    }

    if (enemy.aiState === "chase") {
        runPathTowards(enemy, dt, toTile(player.x, player.y, player.w, player.h), enemy.def.chaseSpeed);
    } else if (enemy.aiState === "return") {
        const spawnTile = toTile(enemy.spawnX, enemy.spawnY, enemy.w, enemy.h);
        const arrived = runPathTowards(enemy, dt, spawnTile, enemy.def.chaseSpeed, RETURN_ARRIVAL_PX);
        if (arrived) enterWander(enemy);
    } else {
        runWander(enemy, dt);
    }
}

function enterChase(enemy) {
    enemy.aiState = "chase";
    enemy.pathTimer = 0;
    enemy.path = [];
    enemy.pathIndex = 0;
    if (typeof spawnDamagePopup === "function") {
        spawnDamagePopup(enemy.x + enemy.w / 2, enemy.y - 6, "!", "#e06a6a");
    }
}

function enterReturn(enemy) {
    enemy.aiState = "return";
    enemy.pathTimer = 0;
    enemy.path = [];
    enemy.pathIndex = 0;
}

function enterWander(enemy) {
    enemy.aiState = "wander";
    enemy.wanderState = "idle";
    enemy.wanderTimer = 1 + Math.random() * 2;
}

//path following
function runPathTowards(enemy, dt, destTile, speed, arrivalPx = WAYPOINT_ARRIVAL_PX) {
    enemy.pathTimer -= dt;
    if (enemy.pathTimer <= 0) {
        const startTile = toTile(enemy.x, enemy.y, enemy.w, enemy.h);
        enemy.path = findPath(map, startTile.col, startTile.row, destTile.col, destTile.row) || [];
        enemy.pathIndex = 0;
        enemy.pathTimer = PATH_RECALC_INTERVAL;
    }

    if (enemy.path.length === 0) {
        const dc = tileCenter(destTile.col, destTile.row);
        return Math.hypot((enemy.x + enemy.w / 2) - dc.x, (enemy.y + enemy.h / 2) - dc.y) <= arrivalPx * 4;
    }

    if (enemy.pathIndex >= enemy.path.length) return true;

    const waypoint = enemy.path[enemy.pathIndex];
    const target = tileCenter(waypoint.col, waypoint.row);
    const dx = target.x - (enemy.x + enemy.w / 2);
    const dy = target.y - (enemy.y + enemy.h / 2);
    const dist = Math.hypot(dx, dy);

    if (dist <= arrivalPx) {
        enemy.pathIndex++;
        if (enemy.pathIndex >= enemy.path.length) return true;
        return false;
    }

    const step = (speed * dt) / dist;
    moveWithCollision(map, enemy, dx * step, dy * step);
    return false;
}

//idle wander
function pickWanderTarget(enemy) {
    for (let attempt = 0; attempt < 8; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * enemy.def.leashRadius;
        const tx = enemy.spawnX + Math.cos(angle) * dist;
        const ty = enemy.spawnY + Math.sin(angle) * dist;
        if (!rectCollidesWithMap(map, tx, ty, enemy.w, enemy.h)) {
            return { x: tx, y: ty };
        }
    }
    return { x: enemy.spawnX, y: enemy.spawnY };
}

function runWander(enemy, dt) {
    enemy.wanderTimer -= dt;
    if (enemy.wanderState === "idle") {
        if (enemy.wanderTimer <= 0) {
            enemy.wanderTarget = pickWanderTarget(enemy);
            enemy.wanderState = "moving";
            enemy.wanderTimer = 3 + Math.random() * 2;
        }
        return;
    }

    const dx = enemy.wanderTarget.x - enemy.x;
    const dy = enemy.wanderTarget.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 3 || enemy.wanderTimer <= 0) {
        enemy.wanderState = "idle";
        enemy.wanderTimer = 1.5 + Math.random() * 2.5;
    } else {
        const step = (enemy.def.wanderSpeed * dt) / dist;
        moveWithCollision(map, enemy, dx * step, dy * step);
    }
}