import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ---------------------
// In-memory data
// ---------------------
let coinsData = [];
let activeTrades = [];

// ---------------------
// API
// ---------------------

app.get("/", (req, res) => {
    res.send("JPBot Dashboard API is running");
});

app.get("/api/coins", (req, res) => {
    res.json(coinsData);
});

app.get("/api/trades", (req, res) => {
    res.json(activeTrades);
});

app.post("/api/coins", (req, res) => {
    if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Expected array" });
    }

    coinsData = req.body;

    activeTrades = coinsData
        .filter(c => c.balance > 0)
        .map(c => ({
            symbol: c.symbol,
            pair: c.pair,
            balance: c.balance,
            entryPrice: c.currentPrice,
            currentPrice: c.currentPrice
        }));

    console.log("✅ Data ontvangen:", coinsData.length, "coins");
    res.json({ status: "ok" });
});

// ---------------------
// DASHBOARD (INLINE)
// ---------------------
app.get("/dashboard.html", (req, res) => {
res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>JPBot Dashboard</title>

<style>
* { box-sizing: border-box; }
body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    background: #0f1220;
    color: #fff;
}

header {
    padding: 16px;
    background: linear-gradient(135deg, #1e90ff, #6a5acd);
    font-size: 22px;
    font-weight: 600;
}

.section {
    padding: 16px;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 14px;
}

.card {
    background: #1b1f3b;
    border-radius: 14px;
    padding: 14px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
    transition: transform 0.2s;
}
.card:hover { transform: scale(1.03); }

.symbol {
    font-size: 18px;
    font-weight: bold;
}

.pair {
    font-size: 12px;
    opacity: 0.6;
}

.price {
    margin-top: 8px;
    font-size: 16px;
}

.balance {
    margin-top: 4px;
    font-size: 13px;
    opacity: 0.8;
}

.trade {
    display: flex;
    justify-content: space-between;
    background: #222654;
    padding: 12px;
    border-radius: 12px;
    margin-bottom: 10px;
}
</style>
</head>

<body>
<header>🚀 JPBot Dashboard</header>

<div class="section">
    <h2>📊 Coins</h2>
    <div id="coins" class="grid"></div>
</div>

<div class="section">
    <h2>🔥 Actieve Trades</h2>
    <div id="trades"></div>
</div>

<script>
let scrollY = 0;

async function loadData() {
    scrollY = window.scrollY;

    const coins = await fetch('/api/coins').then(r => r.json());
    const trades = await fetch('/api/trades').then(r => r.json());

    const coinsDiv = document.getElementById('coins');
    coinsDiv.innerHTML = coins.map(c => \`
        <div class="card">
            <div class="symbol">\${c.symbol}</div>
            <div class="pair">\${c.pair}</div>
            <div class="price">€ \${Number(c.currentPrice).toFixed(4)}</div>
            <div class="balance">Bal: \${c.balance}</div>
        </div>
    \`).join("");

    const tradesDiv = document.getElementById('trades');
    tradesDiv.innerHTML = trades.length === 0
        ? "<div style='opacity:.6'>Geen actieve trades</div>"
        : trades.map(t => \`
            <div class="trade">
                <div>
                    <strong>\${t.symbol}</strong><br>
                    <small>\${t.pair}</small>
                </div>
                <div>
                    € \${Number(t.currentPrice).toFixed(4)}
                </div>
            </div>
        \`).join("");

    window.scrollTo(0, scrollY);
}

loadData();
setInterval(loadData, 5000);
</script>

</body>
</html>`);
});

// ---------------------
app.listen(port, () => {
    console.log("JPBot Dashboard running on port", port);
});
