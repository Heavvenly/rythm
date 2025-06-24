let currentNotes = [];
let songData = null;
let startTime = null;
let animationId = null;
let score = 0;
let combo = 0;
let comboBonusThreshold = 15;
let recording = false; // not where you change this
let recordedNotes = [];
let totalNotes = 0;
let missedNotes = 0;
function toggleRecording() {
  recording = !recording;
  if (recording) {
    recordedNotes = [];
    console.log("🎙 Recording started...");
  } else {
    console.log("🛑 Recording stopped. Copy this into your song file:");
    console.log(JSON.stringify(recordedNotes, null, 2));
  }
}
// Record keypress events with timing
document.addEventListener("keydown", (e) => {
  const key = e.key.toLowerCase();
  if (recording && ['a','s','d','f'].includes(key)) {
    const audio = document.getElementById('audio');
    recordedNotes.push({ time: Math.round(audio.currentTime * 1000), key });
    console.log('Recorded:', recordedNotes[recordedNotes.length - 1]);
  }
});

// Useful console command to toggle: toggleRecording();
function updateHUD() {
  document.getElementById("score").textContent = `Score: ${score}`;
  document.getElementById("combo").textContent = `Combo: ${combo}`;
}
function startGame(songName) {
  songData = window[songName];
  const audio = document.getElementById("audio");

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");

  currentNotes = [];
  score = 0;
  combo = 0;
  totalNotes = songData.notes.length;
  missedNotes = 0;
  updateHUD();

  const delay = songData.startDelay || 0;
  const songtitle = songData.songName;
  document.getElementById("song-title").textContent = songtitle;

  audio.src = `${songName}.mp3`;
  audio.currentTime = 0;

  // Automatically start recording
  recording = true;
  recordedNotes = [];

  setTimeout(() => {
    audio.play().then(() => {

      startTime = performance.now() - delay;
      animationId = requestAnimationFrame(gameLoop);
    }).catch(err => {
      alert("Audio failed to play: " + err);
    });
  }, delay);
  const overlay = document.getElementById('transition-overlay');
  const game = document.getElementById('game');

  // Make overlay visible
  overlay.style.opacity = '1';

  // Show game just before the flashy animation hits
  setTimeout(() => {
    game.classList.remove('hidden');
    game.classList.add('flashy-enter');
  }, 100);

  // Let the glow hit and fade out
  setTimeout(() => {
    overlay.style.opacity = '0';
    game.classList.remove('flashy-enter');
  }, 700);
  document.getElementById("audio").onended = () => {
  recording = false;
  console.log("🛑 Recording finished! Paste this into your song file:");
  console.log(JSON.stringify(recordedNotes, null, 2));
  const maxScore = totalNotes * 225;
  const rankPercent = score / maxScore;
  let rank = "D";

  if (rankPercent >= 1) rank = "S+";
  else if (rankPercent >= 0.95) rank = "S";
  else if (rankPercent >= 0.85) rank = "A";
  else if (rankPercent >= 0.70) rank = "B";
  else if (rankPercent >= 0.50) rank = "C";

  // How many more points needed for next rank
  let nextTarget = 0;
  if (rank === "D") nextTarget = Math.ceil(maxScore * 0.50);
  else if (rank === "C") nextTarget = Math.ceil(maxScore * 0.70);
  else if (rank === "B") nextTarget = Math.ceil(maxScore * 0.85);
  else if (rank === "A") nextTarget = Math.ceil(maxScore * 0.95);
  else if (rank === "S") nextTarget = Math.ceil(maxScore * 1);
  else nextTarget = score; // S+ = max

  const toNext = Math.max(0, nextTarget - score);

  // Show end screen

  document.getElementById("end-screen").classList.remove("hidden");

  document.getElementById("final-rank").textContent = `Rank: ${rank}`;
  document.getElementById("final-score").textContent = `Score: ${score} / ${maxScore}`;
  document.getElementById("final-misses").textContent = `Misses: ${missedNotes}`;
  document.getElementById("next-rank-progress").textContent = toNext > 0
    ? `${toNext} more points to reach next rank`
    : `good work! you do got rythm!`;
};
}
function returnToMenu() {
  document.getElementById("end-screen").classList.add("hidden");
  document.getElementById("game").classList.add("hidden");
  document.getElementById("menu").classList.remove("hidden");
  audio.pause();
}
function gameLoop(timestamp) {
  const audio = document.getElementById("audio");
  const elapsed = (document.getElementById("audio").currentTime * 1000) + (songData.audioOffset || 0);
  // Generate notes based on song map
  songData.notes.forEach(note => {
    if (!note.spawned && elapsed >= note.time) {
      spawnNote(note.key);
      note.spawned = true;
    }
  });

  // Move existing notes
  document.querySelectorAll(".note").forEach(note => {
    let top = parseFloat(note.style.top);
    note.style.top = (top + 4) + "px";
    if (top > 600 && !note.classList.contains("hit")) {
      note.remove();
      registerMiss();
    }
  });

  animationId = requestAnimationFrame(gameLoop);
}
function updateComboVisuals() {
  if (combo >= comboBonusThreshold) {
    document.body.classList.add("combo-active");
  } else {
    document.body.classList.remove("combo-active");
  }
}
function spawnNote(key) {
  const col = document.getElementById("col-" + key);
  const note = document.createElement("div");
  note.classList.add("note");
  note.dataset.key = key;
  note.dataset.spawnTime = performance.now(); // Save when it appeared
  note.style.top = "0px";
  col.appendChild(note);
}
function showFeedback(text, type) {
  const feedback = document.getElementById("feedback");
  feedback.textContent = text;
  feedback.style.opacity = 1;

  if (type === "miss") {
    document.body.classList.add("miss-feedback");
    setTimeout(() => {
      document.body.classList.remove("miss-feedback");
    }, 300);
  }

  setTimeout(() => {
    feedback.style.opacity = 0;
  }, 300);
}
document.addEventListener("keydown", (e) => {
  let key = e.key.toLowerCase();
  let rawKey = e.key.toLowerCase();

  if (rawKey === 'j') {
    key = 'd';
  } else if (rawKey === 'k') {
    key = 'f';
  } else {
    key = rawKey;
  }
  if (!['a', 's', 'd', 'f'].includes(key)) return;

  const col = document.getElementById("col-" + key);
  const notes = Array.from(col.getElementsByClassName("note"));

  for (let note of notes) {
    const noteTop = parseFloat(note.style.top);
    const hitZone = 520;
    const tolerance = 60;

    const distance = Math.abs(noteTop - hitZone);
if (distance < 15) {
  // Perfect hit
  note.classList.add("hit");
  setTimeout(() => note.remove(), 300);
  combo++;
  let baseScore = 100;
  if (combo >= comboBonusThreshold) baseScore *= 2;
  score += baseScore + 50; // extra perfect bonus
  updateHUD();
  updateComboVisuals();
  showFeedback("Perfect!", "perfect");
  return;
} else if (distance < tolerance) {
  // Normal hit
  note.classList.add("hit");
  setTimeout(() => note.remove(), 300);
  combo++;
  let baseScore = 100;
  if (combo >= comboBonusThreshold) baseScore *= 2;
  score += baseScore;
  updateHUD();
  updateComboVisuals();
  return;
}
  }

  // Miss (no note in hit zone)
  registerMiss();
});
function registerMiss() {
  missedNotes++;
  combo = 0;
  updateHUD();
  updateComboVisuals();
  showFeedback("Miss!", "miss");
}
['a', 's', 'd', 'f'].forEach((key) => {
  const col = document.getElementById("col-" + key);
  col.addEventListener("click", () => {
    const event = new KeyboardEvent("keydown", { key });
    document.dispatchEvent(event);
  });
});
