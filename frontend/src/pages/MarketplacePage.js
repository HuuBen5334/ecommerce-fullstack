import { useState, useEffect } from "react";
import { placeOrder } from "../api";

function ProductModal({ product, onClose, onBuy, buying }) {
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

export default function MarketplacePage({ selectedUserId, products, refetch }) {
  const [buying, setBuying]     = useState(null);
  const [expanded, setExpanded] = useState(null);

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

  const inStock = products.filter((p) => p.stockQuantity > 0).length;
  const expandedProduct = expanded
    ? products.find((p) => p.id === expanded.id) ?? expanded
    : null;

  return (
    <div className="page">
      <h1>Marketplace</h1>
      <p className="stock-summary">{inStock} of {products.length} products in stock</p>

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
          onClose={() => setExpanded(null)}
          onBuy={handleBuy}
          buying={buying}
        />
      )}
    </div>
  );
}
