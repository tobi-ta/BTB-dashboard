const VALID_USER = "admin";
const VALID_PASS = "btb2026";

// Small inline sound engine for login (respects sound_enabled flag from dashboard)
function playLoginSound(type) {
  if (localStorage.getItem("sound_enabled") !== "true") return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const play = (freq, wave, dur, gain, delay = 0) => {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(gain, now + 0.005);
      g.gain.linearRampToValueAtTime(0, now + dur);
      osc.connect(g).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    };
    if (type === "success") {
      play(523, "sine", 0.12, 0.14);
      play(659, "sine", 0.12, 0.14, 0.08);
      play(784, "sine", 0.2, 0.14, 0.16);
    } else {
      play(220, "sawtooth", 0.1, 0.12);
      play(180, "sawtooth", 0.14, 0.12, 0.07);
    }
  } catch (_) { /* noop */ }
}

if (localStorage.getItem("btb_logged_in") === "true") {
  window.location.href = "dashboard.html";
}

const form = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (username === VALID_USER && password === VALID_PASS) {
    localStorage.setItem("btb_logged_in", "true");
    localStorage.setItem("btb_username", username);
    playLoginSound("success");
    window.location.href = "dashboard.html";
  } else {
    errorMsg.textContent = "Invalid username or password.";
    usernameInput.classList.add("error");
    passwordInput.classList.add("error");
    passwordInput.value = "";
    passwordInput.focus();
    playLoginSound("error");
  }
});

[usernameInput, passwordInput].forEach((input) => {
  input.addEventListener("input", () => {
    input.classList.remove("error");
    errorMsg.textContent = "";
  });
});
