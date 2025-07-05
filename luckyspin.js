const translations = {
  en: {
    title: "🎉 Lucky Draw 🎉",
    usernamePlaceholder: "Enter your username...",
    spin: "🎯 Spin",
    yourResult: "🎯 Your Result:",
    winnerBoard: "🏆 Winner Board",
    alreadySpun: "❗ This user already spun.",
    pleaseEnter: "Please enter your username.",
    alreadySpunAlert: "This user has already spun.",
    prizes: ["100 MMK", "200 MMK", "500 MMK", "1000 MMK", "5000 MMK", "Deposit 500% Free"],
    won: "🎊 {username} won: {prize}"
  },
  mm: {
    title: "🎉 ကံစမ်းမဲ 🎉",
    usernamePlaceholder: "သင့်အမည်ထည့်ပါ...",
    spin: "🎯 ကံစမ်းမဲ",
    yourResult: "🎯 သင့်ရလဒ်:",
    winnerBoard: "🏆 အနိုင်ရသူများ",
    alreadySpun: "❗ ဤအသုံးပြုသူက ကံစမ်းပြီးပါပြီ။",
    pleaseEnter: "ကျေးဇူးပြု၍ သင့်အမည်ထည့်ပါ။",
    alreadySpunAlert: "ဤအသုံးပြုသူက ကံစမ်းပြီးပါပြီ။",
    prizes: ["၁၀၀ ကျပ်", "၂၀၀ ကျပ်", "၅၀၀ ကျပ်", "၁၀၀၀ ကျပ်", "၅၀၀၀ ကျပ်", " 5၀၀% အပိုငွေသွင်းခြင်း"],
    won: "🎊 {username} က ရရှိသည် - {prize}"
  }
};

let currentLang = "en";
const prizeProbabilities = Array(translations[currentLang].prizes.length).fill(1);

function setLanguage(lang) {
  currentLang = lang;
  const t = translations[lang];

  document.getElementById("title").innerText = t.title;
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

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("lang-en").onclick = () => setLanguage("en");
  document.getElementById("lang-mm").onclick = () => setLanguage("mm");
  setLanguage("en"); // default
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
  return -c * t*(t-2) + b;
}

function spin() {
  const username = document.getElementById('username').value.trim();
  const btn = document.getElementById('spinBtn');
  const history = document.getElementById('history');
  const resultDiv = document.getElementById('result');
  const prizeElements = document.querySelectorAll('.prize');
  const t = translations[currentLang];

  if (!username) {
    alert(t.pleaseEnter);
    return;
  }

  const localKey = "spun_" + username;

  if (localStorage.getItem(localKey) === "true") {
    alert(t.alreadySpunAlert);
    return;
  }

  btn.disabled = true;
  resultDiv.innerText = '';
  history.innerHTML = `<strong id="historyTitle">${t.yourResult}</strong><br>`;
  const rollSound = document.getElementById('rollSound');
  const winSound = document.getElementById('winSound');

  const finalIndex = weightedRandomIndex(prizeProbabilities);
  const cycles = 4;
  const totalSteps = cycles * translations[currentLang].prizes.length + finalIndex;
  let current = 0;

  rollSound.currentTime = 0;
  rollSound.play();

  function animateSpin() {
    prizeElements.forEach(p => p.classList.remove('highlight'));
    prizeElements[current % translations[currentLang].prizes.length].classList.add('highlight');
    current++;
    if (current <= totalSteps) {
      const delay = easeOutQuad(current, 30, 300, totalSteps);
      setTimeout(animateSpin, delay);
    } else {
      rollSound.pause();
      winSound.play();
      prizeElements.forEach(p => p.classList.remove('highlight'));
      prizeElements[finalIndex].classList.add('highlight');
      const wonPrize = translations[currentLang].prizes[finalIndex];
      // --- Confetti and special message for last 3 prizes ---
      const specialIdx = translations[currentLang].prizes.length - 3;
      let confettiTitle = '';
      let confettiMsg = '';
      let confettiStyle = 0;
      if (finalIndex >= specialIdx) {
        if (finalIndex === specialIdx) {
          confettiTitle = 'Big Win!';
          confettiMsg = 'Congratulations! You just hit one of the top prizes!';
          confettiStyle = 0;
        } else if (finalIndex === specialIdx + 1) {
          confettiTitle = 'Jackpot Winner!';
          confettiMsg = 'Amazing! You have won the second highest reward!';
          confettiStyle = 1;
        } else if (finalIndex === specialIdx + 2) {
          confettiTitle = 'Unbelievable Luck!';
          confettiMsg = 'You got the ultimate prize! Fortune truly favors you!';
          confettiStyle = 2;
        }
        // Show confetti and styled message
        launchConfetti(confettiStyle);
        resultDiv.innerHTML = `<div style="font-size:2rem;font-weight:bold;color:#FFD700;text-shadow:2px 2px 8px #000;margin-bottom:8px;">${confettiTitle}</div><div style="font-size:1.2rem;color:#00FF66;margin-bottom:8px;">${confettiMsg}</div>` + resultDiv.innerHTML;
      }
      const text = t.won.replace("{username}", username).replace("{prize}", wonPrize);
      resultDiv.innerText = text;
      history.innerHTML += `• ${text}<br>`;
      localStorage.setItem(localKey, "true");

      const today = new Date().toISOString().slice(0,10); // YYYY-MM-DD
      let records = JSON.parse(localStorage.getItem("spin_records") || "[]");
      records.push({ username, date: today, prize: wonPrize }); // <-- Save prize
      localStorage.setItem("spin_records", JSON.stringify(records));

      // --- Save to MongoDB backend ---
      fetch('http://localhost:3001/api/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, prize: wonPrize })
      })
      .then(res => res.json())
      .then(data => {
        // Optionally handle response
        // console.log('Saved to DB:', data);
      })
      .catch(err => {
        // Optionally handle error
        // console.error('DB error:', err);
      });

      btn.disabled = true;
    }
  }

  animateSpin();
}

// 自动检查用户名是否已抽奖（输入框变化时）
document.addEventListener("DOMContentLoaded", () => {
  updatePrizeDisplay();
  const btn = document.getElementById('spinBtn');
  const usernameInput = document.getElementById('username');
  usernameInput.addEventListener("input", () => {
    const username = usernameInput.value.trim();
    const key = "spun_" + username;
    const t = translations[currentLang];
    if (!username) {
      btn.disabled = false;
      document.getElementById("result").innerText = "";
      return;
    }
    // Check with backend if user has spun
    fetch('http://localhost:3001/api/spins')
      .then(res => res.json())
      .then(spins => {
        const found = spins.some(s => (s.username || '').toLowerCase() === username.toLowerCase());
        if (found) {
          localStorage.setItem(key, "true");
          btn.disabled = true;
          document.getElementById("result").innerText = t.alreadySpun;
        } else {
          localStorage.removeItem(key);
          btn.disabled = false;
          document.getElementById("result").innerText = "";
        }
      })
      .catch(() => {
        // fallback to localStorage if backend fails
        if (localStorage.getItem(key) === "true") {
          btn.disabled = true;
          document.getElementById("result").innerText = t.alreadySpun;
        } else {
          btn.disabled = false;
          document.getElementById("result").innerText = "";
        }
      });
  });
});

// Add this after your other JS code

const winnerNames = [
  {en: "Aung Khat", mm: "အောင်ခတ်"},
  {en: "TinTin", mm: "တင်တင်"},
  {en: "WinChit", mm: "ဝင်းချစ်"},
  {en: "Sai Shan", mm: "စိုင်းရှမ်း"},
  {en: "Cherry", mm: "ချယ်ရီ"},
  {en: "Zaw Win", mm: "ဇော်ဝင်း"},
  {en: "May Thu", mm: "မေသူ"},
  {en: "Ko Ko", mm: "ကိုကို"},
  {en: "Hnin Ei", mm: "နှင်းအိ"},
  {en: "Min Min", mm: "မင်းမင်း"},
  {en: "Soe Moe", mm: "စိုးမိုး"},
  {en: "Mya Mya", mm: "မြမြ"},
  {en: "Htet Htet", mm: "ထက်ထက်"},
  {en: "Su Su", mm: "စုစု"},
  {en: "Aye Chan", mm: "အေးချမ်း"},
  {en: "Nyein Ei", mm: "ငြိမ်းအိ"},
  {en: "Thura", mm: "သူရ"},
  {en: "Khin Khin", mm: "ခင်ခင်"},
  {en: "Moe Moe", mm: "မိုးမိုး"},
  {en: "Sanda", mm: "စန္ဒာ"}
 
];

const winnerPrizes = [
  "100 MMK", "200 MMK", "500 MMK", "1000 MMK", "5000 MMK", "Deposit 200% Free"
];

// Deterministic shuffle based on date
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getTodaySeed() {
  const now = new Date();
  // Use YYYYMMDD as seed
  return parseInt(now.getFullYear() + ("0"+(now.getMonth()+1)).slice(-2) + ("0"+now.getDate()).slice(-2));
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

function renderWinnerBoard() {
  const tbody = document.getElementById("winnerBoardBody");
  if (!tbody) return;
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
  return d.toISOString().slice(0,10); // YYYY-MM-DD
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

function renderWinnerBoardHistory(dateStr) {
  const tbody = document.getElementById("winnerBoardBody");
  if (!tbody) return;
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
  select.onchange = function() {
    renderWinnerBoardHistory(this.value);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  renderWinnerDaySelect();
  renderWinnerBoardHistory(getDateString(0));
});

// --- Real Users Modal Logic ---
const REAL_USERS_KEY = "shangyi@123"; // Change this to your secret key

document.getElementById("viewRealUsersBtn").onclick = function() {
  document.getElementById("realUsersModal").style.display = "flex";
  document.getElementById("realUsersAuth").style.display = "block";
  document.getElementById("realUsersList").style.display = "none";
  document.getElementById("realUsersKeyInput").value = "";
  document.getElementById("realUsersKeyError").innerText = "";
};

document.getElementById("closeRealUsersModal").onclick = function() {
  document.getElementById("realUsersModal").style.display = "none";
};

document.getElementById("realUsersKeyBtn").onclick = function() {
  const inputKey = document.getElementById("realUsersKeyInput").value;
  if (inputKey === REAL_USERS_KEY) {
    // Show real users
    document.getElementById("realUsersAuth").style.display = "none";
    document.getElementById("realUsersList").style.display = "block";
    showRealUsers();
  } else {
    document.getElementById("realUsersKeyError").innerText = "Wrong key!";
  }
};

// --- Fetch and render real user spins from MongoDB ---
function showRealUsers() {
  const ul = document.getElementById("realUsersUl");
  ul.innerHTML = "";

  // Fetch from backend
  fetch('http://localhost:3001/api/spins')
    .then(res => res.json())
    .then(records => {
      if (!records.length) {
        ul.innerHTML = "<li style='color:#fff;'>No user has spun yet.</li>";
        return;
      }
      // Sort by date descending
      records.sort((a, b) => new Date(b.date) - new Date(a.date));
      // Calculate totals
      const uniqueUsers = new Set(records.map(r => (r.username || '').toLowerCase()));
      let totalPrize = 0;
      function myanmarToEnglish(str) {
        // Convert Myanmar numerals to English
        const myanmarDigits = '၀၁၂၃၄၅၆၇၈၉';
        return str.replace(/[၀-၉]/g, d => myanmarDigits.indexOf(d));
      }
      records.forEach(r => {
        let prizeStr = (r.prize || '').replace(/,/g, '');
        prizeStr = myanmarToEnglish(prizeStr);
        // Only sum if prize is MMK (contains MMK or ကျပ်)
        if (/\d+/.test(prizeStr) && (prizeStr.includes('MMK') || prizeStr.includes('ကျပ်'))) {
          let match = prizeStr.match(/(\d+)/);
          if (match) totalPrize += parseInt(match[1], 10);
        }
      });
      // Create a table for better formatting
      let html = `<div style='text-align:center;margin-bottom:12px;'><span style='font-size:22px;font-weight:bold;color:#fff;'>🎯 Spin Records</span></div>`;
      html += `<div style='color:#FFD700;font-size:17px;margin-bottom:10px;'>Total Users: <b>${uniqueUsers.size}</b> &nbsp; | &nbsp; Total Prize: <b>${totalPrize.toLocaleString()} MMK</b></div>`;
      html += `<table style="width:100%;color:#fff;font-size:16px;border-collapse:separate;border-spacing:0 8px;table-layout:fixed;">
        <thead>
          <tr style='border-bottom:2px solid #FFD700;'>
            <th style='padding:8px 10px;width:32%;text-align:left;'>Date</th>
            <th style='padding:8px 10px;width:34%;text-align:left;'>Username</th>
            <th style='padding:8px 10px;width:34%;text-align:left;'>Prize</th>
          </tr>
        </thead>
        <tbody>`;
      records.forEach(r => {
        // Format date as YYYY-MM-DD only
        const dateObj = new Date(r.date);
        const date = dateObj.getFullYear() + '-' + String(dateObj.getMonth()+1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');
        html += `<tr style='background:#222;border-radius:8px;'>
          <td style='padding:8px 10px;border-radius:8px 0 0 8px;'>${date}</td>
          <td style='padding:8px 10px;'>${r.username}</td>
          <td style='padding:8px 10px;border-radius:0 8px 8px 0;color:#FFD700;font-weight:bold;'>${r.prize}</td>
        </tr>`;
      });
      html += '</tbody></table>';
      ul.innerHTML = html;
    })
    .catch(() => {
      ul.innerHTML = "<li style='color:#fff;'>Could not load real user data.</li>";
    });
}

// Optional: Close modal when clicking outside the popup
document.getElementById("realUsersModal").addEventListener("click", function(e) {
  if (e.target === this) this.style.display = "none";
});

// --- Reset Database Modal Logic ---
function createResetModal() {
  if (document.getElementById('resetDbModal')) return;
  const modal = document.createElement('div');
  modal.id = 'resetDbModal';
  modal.style = 'display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);z-index:10000;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:#222;padding:30px 20px;border-radius:12px;max-width:350px;margin:auto;position:relative;min-width:280px;">
      <button id="closeResetDbModal" style="position:absolute;top:10px;right:10px;background:#FFD700;border:none;border-radius:50%;width:30px;height:30px;font-size:18px;cursor:pointer;">×</button>
      <div id="resetDbAuth">
        <h3 style="color:#FFD700;text-align:center;">Admin Login</h3>
        <input type="text" id="resetDbUsername" placeholder="Username" style="padding:6px 10px;border-radius:5px;width:90%;margin-bottom:8px;">
        <input type="password" id="resetDbPassword" placeholder="Password" style="padding:6px 10px;border-radius:5px;width:90%;margin-bottom:8px;">
        <button id="resetDbAuthBtn" style="margin-top:10px;background:#FFD700;color:#111;font-weight:bold;padding:6px 16px;border-radius:6px;width:90%;">Login</button>
        <div id="resetDbAuthError" style="color:#FF4444;margin-top:8px;text-align:center;"></div>
      </div>
      <div id="resetDbConfirm" style="display:none;text-align:center;">
        <h3 style="color:#FFD700;">Are you sure?</h3>
        <p style="color:#fff;">This will <b>delete all spin records</b> from the database. This action cannot be undone.</p>
        <button id="resetDbConfirmBtn" style="background:#FF4444;color:#fff;font-weight:bold;padding:6px 16px;border-radius:6px;margin-right:10px;">Yes, Delete All</button>
        <button id="resetDbCancelBtn" style="background:#FFD700;color:#111;font-weight:bold;padding:6px 16px;border-radius:6px;">Cancel</button>
      </div>
      <div id="resetDbSuccess" style="display:none;text-align:center;color:#00FF66;font-weight:bold;margin-top:12px;">All records deleted successfully!</div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('closeResetDbModal').onclick = function() {
    modal.style.display = 'none';
    document.getElementById('resetDbAuth').style.display = '';
    document.getElementById('resetDbConfirm').style.display = 'none';
    document.getElementById('resetDbSuccess').style.display = 'none';
    document.getElementById('resetDbUsername').value = '';
    document.getElementById('resetDbPassword').value = '';
    document.getElementById('resetDbAuthError').innerText = '';
  };

  document.getElementById('resetDbAuthBtn').onclick = function() {
    const username = document.getElementById('resetDbUsername').value;
    const password = document.getElementById('resetDbPassword').value;
    // Change these credentials as needed
    if (username === 'admin' && password === 'shangyi@123') {
      document.getElementById('resetDbAuth').style.display = 'none';
      // Show user delete form
      document.getElementById('resetDbConfirm').innerHTML = `
        <h3 style="color:#FFD700;">Delete User Records</h3>
        <input type="text" id="deleteUserInput" placeholder="Enter username to delete" style="padding:6px 10px;border-radius:5px;width:90%;margin-bottom:8px;">
        <button id="deleteUserBtn" style="background:#FF4444;color:#fff;font-weight:bold;padding:6px 16px;border-radius:6px;margin-right:10px;">Delete User</button>
        <button id="resetDbCancelBtn" style="background:#FFD700;color:#111;font-weight:bold;padding:6px 16px;border-radius:6px;">Cancel</button>
        <div id="deleteUserResult" style="margin-top:10px;"></div>
      `;
      document.getElementById('resetDbConfirm').style.display = '';
      document.getElementById('resetDbCancelBtn').onclick = function() {
        modal.style.display = 'none';
        document.getElementById('resetDbAuth').style.display = '';
        document.getElementById('resetDbConfirm').style.display = 'none';
        document.getElementById('resetDbSuccess').style.display = 'none';
        document.getElementById('resetDbUsername').value = '';
        document.getElementById('resetDbPassword').value = '';
        document.getElementById('resetDbAuthError').innerText = '';
      };
      document.getElementById('deleteUserBtn').onclick = function() {
        const userToDelete = document.getElementById('deleteUserInput').value.trim();
        if (!userToDelete) {
          document.getElementById('deleteUserResult').innerHTML = '<span style="color:#FF4444;">Please enter a username.</span>';
          return;
        }
        fetch('http://localhost:3001/api/spins/user/' + encodeURIComponent(userToDelete), { method: 'DELETE' })
          .then(res => {
            if (!res.ok) {
              return res.json().then(data => { throw new Error(data.error || 'Server error'); });
            }
            return res.json();
          })
          .then(data => {
            if (data.success) {
              document.getElementById('deleteUserResult').innerHTML = '<span style="color:#00FF66;">User records deleted successfully!</span>';
            } else {
              document.getElementById('deleteUserResult').innerHTML = '<span style="color:#FF4444;">Failed to delete user records.</span>';
            }
          })
          .catch((err) => {
            document.getElementById('deleteUserResult').innerHTML = '<span style="color:#FF4444;">' + (err.message || 'Failed to delete user records.') + '</span>';
            console.error('Delete user error:', err);
          });
      };
    } else {
      document.getElementById('resetDbAuthError').innerText = 'Invalid username or password!';
    }
  };

  // Optional: Close modal when clicking outside the popup
  modal.addEventListener('click', function(e) {
    if (e.target === this) this.style.display = 'none';
  });
}

// Add Reset button to the page (e.g., below winner board)
document.addEventListener('DOMContentLoaded', () => {
  createResetModal();
  const resetBtn = document.createElement('button');
  resetBtn.id = 'resetDbBtn';
  resetBtn.innerText = 'Reset Database';
  resetBtn.style = 'background:#FF4444;color:#fff;font-weight:bold;margin:18px auto 0 auto;display:block;max-width:220px;';
  document.querySelector('.winner-board').appendChild(resetBtn);
  resetBtn.onclick = function() {
    document.getElementById('resetDbModal').style.display = 'flex';
  };
});

app.use(cors());

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
      ctx.moveTo(c.x + c.tilt + c.r/3, c.y);
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
