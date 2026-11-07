(() => {
  const dashboard = document.getElementById("dashboard");
  const dashboardButton = document.querySelector('[data-tab="dashboard"]');

  if (!dashboard || !dashboardButton) {
    console.error("BHT: Dashboard navigation not found.");
    return;
  }

  document.getElementById("tm-upgrade")?.remove();
  document.getElementById("bht-discipline-nav")?.remove();

  const money = n => new Intl.NumberFormat("en-US", {
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

  const el = id => document.getElementById(id);

  const getTrades = () => {
    try {
      return Array.isArray(trades) ? trades : [];
    } catch {
      return [];
    }
  };

  const pnl = t => Number(t.pnl || 0);
  const tradeDate = t => String(t.date || "").slice(0, 10);
  const followed = t => t.followed === "yes";

  function scoreFor(data) {
    if (!data.length) return null;
    return Math.round(
      data.filter(followed).length / data.length * 100
    );
  }

  const month = new Date();
  month.setDate(1);

  let selectedDate = null;
  let disciplineDate = null;
  let currentView = "performance";

  // Add the Discipline button beside Dashboard.
  const disciplineButton = document.createElement("button");
  disciplineButton.type = "button";
  disciplineButton.id = "bht-discipline-nav";
  disciplineButton.textContent = "Discipline";
  dashboardButton.insertAdjacentElement("afterend", disciplineButton);

  // Create both dashboard views.
  const root = document.createElement("section");
  root.id = "tm-upgrade";

  root.innerHTML = `
    <style>
      #tm-upgrade {
        --blue: #60a5fa;
        --green: #4adea2;
        --red: #fb7185;
        color: #f1f5f9;
        font-family: Inter, system-ui, Arial, sans-serif;
        margin: 20px 0 30px;
      }

      #tm-upgrade * { box-sizing: border-box; }

      #tm-upgrade [hidden] { display: none !important; }

      #bht-discipline-nav {
        cursor: pointer;
      }

      #bht-discipline-nav.bht-active {
        background: #2563eb;
        color: white;
        border-color: #3b82f6;
      }

      #tm-upgrade .bht-title {
        margin-bottom: 22px;
      }

      #tm-upgrade .bht-title h2 {
        font-size: 28px;
        letter-spacing: -.8px;
        margin: 0 0 6px;
        color: #f8fafc;
      }

      #tm-upgrade .bht-muted {
        color: #94a3b8;
        font-size: 13px;
        line-height: 1.6;
      }

      #tm-upgrade .bht-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 18px;
      }

      #tm-upgrade .bht-grid-two {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 18px;
      }

      #tm-upgrade .bht-card,
      #tm-upgrade .bht-panel {
        background: linear-gradient(145deg, #1b2a40, #121d2e);
        border: 1px solid #304158;
        border-radius: 16px;
        box-shadow: 0 8px 25px rgba(0,0,0,.12);
      }

      #tm-upgrade .bht-card {
        padding: 20px;
        min-width: 0;
      }

      #tm-upgrade .bht-panel {
        padding: 22px;
        margin-bottom: 18px;
      }

      #tm-upgrade .bht-panel h3 {
        font-size: 19px;
        margin: 0 0 8px;
        color: #f8fafc;
      }

      #tm-upgrade .bht-label {
        color: #a5b4ca;
        font-size: 12px;
        font-weight: 600;
      }

      #tm-upgrade .bht-number {
        display: block;
        font-size: clamp(23px, 3vw, 31px);
        font-weight: 800;
        letter-spacing: -.7px;
        margin: 12px 0 7px;
        overflow-wrap: anywhere;
      }

      #tm-upgrade .bht-green { color: var(--green); }
      #tm-upgrade .bht-red { color: var(--red); }
      #tm-upgrade .bht-blue { color: var(--blue); }

      #tm-upgrade .bht-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
      }

      #tm-upgrade .bht-calendar {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 6px;
        margin-top: 18px;
      }

      #tm-upgrade .bht-weekday {
        text-align: center;
        color: #94a3b8;
        font-size: 11px;
        font-weight: 700;
        padding: 8px 0;
      }

      #tm-upgrade .bht-day {
        min-width: 0;
        min-height: 82px;
        padding: 8px 3px;
        background: #202e42;
        border: 1px solid #314057;
        border-radius: 9px;
        color: #e2e8f0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 7px;
        cursor: pointer;
        font-size: 11px;
        overflow-wrap: anywhere;
      }

      #tm-upgrade .bht-day:hover {
        border-color: #60a5fa;
        filter: brightness(1.15);
      }

      #tm-upgrade .bht-day:focus-visible {
        outline: 2px solid #93c5fd;
      }

      #tm-upgrade .bht-win {
        background: #123d32;
        border-color: #246b53;
      }

      #tm-upgrade .bht-loss {
        background: #492331;
        border-color: #854053;
      }

      #tm-upgrade .bht-selected {
        outline: 2px solid #60a5fa;
        outline-offset: -2px;
      }

      #tm-upgrade .bht-controls {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      #tm-upgrade .bht-review {
        background: #101b2c;
        border: 1px solid #31445e;
        border-radius: 12px;
        padding: 18px;
        margin-top: 18px;
      }

      #tm-upgrade .bht-trade {
        background: #1b2a40;
        border: 1px solid #34465e;
        border-radius: 10px;
        padding: 15px;
        margin: 12px 0;
      }

      #tm-upgrade .bht-trade p {
        margin: 8px 0;
        font-size: 13px;
      }

      #tm-upgrade .bht-notes {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      #tm-upgrade .bht-ring {
        --score: 0;
        width: 155px;
        height: 155px;
        border-radius: 50%;
        background: conic-gradient(
          #60a5fa calc(var(--score) * 1%),
          #304057 0
        );
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      #tm-upgrade .bht-ring-inner {
        width: 127px;
        height: 127px;
        border-radius: 50%;
        background: #142033;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      #tm-upgrade .bht-ring-inner strong {
        font-size: 38px;
      }

      #tm-upgrade .bht-ring-inner small {
        color: #94a3b8;
        font-size: 11px;
      }

      #tm-upgrade .bht-score-layout {
        display: flex;
        align-items: center;
        gap: 30px;
        flex-wrap: wrap;
        margin-top: 22px;
      }

      #tm-upgrade .bht-progress {
        height: 8px;
        border-radius: 20px;
        background: #304057;
        overflow: hidden;
        margin-top: 12px;
      }

      #tm-upgrade .bht-progress-fill {
        height: 100%;
        width: 0%;
        background: #60a5fa;
        border-radius: 20px;
      }

      #tm-upgrade .bht-insight {
        padding: 14px;
        background: #142b42;
        border-left: 3px solid #60a5fa;
        border-radius: 8px;
        margin-top: 12px;
        color: #cbd5e1;
        font-size: 13px;
        line-height: 1.7;
      }

      #tm-upgrade .bht-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 15px;
      }

      #tm-upgrade input[type="date"] {
        color-scheme: dark;
      }

      @media (max-width: 850px) {
        #tm-upgrade .bht-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 550px) {
        #tm-upgrade .bht-panel,
        #tm-upgrade .bht-card { padding: 13px; }

        #tm-upgrade .bht-grid,
        #tm-upgrade .bht-grid-two { gap: 9px; }

        #tm-upgrade .bht-grid-two {
          grid-template-columns: 1fr;
        }

        #tm-upgrade .bht-calendar { gap: 3px; }

        #tm-upgrade .bht-day {
          min-height: 60px;
          padding: 5px 2px;
          font-size: 9px;
          gap: 5px;
        }

        #tm-upgrade .bht-ring {
          width: 125px;
          height: 125px;
        }

        #tm-upgrade .bht-ring-inner {
          width: 103px;
          height: 103px;
        }
      }
    </style>

    <!-- PERFORMANCE DASHBOARD -->
    <div id="bht-performance-view">
      <div class="bht-title">
        <h2>Performance Dashboard</h2>
        <p class="bht-muted">
          Know your numbers. Understand your trading.
        </p>
      </div>

      <div class="bht-grid">
        <div class="bht-card">
          <span class="bht-label">Net P&L</span>
          <strong class="bht-number" id="bht-net">—</strong>
          <span class="bht-muted">All recorded trades</span>
        </div>

        <div class="bht-card">
          <span class="bht-label">Win Rate</span>
          <strong class="bht-number" id="bht-winrate">—</strong>
          <span class="bht-muted" id="bht-win-count">—</span>
        </div>

        <div class="bht-card">
          <span class="bht-label">Profit Factor</span>
          <strong class="bht-number" id="bht-factor">—</strong>
          <span class="bht-muted">Gross wins / losses</span>
        </div>

        <div class="bht-card">
          <span class="bht-label">Average Win</span>
          <strong class="bht-number" id="bht-average">—</strong>
          <span class="bht-muted">Per winning trade</span>
        </div>
      </div>

      <div class="bht-panel">
        <div class="bht-row">
          <div>
            <h3>Trading Calendar</h3>
            <p class="bht-muted">
              Click a date to see your trades.
            </p>
          </div>

          <div class="bht-controls">
            <button type="button" id="bht-prev">←</button>
            <strong id="bht-month"></strong>
            <button type="button" id="bht-next">→</button>
          </div>
        </div>

        <div class="bht-calendar" id="bht-calendar"></div>
        <div class="bht-review" id="bht-review" hidden></div>
      </div>
    </div>

    <!-- DISCIPLINE DASHBOARD -->
    <div id="bht-discipline-view" hidden>
      <div class="bht-title">
        <h2>Discipline Dashboard</h2>
        <p class="bht-muted">
          Your trades don't lie. Neither do we.
        </p>
      </div>

      <div class="bht-panel">
        <h3>Overall Discipline Score</h3>
        <p class="bht-muted">
          Your score measures plan adherence, not profitability.
        </p>

        <div class="bht-score-layout">
          <div class="bht-ring" id="bht-ring">
            <div class="bht-ring-inner">
              <strong id="bht-score">—</strong>
              <small>OUT OF 100</small>
            </div>
          </div>

          <div style="flex:1;min-width:180px">
            <h3 id="bht-score-title">No trades recorded</h3>
            <p class="bht-muted" id="bht-score-detail"></p>
            <div class="bht-progress">
              <div class="bht-progress-fill" id="bht-score-bar"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bht-grid-two">
        <div class="bht-card">
          <span class="bht-label">Plan Adherence</span>
          <strong class="bht-number bht-blue" id="bht-adherence">—</strong>
          <span class="bht-muted" id="bht-adherence-detail"></span>
        </div>

        <div class="bht-card">
          <span class="bht-label">Trades Taken After a Loss</span>
          <strong class="bht-number" id="bht-afterloss">—</strong>
          <span class="bht-muted">
            Not automatically revenge trading
          </span>
        </div>
      </div>

      <div class="bht-panel">
        <h3>Daily Discipline Review</h3>
        <p class="bht-muted">
          Select a date to review your execution.
        </p>

        <input type="date" id="bht-discipline-date"/>

        <div id="bht-daily-score" style="margin-top:18px"></div>
      </div>

      <div class="bht-panel">
        <h3>BHT Psychology Insights</h3>
        <p class="bht-muted">
          Feedback based on your recorded trading behavior.
        </p>

        <div id="bht-insights"></div>
      </div>
    </div>
  `;

  dashboard.prepend(root);

  // Keep the original dashboard elements available
  // on Performance, but hide them on Discipline.
  const originalChildren = [...dashboard.children].filter(
    child => child !== root
  );

  const originalDisplay = new Map(
    originalChildren.map(child => [child, child.style.display])
  );

  function switchView(view) {
    currentView = view;

    const discipline = view === "discipline";

    el("bht-performance-view").hidden = discipline;
    el("bht-discipline-view").hidden = !discipline;

    originalChildren.forEach(child => {
      child.style.display = discipline
        ? "none"
        : originalDisplay.get(child);
    });

    disciplineButton.classList.toggle("bht-active", discipline);
    disciplineButton.setAttribute("aria-pressed", String(discipline));

    if (discipline) {
      updateDiscipline();
    }
  }

  disciplineButton.addEventListener("click", () => {
    // Use the existing Dashboard navigation so
    // the app shows the correct parent section.
    dashboardButton.click();
    switchView("discipline");
  });

  // Clicking Dashboard returns to performance.
  dashboardButton.addEventListener("click", () => {
    switchView("performance");
  });

  // Other existing tabs keep their normal behavior.
  document.querySelectorAll("[data-tab]").forEach(button => {
    if (button === dashboardButton) return;

    button.addEventListener("click", () => {
      if (currentView === "discipline") {
        switchView("performance");
      }
    });
  });

  // Performance statistics.
  function updatePerformance() {
    const data = getTrades();
    const wins = data.filter(t => pnl(t) > 0);
    const losses = data.filter(t => pnl(t) < 0);

    const net = data.reduce((sum, t) => sum + pnl(t), 0);
    const grossWins = wins.reduce((sum, t) => sum + pnl(t), 0);
    const grossLosses = -losses.reduce(
      (sum, t) => sum + pnl(t), 0
    );

    el("bht-net").textContent = money(net);
    el("bht-net").className =
      "bht-number " + (net < 0 ? "bht-red" : "bht-green");

    el("bht-winrate").textContent = data.length
      ? (wins.length / data.length * 100).toFixed(1) + "%"
      : "—";

    el("bht-win-count").textContent =
      `${wins.length} wins / ${data.length} trades`;

    el("bht-factor").textContent = grossLosses
      ? (grossWins / grossLosses).toFixed(2)
      : grossWins ? "∞" : "—";

    el("bht-average").textContent = wins.length
      ? money(grossWins / wins.length)
      : "—";

    updateCalendar();

    if (selectedDate) showTradeReview(selectedDate);
  }

  // Interactive trading calendar.
  function updateCalendar() {
    const year = month.getFullYear();
    const m = month.getMonth();

    el("bht-month").textContent =
      month.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric"
      });

    const totals = {};
    const counts = {};

    getTrades().forEach(t => {
      const date = tradeDate(t);
      if (!date) return;

      totals[date] = (totals[date] || 0) + pnl(t);
      counts[date] = (counts[date] || 0) + 1;
    });

    let html = [
      "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
    ].map(day =>
      `<div class="bht-weekday">${day}</div>`
    ).join("");

    const first = new Date(year, m, 1).getDay();
    const days = new Date(year, m + 1, 0).getDate();

    for (let i = 0; i < first; i++) {
      html += "<div></div>";
    }

    for (let day = 1; day <= days; day++) {
      const date =
        `${year}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const amount = totals[date] || 0;
      const count = counts[date] || 0;

      const cls = amount > 0
        ? "bht-win"
        : amount < 0 ? "bht-loss" : "";

      html += `
        <button type="button"
          class="bht-day ${cls} ${selectedDate === date ? "bht-selected" : ""}"
          data-bht-date="${date}"
          aria-label="${date}, ${count} trades">
          <b>${day}</b>
          ${count ? `
            <span>${money(amount)}</span>
            <span>${count} trade${count === 1 ? "" : "s"}</span>
          ` : ""}
        </button>
      `;
    }

    el("bht-calendar").innerHTML = html;
  }

  // Trade review on the Performance Dashboard.
  function showTradeReview(date) {
    selectedDate = date;
    updateCalendar();

    const daily = getTrades().filter(
      t => tradeDate(t) === date
    );

    const total = daily.reduce(
      (sum, t) => sum + pnl(t), 0
    );

    const cards = daily.map((t, i) => `
      <div class="bht-trade">
        <div class="bht-row">
          <strong>Trade ${i + 1} · ${escapeHTML(t.market)}</strong>
          <strong class="${pnl(t) < 0 ? "bht-red" : "bht-green"}">
            ${money(pnl(t))}
          </strong>
        </div>
        <p><b>Setup:</b> ${escapeHTML(t.setup)}</p>
        <p><b>Mindset:</b> ${escapeHTML(t.mood)}</p>
        <p><b>Contracts:</b> ${escapeHTML(t.contracts)}</p>
        <p><b>Followed plan:</b> ${followed(t) ? "Yes" : "No"}</p>
        <p><b>After loss:</b> ${t.afterLoss === "yes" ? "Yes" : "No"}</p>
        <p class="bht-notes"><b>Notes:</b> ${escapeHTML(t.notes || "None")}</p>
      </div>
    `).join("");

    el("bht-review").hidden = false;

    el("bht-review").innerHTML = `
      <div class="bht-row">
        <div>
          <h3>Trading Day · ${escapeHTML(date)}</h3>
          <p class="bht-muted">${daily.length} trades recorded</p>
        </div>
        <strong class="${total < 0 ? "bht-red" : "bht-green"}">
          ${money(total)}
        </strong>
      </div>

      ${cards || '<p class="bht-muted">No trades recorded.</p>'}

      <div class="bht-actions">
        ${daily.length ? `
          <button type="button" id="bht-full-review">
            Generate Full Review
          </button>
        ` : ""}
        <button type="button" id="bht-close">Close</button>
      </div>
    `;
  }

  el("bht-calendar").addEventListener("click", e => {
    const cell = e.target.closest("[data-bht-date]");
    if (cell) showTradeReview(cell.dataset.bhtDate);
  });

  el("bht-review").addEventListener("click", e => {
    const button = e.target.closest("button");
    if (!button) return;

    if (button.id === "bht-close") {
      selectedDate = null;
      el("bht-review").hidden = true;
      updateCalendar();
    }

    if (button.id === "bht-full-review" && selectedDate) {
      const dateInput = el("reviewDate");
      const reviewTab = document.querySelector('[data-tab="review"]');
      const generate = el("generate");

      if (dateInput && reviewTab && generate) {
        dateInput.value = selectedDate;
        reviewTab.click();
        generate.click();
      }
    }
  });

  function changeMonth(delta) {
    month.setMonth(month.getMonth() + delta);
    selectedDate = null;
    el("bht-review").hidden = true;
    updateCalendar();
  }

  el("bht-prev").onclick = () => changeMonth(-1);
  el("bht-next").onclick = () => changeMonth(1);

  // Dedicated Discipline Dashboard.
  function updateDiscipline() {
    const data = getTrades();
    const score = scoreFor(data);
    const good = data.filter(followed).length;
    const afterLoss = data.filter(
      t => t.afterLoss === "yes"
    );

    const brokenAfterLoss = afterLoss.filter(
      t => !followed(t)
    ).length;

    el("bht-score").textContent =
      score === null ? "—" : score;

    el("bht-ring").style.setProperty(
      "--score", score ?? 0
    );

    el("bht-score-bar").style.width =
      `${score ?? 0}%`;

    el("bht-adherence").textContent =
      score === null ? "—" : score + "%";

    el("bht-adherence-detail").textContent =
      `${good} of ${data.length} trades followed plan`;

    el("bht-afterloss").textContent =
      afterLoss.length;

    el("bht-score-title").textContent =
      score === null ? "Start logging trades"
      : score >= 90 ? "Excellent plan adherence"
      : score >= 75 ? "Strong consistency"
      : score >= 50 ? "Needs improvement"
      : "Your discipline needs attention";

    el("bht-score-detail").textContent = data.length
      ? `You followed your plan on ${good} of ${data.length} trades.`
      : "Log trades to begin measuring your discipline.";

    const insights = [];

    if (!data.length) {
      insights.push(
        "Start logging trades to receive personalized feedback."
      );
    } else {
      if (score >= 90) {
        insights.push(
          "Your reported plan adherence is excellent. Keep focusing on execution rather than daily P&L."
        );
      } else if (score < 75) {
        insights.push(
          `You broke your trading plan on ${data.length - good} recorded trades. Review those entries to identify recurring mistakes.`
        );
      } else {
        insights.push(
          "Your plan adherence is reasonably consistent. Review the trades where you deviated from your rules."
        );
      }

      if (afterLoss.length) {
        insights.push(
          `You recorded ${afterLoss.length} trades taken after a loss. ${brokenAfterLoss} of those did not follow your plan. Trading after a loss isn't automatically revenge trading, but rule-breaking afterward deserves attention.`
        );
      }

      const losingDisciplined = data.filter(
        t => pnl(t) < 0 && followed(t)
      ).length;

      if (losingDisciplined) {
        insights.push(
          `You recorded ${losingDisciplined} losing trades where you still followed your plan. A loss alone does not mean you traded poorly.`
        );
      }
    }

    el("bht-insights").innerHTML = insights.map(
      message => `<div class="bht-insight">${escapeHTML(message)}</div>`
    ).join("");

    if (disciplineDate) {
      updateDailyDiscipline(disciplineDate);
    }
  }

  function updateDailyDiscipline(date) {
    disciplineDate = date;

    const daily = getTrades().filter(
      t => tradeDate(t) === date
    );

    const score = scoreFor(daily);
    const good = daily.filter(followed).length;
    const net = daily.reduce(
      (sum, t) => sum + pnl(t), 0
    );

    if (!daily.length) {
      el("bht-daily-score").innerHTML = `
        <p class="bht-muted">No trades recorded for this day.</p>
      `;
      return;
    }

    const message = score === 100
      ? "You followed your plan on every recorded trade."
      : score >= 75
        ? "Good plan adherence, with room to improve."
        : "Review which trading rules you broke today.";

    el("bht-daily-score").innerHTML = `
      <div class="bht-grid-two">
        <div class="bht-card">
          <span class="bht-label">Daily Discipline Score</span>
          <strong class="bht-number bht-blue">${score}/100</strong>
          <span class="bht-muted">
            ${good} of ${daily.length} trades followed plan
          </span>
        </div>

        <div class="bht-card">
          <span class="bht-label">Daily Net P&L</span>
          <strong class="bht-number ${net < 0 ? "bht-red" : "bht-green"}">
            ${money(net)}
          </strong>
          <span class="bht-muted">
            Separate from discipline score
          </span>
        </div>
      </div>

      <div class="bht-insight">${escapeHTML(message)}</div>
    `;
  }

  el("bht-discipline-date").addEventListener("change", e => {
    if (e.target.value) {
      updateDailyDiscipline(e.target.value);
    }
  });

  // Default daily review to today.
  const today = new Date();
  const todayKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  el("bht-discipline-date").value = todayKey;
  disciplineDate = todayKey;

  // Refresh BHT when the existing app refreshes its trades.
  if (typeof render === "function") {
    const originalRender = render;

    render = function(...args) {
      const result = originalRender.apply(this, args);
      updatePerformance();
      updateDiscipline();
      return result;
    };
  }

  switchView("performance");
  updatePerformance();
  updateDiscipline();
})();
