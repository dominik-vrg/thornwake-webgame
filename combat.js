"use strict";

const ENEMY_DEFS = {
    thornling: {
        name: "Thornling",
        icon: "🥀",
        color: "#5c3d52",
        maxHp: 20,
        attack: 4,
        defense: 0,
        wanderSpeed: 30,
        chaseSpeed: 65,
        leashRadius: 48,
        xpReward: 8,
        w: 22,
        h: 22,
    },
};

const ENEMY_SPAWNS = [
    { type: "thornling", c: 12, r: 5 },
    { type: "thornling", c: 16, r: 4 },
    { type: "thornling", c: 24, r: 12 },
    { type: "thornling", c: 13, r: 17 },
    { type: "thornling", c: 7, r: 9 },
    { type: "thornling", c: 26, r: 15 },
];

const LOOT_TABLE = [
    { id: "wildHerb", weight: 5 },
    { id: "goldCoin", weight: 4 },
    { id: null, weight: 3 },
];

function rollLoot() {
    const total = LOOT_TABLE.reduce((s, e) => s + e.weight, 0);
    let r = Math.random() * total;
    for (const entry of LOOT_TABLE) {
        if (r < entry.weight) return entry.id;
        r -= entry.weight;
    }
    return null;
}

//enemy state
const RESPAWN_TIME = 25;

const enemies = ENEMY_SPAWNS.map((s, i) => {
    const def = ENEMY_DEFS[s.type];
    const spawnX = s.c * TILE_SIZE + (TILE_SIZE - def.w) / 2;
    const spawnY = s.r * TILE_SIZE + (TILE_SIZE - def.h) / 2;
    return {
        id: `enemy_${i}`,
        type: s.type,
        def,
        spawnX, spawnY,
        x: spawnX, y: spawnY,
        w: def.w, h: def.h,
        hp: def.maxHp,
        alive: true,
        hitFlash: 0,
        knockbackVX: 0, knockbackVY: 0,
        wanderState: "idle",
        wanderTimer: 1 + Math.random() * 2,
        wanderTarget: null,
        aiState: "wander",
        path: [],
        pathIndex: 0,
        pathTimer: 0,
        respawnTimer: 0,
    };
});

//damage popups
const damagePopups = [];

function spawnDamagePopup(x, y, text, color) {
    damagePopups.push({ x, y, text, color, life: 0.7, maxLife: 0.7 });
}

function updateDamagePopups(dt) {
    for (let i = damagePopups.length - 1; i >= 0; i--) {
        const p = damagePopups[i];
        p.life -= dt;
        p.y -= dt * 26;
        if (p.life <= 0) damagePopups.splice(i, 1); 
    }
}

function drawDamagePopups(ctx, camera) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "bold 13px 'Courier New', monospace";
    for (const p of damagePopups) {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, p.x - camera.x, p.y - camera.y);
    }
    ctx.restore();
}

//player attack
const ATTACK_COOLDOWN = 0.4;
const ATTACK_REACH = 26;
const ATTACK_WIDTH = 30;
let attackCooldownTimer = 0;
let attackSwingTimer = 0;

function attackHitbox() {
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    switch (player.facing) {
        case "up":    return { x: cx - ATTACK_WIDTH / 2, y: player.y - ATTACK_REACH, w: ATTACK_WIDTH, h: ATTACK_REACH };
        case "down":  return { x: cx - ATTACK_WIDTH / 2, y: player.y + player.h, w: ATTACK_WIDTH, h: ATTACK_REACH };
        case "left":  return { x: player.x - ATTACK_REACH, y: cy - ATTACK_WIDTH / 2, w: ATTACK_REACH, h: ATTACK_WIDTH };
        case "right": return { x: player.x + player.w, y: cy - ATTACK_WIDTH / 2, w: ATTACK_REACH, h: ATTACK_WIDTH };
        default:      return { x: cx - ATTACK_WIDTH / 2, y: player.y + player.h, w: ATTACK_WIDTH, h: ATTACK_REACH };
    }
}

function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function performAttack() {
    if (attackCooldownTimer > 0) return;
    const hasQuickHands = typeof hasPerk === "function" && hasPerk("quickHands");
    attackCooldownTimer = hasQuickHands ? ATTACK_COOLDOWN * 0.8 : ATTACK_COOLDOWN;
    attackSwingTimer = 0.15;
    
    const hitbox = attackHitbox();
    for (const enemy of enemies) {
        if (!enemy.alive) continue;
        if (!rectsOverlap(hitbox, enemy)) continue;

        const dmg = Math.max(1, player.attack - enemy.def.defense);
        damageEnemy(enemy, dmg);
    }
}

function damageEnemy(enemy, dmg) {
    enemy.hp -= dmg;
    enemy.hitFlash = 0.15;

    const ecx = enemy.x + enemy.w / 2, ecy = enemy.y + enemy.h / 2;
    spawnDamagePopup(ecx, ecy - 10, `-${dmg}`, "#f2d98a");

    const pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;
    const dx = ecx - pcx, dy = ecy - pcy;
    const dist = Math.hypot(dx, dy) || 1;
    enemy.knockbackVX = (dx / dist) * 120;
    enemy.knockbackVY = (dy / dist) * 120;

    if (enemy.hp <= 0) killEnemy(enemy);
}

function killEnemy(enemy) {
    enemy.alive = false;
    enemy.respawnTimer = RESPAWN_TIME;
    showToast(`${enemy.def.name} defeated`);

    if (enemy.def.xpReward && typeof addXP === "function") addXP(enemy.def.xpReward);
    if (typeof updateQuestProgressForKill === "function") updateQuestProgressForKill(enemy.type);

    const lootId = rollLoot();
    if (lootId) {
        worldPickups.push({
            id: lootId,
            x: enemy.x + enemy.w / 2,
            y: enemy.y + enemy.h / 2,
            blocked: false,
            collected: false,
            bobPhase: Math.random() * Math.PI * 2,
        });
    }
}

//player damage
let playerInvulnTimer = 0;
const PLAYER_INVULN_TIME = 0.6;

function damagePlayer(amount) {
    if (playerInvulnTimer > 0) return;
    playerInvulnTimer = PLAYER_INVULN_TIME;

    const finalDmg = Math.max(1, amount - player.defense);
    player.hp = Math.max(0, player.hp - finalDmg);
    spawnDamagePopup(player.x + player.w / 2, player.y - 4, `-${finalDmg}`, "#e06a6a");

    if (player.hp <= 0) respawnPlayer();
}

function respawnPlayer() {
    showToast("You were overwhelmed by the thorns... you wake up back near where you started.");
    player.x = map.spawn.x * TILE_SIZE + 4;
    player.y = map.spawn.y * TILE_SIZE + 4;
    player.hp = player.maxHp;
    playerInvulnTimer = 1.2;
    updateCamera();
}


function updateEnemies(dt) {
    if (playerInvulnTimer > 0) playerInvulnTimer -= dt;
    if (attackCooldownTimer > 0) attackCooldownTimer -= dt;
    if (attackSwingTimer > 0) attackSwingTimer -= dt;
    updateDamagePopups(dt);

    for (const enemy of enemies) {
        if (!enemy.alive) {
            enemy.respawnTimer -= dt;
            if (enemy.respawnTimer <= 0) {
                enemy.alive = true;
                enemy.hp = enemy.def.maxHp;
                enemy.x = enemy.spawnX;
                enemy.y = enemy.spawnY;
                enemy.wanderState = "idle";
                enemy.wanderTimer = 1 + Math.random() * 2;
                enemy.aiState = "wander";
                enemy.path = [];
                enemy.pathIndex = 0;
                enemy.pathTimer = 0;
            }
            continue;
        }

        if (enemy.hitFlash > 0) enemy.hitFlash -= dt;

        if (Math.abs(enemy.knockbackVX) > 1 || Math.abs(enemy.knockbackVY) > 1) {
            moveWithCollision(map, enemy, enemy.knockbackVX * dt, enemy.knockbackVY * dt);
            enemy.knockbackVX *= 0.85;
            enemy.knockbackVY *= 0.85;
        } else {
            updateEnemyAI(enemy, dt);
                }

        if (rectsOverlap(enemy, player)) {
            damagePlayer(enemy.def.attack);
        }
    }
}

//render
function drawEnemies(ctx, camera) {
    for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const sx = enemy.x - camera.x;
        const sy = enemy.y - camera.y;
        if (sx < -30 || sx > VIEW_W + 30 || sy < -30 || sy > VIEW_H + 30) continue;

        ctx.save();
        ctx.fillStyle = enemy.hitFlash > 0 ? "#f2d98a" : enemy.def.color;
        ctx.strokeStyle = enemy.aiState === "chase" ? "#e06a6a" : "rgba(0,0,0,0.4)";
        ctx.lineWidth = enemy.aiState === "chase" ? 2.5 : 2;
        roundRect(ctx, sx, sy, enemy.w, enemy.h, 5);
        ctx.fill();
        ctx.stroke();

        ctx.font = "13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(enemy.def.icon, sx + enemy.w / 2, sy + enemy.h / 2 + 1);

        const barW = enemy.w;
        const barY = sy - 10;
        ctx.fillStyle = "#241a0f";
        ctx.fillRect(sx, barY, barW, 4);
        ctx.fillStyle = "#c94f4f";
        ctx.fillRect(sx, barY, barW * Math.max(0, enemy.hp / enemy.def.maxHp), 4);

        ctx.restore();
    }
}

function drawPlayerAttack(ctx, camera) {
    if (attackSwingTimer <= 0) return;
    const hb = attackHitbox();
    ctx.save();
    ctx.globalAlpha = attackSwingTimer / 0.15;
    ctx.fillStyle = "#e8dcc8";
    ctx.fillRect(hb.x - camera.x, hb.y - camera.y, hb.w, hb.h);
    ctx.restore();
}

//input
window.addEventListener("keydown", (e) => {
    if (!UI.gameStarted || UI.dialogueOpen || UI.inventoryOpen || UI.journalOpen) return;
    if (e.key === " ") { e.preventDefault(); performAttack(); }
});