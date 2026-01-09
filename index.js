import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // voor dashboard.html en assets

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

// Frontend haalt coins op
app.get("/api/coins", (req, res) => {
    res.json(coinsData);
});

// Frontend haalt actieve trades op
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
            entryPrice: c.currentPrice, // neem huidige prijs als entryPrice
            currentPrice: c.currentPrice
        }));

    res.json({ status: "ok", message: "Data ontvangen!" });
});

// Start server
app.listen(port, () => {
    console.log(`JPBot Dashboard API running on port ${port}`);
});
