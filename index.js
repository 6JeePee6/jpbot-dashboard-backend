import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==========================
// DATA
// ==========================
let coinsData = [];
let priceHistory = {};
let candleHistory = {};

// ==========================
// API
// ==========================
app.get("/", (req, res) => {
    res.send("JPBot Dashboard API is running");
});

app.get("/api/coins", (req, res) => {
    res.json(coinsData);
});

app.post("/api/coins", (req, res) => {
    if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: "Expected array" });
    }

    coinsData = req.body;

    coinsData.forEach(c => {
        // ---- PRICE HISTORY
        if (!priceHistory[c.symbol]) priceHistory[c.symbol] = [];
        priceHistory[c.symbol].push(c.currentPrice);
        if (priceHistory[c.symbol].length > 60) priceHistory[c.symbol].shift();

        // ---- CANDLES
        if (!candleHistory[c.symbol]) candleHistory[c.symbol] = [];

        const candles = candleHistory[c.symbol];
        const last = candles[candles.length - 1];

        if (!last || Date.now() - last.timestamp > 60_000) {
            candles.push({
                open: c.currentPrice,
                high: c.currentPrice,
                low: c.currentPrice,
                close: c.currentPrice,
                timestamp: Date.now()
            });
        } else {
            last.high = Math.max(last.high, c.currentPrice);
            last.low = Math.min(last.low, c.currentPrice);
            last.close = c.currentPrice;
        }

        if (candles.length > 30) candles.shift();
    });

    res.json({ status: "ok" });
});

// ==========================
// DASHBOARD UI
// ==========================
app.get("/dashboard.html", (req, res) => {
res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>JPBot Dashboard</title>

<style>
body {
    margin: 0;
    background: #0b0b0d;
    color: #f5f5f7;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
}

header {
    padding: 20px;
    font-size: 22px;
    font-weight: 700;
    background: linear-gradient(135deg, #0aff9d, #009e6f);
    color: #002016;
}

.section {
    padding: 18px;
}

.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
}

.card {
    background: #151517;
    border-radius: 18px;
    padding: 14px;
    box-shadow: 0 8px 24px rgba(0,0,0,.5);
}

.row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.symbol {
    font-size: 18px;
    font-weight: 700;
}

.price.up { color: #00ff9c; }
.price.down { color: #ff4d4d; }

.candles {
    height: 80px;
    margin-top: 8px;
}

.trade {
    background: #16181d;
    border-radius: 16px;
    padding: 14px;
    margin-bottom: 12px;
}

.pnl.up { color: #00ff9c; }
.pnl.down { color: #ff4d4d; }

small { opacity: .6 }
</style>
</head>

<body>
<header>JPBot • Live Trading</header>

<div class="section">
<h2>📊 Coins</h2>
<div id="coins" class="grid"></div>
</div>

<div class="section">
<h2>💰 Actieve Trades</h2>
<div id="trades"></div>
</div>

<script>
let lastPrices = {};

function drawCandles(candles) {
    if (!candles || candles.length === 0) return "";
    const prices = candles.flatMap(c => [c.high, c.low]);
    const max = Math.max(...prices);
    const min = Math.min(...prices);

    return candles.map((c, i) => {
        const scale = p => 80 - ((p - min) / (max - min || 1)) * 70;
        const color = c.close >= c.open ? "#00ff9c" : "#ff4d4d";

        return \`
        <line x1="\${i*8+4}" x2="\${i*8+4}" y1="\${scale(c.high)}" y2="\${scale(c.low)}" stroke="\${color}" />
        <rect x="\${i*8+2}" y="\${scale(Math.max(c.open,c.close))}" width="4" height="\${Math.max(2, Math.abs(scale(c.open)-scale(c.close)))}" fill="\${color}" />
        \`;
    }).join("");
}

async function load() {
    const coins = await fetch('/api/coins').then(r => r.json());

    document.getElementById("coins").innerHTML = coins.map(c => {
        const prev = lastPrices[c.symbol] ?? c.currentPrice;
        const dir = c.currentPrice >= prev ? "up" : "down";
        lastPrices[c.symbol] = c.currentPrice;

        return \`
        <div class="card">
            <div class="row">
                <div class="symbol">\${c.symbol}</div>
                <div class="price \${dir}">€ \${c.currentPrice.toFixed(4)}</div>
            </div>
            <svg class="candles" viewBox="0 0 260 80">
                \${drawCandles(c.candles || [])}
            </svg>
            <small>Balance: \${c.balance}</small>
        </div>\`;
    }).join("");

    const trades = coins.filter(c => c.balance > 0);
    document.getElementById("trades").innerHTML =
        trades.length === 0 ? "<small>Geen actieve trades</small>" :
        trades.map(t => {
            const pnl = (t.currentPrice - t.entryPrice) * t.balance;
            const pnlPct = ((t.currentPrice / t.entryPrice - 1) * 100);
            const cls = pnl >= 0 ? "up" : "down";

            return \`
            <div class="trade">
                <div class="row">
                    <strong>\${t.symbol}</strong>
                    <span class="pnl \${cls}">
                        € \${pnl.toFixed(2)} (\${pnlPct.toFixed(2)}%)
                    </span>
                </div>
            </div>\`;
        }).join("");
}

load();
setInterval(load, 4000);
</script>
</body>
</html>`);
});

app.listen(port, () => {
    console.log("JPBot Dashboard running on port", port);
});
