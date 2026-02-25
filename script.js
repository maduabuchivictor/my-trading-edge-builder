// ======== Load trades and management lists from localStorage ========
let trades = JSON.parse(localStorage.getItem("trades")) || [];
let strategies = JSON.parse(localStorage.getItem("strategies")) || ["Sweep + LTF CHOCH","Sweep + BOS + RTO","HTF Pullback + LTF CHOCH"];
let timeframes = JSON.parse(localStorage.getItem("timeframes")) || ["M1","M5","M15","M30","H1","H4","D1"];
let pairs = JSON.parse(localStorage.getItem("pairs")) || ["EURUSD","BTCUSD","USDJPY"];

// ======== DOM Elements ========
const form = document.getElementById("tradeForm");
const tradeList = document.getElementById("tradeList");
const setupSelect = document.getElementById("setup");
const timeframeSelect = document.getElementById("timeframe");
const pairSelect = document.getElementById("pair");

const manageToolsBtn = document.getElementById("manageToolsBtn");
const managementTools = document.getElementById("managementTools");

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
  strategies.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    setupSelect.appendChild(opt);
  });

  timeframeSelect.innerHTML = "";
  timeframes.forEach(tf => {
    const opt = document.createElement("option");
    opt.value = tf;
    opt.textContent = tf;
    timeframeSelect.appendChild(opt);
  });

  pairSelect.innerHTML = "";
  pairs.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    pairSelect.appendChild(opt);
  });
}

// ======== Management Tools ========
function renderManagementLists() {
  // Strategies
  strategyList.innerHTML = "";
  strategies.forEach((s,i)=>{
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
  timeframes.forEach((t,i)=>{
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
  pairs.forEach((p,i)=>{
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
  renderManagementLists();
}

// ======== Add new management items ========
addStrategyBtn.addEventListener("click",()=>{
  const val = newStrategyInput.value.trim();
  if(val && !strategies.includes(val)) strategies.push(val);
  newStrategyInput.value="";
  saveManagement();
});
addTimeframeBtn.addEventListener("click",()=>{
  const val = newTimeframeInput.value.trim();
  if(val && !timeframes.includes(val)) timeframes.push(val);
  newTimeframeInput.value="";
  saveManagement();
});
addPairBtn.addEventListener("click",()=>{
  const val = newPairInput.value.trim();
  if(val && !pairs.includes(val)) pairs.push(val);
  newPairInput.value="";
  saveManagement();
});

// ======== Edit/Delete management items ========
function editItem(type,index){
  const newName = prompt("Enter new name:");
  if(!newName) return;
  if(type==="strategy") strategies[index]=newName;
  else if(type==="timeframe") timeframes[index]=newName;
  else if(type==="pair") pairs[index]=newName;
  saveManagement();
}

function deleteItem(type,index){
  if(!confirm("Are you sure you want to delete this item?")) return;
  if(type==="strategy") strategies.splice(index,1);
  else if(type==="timeframe") timeframes.splice(index,1);
  else if(type==="pair") pairs.splice(index,1);
  saveManagement();
}

// ======== Reset All Data ========
resetAllBtn.addEventListener("click",()=>{
  if(confirm("⚠ Are you sure you want to erase ALL trades and management data?")){
    localStorage.clear();
    trades=[]; strategies=[]; timeframes=[]; pairs=[];
    populateSelects();
    renderManagementLists();
    renderTrades();
    renderPairStats();
  }
});

// ======== Toggle management panel ========
manageToolsBtn.addEventListener("click",()=>{
  managementTools.style.display = managementTools.style.display==="none" ? "block" : "none";
});

// ======== Submit Trade ========
form.addEventListener("submit",(e)=>{
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
    screenshot: null
  };
  const screenshotInput = document.getElementById("screenshot");
  if(screenshotInput.files.length>0){
    const reader = new FileReader();
    reader.onload = function(ev){
      trade.screenshot=ev.target.result;
      trades.push(trade);
      saveAndRender();
    };
    reader.readAsDataURL(screenshotInput.files[0]);
  } else {
    trades.push(trade);
    saveAndRender();
  }
});

// ======== Save and render ========
function saveAndRender(){
  localStorage.setItem("trades",JSON.stringify(trades));
  renderTrades();
  renderPairStats();
  form.reset();
}

// ======== Render Trades ========
function renderTrades(){
  tradeList.innerHTML="";
  trades.forEach((t,i)=>{
    const card=document.createElement("div");
    card.className="trade-card";
    card.innerHTML=`
      <div class="trade-header">
        Trade ${i+1}: <span class="${t.result}">${t.result.toUpperCase()}</span>
      </div>
      📅 ${t.date} | ⏰ ${t.time}<br>
      📌 ${t.setup} | 🕒 ${t.timeframe} | 💹 ${t.pair}
      ${t.note?`<div class="trade-note">📝 ${t.note}</div>`:""}
      ${t.screenshot?`<img src="${t.screenshot}" onclick="openModal(this.src)">`:""}
      <div class="trade-actions">
        <button onclick="editTrade(${i})">✏ Edit</button>
        <button onclick="deleteTrade(${i})">🗑 Delete</button>
      </div>
    `;
    tradeList.appendChild(card);
  });
  updateDashboard();
  drawEquityCurve();
}

// ======== Edit/Delete Trade ========
function editTrade(index){
  const t=trades[index];
  setupSelect.value=t.setup;
  timeframeSelect.value=t.timeframe;
  pairSelect.value=t.pair;
  document.getElementById("result").value=t.result;
  document.getElementById("note").value=t.note;
  trades.splice(index,1);
  saveAndRender();
}
function deleteTrade(index){
  trades.splice(index,1);
  saveAndRender();
}

// ======== Dashboard ========
function updateDashboard(){
  const total=trades.length;
  const wins=trades.filter(t=>t.result==="win").length;
  document.getElementById("totalTrades").textContent=total;
  document.getElementById("overallWinRate").textContent=total?((wins/total)*100).toFixed(1)+"%":"0%";

  // Win Streak
  let streak=0,maxStreak=0;
  trades.forEach(t=>{if(t.result==="win"){streak++; maxStreak=Math.max(maxStreak,streak);} else streak=0;});
  document.getElementById("winStreak").textContent=maxStreak;
}

// ======== Equity Curve ========
function drawEquityCurve(){
  const canvas=document.getElementById("equityChart");
  const ctx=canvas.getContext("2d");
  canvas.width=canvas.offsetWidth;
  canvas.height=200;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  let equity=100; let points=[equity];
  trades.forEach(t=>{equity+=t.result==="win"?10:-10;points.push(equity);});
  ctx.beginPath();
  ctx.moveTo(0,canvas.height-points[0]);
  const step=canvas.width/Math.max(points.length-1,1);
  points.forEach((p,i)=>{ctx.lineTo(i*step,canvas.height-p);});
  ctx.strokeStyle="#3b82f6";
  ctx.lineWidth=2;
  ctx.stroke();
}

// ======== Pair-based Detailed Stats with Strategy+Timeframe Combos ========
function renderPairStats(){
  const container=document.getElementById("pairStatsContainer");
  container.innerHTML="";
  
  pairs.forEach(pair=>{
    const pairTrades = trades.filter(t => t.pair === pair);
    if(pairTrades.length === 0) return;

    const card = document.createElement("div");
    card.className="pair-card";
    card.innerHTML=`<h4>💹 ${pair} (${pairTrades.length} trades)</h4>`;

    // ===== Strategy Stats =====
    const stratStats={};
    pairTrades.forEach(t=>{
      if(!stratStats[t.setup]) stratStats[t.setup]={wins:0,total:0};
      stratStats[t.setup].total++;
      if(t.result==="win") stratStats[t.setup].wins++;
    });
    card.innerHTML+="<b>Strategies:</b><br>";
    for(let s in stratStats){
      const winRate = ((stratStats[s].wins / stratStats[s].total) * 100).toFixed(1);
      const cls = winRate >= 50 ? "strategy-win" : "strategy-loss";
      card.innerHTML += `• <span class="${cls}">${s} → ${winRate}%</span><br>`;
    }

    // ===== Timeframe Stats =====
    const tfStats={};
    pairTrades.forEach(t=>{
      if(!tfStats[t.timeframe]) tfStats[t.timeframe]={wins:0,total:0};
      tfStats[t.timeframe].total++;
      if(t.result==="win") tfStats[t.timeframe].wins++;
    });
    card.innerHTML+="<b>Timeframes:</b><br>";
    for(let tf in tfStats){
      const winRate = ((tfStats[tf].wins / tfStats[tf].total) * 100).toFixed(1);
      card.innerHTML += `• ${tf} → ${winRate}%<br>`;
    }

    // ===== Strategy+Timeframe Combo Stats =====
    const comboStats={};
    pairTrades.forEach(t=>{
      const key = `${t.setup} | ${t.timeframe}`;
      if(!comboStats[key]) comboStats[key]={wins:0,total:0};
      comboStats[key].total++;
      if(t.result==="win") comboStats[key].wins++;
    });

    card.innerHTML+="<b>Combos:</b><br>";
    for(let combo in comboStats){
      const winRate = ((comboStats[combo].wins / comboStats[combo].total) * 100).toFixed(1);
      const cls = winRate >= 50 ? "strategy-win" : "strategy-loss"; // green/red
      card.innerHTML += `• <span class="${cls}">${combo} → ${winRate}%</span><br>`;
    }

    container.appendChild(card);
  });
}

// ======== Image Modal ========
function openModal(src){
  const modal=document.getElementById("imageModal");
  const modalImg=document.getElementById("modalImage");
  modalImg.src=src;
  modal.style.display="flex";
}
document.getElementById("closeModal").onclick=function(){
  document.getElementById("imageModal").style.display="none";
};

// ======== Theme Toggle ========
document.getElementById("themeToggle").addEventListener("click",()=>{
  document.body.classList.toggle("light-mode");
});

// ======== Initial Render ========
populateSelects();
renderManagementLists();
renderTrades();
renderPairStats();