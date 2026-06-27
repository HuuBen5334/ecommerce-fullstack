import { useState, useEffect, useRef } from "react";
import { useFetch } from "../useFetch";

async function placeOrder(productId, userId, quantity) {
  const res = await fetch(
    `/orders?productId=${productId}&userId=${userId}&quantity=${quantity}`,
    { method: "POST" }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function MarketplacePage({ selectedUserId, onUserChange }) {
  const { data: products, error, refetch } = useFetch("/products");
  const { data: users } = useFetch("/users");
  const [buying, setBuying] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const productsRef = useRef(products);

  useEffect(() => { productsRef.current = products; }, [products]);

  useEffect(() => {
    if (!simulating) return;

    const id = setInterval(async () => {
      const live = productsRef.current;
      const inStock = live.filter((p) => p.stockQuantity > 0);
      if (inStock.length === 0) { setSimulating(false); return; }

      const p = inStock[Math.floor(Math.random() * inStock.length)];
      try {
        await placeOrder(p.id, selectedUserId, 1);
        refetch();
      } catch (e) {
        console.error(e);
      }
    }, speed);

    return () => clearInterval(id);
  }, [simulating, speed, refetch, selectedUserId]);

  async function handleBuy(productId) {
    setBuying(productId);
    try {
      await placeOrder(productId, selectedUserId, 1);
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setBuying(null);
    }
  }

  if (error) return <p>Error: {error}</p>;

  const inStock = products.filter((p) => p.stockQuantity > 0).length;

  return (
    <div className="page">
      <h1>Marketplace</h1>

      <div className="sim-controls">
        <label>
          Buying as:
          <select
            value={selectedUserId}
            onChange={(e) => onUserChange(Number(e.target.value))}
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </label>
        <button onClick={() => setSimulating((s) => !s)}>
          {simulating ? "Stop Simulation" : "Start Simulation"}
        </button>
        <label>
          Speed:
          <input
            type="range"
            min="200"
            max="3000"
            step="100"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
          {speed}ms
        </label>
        <span>{inStock} products in stock</span>
      </div>

      <div className="product-grid">
        {products.map((p) => (
          <div key={p.id} className="product-card">
            {p.imageUrl && (
              <img src={p.imageUrl} alt={p.name} className="product-image" />
            )}
            <h3>{p.name}</h3>
            {p.description && <p className="product-description">{p.description}</p>}
            <p className="product-price">${p.price}</p>
            <p className="product-stock">Stock: {p.stockQuantity}</p>
            <button
              onClick={() => handleBuy(p.id)}
              disabled={buying === p.id || p.stockQuantity === 0}
            >
              {buying === p.id ? "Ordering..." : p.stockQuantity === 0 ? "Out of Stock" : "Buy"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
