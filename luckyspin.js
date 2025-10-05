const translations = {
  en: {
    title: "🎉 EZ-BET Lucky Draw 🎉",
    usernamePlaceholder: "Enter your username...",
    spin: "Spin",
    yourResult: "🎯 Your Result:",
    winnerBoard: "🏆 Winner Board",
    alreadySpun: "❗ This user already spun.",
    pleaseEnter: "Please enter your username.",
    alreadySpunAlert: "This user has already spun.",
    prizes: [], // Will be loaded from backend
    won: "🎊 {username} won: {prize}",
    congratulations: "🎉 Congratulations! 🎉",
    youWon: "You won"
  },
  mm: {
    title: "🎉 EZ-BET ကံစမ်းမဲ 🎉",
    usernamePlaceholder: "သင့်အမည်ထည့်ပါ...",
    spin: "လှည့်မယ်",
    yourResult: "🎯 သင့်ရလဒ်:",
    winnerBoard: "🏆 အနိုင်ရသူများ",
    alreadySpun: "❗ ဤအသုံးပြုသူက ကံစမ်းပြီးပါပြီ။",
    pleaseEnter: "ကျေးဇူးပြု၍ သင့်အမည်ထည့်ပါ။",
    alreadySpunAlert: "ဤအသုံးပြုသူက ကံစမ်းပြီးပါပြီ။",
    prizes: [], // Will be loaded from backend
    won: "🎊 {username} က ရရှိသည် - {prize}",
    congratulations: "🎉 ဂုဏ်ယူပါ! 🎉",
    youWon: "သင်ရရှိသည်"
  }
};

let currentLang = "mm";
let prizeProbabilities = []; // Will be loaded from backend

// Backend URL Configuration - Updated to your deployed backend:
const BACKEND_URL = 'https://luckyspin-backend.onrender.com'; // Your deployed backend
// const BACKEND_URL = 'http://localhost:3001'; // Local development

function setLanguage(lang) {
  currentLang = lang;
  const t = translations[lang];

  // Update two-line title
  if (lang === 'en') {
    document.getElementById("titleLine1").innerText = "EZ-BET";
    document.getElementById("titleLine2").innerText = "Lucky Draw";
  } else {
    document.getElementById("titleLine1").innerText = "EZ-BET";
    document.getElementById("titleLine2").innerText = "ကံစမ်းမဲ";
  }

  document.getElementById("username").placeholder = t.usernamePlaceholder;
  document.getElementById("spinBtn").innerText = t.spin;
  document.getElementById("historyTitle").innerText = t.yourResult;
  document.getElementById("winnerBoardTitle").innerText = t.winnerBoard;

  // Update prizes
  updatePrizeDisplay();

  // Update result/history if needed
  const resultDiv = document.getElementById("result");
  if (resultDiv.innerText.includes("won:") || resultDiv.innerText.includes("ရရှိသည်")) {
    resultDiv.innerText = "";
  }
}

// Load and display total spin count
async function loadTotalSpinCount() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/total-spins`);
    const data = await response.json();
    
    if (data.success) {
      // Server now returns the complete total (base counter + database count)
      const serverCount = data.totalSpins || 1958;
      const localCount = parseInt(localStorage.getItem('totalSpinCount') || '1958');
      
      // Always trust the server value when available, only use local as fallback
      const finalCount = serverCount;
      
      // Store the count locally as backup
      localStorage.setItem('totalSpinCount', finalCount.toString());
      
      document.getElementById('totalSpinNumber').textContent = finalCount.toLocaleString();
      console.log(`Total spins loaded: Server=${serverCount}, Local=${localCount}, Final=${finalCount}`);
    }
  } catch (error) {
    console.log('Server unavailable, using local count');
    // Use local storage as fallback
    const localCount = parseInt(localStorage.getItem('totalSpinCount') || '1958');
    document.getElementById('totalSpinNumber').textContent = localCount.toLocaleString();
  }
}

// Increment total spin counter with animation
function incrementSpinCounter() {
  const counterElement = document.getElementById('totalSpinNumber');
  const currentCount = parseInt(counterElement.textContent.replace(/,/g, '')) || 1958;
  const newCount = currentCount + 1;
  
  // Store the new count locally immediately
  localStorage.setItem('totalSpinCount', newCount.toString());
  
  // Animate the increment
  counterElement.style.animation = 'counterIncrement 0.6s ease-out';
  
  setTimeout(() => {
    counterElement.textContent = newCount.toLocaleString();
    counterElement.style.animation = '';
  }, 300);
  
  console.log(`Spin counter incremented: ${currentCount} → ${newCount}`);
}

// Load configuration from backend
async function loadConfig() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/config`);
    const data = await response.json();
    
    if (data.success) {
      // Update translations with loaded prizes
      translations.en.prizes = data.config.prizes.en;
      translations.mm.prizes = data.config.prizes.mm;
      prizeProbabilities = data.config.probabilities;
      
      // Update display
      updatePrizeDisplay();
      console.log('✅ Configuration loaded from backend');
    } else {
      console.error('Failed to load configuration, using defaults');
      // Set default values if backend fails
      translations.en.prizes = ["500 MMK", "1,000 MMK", "2,000 MMK", "3,000 MMK", "5,000 MMK", "10,000 MMK", "15,000 MMK", "30,000 MMK", "100,000 MMK"];
      translations.mm.prizes = ["၅၀၀ ကျပ်", "၁၀၀၀ ကျပ်", "၂၀၀၀ ကျပ်", "၃၀၀၀ ကျပ်", "၅၀၀၀ ကျပ်", "၁၀၀၀၀ ကျပ်", "၁၅၀၀၀ ကျပ်", "၃၀၀၀၀ ကျပ်", "၁၀၀၀၀၀ ကျပ်"];
      prizeProbabilities = [30, 20, 40, 30, 1, 0.1, 0.01, 0.001, 0.0001];
      updatePrizeDisplay();
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
    // Set default values if backend fails
    translations.en.prizes = ["500 MMK", "1,000 MMK", "2,000 MMK", "3,000 MMK", "5,000 MMK", "10,000 MMK", "15,000 MMK", "30,000 MMK", "100,000 MMK"];
    translations.mm.prizes = ["၅၀၀ ကျပ်", "၁၀၀၀ ကျပ်", "၂၀၀၀ ကျပ်", "၃၀၀၀ ကျပ်", "၅၀၀၀ ကျပ်", "၁၀၀၀၀ ကျပ်", "၁၅၀၀၀ ကျပ်", "၃၀၀၀၀ ကျပ်", "၁၀၀၀၀၀ ကျပ်"];
    prizeProbabilities = [30, 20, 40, 30, 1, 0.1, 0.01, 0.001, 0.0001];
    updatePrizeDisplay();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Clear cached total spin count to fix counter sync issue
  // This can be removed after users refresh their browsers
  localStorage.removeItem('totalSpinCount');
  
  document.getElementById("lang-en").onclick = () => setLanguage("en");
  document.getElementById("lang-mm").onclick = () => setLanguage("mm");
  
  // Load configuration and total spin count, then set language
  loadConfig().then(() => {
    setLanguage("mm"); // default
  });
  loadTotalSpinCount();
  
  // Sync with server every 30 seconds (optional)
  setInterval(() => {
    loadTotalSpinCount();
  }, 30000);
});

// Update updatePrizeDisplay to use translations
function updatePrizeDisplay() {
  const container = document.getElementById("prizeList");
  container.innerHTML = '';
  translations[currentLang].prizes.forEach(text => {
    const div = document.createElement("div");
    div.classList.add("prize");
    div.innerText = text;
    container.appendChild(div);
  });
}

function weightedRandomIndex(weights) {
  let total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    if (r < weights[i]) return i;
    r -= weights[i];
  }
  return weights.length - 1;
}

function easeOutQuad(t, b, c, d) {
  t /= d;
  return -c * t * (t - 2) + b;
}

// --- Strict One-Spin-Per-User Rule ---
function spin() {
  const username = document.getElementById('username').value.trim();
  const btn = document.getElementById('spinBtn');
  const history = document.getElementById('history');
  const resultDiv = document.getElementById('result');
  const prizeElements = document.querySelectorAll('.prize');
  const t = translations[currentLang];

  if (!username) {
    showErrorPopup(t.pleaseEnter);
    return;
  }

  btn.disabled = true;
  resultDiv.innerText = '';
  history.innerHTML = `<strong id="historyTitle">${t.yourResult}</strong><br>`;
  const rollSound = document.getElementById('rollSound');
  const winSound = document.getElementById('winSound');

  // --- Check backend before spinning ---
  fetch(`${BACKEND_URL}/api/spins`)
    .then(res => res.json())
    .then(spins => {
      const found = spins.some(s => (s.username || '').toLowerCase() === username.toLowerCase());
      if (found) {
        // User already spun, show message and block spin
        btn.disabled = true;
        resultDiv.innerText = t.alreadySpun;
        showErrorPopup(t.alreadySpunAlert);
        return;
      }
      // Not found, allow spin
      // --- Spin Animation Logic ---
      const finalIndex = weightedRandomIndex(prizeProbabilities);
      const cycles = 4;
      const totalSteps = cycles * translations[currentLang].prizes.length + finalIndex;
      let current = 0;
      // Play roll sound with error handling
      try {
        rollSound.currentTime = 0;
        rollSound.play().catch(() => {
          // Ignore audio errors - audio files might not exist
        });
      } catch (e) {
        // Ignore audio errors
      }
      function animateSpin() {
        prizeElements.forEach(p => p.classList.remove('highlight'));
        prizeElements[current % translations[currentLang].prizes.length].classList.add('highlight');
        current++;
        if (current <= totalSteps) {
          const delay = easeOutQuad(current, 30, 300, totalSteps);
          setTimeout(animateSpin, delay);
        } else {
          // Stop roll sound and play win sound with error handling
          try {
            rollSound.pause();
            winSound.play().catch(() => {
              // Ignore audio errors - audio files might not exist
            });
          } catch (e) {
            // Ignore audio errors
          }
          prizeElements.forEach(p => p.classList.remove('highlight'));
          prizeElements[finalIndex].classList.add('highlight');
          const wonPrize = translations[currentLang].prizes[finalIndex];
          // --- Confetti and special message for premium prizes ---
          const totalPrizes = translations[currentLang].prizes.length;
          let confettiTitle = '';
          let confettiMsg = '';
          let confettiStyle = 0;

          if (finalIndex >= totalPrizes - 6) { // Last 6 prizes get special treatment
            if (finalIndex === totalPrizes - 6) {
              confettiTitle = 'Great Win!';
              confettiMsg = 'Congratulations! You hit a premium prize!';
              confettiStyle = 0;
            } else if (finalIndex === totalPrizes - 5) {
              confettiTitle = 'Big Win!';
              confettiMsg = 'Amazing! You just won a top-tier reward!';
              confettiStyle = 0;
            } else if (finalIndex === totalPrizes - 4) {
              confettiTitle = 'Super Win!';
              confettiMsg = 'Incredible! You hit one of the rare prizes!';
              confettiStyle = 1;
            } else if (finalIndex === totalPrizes - 3) {
              confettiTitle = 'Mega Jackpot!';
              confettiMsg = 'Outstanding! You won an ultra-rare prize!';
              confettiStyle = 1;
            } else if (finalIndex === totalPrizes - 2) {
              confettiTitle = 'LEGENDARY WIN!';
              confettiMsg = 'UNBELIEVABLE! You hit the legendary jackpot!';
              confettiStyle = 2;
            } else if (finalIndex === totalPrizes - 1) {
              confettiTitle = '🎆 ULTIMATE JACKPOT! 🎆';
              confettiMsg = 'IMPOSSIBLE! You won the ultimate grand prize! You are incredibly lucky!';
              confettiStyle = 2;
            }
            launchConfetti(confettiStyle);
            resultDiv.innerHTML = `<div style="font-size:2.2rem;font-weight:bold;color:#FFD700;text-shadow:2px 2px 8px #000;margin-bottom:8px;animation:titleGlow 2s ease-in-out infinite alternate;">${confettiTitle}</div><div style="font-size:1.3rem;color:#00FF66;margin-bottom:8px;text-shadow:1px 1px 4px #000;">${confettiMsg}</div>` + resultDiv.innerHTML;
          }
          const text = t.won.replace("{username}", username).replace("{prize}", wonPrize);
          resultDiv.innerText = text;
          history.innerHTML += `• ${text}<br>`;

          // Show win popup notification
          showWinPopup(username, wonPrize);

          // Increment the total spin counter
          incrementSpinCounter();

          // --- Save to backend, then update localStorage ---
          fetch(`${BACKEND_URL}/api/spin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, prize: wonPrize })
          })
            .then(res => res.json())
            .then(data => {
              // Only after backend confirms, set localStorage
              localStorage.setItem("spun_" + username, "true");
              // Save to local spin_records for history (optional)
              const today = new Date().toISOString().slice(0, 10);
              let records = JSON.parse(localStorage.getItem("spin_records") || "[]");
              records.push({ username, date: today, prize: wonPrize });
              localStorage.setItem("spin_records", JSON.stringify(records));
              btn.disabled = true;
            })
            .catch(err => {
              // Backend error, inform user
              resultDiv.innerText = 'Error saving your spin. Please try again.';
              btn.disabled = false;
            });
        }
      }
      animateSpin();
    })
    .catch(() => {
      // Backend error, fallback: block spin for safety
      resultDiv.innerText = 'Cannot verify spin status. Please try again later.';
      btn.disabled = false;
    });
}

// 自动检查用户名是否已抽奖（输入框变化时）
document.addEventListener("DOMContentLoaded", () => {
  updatePrizeDisplay();
  const btn = document.getElementById('spinBtn');
  const usernameInput = document.getElementById('username');
  usernameInput.addEventListener("input", () => {
    const username = usernameInput.value.trim();
    const t = translations[currentLang];
    if (!username) {
      btn.disabled = false;
      document.getElementById("result").innerText = "";
      return;
    }
    // Always check backend for spin status
    fetch(`${BACKEND_URL}/api/spins`)
      .then(res => res.json())
      .then(spins => {
        const found = spins.some(s => (s.username || '').toLowerCase() === username.toLowerCase());
        if (found) {
          btn.disabled = true;
          document.getElementById("result").innerText = t.alreadySpun;
        } else {
          btn.disabled = false;
          document.getElementById("result").innerText = "";
        }
      })
      .catch(() => {
        // If backend fails, block spin for safety
        btn.disabled = true;
        document.getElementById("result").innerText = 'Cannot verify spin status.';
      });
  });
});

// Add this after your other JS code

const winnerNames = [
  { en: "SNTYG****", mm: "SNTYG****" },
  { en: "SNTnay****", mm: "SNTnay****" },
  { en: "SNTMin**** ", mm: "SNTMin****" },
  { en: "SNTD****", mm: "SNTD****" },
  { en: "SNTKh*****", mm: "SNTKh*****" },
  { en: "SNTna*****", mm: "SNTna*****" },
  { en: "SNTMi*****", mm: "SNTMi*****" },
  { en: "SNTDE*****", mm: "SNTDE*****" },
  { en: "SNT22*****", mm: "SNT22*****" },
  { en: "SNT32***", mm: "SNT32***" },
  { en: "SNT39***", mm: "SNT39***" },
  { en: "SNT55***", mm: "SNT55***" },
  { en: "SNT10***", mm: "SNT10***" },
  { en: "SNT68***", mm: "SNT68***" },
  { en: "SNT85***", mm: "SNT85***" },
  { en: "SNTn*****", mm: "SNTn*****" },
  { en: "SNTDT*****", mm: "SNTDT*****" },
  { en: "SNTKK*****", mm: "SNTKK*****" },
  { en: "SNTBX*****", mm: "SNTBX*****" },
  { en: "SNTLI*****", mm: "SNTLI*****" }

];

const winnerPrizes = [
  "500 MMK", "1,000 MMK", "2,000 MMK", "3,000 MMK", "5,000 MMK", "10,000 MMK", "15,000 MMK", "30,000 MMK", "100,000 MMK"
];

// Deterministic shuffle based on date
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getTodaySeed() {
  const now = new Date();
  // Use YYYYMMDD as seed
  return parseInt(now.getFullYear() + ("0" + (now.getMonth() + 1)).slice(-2) + ("0" + now.getDate()).slice(-2));
}

function getDailyWinners(count = 10) {
  const seed = getTodaySeed();
  // Copy arrays
  let names = winnerNames.slice();
  let prizes = winnerPrizes.slice();
  // Shuffle names
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }
  // Shuffle prizes
  let prizeList = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(seededRandom(seed + 100 + i) * prizes.length);
    prizeList.push(prizes[idx]);
  }
  // Pick first N names and assign prizes
  return names.slice(0, count).map((n, i) => ({
    idx: i + 1,
    en: n.en,
    mm: n.mm,
    prize: prizeList[i]
  }));
}

async function renderWinnerBoard() {
  const tbody = document.getElementById("winnerBoardBody");
  if (!tbody) return;
  
  try {
    // Try to load from backend first
    const response = await fetch(`${BACKEND_URL}/api/winner-board`);
    const data = await response.json();
    
    if (data.success) {
      const winners = data.winners;
      tbody.innerHTML = winners.map(w =>
        `<tr>
          <td>${w.idx}</td>
          <td>${w.en}</td>
          <td>${w.mm}</td>
          <td>${w.prize}</td>
        </tr>`
      ).join('');
      
      // Add a small indicator of the current mode
      const modeIndicator = data.mode === 'real' ? '🔴 Live' : '🎭 Demo';
      const existingIndicator = document.querySelector('.mode-indicator');
      if (existingIndicator) {
        existingIndicator.remove();
      }
      
      const indicator = document.createElement('div');
      indicator.className = 'mode-indicator';
      indicator.style.cssText = 'position: absolute; top: 5px; right: 5px; font-size: 10px; color: #666; background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;';
      indicator.textContent = modeIndicator;
      document.querySelector('.winner-board').style.position = 'relative';
      document.querySelector('.winner-board').appendChild(indicator);
      
      return;
    }
  } catch (error) {
    console.log('Backend not available, using fallback demo data');
  }
  
  // Fallback to original demo data if backend is not available
  const winners = getDailyWinners(10);
  tbody.innerHTML = winners.map(w =>
    `<tr>
      <td>${w.idx}</td>
      <td>${w.en}</td>
      <td>${w.mm}</td>
      <td>${w.prize}</td>
    </tr>`
  ).join('');
}

// Call on page load
document.addEventListener("DOMContentLoaded", renderWinnerBoard);

function getDateString(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function getSeedFromDateString(dateStr) {
  // dateStr: "YYYY-MM-DD"
  return parseInt(dateStr.replace(/-/g, ""));
}

function getDailyWinnersBySeed(seed, count = 10) {
  let names = winnerNames.slice();
  let prizes = winnerPrizes.slice();
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }
  let prizeList = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(seededRandom(seed + 100 + i) * prizes.length);
    prizeList.push(prizes[idx]);
  }
  return names.slice(0, count).map((n, i) => ({
    idx: i + 1,
    en: n.en,
    mm: n.mm,
    prize: prizeList[i]
  }));
}

async function renderWinnerBoardHistory(dateStr) {
  const tbody = document.getElementById("winnerBoardBody");
  if (!tbody) return;
  
  // For historical dates, always use the deterministic demo data
  // This ensures consistency when users browse different dates
  const seed = getSeedFromDateString(dateStr);
  const winners = getDailyWinnersBySeed(seed, 10);
  tbody.innerHTML = winners.map(w =>
    `<tr>
      <td>${w.idx}</td>
      <td>${w.en}</td>
      <td>${w.mm}</td>
      <td>${w.prize}</td>
    </tr>`
  ).join('');
  
  // Update mode indicator for historical view
  const existingIndicator = document.querySelector('.mode-indicator');
  if (existingIndicator) {
    existingIndicator.textContent = '📅 History';
  }
}

function renderWinnerDaySelect() {
  const select = document.getElementById("winnerDaySelect");
  if (!select) return;
  select.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const dateStr = getDateString(i);
    const option = document.createElement("option");
    option.value = dateStr;
    option.innerText = i === 0 ? "Today" : dateStr;
    select.appendChild(option);
  }
  select.onchange = function () {
    const selectedDate = this.value;
    const today = getDateString(0);
    
    if (selectedDate === today) {
      // Show current day with backend data
      renderWinnerBoard();
    } else {
      // Show historical data
      renderWinnerBoardHistory(selectedDate);
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  renderWinnerDaySelect();
  renderWinnerBoardHistory(getDateString(0));
});





// --- Confetti animation helper ---
function launchConfetti(styleIdx = 0) {
  // Simple confetti using canvas
  let confettiCanvas = document.getElementById('confettiCanvas');
  if (!confettiCanvas) {
    confettiCanvas = document.createElement('canvas');
    confettiCanvas.id = 'confettiCanvas';
    confettiCanvas.style.position = 'fixed';
    confettiCanvas.style.left = '0';
    confettiCanvas.style.top = '0';
    confettiCanvas.style.width = '100vw';
    confettiCanvas.style.height = '100vh';
    confettiCanvas.style.pointerEvents = 'none';
    confettiCanvas.style.zIndex = '99999';
    document.body.appendChild(confettiCanvas);
  }
  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  let confetti = [];
  let colors = [
    ['#FFD700', '#FF4444', '#00FF66'], // style 0
    ['#00CFFF', '#FFD700', '#FF00A6'], // style 1
    ['#FF6F00', '#00FFB2', '#FF00E6']  // style 2
  ][styleIdx % 3];
  for (let i = 0; i < 120; i++) {
    confetti.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * -confettiCanvas.height,
      r: 6 + Math.random() * 8,
      d: 2 + Math.random() * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngle: 0,
      tiltAngleInc: (Math.random() * 0.07) + 0.05
    });
  }
  let frame = 0;
  function drawConfetti() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confetti.forEach(c => {
      ctx.beginPath();
      ctx.lineWidth = c.r;
      ctx.strokeStyle = c.color;
      ctx.moveTo(c.x + c.tilt + c.r / 3, c.y);
      ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r);
      ctx.stroke();
    });
    updateConfetti();
    frame++;
    if (frame < 120) requestAnimationFrame(drawConfetti);
    else setTimeout(() => { confettiCanvas.remove(); }, 1200);
  }
  function updateConfetti() {
    confetti.forEach(c => {
      c.y += c.d;
      c.tiltAngle += c.tiltAngleInc;
      c.tilt = Math.sin(c.tiltAngle) * 15;
      if (c.y > confettiCanvas.height) {
        c.x = Math.random() * confettiCanvas.width;
        c.y = -10;
      }
    });
  }
  drawConfetti();
}

// Win Popup Notification Function
function showWinPopup(username, prize) {
  const t = translations[currentLang];

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'win-popup-overlay';

  // Create popup
  const popup = document.createElement('div');
  popup.className = 'win-popup';

  popup.innerHTML = `
    <div class="win-popup-title">${t.congratulations}</div>
    <div class="win-popup-username">${username}</div>
    <div style="font-size: 1.2rem; color: #fff; margin-bottom: 10px;">${t.youWon}</div>
    <div class="win-popup-prize">${prize}</div>
    <button class="win-popup-close" onclick="closeWinPopup()">OK</button>
  `;

  // Add to document
  document.body.appendChild(overlay);
  document.body.appendChild(popup);

  // Trigger animations
  setTimeout(() => {
    popup.classList.add('show');
  }, 100);

  // Auto close after 5 seconds
  setTimeout(() => {
    closeWinPopup();
  }, 5000);
}

function closeWinPopup() {
  const overlay = document.querySelector('.win-popup-overlay');
  const popup = document.querySelector('.win-popup');

  if (overlay) {
    overlay.style.animation = 'fadeIn 0.3s ease reverse';
    setTimeout(() => overlay.remove(), 300);
  }

  if (popup) {
    popup.style.animation = 'popupSlideIn 0.3s ease reverse';
    setTimeout(() => popup.remove(), 300);
  }
}

// Close popup when clicking overlay
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('win-popup-overlay')) {
    closeWinPopup();
  }
});
// Error Popup Notification Function
function showErrorPopup(message) {
  const t = translations[currentLang];

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'error-popup-overlay';

  // Create popup
  const popup = document.createElement('div');
  popup.className = 'error-popup';

  popup.innerHTML = `
    <div class="error-popup-title">⚠️ ${currentLang === 'en' ? 'Warning' : 'သတိပေးချက်'}</div>
    <div class="error-popup-message">${message}</div>
    <button class="error-popup-close" onclick="closeErrorPopup()">${currentLang === 'en' ? 'OK' : 'ရပါပြီ'}</button>
  `;

  // Add to document
  document.body.appendChild(overlay);
  document.body.appendChild(popup);

  // Trigger animations
  setTimeout(() => {
    popup.classList.add('show');
  }, 100);

  // Auto close after 4 seconds
  setTimeout(() => {
    closeErrorPopup();
  }, 4000);

  // Focus on username input after popup
  setTimeout(() => {
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
      usernameInput.focus();
    }
  }, 500);
}

function closeErrorPopup() {
  const overlay = document.querySelector('.error-popup-overlay');
  const popup = document.querySelector('.error-popup');

  if (overlay) {
    overlay.style.animation = 'fadeIn 0.3s ease reverse';
    setTimeout(() => overlay.remove(), 300);
  }

  if (popup) {
    popup.style.animation = 'errorPopupSlideIn 0.3s ease reverse';
    setTimeout(() => popup.remove(), 300);
  }
}

// Close error popup when clicking overlay
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('error-popup-overlay')) {
    closeErrorPopup();
  }
});

// Database test function - you can call this in browser console
function testDatabaseConnection() {
  fetch(`${BACKEND_URL}/api/test`)
    .then(res => res.json())
    .then(data => {
      console.log('🔍 Database Test Results:');
      console.log('Database Name:', data.database);
      console.log('Collections:', data.collections);
      console.log('Spin Records Count:', data.spinCount);
      console.log('Full Response:', data);
    })
    .catch(err => {
      console.error('❌ Database test failed:', err);
    });
}

// Auto-run database test on page load (for debugging)
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔍 Running database connection test...');
  testDatabaseConnection();


});