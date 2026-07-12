"use strict";

player.level = 1;
player.xp = 0;
player.perks = new Set();

const PERKS = {
    3: { id: "thickenedHide", name: "Thickened Hide", desc: "The blows still land, but they don't sink in the way they used to. +5 Defense, permanently." },
    5: { id: "quickHands", name: "Quick Hands", desc: "Your swing recovers faster than it used to. 20% shorter attack cooldown." },
};

function xpToNext(level) {
    return 20 + (level - 1) * 15;
}

function addXP(amount) {
    player.xp += amount;
    spawnDamagePopup(player.x + player.w / 2, player.y - 4, `+${amount} XP`, "#7fae5a");

    while (player.xp >= xpToNext(player.level)) {
        player.xp -= xpToNext(player.level);
        levelUp();
    }

    if (UI.inventoryOpen) renderInventoryUI();
}

function levelUp() {
    player.level += 1;
    recalcPlayerStats();
    player.hp = player.maxHp;

    showToast(`Level up! You are now level ${player.level}.`);
    spawnDamagePopup(player.x + player.w / 2, player.y - 22, "LEVEL UP!", "#f2d98a");

    const perk = PERKS[player.level];
    if (perk) {
        player.perks.add(perk.id);
        recalcPlayerStats();
        showToast(`New perk: ${perk.name}`);
        addLoreEntry(`perk-${perk.id}`, `New Perk: ${perk.name}`, [perk.desc]);
    }
}

function hasPerk(id) {
    return player.perks.has(id);
}