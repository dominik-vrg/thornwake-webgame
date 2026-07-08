"use strict";

//item defs
const ITEM_DEFS = {
    ironSword: { id: "ironSword", name: "Iron Sword", type: "weapon", slot: "weapon", stackable: false, icon: "⚔️", color: "#b7c2cc", stats: { attack: 6 }, description: "A well-balanced iron blade." },
    leatherArmor: { id: "leatherArmor", name: "Leather Armor", type: "armor", slot: "armor", stackable: false, icon: "🛡️", color: "#8a6a45", stats: { defense: 5 }, description: "Sturdy leather chestpiece." },
    ironHelm: { id: "ironHelm", name: "Iron Helm", type: "helmet", slot: "helmet", stackable: false, icon: "🪖", color: "#9aa5ad", stats: { defense: 2 }, description: "Protects your head." },
    swiftBoots: { id: "swiftBoots", name: "Swift Boots", type: "boots", slot: "boots", stackable: false, icon: "🥾", color: "", stats: { defense: 1, speed: 40 }, description: "Lightweight boots that quicken your step." },
    healthPotion: { id: "healthPotion", name: "Health Potion", type: "consumable", slot: "null", stackable: true, maxStack: 5, icon: "🧪", color: "#c94f4f", effect: { heal: 40 }, description: "Restores 40 HP when consumed." },
    wildHerb: { id: "wildHerb", name: "Wild Herb", type: "material", slot: "null", stackable: true, maxStack: 20, icon: "🌿", color: "#5f9e4a", description: "A common herb. Might be useful for crafting later." },
    goldCoin: { id: "goldCoin", name: "Gold Coin", type: "material", slot: "null", stackable: true, maxStack: 99, icon: "🪙", color: "#d4af37", description: "Shiny currency, accepted nowhere yet." },
};

const SLOT_ORDER = ["helmet", "weapon", "armor", "boots"];
const EQUIP_SLOT_DEFS = {
    helmet: { label: "Helmet", placeholder: "🪖" },
    weapon: { label: "Weapon", placeholder: "⚔️" },
    armor: { label: "Armor", placeholder: "🛡️" },
    boots: { label: "Boots", placeholder: "🥾"},
};


//player stats
const BASE_ATTACK = 3;
const BASE_DEFENSE = 0;
const BASE_SPEED = player.speed;

player.maxHp = 100;
player.hp = 100;
player.attack = BASE_ATTACK;
player.defense = BASE_DEFENSE;

function recalcPlayerStats() {
    let attack = BASE_ATTACK;
    let defense = BASE_DEFENSE;
    let speed = BASE_SPEED;
    for (const slot of SLOT_ORDER) {
        const id = equipment[slot];
        if (!id) continue;
        const def = ITEM_DEFS[id];
        if (!def.stats) continue;
        attack += def.stats.attack || 0;
        defense += def.stats.defense || 0;
        speed += def.stats.speed || 0;
    }
    player.attack = attack;
    player.defense = defense;
    player.speed = speed;
}


//inventory
const INV_SIZE = 20;
const inventory = new Array(INV_SIZE).fill(null); 
const equipment = { helmet: null, weapon: null, armor: null, boots: null };

function addItemToInventory(id, qty) {
    const def = ITEM_DEFS[id];
    let remaining = qty;

    //top up existing stacks first
    if (def.stackable) {
        for (let i = 0; i < inventory.length && remaining > 0; i++) {
            const slot = inventory[i];
            if (slot && slot.id === id && slot.qty < def.maxStack) {
                const space = def.maxStack - slot.qty;
                const add = Math.min(space, remaining);
                slot.qty += add;
                remaining -= add;
            }
        }
    }

    for (let i = 0; i < inventory.length && remaining > 0; i++) {
        if (!inventory[i]) {
            const add = def.stackable ? Math.min(def.maxStack, remaining) : 1;
            inventory[i] = { id, qty: add };
            remaining -= add;
        }
    }

    return remaining === 0;
}

function swapInventorySlots(i, j) {
    const a = inventory[i], b = inventory[j];
    if (a && b && a.id === b.id && ITEM_DEFS[a.id].stackable) {
        const def = ITEM_DEFS[a.id];
        const total = a.qty + b.qty;
        if (total <= def.maxStack) {
            inventory[j] = { id: a.id, qty: total };
            inventory[i] = null;
        } else {
            inventory[j] = { id: a.id, qty: def.maxStack };
            inventory[i] = { id: a.id, qty: total - def.maxStack };
        }
    } else {
        inventory[i] = b;
        inventory[j] = a;
    }
    selection = null;
    renderInventoryUI();
}

function equipFromInventory(index) {
    const slotItem = inventory[index];
    if (!slotItem) return;
    const def = ITEM_DEFS[slotItem.id];
    if (!def.slot) { showToast(`${def.name} can't be equipped.`); return; }

    const prevId = equipment[def.slot];
    equipment[def.slot] = slotItem.id;

    if (slotItem.qty > 1) slotItem.qty -= 1;
    else inventory[index] = null;

    if (prevId) addItemToInventory(prevId, 1);

    recalcPlayerStats();
    showToast(`Equipped ${def.icon} ${def.name}`);
    selection = null;
    renderInventoryUI();
}

function unequipSlot(slotType) {
    const id = equipment[slotType];
    if (!id) return;
    if (!addItemToInventory(id, 1)) { showToast("Inventory full!"); return; }
    equipment[slotType] = null;
    recalcPlayerStats();
    showToast(`Unequipped ${ITEM_DEFS[id].name}`);
    selection = null;
    renderInventoryUI();
}

function useFromInventory(index) {
    const slotItem = inventory[index];
    if (!slotItem) return;
    const def = ITEM_DEFS[slotItem.id];
    if (def.type !== "consumable") { showToast(`${def.name} can't be used.`); return; }

    if (def.effect && def.effect.heal) {
        player.hp = Math.min(player.maxHp, player.hp + def.effect.heal);
        showToast(`Used ${def.name} — +${def.effect.heal} HP`);
    }
    slotItem.qty -= 1;
    if (slotItem.qty <= 0) inventory[index] = null;
    selection = null;
    renderInventoryUI();
}

function dropFromInventory(index) {
    const slotItem = inventory[index];
    if (!slotItem) return;
    const def = ITEM_DEFS[slotItem.id];

    spawnPickupNearPlayer(slotItem.id);
    slotItem.qty -= 1;
    if (slotItem.qty <= 0) inventory[index] = null;

    showToast(`Dropped ${def.name}`);
    selection = null;
    renderInventoryUI();
}

let worldTime = 0;

const START_TILES = [
    { id: "ironSword",    c: 22, r: 14 },
    { id: "leatherArmor", c: 10, r: 10 },
    { id: "ironHelm",     c: 17, r: 16 },
    { id: "swiftBoots",   c: 4,  r: 3  },
    { id: "healthPotion", c: 11, r: 3  },
    { id: "healthPotion", c: 23, r: 15 },
    { id: "wildHerb",     c: 18, r: 8  },
    { id: "wildHerb",     c: 9,  r: 18 },
    { id: "wildHerb",     c: 27, r: 6  },
    { id: "goldCoin",     c: 5,  r: 12 },
    { id: "goldCoin",     c: 21, r: 17 },
];

let worldPickups = START_TILES.map((t) => ({
    id: t.id,
    x: t.c * TILE_SIZE + TILE_SIZE / 2,
    y: t.r * TILE_SIZE + TILE_SIZE / 2,
    blocked: false,
    collected: false,
    bobPhase: Math.random() * Math.PI * 2,
}));

function spawnPickupNearPlayer(itemId) {
    worldPickups.push({
        id: itemId,
        x: player.x + player.w / 2,
        y: player.y + player.h / 2,
        blocked: true,
        collected: false,
        bobPhase: Math.random() * Math.PI * 2,
    });
}

function updateWorldPickups(dt) {
    worldTime += dt;

    for (const p of worldPickups) {
        const overlap =
            player.x < p.x + 10 && player.x + player.w > p.x - 10 &&
            player.y < p.y + 10 && player.y + player.h > p.y - 10;

        if (overlap) {
            if (!p.blocked) {
                const def = ITEM_DEFS[p.id];
                if (addItemToInventory(p.id, 1)) {
                    p.collected = true;
                    showToast(`Picked up ${def.icon} ${def.name}`);
                } else {
                    p.blocked = true;
                    showToast("Inventory full!");
                }
            }
        } else {
            p.blocked = false;
        }
    }

    if (worldPickups.some((p) => p.collected)) {
        worldPickups = worldPickups.filter((p) => !p.collected);
        if (UI.inventoryOpen) renderInventoryUI();
    }
}

function drawWorldPickups(ctx, camera) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const p of worldPickups) {
        const bob = Math.sin(worldTime * 3 + p.bobPhase) * 3;
        const sx = p.x - camera.x;
        const sy = p.y - camera.y + bob;
        if (sx < -20 || sx > VIEW_W + 20 || sy < -20 || sy > VIEW_H + 20) continue;

        const def = ITEM_DEFS[p.id];
        ctx.beginPath();
        ctx.fillStyle = def.color + "cc";
        ctx.arc(sx, sy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = "14px sans-serif";
        ctx.fillText(def.icon, sx, sy + 1);
    }
    ctx.restore();
}

//mini hud
function drawHud(ctx) {
    ctx.save();

    const pad = 10, w = 150, h = 54;
    ctx.fillStyle = "rgba(20, 16, 15, 0.72)";
    ctx.strokeStyle = "rgba(201, 138, 62, 0.6)";
    ctx.lineWidth = 1;
    roundRect(ctx, pad, pad, w, h, 6);
    ctx.fill();
    ctx.stroke();

    const barX = pad + 8, barY = pad + 8, barW = w - 16, barH = 8;
    ctx.fillStyle = "#3a2c22";
    ctx.fillRect(barX, barY, barW, barH);
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    ctx.fillStyle = hpRatio > 0.3 ? "#7fae5a" : "#c94f4f";
    ctx.fillRect(barX, barY, barW * hpRatio, barH);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
    ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);

    ctx.fillStyle = "#e8dcc8";
    ctx.font = "11px 'Courier New', monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`HP ${Math.ceil(player.hp)}/${player.maxHp}`, barX, barY + barH + 4);
    ctx.fillText(`ATK ${player.attack} DEF ${player.defense}`, barX, barY + barH + 18);

    ctx.font = "14px sans-serif";
    let iconX = barX;
    const iconY = barY + barH + 32;
    for (const slot of SLOT_ORDER) {
        const id = equipment[slot];
        ctx.globalAlpha = id ? 1 : 0.25;
        ctx.fillText(id ? ITEM_DEFS[id].icon : EQUIP_SLOT_DEFS[slot].placeholder, iconX, iconY);
        iconX += 20;
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(232, 220, 200, 0.7)";
    ctx.fillText("[Tab] Inventory", VIEW_W - 10, 10);
    ctx.fillText("[J] Journal", VIEW_W - 10, 24);

    ctx.restore();
}

//toast notification
const toastEl = document.getElementById("pickupToast");
let toastTimer = null;

function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
}

//inventory ui
const overlayEl = document.getElementById("inventoryOverlay");
const equipSlotsEl = document.getElementById("equipSlots");
const invGridEl = document.getElementById("invGrid");
const statsReadoutEl = document.getElementById("statsReadout");
const tooltipEl = document.getElementById("itemTooltip");
const actionsEl = document.getElementById("invActions");

let selection = null;
let dragSource = null;

function renderInventoryUI() {
    equipSlotsEl.innerHTML = SLOT_ORDER.map((slot) => {
        const id = equipment[slot];
        const def = id ? ITEM_DEFS[id] : null;
        const isSelected = selection && selection.kind === "equip" && selection.key === slot;
        return `
            <div class="equip-slot ${def ? "filled" : ""} ${isSelected ? "selected" : ""}" data-slot="${slot}" draggable="${def ? "true" : "false"}">
                <div class="equip-slot-icon" style="opacity:${def ? 1 : 0.3}">${def ? def.icon : EQUIP_SLOT_DEFS[slot].placeholder}</div>
                <div class="equip-slot-label">${EQUIP_SLOT_DEFS[slot].label}</div>
            </div>`;
    }).join("");

    invGridEl.innerHTML = inventory.map((slotItem, i) => {
        const def = slotItem ? ITEM_DEFS[slotItem.id] : null;
        const isSelected = selection && selection.kind === "inv" && selection.key === i;
        return `
            <div class="slot ${def ? "filled" : ""} ${isSelected ? "selected" : ""}" data-index="${i}" draggable="${def ? "true" : "false"}">
                ${def ? `<span>${def.icon}</span>` : ""}
                ${def && def.stackable && slotItem.qty > 1 ? `<span class="qty-badge">${slotItem.qty}</span>` : ""}
            </div>`;
    }).join("");

    const hpRatio = Math.max(0, player.hp / player.maxHp);
    statsReadoutEl.innerHTML = `
        <div class="hp-bar-bg"><div class="hp-bar-fill" style="width:${hpRatio * 100}%"></div></div>
        <div>HP <b>${Math.ceil(player.hp)}/${player.maxHp}</b></div>
        <div>Attack <b>${player.attack}</b> &nbsp; Defense <b>${player.defense}</b></div>
        <div>Speed <b>${player.speed}</b></div>
    `;

    renderTooltipAndActions();
}

function renderTooltipAndActions() {
    if (!selection) {
        tooltipEl.innerHTML = "Click an item to inspect it. Drag items to equip, or onto other slots to swap.";
        actionsEl.innerHTML = "";
        return;
    }

    let id, isEquipped = false, slotType = null, invIndex = null, qty = null;
    if (selection.kind === "equip") {
        slotType = selection.key;
        id = equipment[slotType];
        isEquipped = true;
    } else {
        invIndex = selection.key;
        const s = inventory[invIndex];
        id = s ? s.id : null;
        qty = s ? s.qty : null;
    }

    if (!id) {
        tooltipEl.innerHTML = "Empty slot.";
        actionsEl.innerHTML = "";
        return;
    }

    const def = ITEM_DEFS[id];
    const statLines = [];
    if (def.stats) {
        if (def.stats.attack) statLines.push(`+${def.stats.attack} Attack`);
        if (def.stats.defense) statLines.push(`+${def.stats.defense} Defense`);
        if (def.stats.speed) statLines.push(`+${def.stats.speed} Speed`);
    }
    if (def.effect && def.effect.heal) statLines.push(`Restores ${def.effect.heal} HP`);

    tooltipEl.innerHTML = `<b>${def.icon} ${def.name}</b>${qty > 1 ? ` x${qty}` : ""}<br>${def.description}${statLines.length ? `<br>${statLines.join(" · ")}` : ""}`;

    const buttons = [];
    if (isEquipped) {
        buttons.push(`<button data-action="unequip" data-slot="${slotType}">Unequip</button>`);
    } else {
        if (def.slot) buttons.push(`<button data-action="equip" data-index="${invIndex}">Equip</button>`);
        if (def.type === "consumable") buttons.push(`<button data-action="use" data-index="${invIndex}">Use</button>`);
        buttons.push(`<button class="secondary" data-action="drop" data-index="${invIndex}">Drop</button>`);
    } 
    actionsEl.innerHTML = buttons.join("");
}

actionsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "equip") equipFromInventory(parseInt(btn.dataset.index, 10));
    else if (action === "unequip") unequipSlot(btn.dataset.slot);
    else if (action === "use") useFromInventory(parseInt(btn.dataset.index, 10));
    else if (action === "drop") dropFromInventory(parseInt(btn.dataset.index, 10));
});

invGridEl.addEventListener("click", (e) => {
    const el = e.target.closest(".slot");
    if (!el) return;
    selection = { kind: "inv", key: parseInt(el.dataset.index, 10) };
    renderInventoryUI();
});

equipSlotsEl.addEventListener("click", (e) => {
    const el = e.target.closest(".equip-slot");
    if (!el) return;
    selection = { kind: "equip", key: el.dataset.slot };
    renderInventoryUI();
});

function attachDragEvents(containerEl, kind, selector) {
    containerEl.addEventListener("dragstart", (e) => {
        const el = e.target.closest(selector);
        if (!el || el.getAttribute("draggable") !== "true") { e.preventDefault(); return; }
        const key = kind === "inv" ? parseInt(el.dataset.index, 10) : el.dataset.slot;
        dragSource = { kind, key };
        e.dataTransfer.effectAllowed = "move";
    });
    containerEl.addEventListener("dragover", (e) => {
        e.preventDefault();
        const el = e.target.closest(selector);
        if (el) el.classList.add("drag-over");
    });
    containerEl.addEventListener("dragleave", (e) => {
        const el = e.target.closest(selector);
        if (el) el.classList.remove("drag-over");
    });
    containerEl.addEventListener("drop", (e) => {
        e.preventDefault();
        const el = e.target.closest(selector);
        if (!el || !dragSource) return;
        const targetKey = kind === "inv" ? parseInt(el.dataset.index, 10) : el.dataset.slot;
        handleDrop(dragSource, { kind, key: targetKey });
        dragSource = null;
    });
}
attachDragEvents(invGridEl, "inv", ".slot");
attachDragEvents(equipSlotsEl, "equip", ".equip-slot");

function handleDrop(source, target) {
    if (source.kind === "inv" && target.kind === "inv") {
        if (source.key !== target.key) swapInventorySlots(source.key, target.key);
    } else if (source.kind === "inv" && target.kind === "equip") {
        const s = inventory[source.key];
        if (s && ITEM_DEFS[s.id].slot === target.key) equipFromInventory(source.key);
        else showToast("That doesn't go there.");
    } else if (source.kind === "equip" && target.kind === "inv") {
        unequipSlot(source.key);
    }
}

overlayEl.addEventListener("click", (e) => {
    if (e.target === overlayEl) toggleInventory(false);
});

function toggleInventory(force) {
    UI.inventoryOpen = typeof force === "boolean" ? force : !UI.inventoryOpen;
    overlayEl.classList.toggle("hidden", !UI.inventoryOpen);
    if (UI.inventoryOpen) {
        if (UI.journalOpen && typeof toggleJournal === "function") toggleJournal(false);
        selection = null;
        renderInventoryUI();
    }
}

window.addEventListener("keydown", (e) => {
    if (!UI.gameStarted) return;
    const k = e.key.toLowerCase();
    if (k === "tab") { e.preventDefault(); toggleInventory(); }
    else if (k === "escape" && UI.inventoryOpen) toggleInventory(false);
});

inventory[0] = { id: "healthPotion", qty: 1 };
recalcPlayerStats();
renderInventoryUI();