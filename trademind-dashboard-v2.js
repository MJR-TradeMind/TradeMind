(() => {
  const dashboard = document.getElementById("dashboard");
  if (!dashboard || typeof render !== "function") return;

  const section = document.createElement("section");
  section.id = "tm-upgrade";

  section.innerHTML = `
    <style>
      #tm-upgrade {
        margin: 20px 0;
        color: #e7edf7;
      }

      .tm-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin: 16px 0;
      }

      .tm-card, .tm-panel {
        background: #172235;
        border: 1px solid #304158;
        border-radius: 14px;
        padding: 18px;
        margin-bottom: 14px;
      }

      .tm-card small {
        color: #9aaac0;
      }

      .tm-card strong {
        display: block;
        font-size: 25px;
        margin-top: 8px;
      }

      .tm-calendar {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 5px;
      }

      .tm-day {
        padding: 8px 3px;
        min-height: 54px;
        text-align: center;
        border-radius: 7px;
        background: #263449;
        font-size: 11px;
        overflow-wrap: anywhere;
      }

      button.tm-day {
        width: 100%;
        border: 1px solid transparent;
        color: #e7edf7;
        font-weight: normal;
        cursor: pointer;
      }

      button.tm-day:hover {
        border-color: #77b8ff;
        filter: brightness(1.2);
      }

      button.tm-day:focus-visible {
        outline: 2px solid #77b8ff;
      }

      .tm-win {
        background: #14513d !important;
      }

      .tm-loss {
        background: #672a3b !important;
      }

      .tm-selected {
        border: 2px solid #77b8ff !important;
      }

      .tm-review {
        margin-top: 18px;
        padding: 18px;
        background: #101a2a;
        border: 1px solid #304158;
        border-radius: 12px;
      }

      .tm-review-card {
        background: #1b2940;
        padding: 15px;
        border-radius: 10px;
        margin-top: 12px;
      }

      .tm-review-card p {
        margin: 8px 0;
        overflow-wrap: anywhere;
      }

      .tm-review-top {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      .tm-positive {
        color: #4adea2;
      }

      .tm-negative {
        color: #fb7185;
      }

      .tm-review-notes {
        white-space: pre-wrap;
      }

      @media (max-width: 600px) {
        .tm-card, .tm-panel {
          padding: 12px;
        }

        .tm-day {
          min-height: 48px;
          padding: 5px 2px;
          font-size: 10px;
        }
      }
    </style>

    <h2>BHT Performance Analytics</h2>

    <div class="tm-cards">
      <div class="tm-card">
        <small>Net P&L</small>
        <strong id="tm-net">—</strong>
      </div>

      <div class="tm-card">
        <small>Win Rate</small>
        <strong id="tm-rate">—</strong>
      </div>

      <div class="tm-card">
        <small>Profit Factor</small>
        <strong id="tm-factor">—</strong>
      </div>

      <div class="tm-card">
        <small>Average Win</small>
        <strong id="tm-avg">—</strong>
      </div>
    </div>

    <div class="tm-panel">
      <h3>Trading Calendar</h3>

      <div style="display:flex;gap:12px;align-items:center;margin-bottom:15px">
        <button id="tm-prev" type="button">←</button>
        <strong id="tm-month"></strong>
        <button id="tm-next" type="button">→</button>
      </div>

      <div class="tm-calendar" id="tm-calendar"></div>

      <div id="tm-daily-review" class="tm-review" hidden></div>
    </div>
  `;

  dashboard.prepend(section);

  const el = id => document.getElementById(id);

  const money = n =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(n);

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

  const dateKey = (year, monthIndex, day) =>
    `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const month = new Date();
  month.setDate(1);

  let selectedDate = null;

  function getTrades() {
    return Array.isArray(trades) ? trades : [];
  }

  function updateDashboard() {
    const data = getTrades();

    const total = data.reduce(
      (sum, trade) => sum + Number(trade.pnl || 0), 0
    );

    const wins = data.filter(t => Number(t.pnl) > 0);
    const losses = data.filter(t => Number(t.pnl) < 0);

    const gains = wins.reduce(
      (sum, t) => sum + Number(t.pnl), 0
    );

    const lost = -losses.reduce(
      (sum, t) => sum + Number(t.pnl), 0
    );

    el("tm-net").textContent = money(total);

    el("tm-net").className =
      total < 0 ? "tm-negative" : "tm-positive";

    el("tm-rate").textContent = data.length
      ? (wins.length / data.length * 100).toFixed(1) + "%"
      : "—";

    el("tm-factor").textContent = lost
      ? (gains / lost).toFixed(2)
      : gains ? "∞" : "—";

    el("tm-avg").textContent = wins.length
      ? money(gains / wins.length)
      : "—";

    updateCalendar();

    if (selectedDate) {
      showDailyReview(selectedDate);
    }
  }

  function updateCalendar() {
    el("tm-month").textContent =
      month.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric"
      });

    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    const firstDay = new Date(year, monthIndex, 1).getDay();
    const days = new Date(year, monthIndex + 1, 0).getDate();

    const totals = {};
    const counts = {};

    getTrades().forEach(t => {
      const date = String(t.date || "").slice(0, 10);

      totals[date] =
        (totals[date] || 0) + Number(t.pnl || 0);

      counts[date] = (counts[date] || 0) + 1;
    });

    let html = [
      "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
    ].map(day =>
      `<div class="tm-day">${day}</div>`
    ).join("");

    for (let i = 0; i < firstDay; i++) {
      html += "<div></div>";
    }

    for (let day = 1; day <= days; day++) {
      const date = dateKey(year, monthIndex, day);

      const amount = totals[date];
      const count = counts[date] || 0;

      const cls = amount > 0
        ? "tm-win"
        : amount < 0
          ? "tm-loss"
          : "";

      const selected = selectedDate === date
        ? "tm-selected"
        : "";

      html += `
        <button type="button"
          class="tm-day ${cls} ${selected}"
          data-review-date="${date}"
          aria-label="${date}, ${count} trades">
          <b>${day}</b>
          ${count
            ? `<div>${money(amount)}</div>
               <div>${count} trade${count === 1 ? "" : "s"}</div>`
            : ""}
        </button>
      `;
    }

    el("tm-calendar").innerHTML = html;
  }

  function showDailyReview(date) {
    const panel = el("tm-daily-review");

    const dailyTrades = getTrades().filter(
      t => String(t.date || "").slice(0, 10) === date
    );

    selectedDate = date;

    updateCalendar();

    panel.hidden = false;

    const total = dailyTrades.reduce(
      (sum, t) => sum + Number(t.pnl || 0), 0
    );

    const followed = dailyTrades.filter(
      t => t.followed === "yes"
    ).length;

    const pnlClass = total < 0
      ? "tm-negative"
      : "tm-positive";

    if (!dailyTrades.length) {
      panel.innerHTML = `
        <h3>Daily Review — ${escapeHTML(date)}</h3>
        <p>No trades logged for this day.</p>
        <button type="button" id="tm-close-review">
          Close review
        </button>
      `;
      return;
    }

    const tradeCards = dailyTrades.map((trade, index) => {
      const pnl = Number(trade.pnl || 0);

      return `
        <div class="tm-review-card">
          <div class="tm-review-top">
            <strong>
              Trade ${index + 1} —
              ${escapeHTML(trade.market)}
            </strong>
            <strong class="${pnl < 0 ? "tm-negative" : "tm-positive"}">
              ${money(pnl)}
            </strong>
          </div>

          <p><b>Setup:</b> ${escapeHTML(trade.setup)}</p>
          <p><b>Mindset:</b> ${escapeHTML(trade.mood)}</p>
          <p><b>Contracts:</b> ${escapeHTML(trade.contracts)}</p>
          <p><b>Followed plan:</b>
            ${trade.followed === "yes" ? "Yes" : "No"}
          </p>
          <p><b>Trade after loss:</b>
            ${trade.afterLoss === "yes" ? "Yes" : "No"}
          </p>
          <p><b>Notes:</b></p>
          <p class="tm-review-notes">
            ${escapeHTML(trade.notes || "No notes entered.")}
          </p>
        </div>
      `;
    }).join("");

    panel.innerHTML = `
      <div class="tm-review-top">
        <div>
          <h3>Daily Review — ${escapeHTML(date)}</h3>
          <p>${dailyTrades.length} trade${dailyTrades.length === 1 ? "" : "s"}</p>
        </div>
        <h3 class="${pnlClass}">${money(total)}</h3>
      </div>

      <p>Followed trading plan:
        <b>${followed}/${dailyTrades.length}</b>
      </p>

      ${tradeCards}

      <div class="actions" style="margin-top:18px">
        <button type="button" id="tm-full-review">
          Generate full reflection prompt
        </button>
        <button type="button" id="tm-close-review">
          Close review
        </button>
      </div>
    `;
  }

  el("tm-calendar").addEventListener("click", event => {
    const cell = event.target.closest("[data-review-date]");
    if (!cell) return;

    showDailyReview(cell.dataset.reviewDate);
  });

  el("tm-daily-review").addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.id === "tm-close-review") {
      selectedDate = null;
      el("tm-daily-review").hidden = true;
      updateCalendar();
    }

    if (button.id === "tm-full-review") {
      if (!selectedDate) return;

      el("reviewDate").value = selectedDate;

      document.querySelector(
        '[data-tab="review"]'
      ).click();

      el("generate").click();
    }
  });

  el("tm-prev").onclick = () => {
    month.setMonth(month.getMonth() - 1);
    selectedDate = null;
    el("tm-daily-review").hidden = true;
    updateCalendar();
  };

  el("tm-next").onclick = () => {
    month.setMonth(month.getMonth() + 1);
    selectedDate = null;
    el("tm-daily-review").hidden = true;
    updateCalendar();
  };

  const oldRender = render;

  render = function(...args) {
    oldRender.apply(this, args);
    updateDashboard();
  };

  updateDashboard();
})();
  updateDashboard();
})();
