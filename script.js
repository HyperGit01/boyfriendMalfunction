/* =========================================
   OPERATION: SAVE BHUMI
   Main game logic
   ========================================= */

"use strict";

const $ = (selector) => document.querySelector(selector);

const screens = {
    title: $("#titleScreen"),
    boss: $("#bossScreen"),
    repair: $("#repairScreen"),
    apology: $("#apologyScreen"),
    final: $("#finalScreen"),
    ending: $("#endingScreen")
};

const levelIndicator = $("#levelIndicator");

let currentScreen = "title";
let repairTimer = null;
let transitionLocked = false;

const bossDialogue = $("#bossDialogue");
const healthFill = $("#healthFill");
const healthNumber = $("#healthNumber");

const progressFill = $("#progressFill");
const progressPercent = $("#progressPercent");
const repairStatus = $("#repairStatus");
const unlockCard = $("#unlockCard");
const repairContinue = $("#repairContinue");

const endingLabel = $("#endingLabel");
const endingTitle = $("#endingTitle");
const endingMessage = $("#endingMessage");

const bossChoices = $("#bossScreen .choices");

const levelNames = {
    title: "LEVEL 00",
    boss: "LEVEL 01",
    repair: "LEVEL 02",
    apology: "SAVE POINT",
    final: "FINAL ROUND",
    ending: "GAME CLEAR"
};


/* -----------------------------------------
   SCREEN NAVIGATION
   ----------------------------------------- */

function showScreen(screenName) {
    if (!screens[screenName]) {
        console.error("Unknown screen:", screenName);
        return;
    }

    // Stop any previous screen's animation.
    clearTimeout(repairTimer);
    repairTimer = null;

    // Display exactly one screen.
    Object.entries(screens).forEach(([name, element]) => {
        const isActive = name === screenName;

        element.hidden = !isActive;
        element.classList.toggle("active", isActive);
    });

    currentScreen = screenName;

    levelIndicator.textContent = levelNames[screenName];

    // Return to the top whenever a new stage opens.
    window.scrollTo({
        top: 0,
        behavior: window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches ? "auto" : "smooth"
    });
}


/* -----------------------------------------
   RESET THE GAME
   ----------------------------------------- */

function resetBoss() {
    bossDialogue.textContent =
        "PLAYER 1 HAS ENTERED THE BATTLE. " +
        "His communication system was unfortunately offline.";

    healthFill.style.width = "100%";
    healthNumber.textContent = "100 HP";

    bossChoices.innerHTML = `
        <button class="btn btn-cyan" data-action="explain">
            [ A ] EXPLAIN YOURSELF
        </button>

        <button class="btn btn-pink" data-action="admit">
            [ B ] ADMIT THE MISTAKE
        </button>

        <button class="btn btn-purple" data-action="skipBoss">
            [ C ] SKIP TO APOLOGY
        </button>
    `;
}

function resetRepair() {
    progressFill.style.width = "0%";
    progressPercent.textContent = "0%";

    repairStatus.textContent = "PLEASE WAIT...";

    unlockCard.hidden = true;
    repairContinue.hidden = true;
}

function startGame() {
    resetBoss();
    resetRepair();

    showScreen("boss");
}


/* -----------------------------------------
   BOSS FIGHT
   ----------------------------------------- */

function chooseBossResponse(choice) {
    if (choice === "explain") {
        bossDialogue.textContent =
            'AKSHIT: "I genuinely fell asleep." ' +
            "SYSTEM: That explains what happened. " +
            "It does not automatically erase how it felt.";

        healthFill.style.width = "65%";
        healthNumber.textContent = "65 HP";

        replaceBossChoices(`
            <button class="btn btn-pink"
                    data-action="admit">
                ACCEPT RESPONSIBILITY
            </button>

            <button class="btn btn-purple"
                    data-action="skipBoss">
                SKIP TO APOLOGY
            </button>
        `);

        return;
    }

    if (choice === "admit") {
        bossDialogue.textContent =
            'AKSHIT: "I should have told you I was getting sleepy." ' +
            "SYSTEM: Accountability detected. " +
            "Communication skill +1.";

        healthFill.style.width = "25%";
        healthNumber.textContent = "25 HP";

        replaceBossChoices(`
            <button class="btn btn-cyan"
                    data-action="bossContinue">
                CONTINUE TO SYSTEM REPAIR ▶
            </button>
        `);

        return;
    }

    if (choice === "skipBoss") {
        beginRepair();
    }
}

function replaceBossChoices(html) {
    bossChoices.innerHTML = html;
}


/* -----------------------------------------
   SYSTEM REPAIR
   ----------------------------------------- */

function beginRepair() {
    resetRepair();
    showScreen("repair");

    const lines = [
        "> SCANNING COMMUNICATION SYSTEM...",
        "> GOODNIGHT PROTOCOL: NEEDS IMPROVEMENT",
        "> EMOTIONAL AWARENESS: UPDATING...",
        "> ACCOUNTABILITY MODULE: INSTALLED"
    ];

    const terminal = $("#terminalLines");

    // Reveal the diagnostic lines in sequence.
    terminal.innerHTML = "";

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const lineDelay = reducedMotion ? 0 : 420;

    lines.forEach((line, index) => {
        const paragraph = document.createElement("p");
        paragraph.textContent = line;
        paragraph.style.visibility = "hidden";

        terminal.appendChild(paragraph);

        repairTimer = setTimeout(() => {
            if (currentScreen !== "repair") {
                return;
            }

            paragraph.style.visibility = "visible";
        }, lineDelay * (index + 1));
    });

    const totalDuration = reducedMotion ? 100 : 3400;
    const startedAt = performance.now();

    function updateProgress(now) {
        if (currentScreen !== "repair") {
            return;
        }

        const elapsed = now - startedAt;
        const percentage = Math.min(
            100,
            Math.round((elapsed / totalDuration) * 100)
        );

        progressFill.style.width = percentage + "%";
        progressPercent.textContent = percentage + "%";

        if (percentage < 100) {
            repairTimer = setTimeout(() => {
                requestAnimationFrame(updateProgress);
            }, reducedMotion ? 0 : 35);

            return;
        }

        finishRepair();
    }

    repairTimer = setTimeout(() => {
        requestAnimationFrame(updateProgress);
    }, lineDelay * lines.length + 150);
}

function finishRepair() {
    progressFill.style.width = "100%";
    progressPercent.textContent = "100%";

    repairStatus.textContent =
        "UPDATE COMPLETE. ACTIONS STILL REQUIRED.";

    unlockCard.hidden = false;
    repairContinue.hidden = false;
}


/* -----------------------------------------
   APOLOGY AND FINAL ROUND
   ----------------------------------------- */

function openApology() {
    showScreen("apology");
}

function openFinalRound() {
    showScreen("final");
}


/* -----------------------------------------
   ENDINGS
   ----------------------------------------- */

function showEnding(type) {
    const endings = {
        forgive: {
            label: "ENDING 01 UNLOCKED",
            title: "A NEW BEGINNING",
            message:
                "Thank you for hearing me out, Bhumi. " +
                "I'll do my best to make my actions match my words."
        },

        upset: {
            label: "ENDING 02 UNLOCKED",
            title: "TAKE YOUR TIME",
            message:
                "That's okay, Bhumi. You don't have to stop " +
                "being upset just because I've apologised. " +
                "Take the time you need. I'm sorry I hurt you."
        },

        hug: {
            label: "BONUS ENDING UNLOCKED",
            title: "+1 VIRTUAL HUG",
            message:
                "Sending you the gentlest virtual hug, Bhumi. " +
                "Delivered with love by Akshit. No pressure—" +
                "just a hug, if you want one. ♥"
        }
    };

    const selectedEnding = endings[type];

    if (!selectedEnding) {
        return;
    }

    endingLabel.textContent = selectedEnding.label;
    endingTitle.textContent = selectedEnding.title;
    endingMessage.textContent = selectedEnding.message;

    showScreen("ending");
}


/* -----------------------------------------
   BUTTON HANDLER
   ----------------------------------------- */

// One event listener handles every game button,
// including buttons created later during the boss fight.

document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");

    if (!button || button.disabled) {
        return;
    }

    // Ignore clicks on hidden screens.
    if (!button.closest(".screen") ||
        button.closest(".screen").hidden) {
        return;
    }

    const action = button.dataset.action;

    switch (action) {
        case "start":
            startGame();
            break;

        case "explain":
            chooseBossResponse("explain");
            break;

        case "admit":
            chooseBossResponse("admit");
            break;

        case "skipBoss":
            chooseBossResponse("skipBoss");
            break;

        case "bossContinue":
            beginRepair();
            break;

        case "continueRepair":
            openApology();
            break;

        case "finalRound":
            openFinalRound();
            break;

        case "forgive":
            showEnding("forgive");
            break;

        case "upset":
            showEnding("upset");
            break;

        case "hug":
            showEnding("hug");
            break;

        case "restart":
            startGame();
            break;

        default:
            console.warn("Unknown action:", action);
    }
});


/* -----------------------------------------
   INITIALISE
   ----------------------------------------- */

showScreen("title");