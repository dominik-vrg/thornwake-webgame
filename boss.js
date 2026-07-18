"use strict";

const BOSS_DEF = {
    name: "The Heart of Thornwake",
    icon: "🌹",
    color: "#7a1f3d",
    flashColor: "#e0a3c0",
    maxHp: 260,
    contactDamage: 10,
    defense: 4,
    w: 56, h: 56,
    xpReward: 150,
};

const boss = {
    x: 0, y: 0, w: BOSS_DEF.w, h: BOSS_DEF.h,
    hp: BOSS_DEF.maxHp,
    maxHp: BOSS_DEF.maxHp,
    alive: false,
    active: false,
    hitFlash: 0,
    contactTimer: 0,
    state: "idle",
    pattern: null,
    stateTimer: 0,
    projectiles: [],
    adds: [],
};

let bossDefeatedEver = false;

function getBossMaxHp() {
    return Math.round(BOSS_DEF.maxHp * getDifficultyMods().enemyHpMult);
}

function resetBossEncounter() {
    const arena = ZONES.boss_arena;
    boss.x = arena.altar.x + 13 - boss.w / 2;
    boss.y = arena.altar.y + 13 - boss.h / 2 - 30;
    boss.maxHp = getBossMaxHp();
    boss.hp = boss.maxHp;
    boss.alive = false;
    boss.active = false;
    boss.state = "idle";
    boss.pattern = null;
    boss.stateTimer = 0;
    boss.projectiles = [];
    boss.adds = [];
}

let nearbyAltar = null;

function updateAltar() {
    if (currentZoneId !== "boss_arena") { nearbyAltar = null; return; }
    if (UI.dialogueOpen) return;

    const arena = ZONES.boss_arena;
    const pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;
    const d = Math.hypot(pcx - (arena.altar.x + 13), pcy - (arena.altar.y + 13));
    nearbyAltar = d <= INTERACT_RANGE ? arena.altar : null;
}

function startBossFight() {
    if (bossDefeatedEver) { showToast("The Heart is still. Whatever was here has gone quiet."); return; }
    if (boss.active) return;

    boss.maxHp = getBossMaxHp();
    boss.hp = boss.maxHp;
    boss.alive = true;
    boss.active = true;
    boss.state = "telegraph";
    boss.pattern = "melee";
    boss.stateTimer = 0.8;

    showToast("The Heart of Thornwake awakens!");
    addLoreEntry("heart-awakens", "The Heart Awakens", ["The thing beneath the grove was never sleeping. It was waiting."]);
    if (typeof playSfx === "function") playSfx("bossTelegraph");
    if (typeof triggerShake === "function") triggerShake(6, 0.3);
}

window.addEventListener("keydown", (e) => {
    if (!UI.gameStarted) return;
    const menuOpen = UI.dialogueOpen || UI.inventoryOpen || UI.journalOpen || UI.craftingOpen || UI.shopOpen || UI.blacksmithOpen || UI.gameOverOpen || UI.victoryOpen;
    if (menuOpen) return;
    if (e.key.toLowerCase() === "e" && nearbyAltar && !boss.active) {
        e.preventDefault();
        startBossFight();
    }
});

const BOSS_PATTERNS = ["melee", "ranged", "summon"];

function pickNextPattern() {
    const options = BOSS_PATTERNS.filter((p) => p !== boss.pattern);
    return options[Math.floor(Math.random() * options.length)];
}

function bossCooldownDuration() {
    const ratio = boss.hp / boss.maxHp;
    const base = 1.6;
    if (ratio < 0.3) return base * 0.5;
    if (ratio < 0.6) return base * 0.75;
    return base;
}

function updateBoss(dt) {
    if (boss.hitFlash > 0) boss.hitFlash -= dt;
    updateBossProjectiles(dt);
    updateBossAdds(dt);

    if (!boss.active || !boss.alive) return;

    if (boss.contactTimer > 0) boss.contactTimer -= dt;
    if (rectsOverlap(boss, player) && boss.contactTimer <= 0) {
        damagePlayer(Math.round(BOSS_DEF.contactDamage * getDifficultyMods().enemyDamageMult));
        boss.contactTimer = 0.5;
    }

    boss.stateTimer -= dt;

    if (boss.state === "telegraph" && boss.stateTimer <= 0) {
        executePattern(boss.pattern);
        boss.state = "acting";
        boss.stateTimer = 0.2;
    } else if (boss.state === "acting" && boss.stateTimer <= 0) {
        boss.state = "cooldown";
        boss.stateTimer = bossCooldownDuration();
    } else if (boss.state === "cooldown" && boss.stateTimer <= 0) {
        boss.pattern = pickNextPattern();
        boss.state = "telegraph";
        boss.stateTimer = boss.pattern === "ranged" ? 0.5 : boss.pattern === "summon" ? 0.6 : 0.7;
        if (typeof playSfx === "function") playSfx("bossTelegraph");
    }
}

function executePattern(pattern) {
    const bcx = boss.x + boss.w / 2, bcy = boss.y + boss.h / 2;
    const pcx = player.x + player.w / 2, pcy = player.y + player.h / 2;

    if (pattern === "melee") {
        if (Math.hypot(pcx - bcx, pcy - bcy) <= 70) {
            damagePlayer(Math.round(16 * getDifficultyMods().enemyDamageMult));
            spawnDamagePopup(pcx, pcy - 14, "SLAM!", "#e06a6a");
            if (typeof triggerShake === "function") triggerShake(9, 0.3);
            if (typeof triggerHitStop === "function") triggerHitStop(0.08);
        }
        if (typeof playSfx === "function") playSfx("bossSlam");
    } else if (pattern === "ranged") {
        const baseAngle = Math.atan2(pcy - bcy, pcx - bcx);
        for (let i = -1; i <= 1; i++) {
            const angle = baseAngle + i * 0.25;
            boss.projectiles.push({ x: bcx, y: bcy, vx: Math.cos(angle) * 160, vy: Math.sin(angle) * 160, life: 3 });
        }
        if (typeof playSfx === "function") playSfx("bossRanged");
    } else if (pattern === "summon") {
        for (let i = 0; i < 2; i++) {
            boss.adds.push({
                x: boss.x + (Math.random() - 0.5) * 40, y: boss.y + (Math.random() - 0.5) * 40,
                w: 18, h: 18, hp: 16, maxHp: 16, alive: true, hitFlash: 0,
            });
        }
        showToast("Thorn sprouts burst from the ground!");
        if (typeof playSfx === "function") playSfx("bossSummon");
    }
}

function updateBossProjectiles(dt) {
    for (let i = boss.projectiles.length - 1; i >= 0; i--) {
        const p = boss.projectiles[i];
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;

        if (rectsOverlap({ x: p.x - 5, y: p.y - 5, w: 10, h: 10 }, player)) {
            damagePlayer(Math.round(9 * getDifficultyMods().enemyDamageMult));
            boss.projectiles.splice(i, 1);
            continue;
        }
        if (p.life <= 0) boss.projectiles.splice(i, 1);
    }
}

function updateBossAdds(dt) {
    for (let i = boss.adds.length - 1; i >= 0; i--) {
        const add = boss.adds[i];
        if (!add.alive) { boss.adds.splice(i, 1); continue; }
        if (add.hitFlash > 0) add.hitFlash -= dt;

        const dx = (player.x + player.w / 2) - (add.x + add.w / 2);
        const dy = (player.y + player.h / 2) - (add.y + add.h / 2);
        const dist = Math.hypot(dx, dy) || 1;
        const step = 50 * dt;
        add.x += (dx / dist) * step;
        add.y += (dy / dist) * step;

        if (rectsOverlap(add, player)) damagePlayer(Math.round(4 * getDifficultyMods().enemyDamageMult));
    }
}

function activeBossHit(hitbox) {
    if (boss.active && boss.alive && rectsOverlap(hitbox, boss)) {
        const dmg = Math.max(1, Math.round((player.attack - BOSS_DEF.defense) * getDifficultyMods().playerDamageMult));
        boss.hp -= dmg;
        boss.hitFlash = 0.15;
        spawnDamagePopup(boss.x + boss.w / 2, boss.y - 10, `-${dmg}`, "#f2d98a");
        if (typeof triggerHitStop === "function") triggerHitStop(0.05);
        if (typeof triggerShake === "function") triggerShake(3, 0.12);
        if (typeof playSfx === "function") playSfx("bossHit");
        if (boss.hp <= 0) defeatBoss();
    }

    for (const add of boss.adds) {
        if (add.alive && rectsOverlap(hitbox, add)) {
            add.hp -= Math.max(1, Math.round(player.attack * getDifficultyMods().playerDamageMult));
            add.hitFlash = 0.15;
            if (add.hp <= 0) { add.alive = false; addXP(3); }
        }
    }
}

function defeatBoss() {
    boss.alive = false;
    boss.active = false;
    boss.projectiles = [];
    boss.adds = [];
    bossDefeatedEver = true;

    showToast("The Heart of Thornwake falls still.");
    if (typeof triggerShake === "function") triggerShake(14, 0.6);
    if (typeof triggerHitStop === "function") triggerHitStop(0.2);

    addXP(BOSS_DEF.xpReward);
    addItemToInventory("goldCoin", 30);
    addItemToInventory("corruptedSap", 5);
    addItemToInventory("heartseedCharm", 1);

    if (!player.perks.has("heartbound")) {
        player.perks.add("heartbound");
        recalcPlayerStats();
        showToast("You feel the corruption's strength settle into your own.");
    }

    addLoreEntry("the-heart-stilled", "The Heart Stilled", [
        "The thing beneath Thornwake has gone quiet. Whether it is dead, or merely sleeping again, no one can say for certain.",
        "The thorns nearby have already begun to wilt. Perhaps, in time, the grove will remember how to be a forest again.",
    ]);

    if (typeof triggerVictory === "function") {
        setTimeout(triggerVictory, 900);
    }
    if (typeof saveGame === "function") saveGame();
}

function drawAltar(ctx, camera) {
    if (currentZoneId !== "boss_arena") return;
    const a = ZONES.boss_arena.altar;
    const sx = a.x - camera.x, sy = a.y - camera.y;

    ctx.save();
    ctx.fillStyle = boss.active ? "rgba(122,31,61,0.5)" : "rgba(80,20,40,0.35)";
    ctx.strokeStyle = "#c94f4f";
    ctx.lineWidth = 2;
    roundRect(ctx, sx, sy, 26, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(bossDefeatedEver ? "🥀" : "❤️‍🔥", sx + 13, sy + 14);

    if (nearbyAltar && !boss.active) {
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

function drawBoss(ctx, camera) {
    for (const p of boss.projectiles) {
        const sx = p.x - camera.x, sy = p.y - camera.y;
        ctx.save();
        ctx.fillStyle = "#a83a3a";
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    for (const add of boss.adds) {
        if (!add.alive) continue;
        const sx = add.x - camera.x, sy = add.y - camera.y;
        ctx.save();
        ctx.fillStyle = add.hitFlash > 0 ? "#f2d98a" : "#5c3d52";
        roundRect(ctx, sx, sy, add.w, add.h, 4);
        ctx.fill();
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🥀", sx + add.w / 2, sy + add.h / 2);
        ctx.restore();
    }

    drawAltar(ctx, camera);

    if (!boss.alive) return;
    const sx = boss.x - camera.x, sy = boss.y - camera.y;
    if (sx < -80 || sx > VIEW_W + 80 || sy < -80 || sy > VIEW_H + 80) return;

    ctx.save();
    const telegraphing = boss.state === "telegraph";
    ctx.fillStyle = boss.hitFlash > 0 ? "#f2d98a" : telegraphing ? BOSS_DEF.flashColor : BOSS_DEF.color;
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 3;
    roundRect(ctx, sx, sy, boss.w, boss.h, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = "30px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(BOSS_DEF.icon, sx + boss.w / 2, sy + boss.h / 2 + 2);
    ctx.restore();
}

function drawBossHud(ctx) {
    if (!boss.active || !boss.alive) return;
    ctx.save();

    const w = 360, h = 34, x = (VIEW_W - w) / 2, y = 14;
    ctx.fillStyle = "rgba(20,16,15,0.8)";
    ctx.strokeStyle = "#7a1f3d";
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 11px 'Courier New', monospace";
    ctx.fillStyle = "#e8dcc8";
    ctx.fillText(BOSS_DEF.name, x + w / 2, y + 11);

    const barX = x + 10, barY = y + 18, barW = w - 20, barH = 8;
    ctx.fillStyle = "#3a2c22";
    ctx.fillRect(barX, barY, barW, barH);
    const ratio = Math.max(0, boss.hp / boss.maxHp);
    ctx.fillStyle = ratio < 0.3 ? "#c94f4f" : "#7a1f3d";
    ctx.fillRect(barX, barY, barW * ratio, barH);
    ctx.strokeStyle = "rgba(0,0,0,0.4)";
    ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);
    ctx.restore();
}