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
    prizes: ["500 MMK", "1,000 MMK", "2,000 MMK", "3,000 MMK", "5,000 MMK", "10,000 MMK"],
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
    prizes: ["၅၀၀ ကျပ်", "၁၀၀၀ ကျပ်", "၂၀၀၀ ကျပ်", "၃၀၀၀ ကျပ်", "၅၀၀၀ ကျပ်", " ၁၀၀၀၀ ကျပ်"],
    won: "🎊 {username} က ရရှိသည် - {prize}"
  }
};

let currentLang = "en";
const prizeProbabilities = [30, 20, 40, 30, 1, 0.1]; // 从高到低

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

// --- Strict One-Spin-Per-User Rule ---
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

  btn.disabled = true;
  resultDiv.innerText = '';
  history.innerHTML = `<strong id="historyTitle">${t.yourResult}</strong><br>`;
  const rollSound = document.getElementById('rollSound');
  const winSound = document.getElementById('winSound');

  // --- Check backend before spinning ---
  fetch('https://luckyspin-backend.onrender.com/api/spins')
    .then(res => res.json())
    .then(spins => {
      const found = spins.some(s => (s.username || '').toLowerCase() === username.toLowerCase());
      if (found) {
        // User already spun, show message and block spin
        btn.disabled = true;
        resultDiv.innerText = t.alreadySpun;
        alert(t.alreadySpunAlert);
        return;
      }
      // Not found, allow spin
      // --- Spin Animation Logic ---
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
            launchConfetti(confettiStyle);
            resultDiv.innerHTML = `<div style="font-size:2rem;font-weight:bold;color:#FFD700;text-shadow:2px 2px 8px #000;margin-bottom:8px;">${confettiTitle}</div><div style="font-size:1.2rem;color:#00FF66;margin-bottom:8px;">${confettiMsg}</div>` + resultDiv.innerHTML;
          }
          const text = t.won.replace("{username}", username).replace("{prize}", wonPrize);
          resultDiv.innerText = text;
          history.innerHTML += `• ${text}<br>`;

          // --- Save to backend, then update localStorage ---
          fetch('https://luckyspin-backend.onrender.com/api/spin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, prize: wonPrize })
          })
          .then(res => res.json())
          .then(data => {
            // Only after backend confirms, set localStorage
            localStorage.setItem("spun_" + username, "true");
            // Save to local spin_records for history (optional)
            const today = new Date().toISOString().slice(0,10);
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
    fetch('https://luckyspin-backend.onrender.com/api/spins')
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
  {en: "Aung Khat", mm: "shang5****"},
  {en: "shang2****", mm: "shang2****"},
  {en: "shang8**** ", mm: "shang8****"},
  {en: "shang2****", mm: "shang2****"},
  {en: "shang6****", mm: "shang6****"},
  {en: "TTH3****", mm: "TTH9****"},
  {en: "TTH5****", mm: "TTH5****"},
  {en: "TTH4****", mm: "TTH4****"},
  {en: "TTH7****", mm: "TTH7****"},
  {en: "MSG12***", mm: "MSG12***"},
  {en: "MSG35***", mm: "MSG35***"},
  {en: "MSG85***", mm: "MSG85***"},
  {en: "MSG63***", mm: "MSG63***"},
  {en: "MSG75***", mm: "MSG75***"},
  {en: "waim1***", mm: "waim1***"},
  {en: "jjoe6***", mm: "jjoe6***"},
  {en: "Kxhain***", mm: "Kxhain***"},
  {en: "mathu****", mm: "mathu****"},
  {en: "bbx****", mm: "bbx****"},
  {en: "bet01***", mm: "bet01***"}
  
];

const winnerPrizes = [
  "500 MMK", "1,000 MMK", "2,000 MMK", "3,000 MMK", "5,000 MMK", "10,000 MMK"
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
  // Make the modal box larger
  const modalBox = document.querySelector('#realUsersModal > div');
  if (modalBox) {
    modalBox.style.maxWidth = '700px';
    modalBox.style.width = '90vw';
    modalBox.style.minWidth = '400px';
    modalBox.style.padding = '40px 30px';
    // Adjust close button to be plain '×' with no background
    const closeBtn = document.getElementById('closeRealUsersModal');
    if (closeBtn) {
      closeBtn.style.background = 'none';
      closeBtn.style.border = 'none';
      closeBtn.style.borderRadius = '0';
      closeBtn.style.width = '44px';
      closeBtn.style.height = '44px';
      closeBtn.style.fontSize = '28px';
      closeBtn.style.lineHeight = '44px';
      closeBtn.style.textAlign = 'center';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.position = 'absolute';
      closeBtn.style.left = '50%';
      closeBtn.style.top = '-22px';
      closeBtn.style.transform = 'translateX(-50%)';
      closeBtn.style.zIndex = '10';
    }
  }
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
function showRealUsers(dateFilter = null) {
  const ul = document.getElementById("realUsersUl");
  ul.innerHTML = "";

  // Fetch from backend
  fetch('https://luckyspin-backend.onrender.com/api/spins')
    .then(res => res.json())
    .then(records => {
      if (!records.length) {
        ul.innerHTML = "<li style='color:#fff;'>No user has spun yet.</li>";
        return;
      }
      // Filter by date if needed
      let filtered = records;
      if (dateFilter) {
        filtered = records.filter(r => {
          const d = new Date(r.date);
          const y = d.getFullYear();
          const m = String(d.getMonth()+1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${day}`;
          return dateStr === dateFilter;
        });
      }
      // Sort by date descending
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      // Calculate totals
      const uniqueUsers = new Set(filtered.map(r => (r.username || '').toLowerCase()));
      let totalPrize = 0;
      function myanmarToEnglish(str) {
        const myanmarDigits = '၀၁၂၃၄၅၆၇၈၉';
        return str.replace(/[၀-၉]/g, d => myanmarDigits.indexOf(d));
      }
      filtered.forEach(r => {
        let prizeStr = (r.prize || '').replace(/,/g, '');
        prizeStr = myanmarToEnglish(prizeStr);
        if (/\d+/.test(prizeStr) && (prizeStr.includes('MMK') || prizeStr.includes('ကျပ်'))) {
          let match = prizeStr.match(/(\d+)/);
          if (match) totalPrize += parseInt(match[1], 10);
        }
      });
      // Create a table for better formatting
      let html = `<div style='text-align:center;margin-bottom:12px;'><span style='font-size:22px;font-weight:bold;color:#fff;'>🎯 Spin Records</span></div>`;
      html += `<div style='color:#FFD700;font-size:17px;margin-bottom:10px;'>Total Users: <b>${uniqueUsers.size}</b> &nbsp; | &nbsp; Total Prize: <b>${totalPrize.toLocaleString()} MMK</b></div>`;
      // The date search box is added by addDateSearchToModal(), so do not add it here
      html += `<div style="max-height:52vh;min-height:180px;overflow-y:auto;margin:0 auto;width:100%;background:#181818;border-radius:12px;box-shadow:0 2px 12px #0002;">
        <table style="width:100%;color:#fff;font-size:15px;border-collapse:separate;border-spacing:0 6px;table-layout:fixed;">
          <thead>
            <tr style='border-bottom:2px solid #FFD700;'>
              <th style='padding:8px 4px;width:32%;text-align:left;'>Date</th>
              <th style='padding:8px 4px;width:34%;text-align:left;'>Username</th>
              <th style='padding:8px 4px;width:34%;text-align:left;'>Prize</th>
            </tr>
          </thead>
          <tbody>`;
      filtered.forEach(r => {
        const dateObj = new Date(r.date);
        const date = dateObj.getFullYear() + '-' + String(dateObj.getMonth()+1).padStart(2, '0') + '-' + String(dateObj.getDate()).padStart(2, '0');
        html += `<tr style='background:#222;border-radius:8px;'>
          <td style='padding:7px 4px;border-radius:8px 0 0 8px;word-break:break-all;'>${date}</td>
          <td style='padding:7px 4px;word-break:break-all;'>${r.username}</td>
          <td style='padding:7px 4px;border-radius:0 8px 8px 0;color:#FFD700;font-weight:bold;'>${r.prize}</td>
        </tr>`;
      });
      html += '</tbody></table></div>';
      ul.innerHTML = html;
    })
    .catch(() => {
      ul.innerHTML = "<li style='color:#fff;'>Could not load real user data.</li>";
    });
}

// Add date search input to modal
function addDateSearchToModal() {
  const modalBox = document.querySelector('#realUsersModal > div');
  if (!modalBox) return;
  if (document.getElementById('realUsersDateSearch')) return;
  const searchDiv = document.createElement('div');
  searchDiv.style = 'text-align:center;margin-bottom:16px;';
  searchDiv.innerHTML = `
    <input id="realUsersDateSearch" type="date" style="padding:6px 10px;border-radius:5px;font-size:16px;max-width:180px;">
    <button id="realUsersDateBtn" style="margin-left:8px;background:#FFD700;color:#111;font-weight:bold;padding:6px 16px;border-radius:6px;">Search</button>
    <button id="realUsersDateClear" style="margin-left:8px;background:#444;color:#fff;font-weight:bold;padding:6px 16px;border-radius:6px;">All</button>
  `;
  modalBox.insertBefore(searchDiv, modalBox.children[1]);
  document.getElementById('realUsersDateBtn').onclick = function() {
    const val = document.getElementById('realUsersDateSearch').value;
    if (val) showRealUsers(val);
  };
  document.getElementById('realUsersDateClear').onclick = function() {
    document.getElementById('realUsersDateSearch').value = '';
    showRealUsers();
  };
}

// Update modal open handler to add date search
const origViewRealUsersBtn = document.getElementById("viewRealUsersBtn").onclick;
document.getElementById("viewRealUsersBtn").onclick = function() {
  if (origViewRealUsersBtn) origViewRealUsersBtn();
  addDateSearchToModal();
  showRealUsers();
};

// --- Reset Database Modal Logic ---
function createResetModal() {
  if (document.getElementById('resetDbModal')) return;
  const modal = document.createElement('div');
  modal.id = 'resetDbModal';
  modal.style = 'display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);z-index:10000;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:#222;padding:30px 20px 20px 20px;border-radius:12px;max-width:350px;margin:auto;position:relative;min-width:280px;">
      <button id="closeResetDbModal" style="position:absolute;left:50%;top:-22px;transform:translateX(-50%);background:none;border:none;border-radius:0;width:44px;height:44px;font-size:28px;line-height:44px;text-align:center;cursor:pointer;z-index:10;">×</button>
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
        fetch('https://luckyspin-backend.onrender.com/api/spins/user/' + encodeURIComponent(userToDelete), { method: 'DELETE' })
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
