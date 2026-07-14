"use strict";

const RECIPES = [
    {
        id: "greaterHealthPotion",
        resultId: "greaterHealthPotion",
        resultQty: 1,
        ingredients: [{ id: "wildHerb", qty: 2 }, { id: "silverLeaf", qty: 1 }],
        description: "A stronger draught. Restores 70 HP.",
    },
    {
        id: "thornforgedBlade",
        resultId: "thornforgedBlade",
        resultQty: 1,
        ingredients: [{ id: "ironSword", qty: 1 }, { id: "thornSpike", qty: 3 }, { id: "corruptedSap", qty: 1 }],
        description: "Reforges an Iron Sword around a corrupted thorn core. Considerably sharper.",
    },
    {
        id: "wardingSalve",
        resultId: "wardingSalve",
        resultQty: 1,
        ingredients: [{ id: "corruptedSap", qty: 2 }, { id: "wildHerb", qty: 1 }],
        description: "Heals a little, and wards off harm entirely for a few moments.",
    },
];

function canCraft(recipe) {
    return recipe.ingredients.every((ing) => totalItemAvailable(ing.id) >= ing.qty);
}

function craftItem(recipeId) {
    const recipe = RECIPES.find((r) => r.id === recipeId);
    if (!recipe || !canCraft(recipe)) return false;

    for (const ing of recipe.ingredients) {
        consumeItemAnywhere(ing.id, ing.qty);
    }

    addItemToInventory(recipe.resultId, recipe.resultQty);
    const resultDef = ITEM_DEFS[recipe.resultId];
    showToast(`Crafted ${resultDef.icon} ${resultDef.name}`);

    if (resultDef.slot && !equipment[resultDef.slot]) {
        const idx = inventory.findIndex((s) => s && s.id === recipe.resultId);
        if (idx !== -1) equipFromInventory(idx);
    }

    renderCraftingUI();
    if (UI.inventoryOpen) renderInventoryUI();
    return true;
}

const craftingOverlayEl = document.getElementById("craftingOverlay");
const recipeListEl = document.getElementById("recipeList");

function renderCraftingUI() {
    recipeListEl.innerHTML = RECIPES.map((recipe) => {
        const resultDef = ITEM_DEFS[recipe.resultId];
        const craftable = canCraft(recipe);
        const ingredientsHtml = recipe.ingredients.map((ing) => {
            const def = ITEM_DEFS[ing.id];
            const have = totalItemAvailable(ing.id);
            const ok = have >= ing.qty;
            return `<span class="recipe-ingredient ${ok ? "" : "insufficient"}">${def.icon} ${have}/${ing.qty}</span>`;
        }).join("");

        return `
            <div class="recipe-card ${craftable ? "" : "locked"}">
                <div class="recipe-icon">${resultDef.icon}</div>
                <div class="recipe-info">
                    <div class="recipe-name">${resultDef.name}</div>
                    <div class="recipe-desc">${recipe.description}</div>
                    <div class="recipe-ingredients">${ingredientsHtml}</div>
                </div>
                <button class="tool-btn recipe-craft-btn" data-recipe="${recipe.id}" ${craftable ? "" : "disabled"}>Craft</button>
            </div>`;
    }).join("");
}

recipeListEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".recipe-craft-btn");
    if (!btn || btn.disabled) return;
    craftItem(btn.dataset.recipe);
});

craftingOverlayEl.addEventListener("click", (e) => {
    if (e.target === craftingOverlayEl) toggleCrafting(false);
});

function toggleCrafting(force) {
    UI.craftingOpen = typeof force === "boolean" ? force : !UI.craftingOpen;
    craftingOverlayEl.classList.toggle("hidden", !UI.craftingOpen);
    if (UI.craftingOpen) {
        if (UI.inventoryOpen) toggleInventory(false);
        if (UI.journalOpen) toggleJournal(false);
        if (UI.shopOpen && typeof toggleShop === "function") toggleShop(false);
        renderCraftingUI();
    }
}

window.addEventListener("keydown", (e) => {
    if (!UI.gameStarted || UI.dialogueOpen) return;
    const k = e.key.toLowerCase();
    if (k === "c") { e.preventDefault(); toggleCrafting(); }
    else if (k === "escape" && UI.craftingOpen) toggleCrafting(false);
});