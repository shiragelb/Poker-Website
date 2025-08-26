document.addEventListener("DOMContentLoaded", () => {
  const addPlayerBtn = document.querySelector(".addPlayerBtn");
  const playersGrid = document.querySelector(".row.g-4");

  const totalPotEl = document.querySelector(".row.text-center .col-md-6:first-child .fs-3");
  const totalChipsEl = document.querySelector(".row.text-center .col-md-6:last-child .fs-3");

  const settlementSection = document.getElementById("settlement-results");
  const calcBtn = document.querySelector(".btn.btn-danger.d-flex.align-items-center.px-4.py-2");
  const cardBodies = settlementSection.querySelectorAll(".card-body");

  const balancesContainer = cardBodies[0];  // first card-body → balances
  const transactionsContainer = cardBodies[1]; // second card-body → transactions


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
                <i class="bi bi-person text-danger"></i>
              </div>
              <div>
                <h5 class="mb-0 text-white">Player</h5>
                <small class="text-muted">Still playing</small>
              </div>
            </div>
            <button class="btn btn-sm btn-outline-danger rounded-circle removePlayerBtn">
              <i class="bi bi-x-lg"></i>
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

  // ----- Settlement Calculation -----
  calcBtn.addEventListener("click", () => {
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

  // Create transaction div
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

  // Update balances
  debtor.balance += amount;
  creditor.balance -= amount;

  // // Update input fields
  // debtor.card.querySelector(".chips-input").value = (debtor.buyIn + debtor.balance).toFixed(2);
  // creditor.card.querySelector(".chips-input").value = (creditor.buyIn + creditor.balance).toFixed(2);

  // Remove settled players
  if (debtor.balance === 0) debtors.shift();
  if (creditor.balance === 0) creditors.shift();
}
settlementSection.classList.remove("d-none");

    }
   );} );