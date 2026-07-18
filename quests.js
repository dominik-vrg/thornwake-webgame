"use strict";

const QUEST_DEFS = {
    "mirela-herbs": {
        id: "mirela-herbs",
        title: "A Bitter Remedy",
        giver: "mirela",
        description: "Mirela needs Wild Herb to prepare a remedy against the corruption spreading from the grove.",
        objective: { type: "collect", itemId: "wildHerb", need: 5, label: "Wild Herb" },
        rewards: { xp: 25, items: [{ id: "healthPotion", qty: 1 }] },
    },
    "mirela-thornlings": {
        id: "mirela-thornlings",
        title: "Thin the Thorns",
        giver: "mirela",
        description: "Thornlings are trampling the herb beds faster than they can regrow. Clear some out near the grove.",
        objective: { type: "kill", enemyType: "thornling", need: 6, label: "Thornlings defeated" },
        rewards: { xp: 40, items: [{ id: "goldCoin", qty: 5 }] },
    },
};

function getQuestInstance(defId) {
    return journal.quests.find((q) => q.defId === defId) || null;
}

function getQuestStatus(defId) {
    const instance = getQuestInstance(defId);
    if (!instance) return "inactive";
    if (instance.status === "completed") return "completed";

    const obj = QUEST_DEFS[defId].objective;
    if (obj.type === "collect") {
        return instance.progress >= obj.need ? "ready" : "active";
    }
    if (obj.type === "kill") {
        return instance.progress >= obj.need ? "ready" : "active";
    }
    return instance.status;
}

function startQuest(defId) {
    if (getQuestInstance(defId)) return;
    const def = QUEST_DEFS[defId];
    const obj = def.objective;
    const initialProgress = obj.type === "collect" ? Math.min(obj.need, countItemInInventory(obj.itemId)) : 0;
    journal.quests.push({ defId, status: "active", progress: initialProgress });
    showToast(`New quest: ${def.title}`);
    if (UI.journalOpen) renderJournalUI();
}

function turnInQuest(defId) {
    if (getQuestStatus(defId) !== "ready") return false;

    const instance = getQuestInstance(defId);
    const def = QUEST_DEFS[defId];

    if (def.objective.type === "collect") {
        removeItemFromInventory(def.objective.itemId, def.objective.need);
    }
    instance.status = "completed";

    grantQuestRewards(def.rewards);
    showToast(`Quest complete: ${def.title}`);
    if (typeof playSfx === "function") playSfx("questComplete");
    if (typeof saveGame === "function") saveGame();
    if (UI.journalOpen) renderJournalUI();
    return true;
}

function grantQuestRewards(rewards) {
    if (rewards.xp) addXP(rewards.xp);
    if (rewards.items) {
        for (const it of rewards.items) addItemToInventory(it.id, it.qty);
    }
}

function updateQuestProgressForKill(enemyType) {
    let changed = false;
    for (const instance of journal.quests) {
        if (instance.status === "completed") continue;
        const obj = QUEST_DEFS[instance.defId].objective;
        if (obj.type === "kill" && obj.enemyType === enemyType && instance.progress < obj.need) {
            instance.progress++;
            changed = true;
            if (instance.progress >= obj.need) {
                showToast(`Objective complete: ${obj.label} (${instance.progress}/${obj.need})`);
            }
        }
    }
    if (changed && UI.journalOpen) renderJournalUI();
}

function updateQuestProgressForCollect(itemId, qtyAdded) {
    let changed = false;
    for (const instance of journal.quests) {
        if (instance.status === "completed") continue;
        const obj = QUEST_DEFS[instance.defId].objective;
        if (obj.type === "collect" && obj.itemId === itemId && instance.progress < obj.need) {
            const before = instance.progress;
            instance.progress = Math.min(obj.need, instance.progress + qtyAdded);
            changed = instance.progress !== before;
            if (instance.progress >= obj.need) {
                showToast(`Objective complete: ${obj.label} (${instance.progress}/${obj.need})`);
            }
        }
    }
    if (changed && UI.journalOpen) renderJournalUI();
}