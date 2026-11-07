(() => {
  const dashboard = document.getElementById("dashboard");
  if (!dashboard || typeof render !== "function") return;

  const section = document.createElement("section");
  section.id = "tm-upgrade";
  section.innerHTML = `
    <style>
      #tm-upgrade { margin: 20px 0; color: #e7edf7; }
      .tm-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin:16px 0; }
      .tm-card,.tm-panel { background:#172235; border:1px solid #304158; border-radius:14px; padding:18px; margin-bottom:14px; }
      .tm-card small { color:#9aaac0; }
      .tm-card strong { display:block; font-size:25px; margin-top:8px; }
      .tm-calendar { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:5px; }
      .tm-day { padding:8px 3px; min-height:48px; text-align:center; border-radius:7px; background:#263449; font-size:11px; overflow-wrap:anywhere; }
      .tm-win { background:#14513d; }
      .tm-loss { background:#672a3b; }
      .tm-chart { width:100%; height:auto; }
    </style>
    <h2>Performance Analytics</h2>
    <div class="tm-cards">
      <div class="tm-card"><small>Net P&L</small><strong id="tm-net">—</strong></div>
      <div class="tm-card"><small>Win Rate</small><strong id="tm-rate">—</strong></div>
      <div class="tm-card"><small>Profit Factor</small><strong id="tm-factor">—</strong></div>
      <div class="tm-card"><small>Average Win</small><strong id="tm-avg">—</strong></div>
    </div>
    <div class="tm-panel">
      <h3>Equity Curve</h3>
      <div id="tm-equity"></div>
    </div>
    <div class="tm-panel">
      <h3>Trading Calendar</h3>
      <div style="display:flex;gap:12px;align-items:center;margin-bottom:15px">
        <button id="tm-prev" type="button">←</button>
        <strong id="tm-month"></strong>
        <button id="tm-next" type="button">→</button>
      </div>
      <div class="tm-calendar" id="tm-calendar"></div>
    </div>
  `;

  dashboard.prepend(section);

  const el = id => document.getElementById(id);
  const money = n => new Intl.NumberFormat("en-US", {
    style:"currency", currency:"USD"
  }).format(n);

  const month = new Date();
  month.setDate(1);

  function updateDashboard() {
    const data = Array.isArray(trades) ? trades : [];
    const total = data.reduce((s,t) => s + Number(t.pnl || 0), 0);
    const wins = data.filter(t => Number(t.pnl) > 0);
    const losses = data.filter(t => Number(t.pnl) < 0);
    const gains = wins.reduce((s,t) => s + Number(t.pnl), 0);
    const lost = -losses.reduce((s,t) => s + Number(t.pnl), 0);

    el("tm-net").textContent = money(total);
    el("tm-rate").textContent = data.length
      ? (wins.length / data.length * 100).toFixed(1) + "%"
      : "—";
    el("tm-factor").textContent = lost
      ? (gains / lost).toFixed(2)
      : gains ? "∞" : "—";
    el("tm-avg").textContent = wins.length
      ? money(gains / wins.length) : "—";

    const ordered = [...data].sort((a,b) =>
      String(a.date || "").localeCompare(String(b.date || ""))
    );
    let running = 0;
    const values = [0, ...ordered.map(t =>
      running += Number(t.pnl || 0)
    )];

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = values.map((v,i) => {
      const x = 20 + i * 560 / Math.max(values.length-1,1);
      const y = 175 - (v-min)/range*150;
      return `${x},${y}`;
    }).join(" ");

    el("tm-equity").innerHTML = data.length
      ? `<svg class="tm-chart" viewBox="0 0 600 200"
          role="img" aria-label="Cumulative trading profit chart">
          <polyline points="${points}" fill="none"
          stroke="#6bb8ff" stroke-width="3"
          stroke-linecap="round" stroke-linejoin="round"/>
         </svg>`
      : "<p>Save trades to see your equity curve.</p>";

    updateCalendar();
  }

  function updateCalendar() {
    el("tm-month").textContent = month.toLocaleDateString("en-US", {
      month:"long", year:"numeric"
    });

    const year = month.getFullYear();
    const m = month.getMonth();
    const firstDay = new Date(year,m,1).getDay();
    const days = new Date(year,m+1,0).getDate();
    const totals = {};

    (Array.isArray(trades) ? trades : []).forEach(t => {
      const date = String(t.date || "").slice(0,10);
      totals[date] = (totals[date] || 0) + Number(t.pnl || 0);
    });

    let html = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]
      .map(d => `<div class="tm-day">${d}</div>`).join("");

    for(let i=0;i<firstDay;i++) {
      html += '<div></div>';
    }

    for(let day=1;day<=days;day++) {
      const date = `${year}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
      const amount = totals[date];
      const cls = amount > 0 ? "tm-win" : amount < 0 ? "tm-loss" : "";
      html += `<div class="tm-day ${cls}">
        <b>${day}</b>
        ${amount === undefined ? "" : `<div>${money(amount)}</div>`}
      </div>`;
    }
    el("tm-calendar").innerHTML = html;
  }

  el("tm-prev").onclick = () => {
    month.setMonth(month.getMonth()-1);
    updateCalendar();
  };
  el("tm-next").onclick = () => {
    month.setMonth(month.getMonth()+1);
    updateCalendar();
  };

  const oldRender = render;
  render = function(...args) {
    oldRender.apply(this,args);
    updateDashboard();
  };

  updateDashboard();
})();
