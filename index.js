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
let portfolioValue = 0;

// ---------------------
// Routes
// ---------------------

app.get("/", (req, res) => res.redirect("/dashboard"));

app.get("/api/coins", (req, res) => res.json(coinsData));
app.get("/api/trades", (req, res) => res.json(activeTrades));

app.post("/api/coins", (req, res) => {
    const data = req.body;
    if (!Array.isArray(data)) return res.sendStatus(400);

    coinsData = data;

    activeTrades = coinsData
        .filter(c => c.balance > 0)
        .map(c => {
            const entryPrice = c.entryPrice || c.currentPrice;
            const pl = (c.currentPrice - entryPrice) * c.balance;
            const plPct = entryPrice ? ((c.currentPrice - entryPrice) / entryPrice) * 100 : 0;

            return {
                symbol: c.symbol,
                entryPrice,
                currentPrice: c.currentPrice,
                balance: c.balance,
                pl,
                plPct,
                trailing: c.trailingActive || false
            };
        });

    portfolioValue = coinsData.reduce(
        (sum, c) => sum + (c.balance * c.currentPrice), 0
    );

    console.log("✅ Dashboard data updated");
    res.json({ status: "ok" });
});

// ---------------------
// Dashboard
// ---------------------
app.get("/dashboard", (req, res) => {
res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>JPBot Dashboard</title>

<style>
:root {
    --bg: #0b0f14;
    --card: #11161d;
    --text: #e5e7eb;
    --muted: #8b949e;
    --green: #00e676;
    --red: #ff5252;
    --orange: #ff9800;
    --accent: #00c853;
}

body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

header {
    padding: 16px 20px;
    font-size: 20px;
    font-weight: 600;
}

.portfolio {
    margin: 0 20px 20px;
    background: var(--card);
    border-radius: 14px;
    padding: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.portfolio small {
    color: var(--muted);
}

.coins {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 14px;
    padding: 0 20px 30px;
}

.coin {
    background: var(--card);
    border-radius: 14px;
    padding: 12px;
    border: 2px solid transparent;
}

.coin.green { border-color: var(--green); }
.coin.red { border-color: var(--red); }
.coin.orange { border-color: var(--orange); }

.coin h3 {
    margin: 0;
    font-size: 16px;
}

.coin small {
    color: var(--muted);
}

.row {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 14px;
}

.price.up { color: var(--green); }
.price.down { color: var(--red); }

.ai {
    margin-top: 6px;
    font-size: 13px;
    color: #7dd3fc;
}

.trade {
    margin-top: 8px;
    font-size: 13px;
    color: var(--muted);
}
</style>
</head>

<body>
<header>📊 JPBot Dashboard</header>

<div class="portfolio">
    <div>
        <small>Portfolio value</small><br/>
        <strong id="portfolio">€0.00</strong>
    </div>
    <small>Live</small>
</div>

<div class="coins" id="coins"></div>

<script>
let lastPrices = {};

async function loadData() {
    const coins = await fetch("/api/coins").then(r => r.json());
    const trades = await fetch("/api/trades").then(r => r.json());

    const tradeMap = {};
    trades.forEach(t => tradeMap[t.symbol] = t);

    const container = document.getElementById("coins");
    container.innerHTML = "";

    let total = 0;

    coins.forEach(c => {
        const trade = tradeMap[c.symbol];
        const value = c.balance * c.currentPrice;
        total += value;

        let trend = "";
        if (lastPrices[c.symbol]) {
            trend = c.currentPrice > lastPrices[c.symbol] ? "up" : "down";
        }
        lastPrices[c.symbol] = c.currentPrice;

        let border = "";
        if (trade) {
            if (trade.trailing) border = "orange";
            else if (trade.pl >= 0) border = "green";
            else border = "red";
        }

        const div = document.createElement("div");
        div.className = "coin " + border;

        div.innerHTML = \`
            <h3>\${c.symbol}</h3>
            <small>\${c.pair}</small>

            <div class="row">
                <span>Price</span>
                <span class="price \${trend}">€\${c.currentPrice.toFixed(4)}</span>
            </div>

            <div class="row">
                <span>Balance</span>
                <span>\${c.balance}</span>
            </div>

            <div class="row">
                <span>Value</span>
                <span>€\${value.toFixed(2)}</span>
            </div>

            <div class="ai">🤖 AI score: \${c.aiScore ?? "-"}</div>

            \${trade ? \`
                <div class="trade">
                    Entry: €\${trade.entryPrice.toFixed(4)}<br/>
                    P/L: €\${trade.pl.toFixed(2)} (\${trade.plPct.toFixed(2)}%)
                </div>
            \` : ""}
        \`;

        container.appendChild(div);
    });

    document.getElementById("portfolio").innerText = "€" + total.toFixed(2);
}

setInterval(loadData, 3000);
loadData();
</script>
</body>
</html>
`);
});

app.listen(port, () =>
    console.log("🚀 JPBot Dashboard running on port", port)
);
