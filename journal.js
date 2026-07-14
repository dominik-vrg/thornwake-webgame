"use strict";

const OPENING_NARRATION = [
    "For as long as anyone living can remember, Thornwake has slept.",
    "Three nights ago the ground split beneath the old grove, and the thorns began to move on their own.",
    "Something buried out there is waking up — and the forest is waking up with it.",
    "You were the only one who saw it happen. That makes this yours to deal with, whether you like it or not.",
    "Mirela, the village herbalist, may be the only person who understands what's spreading. Find her.",
];

const journal = {
    quests: [],
    lore: [],
};

function addLoreEntry(id, title, paragraphs) {
    if (journal.lore.some((e) => e.id === id)) return;
    journal.lore.push({ id, title, paragraphs });
    if (UI.journalOpen) renderJournalUI();
}

addLoreEntry("the-awakening", "The Awakening", OPENING_NARRATION);

//journal ui
const journalOverlayEl = document.getElementById("journalOverlay");
const journalTabsEl = document.getElementById("journalTabs");
const journalContentEl = document.getElementById("journalContent");

let journalTab = "quests";

const QUEST_STATUS_LABEL = {
    active: "In Progress",
    ready: "Ready to turn in!",
    completed: "Completed",
};

function questObjectiveLine(def, instance) {
    const obj = def.objective;
    if (obj.type === "collect") {
        const have = Math.min(obj.need, countItemInInventory(obj.itemId));
        return `${obj.label}: ${have}/${obj.need}`;
    }
    if (obj.type === "kill") {
        return `${obj.label}: ${instance.progress}/${obj.need}`;
    }
    return "";
}

function renderJournalUI() {
    for (const el of journalTabsEl.children) {
        el.classList.toggle("active", el.dataset.tab === journalTab);
    }

    if (journalTab === "quests") {
        const sorted = [...journal.quests].sort((a, b) => (a.status === "completed") - (b.status === "completed"));
        journalContentEl.innerHTML = sorted.length
            ? sorted.map((instance) => {
                const def = QUEST_DEFS[instance.defId];
                const status = getQuestStatus(instance.defId);
                return `
                    <div class="journal-entry quest-entry quest-${status}">
                        <div class="journal-entry-title">
                        ${def.title}
                        <span class="quest-status quest-status-${status}">${QUEST_STATUS_LABEL[status]}</span>
                        </div>
                    <div class="journal-entry-body">
                        <p>${def.description}</p>
                        <p class="quest-objective">${questObjectiveLine(def, instance)}</p>
                    </div>
                </div>`;
    }).join("")
            : `<div class="journal-empty">No active quests yet. Explore Thornwake and talk to its people to find work.</div>`;
    } else {
        journalContentEl.innerHTML = journal.lore.map((e) => `
            <div class="journal-entry">
                <div class="journal-entry-title">${e.title}</div>
                <div class="journal-entry-body">${e.paragraphs.map((p) => `<p>${p}</p>`).join("")}</div>
            </div>`).join("");
    }
}

journalTabsEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    journalTab = btn.dataset.tab;
    renderJournalUI();
});

journalOverlayEl.addEventListener("click", (e) => {
    if (e.target === journalOverlayEl) toggleJournal(false);
});

function toggleJournal(force) {
    UI.journalOpen = typeof force === "boolean" ? force : !UI.journalOpen;
    journalOverlayEl.classList.toggle("hidden", !UI.journalOpen);
    if (UI.journalOpen) {
        if (UI.inventoryOpen && typeof toggleInventory === "function") toggleInventory(false);
        if (UI.craftingOpen && typeof toggleCrafting === "function") toggleCrafting(false);
        if (UI.shopOpen && typeof toggleShop === "function") toggleShop(false);
        renderJournalUI();
    }
}

window.addEventListener("keydown", (e) => {
    if (!UI.gameStarted || UI.dialogueOpen) return;
    const k = e.key.toLowerCase();
    if (k === "j") { e.preventDefault(); toggleJournal(); }
    else if (k === "escape" && UI.journalOpen) toggleJournal(false);
});