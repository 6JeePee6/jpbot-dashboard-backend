import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let coinsData = [];

// Healthcheck
app.get("/", (req, res) => {
    res.send("JPBot Dashboard API is running");
});

// Frontend haalt coins op
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
