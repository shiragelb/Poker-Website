document.addEventListener("DOMContentLoaded", () => {
  const addPlayerBtn = document.querySelector(".addPlayerBtn");
  const playersGrid = document.querySelector(".row.g-4");

  const totalPotEl = document.querySelector(".row.text-center .col-md-6:first-child .fs-3");
  const totalChipsEl = document.querySelector(".row.text-center .col-md-6:last-child .fs-3");

  const settlementSection = document.getElementById("settlement-results");
  const calcBtn = document.querySelector(".btn.btn-danger.d-flex.align-items-center.px-4.py-2");
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

    totalPotEl.textContent = `$${totalPot.toFixed(2)}`;
    totalChipsEl.textContent = `$${totalChips.toFixed(2)}`;

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
    col.className = "col-md-6 col-lg-4 player-card";

    col.innerHTML = `
      <div class="card bg-dark border-secondary shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-3">
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-circle bg-danger bg-opacity-25 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                 <i class="bi bi-person text-danger">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" 
                stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="7" r="4"></circle>
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
            </svg></i>
              </div>
              <div>
                <h5 class="mb-0 text-white">Player</h5>
                <small class="text-muted">Still playing</small>
              </div>
            </div>
            <button class="btn btn-sm btn-outline-danger removePlayerBtn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" class="x-icon">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
            </button>
          </div>
          <div class="mb-3">
            <label class="form-label text-light">Player Name</label>
            <input type="text" class="form-control bg-secondary text-white border-0 player-name-input" placeholder="Enter player name">
          </div>
          <div class="mb-3">
            <label class="form-label text-light">Buy-in Amount ($)</label>
            <input type="number" class="form-control bg-secondary text-white border-0 buyin-input" placeholder="0">
          </div>
          <div class="mb-3">
            <label class="form-label text-light">Current Chips ($)</label>
            <input type="number" class="form-control bg-secondary text-white border-0 chips-input" placeholder="0">
          </div>
        </div>
      </div>
    `;

    const buyInInput = col.querySelector(".buyin-input");
    const chipsInput = col.querySelector(".chips-input");
    const removeBtn = col.querySelector(".removePlayerBtn");

    buyInInput.addEventListener("input", recalcTotals);
    chipsInput.addEventListener("input", recalcTotals);

    removeBtn.addEventListener("click", () => {
      col.remove();
      renumberPlayers();
      recalcTotals();
    });

    return col;
  }

  function initializePlayerCard(card) {
    card.classList.add("player-card");

    // Make sure all inputs have the proper classes
    const buyInInput = card.querySelector("input.buyin-input") || card.querySelector("input[type='number']");
    const chipsInput = card.querySelector("input.chips-input") || card.querySelectorAll("input[type='number']")[1];
    if (buyInInput) buyInInput.classList.add("buyin-input");
    if (chipsInput) chipsInput.classList.add("chips-input");

    // Attach listeners
    if (buyInInput) buyInInput.addEventListener("input", recalcTotals);
    if (chipsInput) chipsInput.addEventListener("input", recalcTotals);

    const removeBtn = card.querySelector(".btn-outline-danger");
    removeBtn.classList.add("removePlayerBtn");
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
  // ----- Settlement Calculation -----
  calcBtn.addEventListener("click", () => {
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
const validPlayers = players.filter(p => p.buyIn > 0 && p.chips > 0);
if (validPlayers.length < 2) return;

// store players in game object
curGame.players = validPlayers.map(p => ({
  name: p.name,
  balance: p.balance,
  buyIn: p.buyIn,
  chips: p.chips
}));

// Separate creditors and debtors
let creditors = validPlayers.filter(p => p.balance > 0).map(p => ({...p}));
let debtors = validPlayers.filter(p => p.balance < 0).map(p => ({...p}));

// Clear previous results
balancesContainer.innerHTML = "";
transactionsContainer.innerHTML = "";

// Show balances
validPlayers.forEach(p => {
  const diff = p.balance;
  const balanceDiv = document.createElement("div");
  balanceDiv.className = `d-flex justify-content-between align-items-center p-2 mb-2 ${
    diff >= 0 ? 'bg-success bg-opacity-25 border border-success' : 'bg-danger bg-opacity-25 border border-danger'
  } rounded`;
  balanceDiv.innerHTML = `
    <div class="d-flex align-items-center gap-2">
      <span class="badge ${diff >= 0 ? 'bg-success' : 'bg-danger'}">&nbsp;</span>
      <span>${p.name}</span>
    </div>
    <div class="d-flex align-items-center gap-1 fw-bold ${diff >= 0 ? 'text-success' : 'text-danger'}">
      ${diff >= 0 ? '+' : ''}$${diff.toFixed(2)}
    </div>
  `;
  balancesContainer.appendChild(balanceDiv);
});


// Settlement transactions

while (debtors.length && creditors.length) {
  const debtor = debtors[0];
  const creditor = creditors[0];

  const amount = Math.min(creditor.balance, -debtor.balance);

  // UI rendering
  const transDiv = document.createElement("div");
  transDiv.className = "d-flex justify-content-between align-items-center p-2 mb-2 bg-secondary bg-opacity-25 rounded border border-secondary";
  transDiv.innerHTML = `
    <div class="d-flex align-items-center gap-3">
      <span class="fw-medium">${debtor.name}</span>
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-danger">
        <path d="M5 12h14"></path>
        <path d="m12 5 7 7-7 7"></path>
      </svg>
      <span class="fw-medium">${creditor.name}</span>
    </div>
    <span class="badge bg-danger text-white">$${amount.toFixed(2)}</span>
  `;
  transactionsContainer.appendChild(transDiv);
  transfersCount++;
  // Save to game.transactions (so your history HTML can render it)
  curGame.transactions.push({
    from: debtor.name,
    to: creditor.name,
    amount: amount
  });

  
  debtor.balance += amount;
  creditor.balance -= amount;

  if (debtor.balance === 0) debtors.shift();
  if (creditor.balance === 0) creditors.shift();

}

settlementSection.classList.remove("d-none");
const transfersBadge = settlementSection.querySelector(".transfers-num");
transfersBadge.textContent = `${transfersCount} transfer${transfersCount !== 1 ? 's' : ''}`;
});


// ----- Game History Management -----

// History data from localStorage
localStorage.removeItem("gameHistory");
localStorage.clear();
let gameHistory = JSON.parse(localStorage.getItem("gameHistory")) || [];


// Render history cards
function renderHistory() {
  console.log("Rendering history...", gameHistory);
  const historyList = document.getElementById("historyList");
  if (!historyList) return;

  historyList.innerHTML = "";

  if (gameHistory.length === 0) {
    historyList.innerHTML = `<p class="text-gray-400 text-center">No game history yet.</p>`;
    return;
  }

// Before rendering, update curGame details

curGame.name = document.querySelector(".game-name").value || "Unnamed Game";
curGame.date = new Date().toISOString(); // or .toLocaleString() if you prefer readable
curGame.totalPlayers = curGame.players.length;
curGame.totalPot = parseFloat(totalPotEl.textContent.replace("$", "")) || 0;
curGame.transfersCount = transfersCount;
gameHistory.forEach((game, idx) => {
  const card = document.createElement("div");
  card.className = "col-12 col-md-10 col-lg-8 mx-auto mb-4"; // centered

  card.innerHTML = `
    <div class="card bg-dark border border-secondary shadow-sm rounded-4">
      <!-- Header -->
      <div class="card-body d-flex justify-content-between align-items-center border-bottom border-secondary pb-3">
        <div class="d-flex align-items-center gap-3">
          <!-- Icon -->
          <div class="d-flex align-items-center justify-content-center bg-danger bg-opacity-25 rounded-3" 
               style="width: 48px; height: 48px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="lucide lucide-users text-danger">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <!-- Title + Date -->
          <div>
            <h5 class="mb-1 fw-bold text-white">${game.name || "Unnamed Game"}</h5>
            <small class="text-light opacity-75">${new Date(game.date).toLocaleString()}</small>
          </div>
        </div>
        <!-- Status badge -->
        <div class="badge rounded-pill bg-success bg-opacity-25 text-success px-3 py-2">
          Completed
        </div>
      </div>

      <!-- Stats row -->
      <div class="card-body">
        <div class="row g-3 text-center">
          <div class="col bg-secondary bg-opacity-25 rounded-3 p-3">
            <div class="fs-5 fw-bold text-white">${game.totalPlayers}</div>
            <small class="text-light opacity-75">Players</small>
          </div>
          <div class="col bg-secondary bg-opacity-25 rounded-3 p-3">
            <div class="fs-5 fw-bold text-white">$${game.totalPot.toFixed(2)}</div>
            <small class="text-light opacity-75">Pot</small>
          </div>
          <div class="col bg-secondary bg-opacity-25 rounded-3 p-3">
            <div class="fs-5 fw-bold text-white">${game.transfersCount}</div>
            <small class="text-light opacity-75">Transfers</small>
          </div>
        </div>
      </div>

      <!-- Collapsible content -->
      <div class="card-body border-top border-secondary pt-4 collapse" id="collapse-${idx}">
        <!-- Players -->
        <h6 class="fw-semibold text-white mb-3">Players</h6>
        <div class="row g-3">
          ${game.players.map(p => `
            <div class="col-md-6">
              <div class="d-flex justify-content-between align-items-center p-3 bg-secondary bg-opacity-25 rounded-3">
                <div class="d-flex align-items-center gap-2">
                  <div class="rounded-circle ${p.balance >= 0 ? "bg-success" : "bg-danger"}" style="width:10px;height:10px;"></div>
                  <span class="fw-medium text-white">${p.name}</span>
                </div>
                <small class="text-light opacity-75">
                  Buy-in: $${p.buyIn.toFixed(2)} | Chips: $${p.chips.toFixed(2)}
                </small>
              </div>
            </div>
          `).join("")}
        </div>

        <!-- Transactions -->
        <h6 class="fw-semibold text-white mt-4 mb-3">Settlement Transactions</h6>
        <div class="d-flex flex-column gap-3">
          ${game.transactions.map(t => `
            <div class="d-flex justify-content-between align-items-center p-3 bg-secondary bg-opacity-25 rounded-3">
              <div class="d-flex align-items-center gap-3">
                <span class="fw-medium text-white">${t.from}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor"
                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                  class="lucide lucide-arrow-right text-danger">
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
                <span class="fw-medium text-white">${t.to}</span>
              </div>
              <span class="badge bg-danger text-white px-3 py-2">$${t.amount.toFixed(2)}</span>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Collapse toggle -->
      <div class="card-footer text-center bg-dark border-0">
        <button class="btn btn-sm btn-outline-secondary" 
                data-bs-toggle="collapse" 
                data-bs-target="#collapse-${idx}">
          Show Details
        </button>
      </div>
    </div>
  `;

  historyList.appendChild(card);
});


  // Attach toggle listeners
}

// Show History button
document.getElementById("showHistoryBtn").addEventListener("click", () => {
  document.getElementById("mainPage").classList.add("d-none");
  document.getElementById("historyPage").classList.remove("d-none");
  renderHistory(); // render when opened
});

// Calculator button
document.querySelector(".Calculate-btn").addEventListener("click", () => {
  document.getElementById("historyPage").classList.add("d-none");
  document.getElementById("mainPage").classList.remove("d-none");
});

// Keeps track if we already saved to avoid duplicates
let saved = false;

document.querySelector('.save-btn').addEventListener('click', () => {
  if (!curGame) return; // currentGame is your existing game object
  gameHistory.push(curGame);
  localStorage.setItem("gameHistory", JSON.stringify(gameHistory));

  if (!document.getElementById("historyPage").classList.contains("d-none")) {
    renderHistory();
  }
});

});


