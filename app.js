document.addEventListener("DOMContentLoaded", () => {
  const addPlayerBtn = document.querySelector(".addPlayerBtn");
  const playersGrid = document.getElementById("playersGrid");

  const totalPotEl = document.getElementById("totalPot");
  const totalChipsEl = document.getElementById("totalChips");

  const settlementSection = document.getElementById("settlement-results");
  const calcBtn = document.getElementById("calcBtn");
  const calculatorNavBtn = document.querySelector(".Calculate-btn");
  const historyNavBtn = document.getElementById("showHistoryBtn");
  const balancesContainer = settlementSection.querySelector(".balances-list");
  const transactionsContainer = settlementSection.querySelector(".transactions-list");

  const MIN_PLAYERS = 2;
  const MAX_PLAYERS = 8;

  // ----- Helper Functions -----

  function recalcTotals() {
    let totalPot = 0;
    let totalChips = 0;
    document.querySelectorAll(".player-card").forEach(card => {
      const buyIn = parseFloat(card.querySelector(".buyin-input").value) || 0;
      const chips = parseFloat(card.querySelector(".chips-input").value) || 0;
      totalPot += buyIn;
      totalChips += chips;
    });

    totalPotEl.textContent = totalPot.toFixed(2);
    totalChipsEl.textContent = totalChips.toFixed(2);
    hideMismatchBanners();

    const playerCount = document.querySelectorAll(".player-card").length;
    addPlayerBtn.disabled = playerCount >= MAX_PLAYERS;

    document.querySelectorAll(".removePlayerBtn").forEach(btn => {
      btn.disabled = playerCount <= MIN_PLAYERS;
    });
  }

  function renumberPlayers() {
    document.querySelectorAll(".player-card").forEach((card, index) => {
      card.querySelector("h5").textContent = `Player ${index + 1}`;
    });
  }

  function createPlayerCard() {
    const col = document.createElement("div");
    col.className = "player-card pop-in-top";

    col.innerHTML = `
      <div class="player-card-inner">
        <div class="player-card-head">
          <h5>Player</h5>
          <button type="button" class="removePlayerBtn" aria-label="Remove player">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" class="x-icon">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <label class="field-label">Player Name</label>
        <input type="text" class="field-input player-name-input" placeholder="player name">
        <label class="field-label">Buy-in Amount</label>
        <input type="number" class="field-input buyin-input" placeholder="0">
        <label class="field-label">Current chips ($)</label>
        <input type="number" class="field-input chips-input" placeholder="0">
      </div>
    `;

    const buyInInput = col.querySelector(".buyin-input");
    const chipsInput = col.querySelector(".chips-input");
    const removeBtn = col.querySelector(".removePlayerBtn");

    buyInInput.addEventListener("input", recalcTotals);
    chipsInput.addEventListener("input", recalcTotals);

    removeBtn.addEventListener("click", () => {
      if (document.querySelectorAll(".player-card").length > MIN_PLAYERS) {
        col.remove();
        renumberPlayers();
        recalcTotals();
      }
    });

    return col;
  }

  function initializePlayerCard(card) {
    card.classList.add("player-card");

    const buyInInput = card.querySelector(".buyin-input");
    const chipsInput = card.querySelector(".chips-input");

    if (buyInInput) buyInInput.addEventListener("input", recalcTotals);
    if (chipsInput) chipsInput.addEventListener("input", recalcTotals);

    const removeBtn = card.querySelector(".removePlayerBtn");
    if (!removeBtn) return;
    removeBtn.addEventListener("click", () => {
      if (document.querySelectorAll(".player-card").length > MIN_PLAYERS) {
        card.remove();
        renumberPlayers();
        recalcTotals();
      }
    });
  }

  // ----- Initialize existing cards -----
  document.querySelectorAll(".player-card").forEach(initializePlayerCard);

  // Initial numbering and totals
  renumberPlayers();
  recalcTotals();

  // Add new player
  addPlayerBtn.addEventListener("click", () => {
    if (document.querySelectorAll(".player-card").length < MAX_PLAYERS) {
      const newCard = createPlayerCard();
      playersGrid.appendChild(newCard);
      renumberPlayers();
      recalcTotals();
    }
  });

  let curGame = {
  players: [],
  transactions: []
  };

  let transfersCount = 0;

  function toCents(value) {
    return Math.round((parseFloat(value) || 0) * 100);
  }

  function hideMismatchBanners() {
    document.querySelectorAll(".mismatch-banner").forEach(banner => {
      banner.classList.add("d-none");
      banner.innerHTML = "";
    });
  }

  function updateMismatchBanners(totalPot, totalChips) {
    const potCents = toCents(totalPot);
    const chipCents = toCents(totalChips);
    const balanced = potCents === chipCents;
    const diff = (Math.abs(chipCents - potCents) / 100).toFixed(2);
    const extraChips = chipCents > potCents;
    const message = extraChips
      ? `<strong>Chip count doesn't match buy-ins.</strong> There is $${diff} more in chips than was bought in. Check the stacks — settlement can't fully balance.`
      : `<strong>Chip count doesn't match buy-ins.</strong> There is $${diff} missing from the table compared to buy-ins. Check the stacks — settlement can't fully balance.`;

    document.querySelectorAll(".mismatch-banner").forEach(banner => {
      if (balanced) {
        banner.classList.add("d-none");
        banner.innerHTML = "";
        return;
      }
      banner.classList.remove("d-none");
      banner.innerHTML = message;
    });
  }

  // Pair debtors with creditors inside one group. Optimal when that group
  // cannot be split into smaller zero-sum subsets.
  function greedySettle(people) {
    const creditors = people.filter(p => p.balance > 0).map(p => ({ ...p }));
    const debtors = people.filter(p => p.balance < 0).map(p => ({ ...p }));
    const txs = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(creditors[j].balance, -debtors[i].balance);
      if (amount > 0) {
        txs.push({
          from: debtors[i].name,
          to: creditors[j].name,
          amount
        });
        debtors[i].balance += amount;
        creditors[j].balance -= amount;
      }
      if (debtors[i].balance === 0) i++;
      if (creditors[j].balance === 0) j++;
    }

    return txs;
  }

  function maskToPeople(people, mask) {
    return people.filter((_, idx) => mask & (1 << idx));
  }

  // Minimum transfers: bitmask DP finds the maximum number of zero-sum groups
  // (min transfers = n - k when the table balances). Then greedy-settle each group.
  function computeMinTransfers(players) {
    const people = players
      .map(p => ({ name: p.name, balance: toCents(p.chips) - toCents(p.buyIn) }))
      .filter(p => p.balance !== 0);

    if (people.length === 0) return [];

    const n = people.length;
    const size = 1 << n;
    const subsetSum = new Int32Array(size);

    for (let mask = 1; mask < size; mask++) {
      const bit = mask & -mask;
      const idx = 31 - Math.clz32(bit);
      subsetSum[mask] = subsetSum[mask ^ bit] + people[idx].balance;
    }

    const dp = new Uint8Array(size);
    for (let mask = 1; mask < size; mask++) {
      let best = 0;
      for (let sub = mask; sub > 0; sub = (sub - 1) & mask) {
        if (subsetSum[sub] === 0) {
          const val = dp[mask ^ sub] + 1;
          if (val > best) best = val;
        }
      }
      dp[mask] = best;
    }

    const groups = [];
    function splitMask(mask) {
      if (mask === 0 || dp[mask] === 0) return;

      if (subsetSum[mask] === 0 && dp[mask] === 1) {
        groups.push(mask);
        return;
      }

      for (let sub = (mask - 1) & mask; sub > 0; sub = (sub - 1) & mask) {
        if (dp[sub] + dp[mask ^ sub] === dp[mask]) {
          splitMask(sub);
          splitMask(mask ^ sub);
          return;
        }
      }

      if (subsetSum[mask] === 0) groups.push(mask);
    }

    const full = size - 1;
    splitMask(full);

    let used = 0;
    const txs = [];
    groups.forEach(mask => {
      used |= mask;
      greedySettle(maskToPeople(people, mask)).forEach(t => txs.push(t));
    });

    const leftover = full ^ used;
    if (leftover) {
      greedySettle(maskToPeople(people, leftover)).forEach(t => txs.push(t));
    }

    return txs.map(t => ({
      from: t.from,
      to: t.to,
      amount: t.amount / 100
    }));
  }

  // ----- Settlement Calculation -----
  calcBtn.addEventListener("click", () => {
  curGame = {
  players: [],
  transactions: []
  };
    transfersCount = 0;
    const playerCards = document.querySelectorAll(".player-card");
    const players = [];

    // Collect all players
    playerCards.forEach((card, index) => {
      const nameInput = card.querySelector(".player-name-input");
      const buyIn = parseFloat(card.querySelector(".buyin-input").value) || 0;
      const chips = parseFloat(card.querySelector(".chips-input").value) || 0;
      players.push({
        card,
        name: nameInput.value || `Player ${index + 1}`,
        buyIn,
        chips,
        balance: chips - buyIn
      });
    });

// Filter only players with valid data
const validPlayers = players.filter(p=> p.buyIn >= 0 && p.chips >= 0);
if (validPlayers.length < 2) return;

// store players in game object
curGame.players = validPlayers.map(p => ({
  name: p.name,
  balance: p.balance,
  buyIn: p.buyIn,
  chips: p.chips
}));

// Clear previous results
balancesContainer.innerHTML = "";
transactionsContainer.innerHTML = "";

// Show balances
validPlayers.forEach(p => {
  const diff = p.balance;
  const balanceDiv = document.createElement("div");
  balanceDiv.className = `balance-row ${diff >= 0 ? "balance-row--win" : "balance-row--lose"}`;
  balanceDiv.innerHTML = `
    <span class="balance-name">${p.name}</span>
    <span class="balance-amount ${diff >= 0 ? "balance-amount--win" : "balance-amount--lose"}">
      ${diff >= 0 ? "+" : ""}$${diff.toFixed(2)}
    </span>
  `;
  balancesContainer.appendChild(balanceDiv);
});

const transactions = computeMinTransfers(validPlayers);
transfersCount = transactions.length;
curGame.transactions = transactions.map(t => ({
  from: t.from,
  to: t.to,
  amount: t.amount
}));

transactions.forEach(t => {
  const transDiv = document.createElement("div");
  transDiv.className = "transfer-row";
  transDiv.innerHTML = `
    <div class="d-flex align-items-center gap-3">
      <span class="fw-medium">${t.from}</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14"></path>
        <path d="m12 5 7 7-7 7"></path>
      </svg>
      <span class="fw-medium">${t.to}</span>
    </div>
    <span class="amount-chip">$${t.amount.toFixed(2)}</span>
  `;
  transactionsContainer.appendChild(transDiv);
});

settlementSection.classList.remove("d-none");
settlementSection.scrollIntoView({ behavior: "smooth", block: "start" });
const transfersBadge = settlementSection.querySelector(".transfers-num");
transfersBadge.textContent = `${transfersCount} transfer${transfersCount !== 1 ? 's' : ''}`;

const totalPot = validPlayers.reduce((sum, p) => sum + p.buyIn, 0);
const totalChips = validPlayers.reduce((sum, p) => sum + p.chips, 0);
updateMismatchBanners(totalPot, totalChips);
});


// ----- Game History Management -----

// Load history from localStorage
let gameHistory = JSON.parse(localStorage.getItem("gameHistory")) || [];

// Render history cards
function renderHistory() {
    
  // Load history from localStorage
  
  const historyList = document.getElementById("historyList");
  if (!historyList) return;

  historyList.innerHTML = "";

  if (gameHistory.length === 0) {
    historyList.innerHTML = `<p class="text-center app-subtitle">No game history yet.</p>`;
    return;
  }

// Before rendering, update curGame details
curGame.name = document.querySelector(".game-name").value || "Unnamed Game";
curGame.date = new Date().toISOString(); // or .toLocaleString() if you prefer readable
curGame.totalPlayers = curGame.players.length;
curGame.totalPot = parseFloat(totalPotEl.textContent) || 0;
curGame.transfersCount = transfersCount;

// Render each game
gameHistory.forEach((game, idx) => {
  console.log("Rendering game:", game);
  const card = document.createElement("div");
  card.className = "history-card";

  card.innerHTML = `
      <div class="history-card-head">
        <div>
          <h5 class="history-card-title">${game.name || "Unnamed Game"}</h5>
          <span class="history-card-date">${new Date(game.date).toLocaleString()}</span>
        </div>
        <div class="history-badge">completed</div>
      </div>
      <div class="history-stats">
        <div class="history-stat">
          <div class="history-stat-value">${game.totalPlayers}</div>
          <div class="history-stat-label">players</div>
        </div>
        <div class="history-stat">
          <div class="history-stat-value">${game.totalPot.toFixed(2)}</div>
          <div class="history-stat-label">pot</div>
        </div>
        <div class="history-stat">
          <div class="history-stat-value">${game.transfersCount}</div>
          <div class="history-stat-label">transfers</div>
        </div>
      </div>
      <div class="history-details collapse" id="collapse-${idx}">
        <h6 class="panel-title">players</h6>
        ${(game.players || []).map(p => `
          <div class="balance-row ${p.balance >= 0 ? "balance-row--win" : "balance-row--lose"}">
            <span class="balance-name">${p.name}</span>
            <small>buy-in: $${p.buyIn.toFixed(2)} | chips: $${p.chips.toFixed(2)}</small>
          </div>
        `).join("")}
        <h6 class="panel-title" style="margin-top:16px;">settlement transactions</h6>
        ${(game.transactions || []).map(t => `
          <div class="transfer-row">
            <div class="d-flex align-items-center gap-3">
              <span>${t.from}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
              <span>${t.to}</span>
            </div>
            <span class="amount-chip">$${t.amount.toFixed(2)}</span>
          </div>
        `).join("")}
      </div>
      <button class="history-toggle" data-bs-toggle="collapse" data-bs-target="#collapse-${idx}">
        show details
      </button>
  `;

  historyList.appendChild(card);
});

  // Attach toggle listeners
}

function setActiveNav(isHistory) {
  calculatorNavBtn.classList.toggle("is-active", !isHistory);
  historyNavBtn.classList.toggle("is-active", isHistory);
}

historyNavBtn.addEventListener("click", () => {
  document.getElementById("mainPage").classList.add("d-none");
  document.getElementById("historyPage").classList.remove("d-none");
  setActiveNav(true);
  renderHistory();
});

calculatorNavBtn.addEventListener("click", () => {
  document.getElementById("historyPage").classList.add("d-none");
  document.getElementById("mainPage").classList.remove("d-none");
  setActiveNav(false);
});


document.querySelector('.save-btn').addEventListener('click', () => {
  if (!curGame) return;

  // Create a fresh snapshot of curGame
  const savedGame = {
    name: document.querySelector(".game-name").value || "Unnamed Game",
    date: new Date().toISOString(),
    totalPlayers: curGame.players.length,
    totalPot: parseFloat(totalPotEl.textContent) || 0,
    transfersCount: transfersCount,
    players: JSON.parse(JSON.stringify(curGame.players)), // deep copy players
    transactions: JSON.parse(JSON.stringify(curGame.transactions)) // deep copy transactions
    
  };
  console.log("transactions:", curGame.transactions);
  console.log("players:", curGame.players);

  // Prevent duplicates: compare with the first (latest) game in history
  const lastGame = gameHistory[0];
  const isDuplicate = lastGame &&
    lastGame.totalPlayers === savedGame.totalPlayers &&
    lastGame.totalPot === savedGame.totalPot &&
    lastGame.transfersCount === savedGame.transfersCount &&
    JSON.stringify(lastGame.players) === JSON.stringify(savedGame.players) &&
    JSON.stringify(lastGame.transactions) === JSON.stringify(savedGame.transactions);

  // Save new game
  if (!isDuplicate){
  gameHistory.unshift(savedGame);}
  localStorage.setItem("gameHistory", JSON.stringify(gameHistory));

  if (!document.getElementById("historyPage").classList.contains("d-none")) {
    renderHistory();
  }

  saved = true;
});

  document.getElementById("clearHistoryBtn").addEventListener("click", () => {
    // Clear in-memory list and localStorage
    gameHistory = [];
    localStorage.removeItem('gameHistory')

    // Animate cards fading out
    const historyList = document.getElementById("historyList");
    historyList.querySelectorAll(".history-card").forEach(card => {
      card.classList.add("fade-out");
    });

    setTimeout(() => {
      historyList.innerHTML = `<p class="text-center app-subtitle">No game history yet.</p>`;
    }, 300);
  });

});


