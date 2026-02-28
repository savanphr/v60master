let totalSeconds = 0,
  timerInterval = null,
  audioCtx = null,
  targetSecondsForPhase = 0;
let durations = JSON.parse(localStorage.getItem("v60_durations")) || {
  1: 30,
  2: 30,
  3: 60,
  4: 999
};
let currentTheme = localStorage.getItem("v60_theme") || "light";

// --- INITIALISATION ---
(function init() {
  applyTheme(currentTheme);
  updateBadges();

  // Remplissage des inputs paramètres
  const i1 = document.getElementById("input-dur-1"),
    i2 = document.getElementById("input-dur-2"),
    i3 = document.getElementById("input-dur-3");
  if (i1) i1.value = durations[1];
  if (i2) i2.value = durations[2];
  if (i3) i3.value = durations[3];
})();

// --- GESTION DES MODALS & RÉGLAGES ---
function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function saveSettings() {
  durations[1] = parseInt(document.getElementById("input-dur-1").value) || 30;
  durations[2] = parseInt(document.getElementById("input-dur-2").value) || 30;
  durations[3] = parseInt(document.getElementById("input-dur-3").value) || 60;
  localStorage.setItem("v60_durations", JSON.stringify(durations));
  updateBadges();
}

function updateBadges() {
  [1, 2, 3].forEach((i) => {
    const b = document.getElementById(`badge-${i}`);
    if (b) b.textContent = durations[i] + "s";
  });
}

// --- THÈME (CLAIR / SOMBRE) ---
function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  localStorage.setItem("v60_theme", currentTheme);
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  document.body.className = theme;
  const dot = document.getElementById("toggle-dot"),
    bg = document.getElementById("theme-toggle");
  if (dot) dot.style.left = theme === "dark" ? "26px" : "4px";
  if (bg) bg.style.backgroundColor = theme === "dark" ? "#d97706" : "#a8a29e";
}

// --- LOGIQUE DU TIMER ---
function playBeep() {
  try {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator(),
      gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {}
}


function startPhase(id) {
  // Initialiser l'audio au premier clic (requis par iOS/Chrome)
  if (!audioCtx)
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();

  // UI : Highlight de l'étape active
  document.querySelectorAll('[id^="step-"]').forEach((el) => {
    el.classList.add("opacity-40");
    el.classList.remove("step-active");
  });
  document.getElementById("step-" + id).classList.remove("opacity-40");
  document.getElementById("step-" + id).classList.add("step-active");

  // Activer la vapeur
  document
    .getElementById("steam-icon")
    .classList.add("animate-steam", "opacity-100");

  // Cacher le bouton "Démarrer" de l'étape en cours
  document.getElementById("btn-" + id).classList.add("hidden");

  targetSecondsForPhase = totalSeconds + durations[id];

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    totalSeconds++;
    updateDisplay();

    // Arrêt automatique si on atteint la durée cible (sauf pour l'étape 4 qui est libre)
    if (totalSeconds >= targetSecondsForPhase && id < 4) {
      stopTimer(id);
    }
  }, 1000);
}

function stopTimer(currentPhaseId) {
  clearInterval(timerInterval);
  timerInterval = null;
  playBeep();

  // Stopper la vapeur
  document
    .getElementById("steam-icon")
    .classList.remove("animate-steam", "opacity-100");

  // Débloquer l'étape suivante
  const nextPhaseId = currentPhaseId + 1;
  const nextBtn = document.getElementById("btn-" + nextPhaseId);

  if (nextBtn) {
    nextBtn.disabled = false;
    // Correction de la couleur : On passe en orange vif sans transparence
    nextBtn.classList.remove("btn-inactive");
    nextBtn.classList.add("btn-vibrant");
    nextBtn.style.opacity = "1";
  }
}

function updateDisplay() {
  const mins = Math.floor(totalSeconds / 60),
    secs = totalSeconds % 60;
  document.getElementById(
    "main-timer"
  ).textContent = `${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function resetApp() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  totalSeconds = 0;
  updateDisplay();

  // Reset vapeur
  document
    .getElementById("steam-icon")
    .classList.remove("animate-steam", "opacity-100");

  // Reset visuel des étapes (Étape 1 active, les autres opaques)
  document.querySelectorAll('[id^="step-"]').forEach((el, i) => {
    el.classList.add("opacity-40");
    el.classList.remove("step-active");
    if (i === 0) {
      el.classList.remove("opacity-40");
      el.classList.add("step-active");
    }
  });

  // Reset des boutons (Bouton 1 vif, les autres grisés)
  document.querySelectorAll('button[id^="btn-"]').forEach((btn, i) => {
    btn.classList.remove("hidden");
    btn.style.opacity = ""; // On reset le style en ligne pour laisser le CSS agir
    if (i === 0) {
      btn.disabled = false;
      btn.classList.remove("btn-inactive");
      btn.classList.add("btn-vibrant");
    } else {
      btn.disabled = true;
      btn.classList.remove("btn-vibrant");
      btn.classList.add("btn-inactive");
    }
  });
}

function shareRecipe() {
  const text = `☕️ Ma Recette V60 Master :\n1. Bloom : ${durations[1]}s\n2. Versage 1 : ${durations[2]}s\n3. Versage 2 : ${durations[3]}s\nÀ tester !`;
  if (navigator.share) {
    navigator.share({ title: "V60 Master", text: text }).catch(() => {});
  } else {
    alert("Recette prête à être copiée :\n\n" + text);
  }
}
