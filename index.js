import express from "express";
import cors from "cors";
import path from "path";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files vanuit root
app.use(express.static(path.resolve('./')));

// In-memory coin data
let coinsData = [];

// Healthcheck
app.get("/", (req, res) => {
    res.send("JPBot Dashboard API is running");
});

// API voor coins
app.get("/api/coins", (req, res) => {
    res.json(coinsData);
});

// JPBot stuurt nieuwe data
app.post("/api/coins", (req, res) => {
    const newData = req.body;
    if (!Array.isArray(newData)) {
        return res.status(400).json({ status: "error", message: "Data moet een array zijn" });
    }
    coinsData = newData;
    console.log("✅ Data ontvangen van JPBot:", coinsData);
    res.json({ status: "ok", message: "Data ontvangen!" });
});

app.listen(port, () => {
    console.log(`JPBot Dashboard API is running on port ${port}`);
});
