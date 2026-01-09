import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// =====================
// In-memory storage
// =====================
let coinsData = [];
let activeTrades = [];
let equityHistory = [];

// =====================
// API
// =====================
app.get("/", (req, res) => {
    res.redirect("/dashboard");
});

app.get("/api/coins", (req, res) => {
    res.json(coinsData);
});

app.get("/api/trades", (req, res) => {
    res.json(activeTrades);
});

app.get("/api/equity", (req, res) => {
    res.json(equityHistory);
});

app.post("/api/coins", (req, res) => {
    const data = req.body;
    if (!Array.isArray(data)) {
        return res.status(400).json({ error: "Expected array" });
    }

    coinsData = data;

    // Actieve trades = balance > 0
    activeTrades = coinsData
        .filter(c => c.balance > 0)
        .map(c => ({
            symbol: c.symbol,
            entryPrice: c.entryPrice ?? c.currentPrice,
            currentPrice: c.currentPrice,
            amount: c.balance,
            aiScore: c.aiScore ?? 50
        }));

    const totalValue = coinsData.reduce(
        (sum, c) => sum + (c.balance * c.currentPrice),
        0
    );

    equityHistory.push({ t: Date.now(), v: totalValue });
    if (equityHistory.length > 300) equityHistory.shift();

    console.log("✅ Dashboard update ontvangen");
    res.json({ status: "ok" });
});

// =====================
// DASHBOARD UI
// =====================
app.get("/dashboard", (req, res) => {
res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>JPBot Dashboard</title>
<style>
body {
    margin:0;
    font-family:-apple-system, BlinkMacSystemFont;
    background:#000;
    color:#fff;
}
.section {
    padding:20px;
}
h2 {
    margin:0 0 10px;
    color:#00ff9c;
}
.card {
    background:#0a0a0a;
    border-radius:14px;
    padding:14px;
    margin-bottom:12px;
    box-shadow:0 0 25px rgba(0,255,156,0.12);
}
.row {
    display:flex;
    justify-content:space-between;
    align-items:center;
}
.green { color:#00ff9c }
.red { color:#ff3b30 }
.bar {
    height:8px;
    border-radius:8px;
    background:#111;
    overflow:hidden;
    margin-top:6px;
}
.bar span {
    display:block;
    height:100%;
}
svg {
    width:100%;
}
</style>
</head>
<body>

<div class="section">
<h2>📈 Portfolio</h2>
<svg id="equity" viewBox="0 0 600 200"></svg>
</div>

<div class="section">
<h2>🪙 Coins</h2>
<div id="coins"></div>
</div>

<div class="section">
<h2>💼 Actieve Trades</h2>
<div id="trades"></div>
</div>

<script>
async function fetchJSON(url){ return fetch(url).then(r=>r.json()) }

// ------------------
// Equity chart
// ------------------
async function drawEquity() {
    const data = await fetchJSON("/api/equity");
    if(data.length<2) return;
    const max=Math.max(...data.map(d=>d.v));
    const min=Math.min(...data.map(d=>d.v));
    const x=i=>i/(data.length-1)*600;
    const y=v=>180-(v-min)/(max-min||1)*160;
    let path="M"+data.map((d,i)=>x(i)+" "+y(d.v)).join(" L ");
    document.getElementById("equity").innerHTML=\`
    <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#00ff9c" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#00ff9c" stop-opacity="0"/>
    </linearGradient>
    </defs>
    <path d="\${path}" stroke="#00ff9c" stroke-width="3" fill="none"/>
    <path d="\${path} L600 200 L0 200Z" fill="url(#g)"/>
    \`;
}

// ------------------
// Coins
// ------------------
async function drawCoins() {
    const coins = await fetchJSON("/api/coins");
    document.getElementById("coins").innerHTML = coins.map(c=>{
        const color = c.aiScore>=70?"#00ff9c":c.aiScore>=50?"#ffd60a":"#ff453a";
        return \`
        <div class="card">
            <div class="row">
                <strong>\${c.symbol}</strong>
                <span>€\${c.currentPrice.toFixed(2)}</span>
            </div>
            <div class="bar"><span style="width:\${c.aiScore}%;background:\${color}"></span></div>
            <small>AI Score: \${c.aiScore}</small>
        </div>\`;
    }).join("");
}

// ------------------
// Trades
// ------------------
async function drawTrades() {
    const trades = await fetchJSON("/api/trades");
    document.getElementById("trades").innerHTML = trades.map(t=>{
        const value = t.amount * t.currentPrice;
        const entryValue = t.amount * t.entryPrice;
        const pl = value - entryValue;
        const pct = (pl/entryValue)*100;
        const cls = pl>=0?"green":"red";
        return \`
        <div class="card">
            <div class="row">
                <strong>\${t.symbol}</strong>
                <strong class="\${cls}">\${pl>=0?"+":""}€\${pl.toFixed(2)}</strong>
            </div>
            <small>Entry €\${t.entryPrice.toFixed(2)} → €\${t.currentPrice.toFixed(2)}</small><br/>
            <small class="\${cls}">\${pct.toFixed(2)}%</small>
        </div>\`;
    }).join("");
}

// ------------------
async function load(){
    await drawEquity();
    await drawCoins();
    await drawTrades();
}
load();
setInterval(load, 5000);
</script>

</body>
</html>`);
});

// =====================
app.listen(port, () => {
    console.log("🚀 JPBot Dashboard running on port", port);
});
