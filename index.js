import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory opslag van coin-data en actieve trades
let coinsData = [];
let activeTrades = [];

// ---------------------
// API endpoints
// ---------------------

// Healthcheck
app.get("/", (req, res) => {
    res.send("JPBot Dashboard API is running");
});

// Coins API
app.get("/api/coins", (req, res) => {
    res.json(coinsData);
});

// Actieve trades API
app.get("/api/trades", (req, res) => {
    res.json(activeTrades);
});

// JPBot stuurt nieuwe coin-data
app.post("/api/coins", (req, res) => {
    const newData = req.body;
    if (!Array.isArray(newData)) {
        return res.status(400).json({ status: "error", message: "Data moet een array zijn" });
    }

    coinsData = newData;
    console.log("✅ Coin data ontvangen:", coinsData);

    // Update actieve trades automatisch: alle coins met balance > 0 zijn actief
    activeTrades = coinsData
        .filter(c => c.balance > 0)
        .map(c => ({
            symbol: c.symbol,
            entryPrice: c.currentPrice,
            currentPrice: c.currentPrice
        }));

    res.json({ status: "ok", message: "Data ontvangen!" });
});

// Dashboard endpoint (inline HTML)
app.get("/dashboard.html", (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>JPBot Dashboard</title>
<style>
body { font-family: sans-serif; background: #1e1e2f; color: #fff; margin: 0; padding: 0; }
header { padding: 1rem; background: #28293d; text-align: center; }
main { padding: 1rem; }
h2 { margin-top: 2rem; }
table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #444; }
tr:hover { background: #333; }
</style>
</head>
<body>
<header><h1>JPBot Dashboard</h1></header>
<main>
<h2>Coins</h2>
<table id="coinsTable">
<thead><tr><th>Symbol</th><th>Pair</th><th>Balance</th><th>Price</th></tr></thead>
<tbody></tbody>
</table>

<h2>Actieve Trades</h2>
<table id="tradesTable">
<thead><tr><th>Symbol</th><th>Entry Price</th><th>Current Price</th></tr></thead>
<tbody></tbody>
</table>
</main>

<script>
// Fetch data en update tabellen
async function fetchData() {
    try {
        const coins = await fetch('/api/coins').then(r=>r.json());
        const trades = await fetch('/api/trades').then(r=>r.json());

        const coinsBody = document.querySelector("#coinsTable tbody");
        coinsBody.innerHTML = coins.map(c=>\`<tr>
            <td>\${c.symbol}</td>
            <td>\${c.pair}</td>
            <td>\${c.balance}</td>
            <td>\${c.currentPrice}</td>
        </tr>\`).join("");

        const tradesBody = document.querySelector("#tradesTable tbody");
        tradesBody.innerHTML = trades.map(t=>\`<tr>
            <td>\${t.symbol}</td>
            <td>\${t.entryPrice}</td>
            <td>\${t.currentPrice}</td>
        </tr>\`).join("");
    } catch(err) {
        console.error("Fout bij ophalen data:", err);
    }
}

// Refresh elke 5 seconden
setInterval(fetchData, 5000);
fetchData();
</script>

</body>
</html>`);
});

// Start server
app.listen(port, () => {
    console.log(`JPBot Dashboard API running on port ${port}`);
});
