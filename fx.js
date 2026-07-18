"use strict";

let hitStopTimer = 0;

function triggerHitStop(duration) {
    hitStopTimer = Math.max(hitStopTimer, duration);
}

function updateHitStop(dt) {
    if (hitStopTimer > 0) {
        hitStopTimer -= dt;
        return true;
    }
    return false;
}

const shakeState = { time: 0, duration: 0, magnitude: 0 };

function triggerShake(magnitude, duration) {
    shakeState.magnitude = Math.max(shakeState.magnitude, magnitude);
    shakeState.duration = Math.max(shakeState.duration, duration);
    shakeState.time = Math.max(shakeState.time, duration);
}

function updateShake(dt) {
    if (shakeState.time > 0) shakeState.time = Math.max(0, shakeState.time - dt);
    if (shakeState.time === 0) shakeState.magnitude = 0;
}

function getShakeOffset() {
    if (shakeState.time <= 0 || shakeState.duration <= 0) return { x: 0, y: 0 };
    const ratio = shakeState.time / shakeState.duration;
    const m = shakeState.magnitude * ratio;
    return { x: (Math.random() * 2 - 1) * m, y: (Math.random() * 2 - 1) * m };
}

const LEAF_COUNT = 14;
const leaves = [];
for (let i = 0; i < LEAF_COUNT; i++) {
    leaves.push({
        x: Math.random() * VIEW_W,
        y: Math.random() * VIEW_H,
        speed: 12 + Math.random() * 14,
        drift: 6 + Math.random() * 10,
        phase: Math.random() * Math.PI * 2,
        size: 3 + Math.random() * 3,
        spin: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 2,
    });
}

function leafIntensityForZone() {
    if (!currentZone) return 1;
    if (currentZone.id === "village") return 1;
    if (currentZone.id === "grove_edge") return 0.35;
    return 0;
}

function updateAmbience(dt) {
    const intensity = leafIntensityForZone();
    if (intensity <= 0) return;
    for (const leaf of leaves) {
        leaf.y += leaf.speed * dt;
        leaf.x += Math.sin(worldTime * 1.3 + leaf.phase) * leaf.drift * dt;
        leaf.spin += leaf.spinSpeed * dt;
        if (leaf.y > VIEW_H + 10) {
            leaf.y = -10;
            leaf.x = Math.random() * VIEW_W;
        }
        if (leaf.x < -10) leaf.x = VIEW_W + 10;
        if (leaf.x > VIEW_W + 10) leaf.x = -10;
    }
}

function drawAmbience(ctx) {
    const intensity = leafIntensityForZone();
    if (intensity <= 0) return;

    ctx.save();
    ctx.globalAlpha = 0.55 * intensity;
    ctx.fillStyle = "#8fae5a";
    for (const leaf of leaves) {
        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.spin);
        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size, leaf.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    ctx.restore();
}

function thornIntensity() {
    const c = currentZone && currentZone.corruption;
    return c ? c.alpha : 0;
}

function thornVine(ctx, x, y, angle, length, generation) {
    if (generation <= 0 || length < 6) return;
    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;

    ctx.beginPath();
    ctx.moveTo(x, y);
    const midX = x + Math.cos(angle) * length * 0.5 + Math.sin(worldTime * 0.6 + x) * 4;
    const midY = y + Math.sin(angle) * length * 0.5 + Math.cos(worldTime * 0.6 + y) * 4;
    ctx.quadraticCurveTo(midX, midY, endX, endY);
    ctx.stroke();

    for (let i = 1; i <= 2; i++) {
        const t = i / 3;
        const bx = x + (endX - x) * t;
        const by = y + (endY - y) * t;
        const barbAngle = angle + (i % 2 === 0 ? 1 : -1) * 0.9;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + Math.cos(barbAngle) * 6, by + Math.sin(barbAngle) * 6);
        ctx.stroke();
    }

    thornVine(ctx, endX, endY, angle + (Math.random() - 0.5) * 0.6, length * 0.62, generation - 1);
}

function drawThornCreep(ctx) {
    const intensity = thornIntensity();
    if (intensity <= 0) return;

    const pulse = 0.85 + Math.sin(worldTime * 0.8) * 0.15;
    ctx.save();
    ctx.globalAlpha = Math.min(0.85, intensity * 1.8) * pulse;
    ctx.strokeStyle = "#2a0f1f";
    ctx.lineWidth = 2;

    const reach = 60 + intensity * 140;
    thornVine(ctx, 0, VIEW_H * 0.2, -0.3, reach, 4);
    thornVine(ctx, 0, VIEW_H * 0.75, 0.3, reach, 4);
    thornVine(ctx, VIEW_W, VIEW_H * 0.25, Math.PI + 0.3, reach, 4);
    thornVine(ctx, VIEW_W, VIEW_H * 0.8, Math.PI - 0.3, reach, 4);
    thornVine(ctx, VIEW_W * 0.3, 0, Math.PI / 2 + 0.2, reach * 0.7, 3);
    thornVine(ctx, VIEW_W * 0.7, VIEW_H, -Math.PI / 2 + 0.2, reach * 0.7, 3);

    ctx.restore();
}
