import React, { useEffect, useState } from "react";

function App() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Haal coins op van je backend
  const fetchCoins = async () => {
    try {
      const res = await fetch("https://jpbot-dashboard-backend.onrender.com/api/coins");
      const data = await res.json();
      setCoins(data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Fout bij ophalen coins:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
    // Optioneel: update elke 10 seconden
    const interval = setInterval(fetchCoins, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="loading">🔄 Data laden...</div>;

  return (
    <div className="container">
      <h1>JPBot Dashboard</h1>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Pair</th>
            <th>Balance</th>
            <th>Current Price (€)</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin, index) => (
            <tr key={index}>
              <td>{coin.symbol}</td>
              <td>{coin.pair}</td>
              <td>{coin.balance}</td>
              <td>{coin.currentPrice.toFixed(6)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
