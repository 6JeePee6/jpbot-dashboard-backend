import express from "express";

const app = express();
app.use(express.json());

// In-memory opslag (voor nu)
let latestState = null;

// Health check (Render wil dit)
app.get("/", (_, res) => {
  res.send("JPBot Dashboard API is running");
});

// iOS → Render
app.post("/state", (req, res) => {
  latestState = {
    ...req.body,
    receivedAt: new Date().toISOString()
  };

  console.log("📥 State ontvangen:", latestState);
  res.json({ status: "ok" });
});

// Dashboard → Render
app.get("/state", (_, res) => {
  if (!latestState) {
    return res.status(404).json({ error: "No data yet" });
  }
  res.json(latestState);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server gestart op poort", PORT);
});
