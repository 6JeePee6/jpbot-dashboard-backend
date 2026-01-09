import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let coinsData = [];
let activeTrades = [];

app.get("/", (req, res) => res.redirect("/dashboard"));

app.get("/api/coins", (req, res) => res.json(coinsData));
app.get("/api/trades", (req, res) => res.json(activeTrades));

app.post("/api/coins", (req, res) => {
    coinsData = req.body;

    activeTrades = coinsData
        .filter(c => c.balance > 0)
        .map(c => {
            const entry = c.entryPrice || c.currentPrice;
            const pl = (c.currentPrice - entry) * c.balance;
            const pct = entry ? ((c.currentPrice - entry) / entry) * 100 : 0;

            return {
                symbol: c.symbol,
                entryPrice: entry,
                currentPrice: c.currentPrice,
                pl,
                pct,
                trailing: c.trailingActive || false
            };
        });

    res.json({ ok: true });
});

app.get("/dashboard", (req, res) => {
res.send(`
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>JPBot</title>

<style>
:root {
    --glass: rgba(20, 30, 40, 0.55);
    --border: rgba(255,255,255,0.08);
    --green: #00ff9c;
    --red: #ff4d4d;
    --orange: #ffb020;
    --cyan: #4cc9f0;
}

body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    background:
        radial-gradient(circle at 20% 20%, #0f2027, #000),
        repeating-linear-gradient(
            0deg,
            rgba(0,255,140,0.03) 0px,
            rgba(0,255,140,0.03) 1px,
            transparent 1px,
            transparent 4px
        );
    color: #e5e7eb;
}

header {
    padding: 20px;
    font-size: 22px;
    font-weight: 600;
    letter-spacing: 0.5px;
}

.portfolio {
    margin: 0 20px 24px;
    padding: 16px 20px;
    border-radius: 20px;
    background: var(--glass);
    backdrop-filter: blur(22px);
    border: 1px solid var(--border);
    box-shadow: 0 0 40px rgba(0,255,160,0.12);
    display: flex;
    justify-content: space-between;
}

.coins {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px,1fr));
    gap: 18px;
    padding: 0 20px 40px;
}

.coin {
    position: relative;
    padding: 16px;
    border-radius: 22px;
    background: var(--glass);
    backdrop-filter: blur(18px);
    border: 1px solid var(--border);
    transition: transform .25s ease, box-shadow .25s ease;
}

.coin:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 0 30px rgba(0,255,160,0.25);
}

.coin.green { box-shadow: 0 0 25px rgba(0,255,156,.35); }
.coin.red { box-shadow: 0 0 25px rgba(255,77,77,.35); }
.coin.orange { box-shadow: 0 0 25px rgba(255,176,32,.35); }

h3 {
    margin: 0;
    font-size: 18px;
}

small {
    color: #8b949e;
}

.row {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 14px;
}

.price.up {
    color: var(--green);
    animation: flashGreen .4s;
}
.price.down {
    color: var(--red);
    animation: flashRed .4s;
}

@keyframes flashGreen {
    from { text-shadow: 0 0 12px var(--green); }
    to { text-shadow: none; }
}
@keyframes flashRed {
    from { text-shadow: 0 0 12px var(--red); }
    to { text-shadow: none; }
}

.ai {
    margin-top: 10px;
    font-size: 13px;
    color: var(--cyan);
}

.trade {
    margin-top: 10px;
    font-size: 13px;
    color: #9ca3af;
}

.pulse {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { box-shadow: 0 0 15px rgba(0,255,160,.2); }
    50% { box-shadow: 0 0 30px rgba(0,255,160,.45); }
    100% { box-shadow: 0 0 15px rgba(0,255,160,.2); }
}
</style>
</head>

<body>
<header>🧬 JPBot Trading Matrix</header>

<div class="portfolio">
    <div>
        <small>Total Portfolio</small><br/>
        <strong id="portfolio">€0.00</strong>
    </div>
    <small>LIVE</small>
</div>

<div class="coins" id="coins"></div>

<script>
let lastPrices = {};

async function load() {
    const coins = await fetch("/api/coins").then(r=>r.json());
    const trades = await fetch("/api/trades").then(r=>r.json());
    const tradeMap = Object.fromEntries(trades.map(t => [t.symbol, t]));

    const root = document.getElementById("coins");
    root.innerHTML = "";
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

        let cls = "";
        if (trade) {
            cls = trade.trailing ? "orange pulse" :
                  trade.pl >= 0 ? "green pulse" : "red pulse";
        }

        const div = document.createElement("div");
        div.className = "coin " + cls;
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
                P/L: €\${trade.pl.toFixed(2)} (\${trade.pct.toFixed(2)}%)
            </div>\` : ""}
        \`;
        root.appendChild(div);
    });

    document.getElementById("portfolio").innerText = "€" + total.toFixed(2);
}

setInterval(load, 2500);
load();
</script>
</body>
</html>
`);
});

app.listen(port, () =>
    console.log("🚀 JPBot Matrix Dashboard running")
);
