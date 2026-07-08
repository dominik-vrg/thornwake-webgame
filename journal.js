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

function addQuest(quest) {
    journal.quests.push(quest);
    if (UI.journalOpen) renderJournalUI();
}

addLoreEntry("the-awakening", "The Awakening", OPENING_NARRATION);

//journal ui
const journalOverlayEl = document.getElementById("journalOverlay");
const journalTabsEl = document.getElementById("journalTabs");
const journalContentEl = document.getElementById("journalContent");

let journalTab = "quests";

function renderJournalUI() {
    for (const el of journalTabsEl.children) {
        el.classList.toggle("active", el.dataset.tab === journalTab);
    }

    if (journalTab === "quests") {
        journalContentEl.innerHTML = journal.quests.length
            ? journal.quests.map((q) => `
            <div class="journal-entry">
                <div class="journal-entry-title">${q.title}</div>
                    <div class="journal-entry-body">${q.description || ""}</div>
                </div>`).join("")
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
        renderJournalUI();
    }
}

window.addEventListener("keydown", (e) => {
    if (!UI.gameStarted || UI.dialogueOpen) return;
    const k = e.key.toLowerCase();
    if (k === "j") { e.preventDefault(); toggleJournal(); }
    else if (k === "escape" && UI.journalOpen) toggleJournal(false);
});