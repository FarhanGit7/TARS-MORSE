
// ============================================
// TARS MORSE CODE TRANSLATOR
// ============================================


// MORSE DICTIONARY

const morseCode = {
    A: ".-", B: "-...", C: "-.-.", D: "-..",
    E: ".", F: "..-.", G: "--.", H: "....",
    I: "..", J: ".---", K: "-.-", L: ".-..",
    M: "--", N: "-.", O: "---", P: ".--.",
    Q: "--.-", R: ".-.", S: "...", T: "-",
    U: "..-", V: "...-", W: ".--", X: "-..-",
    Y: "-.--", Z: "--..",

    0: "-----", 1: ".----", 2: "..---",
    3: "...--", 4: "....-", 5: ".....",
    6: "-....", 7: "--...", 8: "---..",
    9: "----.",

    ".": ".-.-.-", ",": "--..--", "?": "..--..",
    "!": "-.-.--", "'": ".----.", "/": "-..-.",
    "(": "-.--.", ")": "-.--.-", "&": ".-...",
    ":": "---...", ";": "-.-.-.", "=": "-...-",
    "+": ".-.-.", "-": "-....-", "_": "..--.-",
    "$": "...-..-", "@": ".--.-."
};


// REVERSE DICTIONARY

const reverseMorse = {};

for (const character in morseCode) {
    reverseMorse[morseCode[character]] = character;
}


// HTML ELEMENTS

const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");

const encodeMode = document.getElementById("encodeMode");
const decodeMode = document.getElementById("decodeMode");

const inputLabel = document.getElementById("inputLabel");

const clearBtn = document.getElementById("clearBtn");
const copyBtn = document.getElementById("copyBtn");

const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");

const speakBtn = document.getElementById("speakBtn");
const speakMorseBtn = document.getElementById("speakMorseBtn");

const voiceSelect = document.getElementById("voiceSelect");
const voiceStatus = document.getElementById("voiceStatus");

const signalBars = document.getElementById("signalBars");
const signalStatus = document.getElementById("signalStatus");

const toast = document.getElementById("toast");


// CURRENT MODE

let currentMode = "encode";


// ENCODE

function encodeMorse(text) {

    return text
        .toUpperCase()
        .split("")
        .map(character => {

            if (character === " ") return "/";

            return morseCode[character] || "?";

        })
        .join(" ");

}


// DECODE

function decodeMorse(code) {

    if (!code.trim()) return "";

    return code
        .trim()
        .split(/\s*\/\s*|\s{3,}/)
        .map(word => {

            return word
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .map(symbol => reverseMorse[symbol] || "?")
                .join("");

        })
        .join(" ");

}


// TRANSLATE

function translate() {

    const text = inputText.value.trim();

    if (!text) {
        outputText.textContent =
            "Your translated message will appear here...";
        return;
    }

    outputText.textContent =
        currentMode === "encode"
            ? encodeMorse(text)
            : decodeMorse(text);

}


// MODE SWITCHING

function setMode(mode) {

    currentMode = mode;

    encodeMode.classList.toggle("active", mode === "encode");
    decodeMode.classList.toggle("active", mode === "decode");

    if (mode === "encode") {
        inputLabel.textContent = "INPUT MESSAGE";
        inputText.placeholder = "Enter your English message...";
    } else {
        inputLabel.textContent = "INPUT MORSE CODE";
        inputText.placeholder = "Example: .... . .-.. .-.. ---";
    }

    translate();

}

encodeMode.addEventListener("click", () => setMode("encode"));
decodeMode.addEventListener("click", () => setMode("decode"));

inputText.addEventListener("input", translate);


// CLEAR

clearBtn.addEventListener("click", () => {

    inputText.value = "";

    outputText.textContent =
        "Your translated message will appear here...";

    stopAll();

    signalStatus.textContent = "AWAITING TRANSMISSION";

    showToast("TERMINAL CLEARED");

});


// COPY

copyBtn.addEventListener("click", async () => {

    const result = outputText.textContent;

    if (!result ||
        result === "Your translated message will appear here...") {
        showToast("NOTHING TO COPY");
        return;
    }

    try {
        await navigator.clipboard.writeText(result);
        showToast("MESSAGE COPIED");
    } catch (error) {
        showToast("COPY FAILED - USE LOCALHOST");
    }

});


// TOAST

let toastTimer;

function showToast(message) {

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);

}


// ============================================
// VOICE OUTPUT
// ============================================

let availableVoices = [];

function loadVoices() {

    if (!("speechSynthesis" in window)) {
        voiceStatus.textContent = "Voice is not supported.";
        return;
    }

    availableVoices = speechSynthesis.getVoices();

    voiceSelect.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Default system voice";

    voiceSelect.appendChild(defaultOption);

    availableVoices.forEach((voice, index) => {

        const option = document.createElement("option");

        option.value = index;
        option.textContent = `${voice.name} (${voice.lang})`;

        voiceSelect.appendChild(option);

    });

}

if ("speechSynthesis" in window) {

    loadVoices();

    speechSynthesis.onvoiceschanged = loadVoices;

}


// STOP VOICE

function stopVoice() {

    if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
    }

}


// SPEAK TEXT

function speakText(text, rate = 0.9) {

    if (!("speechSynthesis" in window)) {
        showToast("VOICE NOT SUPPORTED");
        return;
    }

    if (!text || !text.trim()) {
        showToast("NO MESSAGE TO SPEAK");
        return;
    }

    speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    const selectedIndex = voiceSelect.value;

    if (selectedIndex !== "") {

        speech.voice = availableVoices[Number(selectedIndex)];

    } else {

        const englishVoice = availableVoices.find(voice =>
            voice.lang.toLowerCase().startsWith("en")
        );

        if (englishVoice) speech.voice = englishVoice;

    }

    speech.lang = "en-US";
    speech.rate = rate;
    speech.pitch = 0.85;
    speech.volume = 1;

    speech.onstart = () => {
        voiceStatus.textContent = "TARS IS SPEAKING...";
    };

    speech.onend = () => {
        voiceStatus.textContent = "VOICE TRANSMISSION COMPLETED.";
    };

    speech.onerror = () => {
        voiceStatus.textContent = "VOICE PLAYBACK ERROR.";
    };

    speechSynthesis.speak(speech);

}


// SPEAK ENGLISH

speakBtn.addEventListener("click", () => {

    const message = currentMode === "encode"
        ? inputText.value
        : decodeMorse(inputText.value);

    speakText(message);

});


// SPEAK MORSE

speakMorseBtn.addEventListener("click", () => {

    const code = currentMode === "encode"
        ? encodeMorse(inputText.value)
        : inputText.value.trim();

    const spokenCode = code
        .replace(/\//g, " word break ")
        .replace(/\./g, " dot ")
        .replace(/-/g, " dash ")
        .replace(/\?/g, " unknown symbol ");

    speakText(spokenCode, 0.85);

});


// ============================================
// MORSE BEEP TRANSMISSION
// ============================================

let audioContext = null;
let transmissionToken = 0;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getMorseForAudio() {

    return currentMode === "encode"
        ? encodeMorse(inputText.value)
        : inputText.value.trim();

}


async function playTone(duration, token) {

    if (token !== transmissionToken) return;

    try {

        if (!audioContext) {
            audioContext = new (
                window.AudioContext ||
                window.webkitAudioContext
            )();
        }

        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = 650;

        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);

        gain.gain.exponentialRampToValueAtTime(
            0.25,
            audioContext.currentTime + 0.01
        );

        gain.gain.setValueAtTime(
            0.25,
            audioContext.currentTime + duration / 1000 - 0.01
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + duration / 1000
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(
            audioContext.currentTime + duration / 1000
        );

        await sleep(duration);

    } catch (error) {
        console.error("Audio error:", error);
    }

}


async function transmitMorse() {

    const code = getMorseForAudio();

    if (!code) {
        showToast("NO MESSAGE TO TRANSMIT");
        return;
    }

    stopTransmission();

    const token = transmissionToken;

    playBtn.disabled = true;

    signalBars.classList.add("active");
    signalStatus.textContent = "TRANSMITTING SIGNAL...";

    for (const symbol of code) {

        if (token !== transmissionToken) break;

        if (symbol === ".") {
            await playTone(120, token);
            await sleep(100);
        } else if (symbol === "-") {
            await playTone(360, token);
            await sleep(100);
        } else if (symbol === " ") {
            await sleep(180);
        } else if (symbol === "/") {
            await sleep(450);
        }

    }

    if (token === transmissionToken) {
        signalStatus.textContent = "TRANSMISSION COMPLETED";
        showToast("SIGNAL TRANSMITTED");
    }

    playBtn.disabled = false;
    signalBars.classList.remove("active");

}


function stopTransmission() {

    transmissionToken++;

    playBtn.disabled = false;

    signalBars.classList.remove("active");

    signalStatus.textContent = "TRANSMISSION STOPPED";

}


playBtn.addEventListener("click", transmitMorse);


// STOP EVERYTHING

function stopAll() {

    stopTransmission();
    stopVoice();

}


stopBtn.addEventListener("click", () => {

    stopAll();

    showToast("ALL TRANSMISSIONS STOPPED");

});


// INITIALIZE

setMode("encode");

signalStatus.textContent = "AWAITING TRANSMISSION";

console.log("TARS SYSTEM ONLINE");
