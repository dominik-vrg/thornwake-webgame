"use strict";

const SHOP_STOCK = [
    { id: "healthPotion", price: 8 },
    { id: "wildHerb", price: 3 },
    { id: "silverLeaf", price: 6 },
];

function getGoldCount() {
    return countItemInInventory("goldCoin");
}

function buyItem(itemId) {
    const stock = SHOP_STOCK.find((s) => s.id === itemId);
    if (!stock) return false;
    if (getGoldCount() < stock.price) { showToast("Not enough gold."); return false; }

    removeItemFromInventory("goldCoin", stock.price);
    addItemToInventory(itemId, 1);
    showToast(`Bought ${ITEM_DEFS[itemId].icon} ${ITEM_DEFS[itemId].name}`);
    renderShopUI();
    return true;
}

function sellItem(itemId, qty) {
    const def = ITEM_DEFS[itemId];
    if (!def || !def.value) return false;
    const have = countItemInInventory(itemId);
    const sellQty = Math.min(qty, have);
    if (sellQty <= 0) return false;

    removeItemFromInventory(itemId, sellQty);
    addItemToInventory("goldCoin", def.value * sellQty);
    showToast(`Sold ${sellQty}x ${def.icon} ${def.name} for ${def.value * sellQty} gold`);
    renderShopUI();
    if (UI.inventoryOpen) renderInventoryUI();
    return true;
}

const shopOverlayEl = document.getElementById("shopOverlay");
const shopTabsEl = document.getElementById("shopTabs");
const shopContentEl = document.getElementById("shopContent");
const shopGoldEl = document.getElementById("shopGold");

let shopTab = "buy";

function renderShopUI() {
    shopGoldEl.textContent = `Your Gold: ${getGoldCount()}`;

    for (const el of shopTabsEl.children) {
        el.classList.toggle("active", el.dataset.tab === shopTab);
    }

    if (shopTab === "buy") {
        shopContentEl.innerHTML = SHOP_STOCK.map((stock) => {
            const def = ITEM_DEFS[stock.id];
            const affordable = getGoldCount() >= stock.price;
            return `
                <div class="shop-card ${affordable ? "" : "locked"}">
                    <div class="shop-icon">${def.icon}</div>
                    <div class="shop-info">
                        <div class="shop-name">${def.name}</div>
                        <div class="shop-desc">${def.description}</div>
                    </div>
                    <div class="shop-price">${stock.price}g</div>
                    <button class="tool-btn shop-buy-btn" data-item="${stock.id}" ${affordable ? "" : "disabled"}>Buy</button>
                </div>`;
        }).join("");
    } else {
        const sellable = inventory
            .reduce((acc, slot) => {
                if (!slot) return acc;
                const def = ITEM_DEFS[slot.id];
                if (!def.value) return acc;
                const existing = acc.find((e) => e.id === slot.id);
                if (existing) existing.qty += slot.qty;
                else acc.push({ id: slot.id, qty: slot.qty });
                return acc;
            }, []);

        shopContentEl.innerHTML = sellable.length
            ? sellable.map((entry) => {
                const def = ITEM_DEFS[entry.id];
                const canSellAll = entry.qty > 1;
                return `
                    <div class="shop-card">
                        <div class="shop-icon">${def.icon}</div>
                        <div class="shop-info">
                            <div class="shop-name">${def.name} <span class="shop-have">x${entry.qty}</span></div>
                            <div class="shop-desc">Sells for ${def.value}g each</div>
                        </div>
                        <div class="shop-sell-actions">
                            <button class="tool-btn secondary shop-sell-btn" data-item="${entry.id}" data-qty="1">Sell 1</button>
                            ${canSellAll ? `<button class="tool-btn secondary shop-sell-btn" data-item="${entry.id}" data-qty="${entry.qty}">Sell All</button>` : ""}
                        </div>
                    </div>`;
            }).join("")
            : `<div class="journal-empty">Nothing worth selling right now.</div>`;
    }
}

shopContentEl.addEventListener("click", (e) => {
    const buyBtn = e.target.closest(".shop-buy-btn");
    if (buyBtn && !buyBtn.disabled) { buyItem(buyBtn.dataset.item); return; }

    const sellBtn = e.target.closest(".shop-sell-btn");
    if (sellBtn) sellItem(sellBtn.dataset.item, parseInt(sellBtn.dataset.qty, 10));
});

shopTabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    shopTab = btn.dataset.tab;
    renderShopUI();
});

shopOverlayEl.addEventListener("click", (e) => {
    if (e.target === shopOverlayEl) toggleShop(false);
});

function toggleShop(force) {
    UI.shopOpen = typeof force === "boolean" ? force : !UI.shopOpen;
    shopOverlayEl.classList.toggle("hidden", !UI.shopOpen);
    if (UI.shopOpen) {
        if (UI.inventoryOpen) toggleInventory(false);
        if (UI.journalOpen) toggleJournal(false);
        if (UI.craftingOpen) toggleCrafting(false);
        if (UI.blacksmithOpen && typeof toggleBlacksmith === "function") toggleBlacksmith(false);
        renderShopUI();
    }
}

window.addEventListener("keydown", (e) => {
    if (!UI.gameStarted) return;
    if (e.key.toLowerCase() === "escape" && UI.shopOpen) toggleShop(false);
});