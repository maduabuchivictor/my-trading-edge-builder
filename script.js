// ========================================
// TRADING EDGE BUILDER v2.1
// Advanced Trading Analytics Platform
// ========================================

// FEATURES:
// 1. MULTI-IMAGE UPLOAD
//    - Up to 4 images per trade (enforced at selection and submission)
//    - Live preview of selected images before submitting
//    - Image persistence in localStorage
//    - Full-size image viewer with modal on click
//
// 2. ADVANCED FILTERING
//    - Filter by pair, strategy, timeframe, outcome (win/loss), date range
//    - Slide-out filter panel from left side
//    - Apply and reset filter functionality
//    - "No data found" message when filter yields no results
//
// 3. TRADE HISTORY MANAGEMENT
//    - Toggle between showing recent trade only or all trades
//    - Filtered results respect the show/all toggle
//    - Dashboard stats update based on filtered data
//
// 4. TRADING STATISTICS
//    - Total trades, wins, losses, and win rate in dashboard
//    - Win streak calculation (consecutive wins)
//    - Detailed stats by pair with strategy and timeframe breakdowns
//    - Combo analysis (strategy + timeframe combinations)
//
// 5. MANAGEMENT TOOLS
//    - Add/edit/delete custom strategies, timeframes, and currency pairs
//    - Dynamic dropdown updates across the app
//    - Separated into slide-out panel from left
//    - Mutual exclusion with filter panel
//
// 6. SIDE PANEL SYSTEM (v2.1)
//    - Slide-out animation from left (300ms transitions)
//    - Mutually exclusive panels (opening one closes the other)
//    - X close buttons for easy dismissal
//    - Smooth UX for switching between panels
//
// 7. DATA PERSISTENCE
//    - All trades stored in browser localStorage
//    - Auto-save on every action
//    - Data survives page refresh
//
// 8. RESPONSIVE DESIGN
//    - Mobile-first approach
//    - Desktop + tablet optimized
//    - Touch-friendly interface
//    - Dark/light mode support

// ======== Load trades and management lists from localStorage ========
let trades = JSON.parse(localStorage.getItem("trades")) || [];
// normalize older trade entries that stored a single screenshot string
trades = trades.map((t) => {
  if (t.screenshot && !t.screenshots) {
    t.screenshots = [t.screenshot];
    delete t.screenshot;
  }
  // ensure screenshots is always an array
  if (!t.screenshots) t.screenshots = [];
  return t;
});
let strategies = JSON.parse(localStorage.getItem("strategies")) || [
  "Sweep + LTF CHOCH",
  "Sweep + BOS + RTO",
  "HTF Pullback + LTF CHOCH",
];
let timeframes = JSON.parse(localStorage.getItem("timeframes")) || [
  "M1",
  "M5",
  "M15",
  "M30",
  "H1",
  "H4",
  "D1",
];
let pairs = JSON.parse(localStorage.getItem("pairs")) || [
  "EURUSD",
  "BTCUSD",
  "USDJPY",
];

// track screenshots while editing a trade (preserve if user doesn't change them)
let currentEditingScreenshots = null;

// ======== Filter state ========
let filterState = {
  pair: "",
  result: "",
  strategy: "",
  timeframe: "",
  from: "",
  to: "",
};
let showAll = false;

// ======== DOM Elements ========
const form = document.getElementById("tradeForm");
const tradeList = document.getElementById("tradeList");
const setupSelect = document.getElementById("setup");
const timeframeSelect = document.getElementById("timeframe");
const pairSelect = document.getElementById("pair");
const screenshotInput = document.getElementById("screenshot");
const previewContainer = document.getElementById("previewContainer");

// filter panel elements
const filterBtn = document.getElementById("filterBtn");
const filterPanel = document.getElementById("filterPanel");
const closeFilterBtn = document.getElementById("closeFilterBtn");
const filterPair = document.getElementById("filterPair");
const filterResult = document.getElementById("filterResult");
const filterStrategy = document.getElementById("filterStrategy");
const filterTimeframe = document.getElementById("filterTimeframe");
const filterFrom = document.getElementById("filterFrom");
const filterTo = document.getElementById("filterTo");
const applyFilterBtn = document.getElementById("applyFilterBtn");
const resetFilterBtn = document.getElementById("resetFilterBtn");
const toggleShowBtn = document.getElementById("toggleShowBtn");

const manageToolsBtn = document.getElementById("manageToolsBtn");
const managementTools = document.getElementById("managementTools");
const closeManagementBtn = document.getElementById("closeManagementBtn");

// Management tools elements
const strategyList = document.getElementById("strategyList");
const timeframeList = document.getElementById("timeframeList");
const pairList = document.getElementById("pairList");

const newStrategyInput = document.getElementById("newStrategy");
const newTimeframeInput = document.getElementById("newTimeframe");
const newPairInput = document.getElementById("newPair");

const addStrategyBtn = document.getElementById("addStrategyBtn");
const addTimeframeBtn = document.getElementById("addTimeframeBtn");
const addPairBtn = document.getElementById("addPairBtn");

const resetAllBtn = document.getElementById("resetAllBtn");

// ======== Initialize selects ========
function populateSelects() {
  setupSelect.innerHTML = "";
  strategies.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    setupSelect.appendChild(opt);
  });

  timeframeSelect.innerHTML = "";
  timeframes.forEach((tf) => {
    const opt = document.createElement("option");
    opt.value = tf;
    opt.textContent = tf;
    timeframeSelect.appendChild(opt);
  });

  pairSelect.innerHTML = "";
  pairs.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    pairSelect.appendChild(opt);
  });
}

// populate the filter dropdowns using current lists
function populateFilterOptions() {
  filterPair.innerHTML = "<option value=''>Any Pair</option>";
  pairs.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    filterPair.appendChild(opt);
  });

  filterStrategy.innerHTML = "<option value=''>Any Strategy</option>";
  strategies.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    filterStrategy.appendChild(opt);
  });

  filterTimeframe.innerHTML = "<option value=''>Any Timeframe</option>";
  timeframes.forEach((tf) => {
    const opt = document.createElement("option");
    opt.value = tf;
    opt.textContent = tf;
    filterTimeframe.appendChild(opt);
  });
}

// toggle filter panel - close management panel if opening
function toggleFilterPanel() {
  const isFilterOpen = filterPanel.classList.contains("open");
  if (!isFilterOpen) {
    // Opening filter, close management
    managementTools.classList.remove("open");
  }
  filterPanel.classList.toggle("open");
}

// ======== Management Tools ========
function renderManagementLists() {
  // Strategies
  strategyList.innerHTML = "";
  strategies.forEach((s, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${s}</span>
      <div>
        <button onclick="editItem('strategy',${i})">✏</button>
        <button onclick="deleteItem('strategy',${i})">🗑</button>
      </div>`;
    strategyList.appendChild(li);
  });

  // Timeframes
  timeframeList.innerHTML = "";
  timeframes.forEach((t, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${t}</span>
      <div>
        <button onclick="editItem('timeframe',${i})">✏</button>
        <button onclick="deleteItem('timeframe',${i})">🗑</button>
      </div>`;
    timeframeList.appendChild(li);
  });

  // Pairs
  pairList.innerHTML = "";
  pairs.forEach((p, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${p}</span>
      <div>
        <button onclick="editItem('pair',${i})">✏</button>
        <button onclick="deleteItem('pair',${i})">🗑</button>
      </div>`;
    pairList.appendChild(li);
  });
}

function saveManagement() {
  localStorage.setItem("strategies", JSON.stringify(strategies));
  localStorage.setItem("timeframes", JSON.stringify(timeframes));
  localStorage.setItem("pairs", JSON.stringify(pairs));
  populateSelects();
  populateFilterOptions();
  renderManagementLists();
}

// ======== Add new management items ========
addStrategyBtn.addEventListener("click", () => {
  const val = newStrategyInput.value.trim();
  if (val && !strategies.includes(val)) strategies.push(val);
  newStrategyInput.value = "";
  saveManagement();
});
addTimeframeBtn.addEventListener("click", () => {
  const val = newTimeframeInput.value.trim();
  if (val && !timeframes.includes(val)) timeframes.push(val);
  newTimeframeInput.value = "";
  saveManagement();
});
addPairBtn.addEventListener("click", () => {
  const val = newPairInput.value.trim();
  if (val && !pairs.includes(val)) pairs.push(val);
  newPairInput.value = "";
  saveManagement();
});

// ======== Edit/Delete management items ========
function editItem(type, index) {
  const newName = prompt("Enter new name:");
  if (!newName) return;
  if (type === "strategy") strategies[index] = newName;
  else if (type === "timeframe") timeframes[index] = newName;
  else if (type === "pair") pairs[index] = newName;
  saveManagement();
}

function deleteItem(type, index) {
  if (!confirm("Are you sure you want to delete this item?")) return;
  if (type === "strategy") strategies.splice(index, 1);
  else if (type === "timeframe") timeframes.splice(index, 1);
  else if (type === "pair") pairs.splice(index, 1);
  saveManagement();
}

// ======== Reset All Data ========
resetAllBtn.addEventListener("click", () => {
  if (
    confirm("⚠ Are you sure you want to erase ALL trades and management data?")
  ) {
    localStorage.clear();
    trades = [];
    strategies = [];
    timeframes = [];
    pairs = [];
    filterState = {
      pair: "",
      result: "",
      strategy: "",
      timeframe: "",
      from: "",
      to: "",
    };
    showAll = false;
    populateSelects();
    populateFilterOptions();
    renderManagementLists();
    renderTrades();
    renderPairStats();
    updateShowAllButtonText();
  }
});

// ======== Toggle management panel from left ========
manageToolsBtn.addEventListener("click", () => {
  const isManagementOpen = managementTools.classList.contains("open");
  if (!isManagementOpen) {
    // Opening management, close filter
    filterPanel.classList.remove("open");
  }
  managementTools.classList.toggle("open");
});

// close management panel with close button
closeManagementBtn.addEventListener("click", () => {
  managementTools.classList.remove("open");
});

// ======== Image preview helper ========
function showImagePreviews(sources) {
  previewContainer.innerHTML = "";
  if (!sources) return;
  sources.forEach((src) => {
    const img = document.createElement("img");
    img.src = src;
    previewContainer.appendChild(img);
  });
}

// ======== Screenshot input change listener ========
screenshotInput.addEventListener("change", () => {
  let files = Array.from(screenshotInput.files);
  if (files.length > 4) {
    alert("You can only select up to 4 images.");
    // keep first 4 files only by recreating FileList
    const dt = new DataTransfer();
    files.slice(0, 4).forEach((f) => dt.items.add(f));
    screenshotInput.files = dt.files;
    files = Array.from(dt.files);
  }
  previewContainer.innerHTML = "";
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement("img");
      img.src = ev.target.result;
      previewContainer.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

// ======== Filter panel interactions ========
filterBtn.addEventListener("click", toggleFilterPanel);
applyFilterBtn.addEventListener("click", () => {
  // read values
  filterState.pair = filterPair.value;
  filterState.result = filterResult.value;
  filterState.strategy = filterStrategy.value;
  filterState.timeframe = filterTimeframe.value;
  filterState.from = filterFrom.value;
  filterState.to = filterTo.value;
  showAll = true; // when applying a filter, show all matching
  updateShowAllButtonText();
  renderTrades();
  toggleFilterPanel();
});
resetFilterBtn.addEventListener("click", () => {
  filterState = {
    pair: "",
    result: "",
    strategy: "",
    timeframe: "",
    from: "",
    to: "",
  };
  filterPair.value = "";
  filterResult.value = "";
  filterStrategy.value = "";
  filterTimeframe.value = "";
  filterFrom.value = "";
  filterTo.value = "";
  showAll = false;
  updateShowAllButtonText();
  renderTrades();
});

// close filter panel with close button
closeFilterBtn.addEventListener("click", () => {
  filterPanel.classList.remove("open");
});

toggleShowBtn.addEventListener("click", () => {
  showAll = !showAll;
  updateShowAllButtonText();
  renderTrades();
});

// apply filtering rules to a trades array
function applyFilters(sourceTrades) {
  return sourceTrades.filter((t) => {
    if (filterState.pair && t.pair !== filterState.pair) return false;
    if (filterState.result && t.result !== filterState.result) return false;
    if (filterState.strategy && t.setup !== filterState.strategy) return false;
    if (filterState.timeframe && t.timeframe !== filterState.timeframe)
      return false;
    if (filterState.from) {
      const d = new Date(t.date);
      if (d < new Date(filterState.from)) return false;
    }
    if (filterState.to) {
      const d = new Date(t.date);
      if (d > new Date(filterState.to)) return false;
    }
    return true;
  });
}

function updateShowAllButtonText() {
  toggleShowBtn.textContent = showAll ? "Show Recent Trade" : "Show All Trades";
}

// ======== Submit Trade ========
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const now = new Date();
  const trade = {
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    setup: setupSelect.value,
    timeframe: timeframeSelect.value,
    pair: pairSelect.value,
    result: document.getElementById("result").value,
    note: document.getElementById("note").value,
    screenshots: [],
  };
  if (screenshotInput.files.length > 0) {
    // enforce max 4 again just before saving
    let files = Array.from(screenshotInput.files);
    if (files.length > 4) {
      files = files.slice(0, 4);
    }
    const readers = files.map(
      (file) =>
        new Promise((resolve) => {
          const r = new FileReader();
          r.onload = (ev) => resolve(ev.target.result);
          r.readAsDataURL(file);
        }),
    );
    Promise.all(readers).then((results) => {
      trade.screenshots = results;
      trades.push(trade);
      currentEditingScreenshots = null;
      saveAndRender();
    });
  } else if (currentEditingScreenshots) {
    // reuse previously stored screenshots when editing
    trade.screenshots = currentEditingScreenshots;
    currentEditingScreenshots = null;
    trades.push(trade);
    saveAndRender();
  } else {
    trades.push(trade);
    saveAndRender();
  }
});

// ======== Save and render ========
function saveAndRender() {
  localStorage.setItem("trades", JSON.stringify(trades));
  renderTrades();
  renderPairStats();
  form.reset();
  previewContainer.innerHTML = "";
}

// ======== Render Trades ========
function renderTrades() {
  tradeList.innerHTML = "";
  // apply filters first
  let visible = applyFilters(trades);
  if (!showAll && visible.length > 1) {
    visible = [visible[visible.length - 1]]; // only most recent
  }
  if (visible.length === 0) {
    const msg = document.createElement("p");
    msg.textContent = "No data found.";
    msg.style.textAlign = "center";
    msg.style.padding = "20px";
    tradeList.appendChild(msg);
  } else {
    visible.forEach((t, i) => {
      const card = document.createElement("div");
      card.className = "trade-card";
      card.innerHTML = `
        <div class="trade-header">
          Trade ${i + 1}: <span class="${t.result}">${t.result.toUpperCase()}</span>
        </div>
        📅 ${t.date} | ⏰ ${t.time}<br>
        📌 ${t.setup} | 🕒 ${t.timeframe} | 💹 ${t.pair}
        ${t.note ? `<div class="trade-note">📝 ${t.note}</div>` : ""}
        ${t.screenshots && t.screenshots.length ? t.screenshots.map((src) => `<img src="${src}" onclick="openModal(this.src)">`).join("") : ""}
        <div class="trade-actions">
          <button onclick="editTrade(${i})">✏ Edit</button>
          <button onclick="deleteTrade(${i})">🗑 Delete</button>
        </div>
      `;
      tradeList.appendChild(card);
    });
  }
  updateDashboard();
  drawEquityCurve();
}

// ======== Edit/Delete Trade ========
function editTrade(index) {
  const t = trades[index];
  setupSelect.value = t.setup;
  timeframeSelect.value = t.timeframe;
  pairSelect.value = t.pair;
  document.getElementById("result").value = t.result;
  document.getElementById("note").value = t.note;
  // hold onto screenshots so we can reuse them if the user doesn't select new ones
  currentEditingScreenshots = t.screenshots.slice();
  trades.splice(index, 1);
  saveAndRender();
  // show the screenshots again after reset
  showImagePreviews(currentEditingScreenshots);
}
function deleteTrade(index) {
  trades.splice(index, 1);
  saveAndRender();
}

// ======== Dashboard ========
function updateDashboard() {
  // use filtered list for dashboard stats
  const list = applyFilters(trades);
  const total = list.length;
  const wins = list.filter((t) => t.result === "win").length;
  document.getElementById("totalTrades").textContent = total;
  document.getElementById("overallWinRate").textContent = total
    ? ((wins / total) * 100).toFixed(1) + "%"
    : "0%";

  // Win Streak (within filtered list)
  let streak = 0,
    maxStreak = 0;
  list.forEach((t) => {
    if (t.result === "win") {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else streak = 0;
  });
  document.getElementById("winStreak").textContent = maxStreak;

  // update win/loss counters
  const winCount = wins;
  const lossCount = total - wins;
  document.getElementById("winCount").textContent = winCount;
  document.getElementById("lossCount").textContent = lossCount;
}

// ======== Equity Curve ========
function drawEquityCurve() {
  const canvas = document.getElementById("equityChart");
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth;
  canvas.height = 200;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let equity = 100;
  let points = [equity];
  trades.forEach((t) => {
    equity += t.result === "win" ? 10 : -10;
    points.push(equity);
  });
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - points[0]);
  const step = canvas.width / Math.max(points.length - 1, 1);
  points.forEach((p, i) => {
    ctx.lineTo(i * step, canvas.height - p);
  });
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ======== Pair-based Detailed Stats with Strategy+Timeframe Combos ========
function renderPairStats() {
  const container = document.getElementById("pairStatsContainer");
  container.innerHTML = "";

  pairs.forEach((pair) => {
    const pairTrades = trades.filter((t) => t.pair === pair);
    if (pairTrades.length === 0) return;

    const card = document.createElement("div");
    card.className = "pair-card";
    card.innerHTML = `<h4>💹 ${pair} (${pairTrades.length} trades)</h4>`;

    // ===== Strategy Stats =====
    const stratStats = {};
    pairTrades.forEach((t) => {
      if (!stratStats[t.setup]) stratStats[t.setup] = { wins: 0, total: 0 };
      stratStats[t.setup].total++;
      if (t.result === "win") stratStats[t.setup].wins++;
    });
    card.innerHTML += "<b>Strategies:</b><br>";
    for (let s in stratStats) {
      const winRate = (
        (stratStats[s].wins / stratStats[s].total) *
        100
      ).toFixed(1);
      const cls = winRate >= 50 ? "strategy-win" : "strategy-loss";
      card.innerHTML += `• <span class="${cls}">${s} → ${winRate}%</span><br>`;
    }

    // ===== Timeframe Stats =====
    const tfStats = {};
    pairTrades.forEach((t) => {
      if (!tfStats[t.timeframe]) tfStats[t.timeframe] = { wins: 0, total: 0 };
      tfStats[t.timeframe].total++;
      if (t.result === "win") tfStats[t.timeframe].wins++;
    });
    card.innerHTML += "<b>Timeframes:</b><br>";
    for (let tf in tfStats) {
      const winRate = ((tfStats[tf].wins / tfStats[tf].total) * 100).toFixed(1);
      card.innerHTML += `• ${tf} → ${winRate}%<br>`;
    }

    // ===== Strategy+Timeframe Combo Stats =====
    const comboStats = {};
    pairTrades.forEach((t) => {
      const key = `${t.setup} | ${t.timeframe}`;
      if (!comboStats[key]) comboStats[key] = { wins: 0, total: 0 };
      comboStats[key].total++;
      if (t.result === "win") comboStats[key].wins++;
    });

    card.innerHTML += "<b>Combos:</b><br>";
    for (let combo in comboStats) {
      const winRate = (
        (comboStats[combo].wins / comboStats[combo].total) *
        100
      ).toFixed(1);
      const cls = winRate >= 50 ? "strategy-win" : "strategy-loss"; // green/red
      card.innerHTML += `• <span class="${cls}">${combo} → ${winRate}%</span><br>`;
    }

    container.appendChild(card);
  });
}

// ======== Image Modal ========
function openModal(src) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  modalImg.src = src;
  modal.style.display = "flex";
}
document.getElementById("closeModal").onclick = function () {
  document.getElementById("imageModal").style.display = "none";
};

// ======== Theme Toggle ========
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
});

// ======== Initial Render ========
populateSelects();
populateFilterOptions();
renderManagementLists();
renderTrades();
renderPairStats();
updateShowAllButtonText();
