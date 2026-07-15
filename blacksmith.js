"use strict";

const UPGRADES = [
    {
        id: "upgradeArmor",
        resultId: "reinforcedLeatherArmor",
        requirements: [
            { id: "leatherArmor", qty: 1 },
            { id: "thornSpike", qty: 3 },
            { id: "silverLeaf", qty: 1 },
            { id: "goldCoin", qty: 12 },
        ],
        description: "Reinforces Leather Armor with thorn-hardened stitching. +9 Defense total.",
    },
    {
        id: "upgradeHelm",
        resultId: "wardedHelm",
        requirements: [
            { id: "ironHelm", qty: 1 },
            { id: "corruptedSap", qty: 2 },
            { id: "goldCoin", qty: 15 },
        ],
        description: "Wards an Iron Helm against the corruption itself. +5 Defense total.",
    },
    {
        id: "upgradeBoots",
        resultId: "windrunnerBoots",
        requirements: [
            { id: "swiftBoots", qty: 1 },
            { id: "thornSpike", qty: 2 },
            { id: "silverLeaf", qty: 1 },
            { id: "goldCoin", qty: 10 },
        ],
        description: "Lightens Swift Boots further, until they barely touch the ground. +2 Defense, +70 Speed total.",
    },
    {
        id: "upgradeWeapon",
        resultId: "emberthornBlade",
        requirements: [
            { id: "thornforgedBlade", qty: 1 },
            { id: "corruptedSap", qty: 3 },
            { id: "goldCoin", qty: 25 },
        ],
        description: "Tempers a Thornforged Blade in corrupted sap until it runs hot. +18 Attack total.",
    },
];

function canUpgrade(upgrade) {
    return upgrade.requirements.every((req) => totalItemAvailable(req.id) >= req.qty);
}

function performUpgrade(upgradeId) {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId);
    if (!upgrade || !canUpgrade(upgrade)) return false;

    for (const req of upgrade.requirements) {
        consumeItemAnywhere(req.id, req.qty);
    }

    addItemToInventory(upgrade.resultId, 1);
    const resultDef = ITEM_DEFS[upgrade.resultId];
    showToast(`Upgraded to ${resultDef.icon} ${resultDef.name}`);

    if (resultDef.slot && !equipment[resultDef.slot]) {
        const idx = inventory.findIndex((s) => s && s.id === upgrade.resultId);
        if (idx !== -1) equipFromInventory(idx);
    }

    renderBlacksmithUI();
    if (UI.inventoryOpen) renderInventoryUI();
    return true;
}

const blacksmithOverlayEl = document.getElementById("blacksmithOverlay");
const upgradeListEl = document.getElementById("upgradeList");

function renderBlacksmithUI() {
    upgradeListEl.innerHTML = UPGRADES.map((upgrade) => {
        const resultDef = ITEM_DEFS[upgrade.resultId];
        const upgradable = canUpgrade(upgrade);
        const reqsHtml = upgrade.requirements.map((req) => {
            const def = ITEM_DEFS[req.id];
            const have = totalItemAvailable(req.id);
            const ok = have >= req.qty;
            return `<span class="recipe-ingredient ${ok ? "" : "insufficient"}">${def.icon} ${have}/${req.qty}</span>`;
        }).join("");

        return `
            <div class="recipe-card ${upgradable ? "" : "locked"}">
                <div class="recipe-icon">${resultDef.icon}</div>
                <div class="recipe-info">
                    <div class="recipe-name">${resultDef.name}</div>
                    <div class="recipe-desc">${upgrade.description}</div>
                    <div class="recipe-ingredients">${reqsHtml}</div>
                </div>
                <button class="tool-btn recipe-craft-btn" data-upgrade="${upgrade.id}" ${upgradable ? "" : "disabled"}>Upgrade</button>
            </div>`;
    }).join("");
}

upgradeListEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".recipe-craft-btn");
    if (!btn || btn.disabled) return;
    performUpgrade(btn.dataset.upgrade);
});

blacksmithOverlayEl.addEventListener("click", (e) => {
    if (e.target === blacksmithOverlayEl) toggleBlacksmith(false);
});

function toggleBlacksmith(force) {
    UI.blacksmithOpen = typeof force === "boolean" ? force : !UI.blacksmithOpen;
    blacksmithOverlayEl.classList.toggle("hidden", !UI.blacksmithOpen);
    if (UI.blacksmithOpen) {
        if (UI.inventoryOpen) toggleInventory(false);
        if (UI.journalOpen) toggleJournal(false);
        if (UI.craftingOpen) toggleCrafting(false);
        if (UI.shopOpen) toggleShop(false);
        renderBlacksmithUI();
    }
}

window.addEventListener("keydown", (e) => {
    if (!UI.gameStarted) return;
    if (e.key.toLowerCase() === "escape" && UI.blacksmithOpen) toggleBlacksmith(false);
});