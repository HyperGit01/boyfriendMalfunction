"use strict";

/* =========================================
   OPERATION: SAVE BHUMI
   Animated game engine
   ========================================= */

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

const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

const levelNames = {
    title: "LEVEL 00",
    boss: "LEVEL 01",
    repair: "LEVEL 02",
    apology: "SAVE POINT",
    final: "FINAL ROUND",
    ending: "GAME CLEAR"
};

let currentScreen = "title";
let dialogueTimer = null;
let repairTimers = [];
let typing = false;
let transitionLocked = false;


/* =========================================
   SCREEN NAVIGATION
   ========================================= */

function showScreen(screenName) {
    if (!screens[screenName]) {
        return;
    }

    stopTyping();
    clearRepairTimers();

    Object.entries(screens).forEach(([name, element]) => {
        const active = name === screenName;

        element.hidden = !active;
        element.classList.toggle("active", active);
    });

    currentScreen = screenName;
    levelIndicator.textContent = levelNames[screenName];

    window.scrollTo({
        top: 0,
        behavior: reducedMotion ? "auto" : "smooth"
    });
}


/* =========================================
   TYPEWRITER DIALOGUE
   ========================================= */

function stopTyping() {
    if (dialogueTimer !== null) {
        clearInterval(dialogueTimer);
        dialogueTimer = null;
    }

    typing = false;
}

function typeText(element, message, speed = 22) {
    stopTyping();

    if (reducedMotion) {
        element.textContent = message;
        return;
    }

    typing = true;
    element.textContent = "";

    let index = 0;

    dialogueTimer = setInterval(() => {
        if (!element.isConnected) {
            stopTyping();
            return;
        }

        index += 1;
        element.textContent = message.slice(0, index);

        if (index >= message.length) {
            stopTyping();
        }
    }, speed);
}


/* =========================================
   RESET GAME
   ========================================= */

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
    clearRepairTimers();

    progressFill.style.width = "0%";
    progressPercent.textContent = "0%";

    repairStatus.textContent = "PLEASE WAIT...";

    unlockCard.hidden = true;
    repairContinue.hidden = true;

    $("#terminalLines").innerHTML = "";
}

function startGame() {
    ArcadeSound.start();

    resetBoss();
    resetRepair();

    showScreen("boss");

    typeText(
        bossDialogue,
        "PLAYER 1 HAS ENTERED THE BATTLE. " +
        "His communication system was unfortunately offline."
    );
}


/* =========================================
   BOSS FIGHT
   ========================================= */

function replaceBossChoices(html) {
    bossChoices.innerHTML = html;
}

function chooseBossResponse(choice) {
    if (choice === "explain") {
        typeText(
            bossDialogue,
            'AKSHIT: "I genuinely fell asleep." ' +
            "SYSTEM: That explains what happened. " +
            "It does not automatically erase how it felt."
        );

        healthFill.style.width = "65%";
        healthNumber.textContent = "65 HP";

        replaceBossChoices(`
            <button class="btn btn-pink" data-action="admit">
                ACCEPT RESPONSIBILITY
            </button>

            <button class="btn btn-purple" data-action="skipBoss">
                SKIP TO APOLOGY
            </button>
        `);

        return;
    }

    if (choice === "admit") {
        typeText(
            bossDialogue,
            'AKSHIT: "I should have told you I was getting sleepy." ' +
            "SYSTEM: Accountability detected. " +
            "Communication skill +1."
        );

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


/* =========================================
   SYSTEM REPAIR ANIMATION
   ========================================= */

function clearRepairTimers() {
    repairTimers.forEach((timer) => {
        clearTimeout(timer);
        clearInterval(timer);
    });

    repairTimers = [];
}

function beginRepair() {
    resetRepair();
    showScreen("repair");

    const terminal = $("#terminalLines");

    const lines = [
        "> SCANNING COMMUNICATION SYSTEM...",
        "> GOODNIGHT PROTOCOL: NEEDS IMPROVEMENT",
        "> EMOTIONAL AWARENESS: UPDATING...",
        "> ACCOUNTABILITY MODULE: INSTALLED"
    ];

    const lineDelay = reducedMotion ? 0 : 500;

    lines.forEach((line, index) => {
        const paragraph = document.createElement("p");

        paragraph.textContent = line;
        paragraph.style.visibility = "hidden";

        terminal.appendChild(paragraph);

        const timer = setTimeout(() => {
            if (currentScreen !== "repair") {
                return;
            }

            paragraph.style.visibility = "visible";
        }, lineDelay * (index + 1));

        repairTimers.push(timer);
    });

    const totalDuration = reducedMotion ? 100 : 3000;
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
            const timer = setTimeout(() => {
                requestAnimationFrame(updateProgress);
            }, reducedMotion ? 0 : 30);

            repairTimers.push(timer);
            return;
        }

        finishRepair();
    }

    const timer = setTimeout(() => {
        requestAnimationFrame(updateProgress);
    }, lineDelay * lines.length + 100);

    repairTimers.push(timer);
}

function finishRepair() {
    ArcadeSound.unlock();

    progressFill.style.width = "100%";
    progressPercent.textContent = "100%";

    repairStatus.textContent =
        "UPDATE COMPLETE. ACTIONS STILL REQUIRED.";

    unlockCard.hidden = false;
    repairContinue.hidden = false;
}


/* =========================================
   APOLOGY AND FINAL ROUND
   ========================================= */

function openApology() {
    ArcadeSound.letter();

    showScreen("apology");
}

function openFinalRound() {
    showScreen("final");
}


/* =========================================
   FLOATING HEART CELEBRATION
   ========================================= */

function celebrateHearts() {
    if (reducedMotion) {
        return;
    }

    const colors = [
        "#ff4fa3",
        "#ff9acb",
        "#43e8ff",
        "#b68aff"
    ];

    const heartCount = 18;

    for (let i = 0; i < heartCount; i++) {
        const heart = document.createElement("span");

        heart.className = "celebration-heart";
        heart.textContent = i % 3 === 0 ? "♥" : "✦";
        heart.setAttribute("aria-hidden", "true");

        const startX = 5 + Math.random() * 90;
        const startY = 60 + Math.random() * 35;
        const drift = (Math.random() - 0.5) * 150;
        const rise = -(120 + Math.random() * 260);
        const duration = 1.8 + Math.random() * 1.5;
        const rotation = (Math.random() - 0.5) * 100;
        const size = 14 + Math.random() * 18;

        heart.style.setProperty("--start-x", startX + "vw");
        heart.style.setProperty("--start-y", startY + "vh");
        heart.style.setProperty("--drift-x", drift + "px");
        heart.style.setProperty("--rise-y", rise + "px");
        heart.style.setProperty("--heart-duration", duration + "s");
        heart.style.setProperty("--rotation", rotation + "deg");
        heart.style.setProperty("--heart-size", size + "px");

        heart.style.setProperty(
            "--heart-color",
            colors[Math.floor(Math.random() * colors.length)]
        );

        document.body.appendChild(heart);

        const removalTimer = setTimeout(() => {
            heart.remove();
        }, (duration + 0.3) * 1000);

        // Each heart removes itself after its animation.
        void removalTimer;
    }
}


/* =========================================
   ENDINGS
   ========================================= */

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

    ArcadeSound.celebrate();

    showScreen("ending");
    celebrateHearts();
}


/* =========================================
   BUTTON HANDLER
   ========================================= */

document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");

    if (!button || button.disabled) {
        return;
    }

    const parentScreen = button.closest(".screen");

    if (!parentScreen || parentScreen.hidden) {
        return;
    }

    const action = button.dataset.action;

    // Short selection sound for game-action buttons.
    ArcadeSound.click();

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
            console.warn("Unknown game action:", action);
    }
});


/* =========================================
   START
   ========================================= */

showScreen("title");


/* ==========================================
   RETRO 8-BIT SOUND ENGINE
   ========================================== */

const ArcadeSound = (() => {
    let audioContext = null;
    let masterVolume = 0.16;
    let muted = false;

    function initialize() {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
            return false;
        }

        if (!audioContext) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        return true;
    }

    function tone(frequency, duration, options = {}) {
        if (muted || !initialize()) {
            return;
        }

        const {
            type = "square",
            volume = 0.12,
            slideTo = null,
            delay = 0
        } = options;

        const startTime = audioContext.currentTime + delay;

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(
            frequency,
            startTime
        );

        if (slideTo !== null) {
            oscillator.frequency.exponentialRampToValueAtTime(
                Math.max(1, slideTo),
                startTime + duration
            );
        }

        gain.gain.setValueAtTime(0.0001, startTime);

        gain.gain.exponentialRampToValueAtTime(
            Math.max(0.0002, volume * masterVolume),
            startTime + 0.015
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            startTime + duration
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration + 0.02);
    }

    function playSequence(notes, gap = 0.12) {
        notes.forEach((note, index) => {
            tone(note.frequency, note.duration || 0.12, {
                type: note.type || "square",
                volume: note.volume ?? 0.12,
                slideTo: note.slideTo ?? null,
                delay: index * gap
            });
        });
    }

    // Button-selection beep.
    function click() {
        tone(620, 0.055, {
            volume: 0.08,
            type: "square",
            slideTo: 760
        });
    }

    // Start or restart jingle.
    function start() {
        playSequence([
            { frequency: 392, duration: 0.12 },
            { frequency: 523, duration: 0.12 },
            { frequency: 659, duration: 0.12 },
            { frequency: 784, duration: 0.22 }
        ], 0.13);
    }

    // Repair-completion power-up.
    function unlock() {
        playSequence([
            { frequency: 440, duration: 0.10 },
            { frequency: 554, duration: 0.10 },
            { frequency: 659, duration: 0.10 },
            { frequency: 880, duration: 0.25 }
        ], 0.10);
    }

    // Gentle apology-letter chime.
    function letter() {
        tone(523, 0.35, {
            type: "sine",
            volume: 0.10
        });

        tone(659, 0.45, {
            type: "sine",
            volume: 0.07,
            delay: 0.12
        });

        tone(784, 0.55, {
            type: "sine",
            volume: 0.05,
            delay: 0.24
        });
    }

    // Ending melody.
    function celebrate() {
        playSequence([
            { frequency: 523, duration: 0.14 },
            { frequency: 659, duration: 0.14 },
            { frequency: 784, duration: 0.14 },
            { frequency: 1047, duration: 0.30 }
        ], 0.15);
    }

    function toggleMute() {
        muted = !muted;
        return muted;
    }

    function isMuted() {
        return muted;
    }

    return {
        initialize,
        tone,
        click,
        start,
        unlock,
        letter,
        celebrate,
        toggleMute,
        isMuted
    };
})();


/* ==========================================
   SOUND TOGGLE BUTTON
   ========================================== */

function addSoundToggle() {
    if (document.getElementById("soundToggle")) {
        return;
    }

    const button = document.createElement("button");

    button.id = "soundToggle";
    button.type = "button";
    button.textContent = "♫ SOUND ON";

    button.setAttribute(
        "aria-label",
        "Mute sound effects"
    );

    button.style.cssText = `
        position: fixed;
        top: max(12px, env(safe-area-inset-top));
        right: max(12px, env(safe-area-inset-right));
        z-index: 9999;
        padding: 10px 12px;
        border: 2px solid #64faff;
        background: #11152f;
        color: #64faff;
        font-family: "VT323", monospace;
        font-size: 18px;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(100, 250, 255, 0.25);
    `;

    button.addEventListener("click", () => {
        const muted = ArcadeSound.toggleMute();

        button.textContent = muted
            ? "♫ SOUND OFF"
            : "♫ SOUND ON";

        button.setAttribute(
            "aria-label",
            muted
                ? "Enable sound effects"
                : "Mute sound effects"
        );

        if (!muted) {
            ArcadeSound.initialize();
            ArcadeSound.click();
        }
    });

    document.body.appendChild(button);
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        addSoundToggle
    );
} else {
    addSoundToggle();
}
