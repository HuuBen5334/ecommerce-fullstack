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

function ProductModal({ product, selectedUserId, onClose, onBuy, buying }) {
  // Close on Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.name} className="modal-image" />
        )}
        <h2>{product.name}</h2>
        {product.description && <p className="modal-description">{product.description}</p>}
        <p className="product-price">${product.price}</p>
        <p className="product-stock">Stock: {product.stockQuantity}</p>
        <button
          className="modal-buy"
          onClick={() => onBuy(product.id)}
          disabled={buying === product.id || product.stockQuantity === 0}
        >
          {buying === product.id ? "Ordering..." : product.stockQuantity === 0 ? "Out of Stock" : "Buy"}
        </button>
      </div>
    </div>
  );
}

export default function MarketplacePage({ selectedUserId, onUserChange }) {
  const { data: products, error, refetch } = useFetch("/products");
  const { data: users } = useFetch("/users");
  const [buying, setBuying] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [expanded, setExpanded] = useState(null); // product being viewed in modal
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

  // Keep modal in sync with latest stock after refetch
  const expandedProduct = expanded
    ? products.find((p) => p.id === expanded.id) ?? expanded
    : null;

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
          <div
            key={p.id}
            className="product-card"
            onClick={() => setExpanded(p)}
            style={{ cursor: "pointer" }}
          >
            {p.imageUrl && (
              <img src={p.imageUrl} alt={p.name} className="product-image" />
            )}
            <h3>{p.name}</h3>
            {p.description && <p className="product-description">{p.description}</p>}
            <p className="product-price">${p.price}</p>
            <p className="product-stock">Stock: {p.stockQuantity}</p>
            <button
              onClick={(e) => { e.stopPropagation(); handleBuy(p.id); }}
              disabled={buying === p.id || p.stockQuantity === 0}
            >
              {buying === p.id ? "Ordering..." : p.stockQuantity === 0 ? "Out of Stock" : "Buy"}
            </button>
          </div>
        ))}
      </div>

      {expandedProduct && (
        <ProductModal
          product={expandedProduct}
          selectedUserId={selectedUserId}
          onClose={() => setExpanded(null)}
          onBuy={handleBuy}
          buying={buying}
        />
      )}
    </div>
  );
}
