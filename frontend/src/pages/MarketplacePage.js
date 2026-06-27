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

export default function MarketplacePage({ selectedUserId, products, users, refetch }) {
  const [buying, setBuying]           = useState(null);
  const [expanded, setExpanded]       = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))].sort(
    (a, b) => a === "All" ? -1 : a.localeCompare(b)
  );

  const visible = activeCategory === "All"
    ? products
    : products.filter((p) => p.category === activeCategory);

  async function handleBuy(productId) {
    const userId = selectedUserId === 0 && users.length > 0
      ? users[Math.floor(Math.random() * users.length)].id
      : selectedUserId;
    setBuying(productId);
    try {
      await placeOrder(productId, userId, 1);
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setBuying(null);
    }
  }

  const inStock = visible.filter((p) => p.stockQuantity > 0).length;
  const expandedProduct = expanded
    ? products.find((p) => p.id === expanded.id) ?? expanded
    : null;

  return (
    <div className="marketplace-layout">
      <aside className="category-sidebar">
        <h3>Categories</h3>
        <ul>
          {categories.map((cat) => (
            <li key={cat}>
              <button
                className={`cat-btn ${activeCategory === cat ? "cat-btn--active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
                <span className="cat-count">
                  {cat === "All"
                    ? products.length
                    : products.filter((p) => p.category === cat).length}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="marketplace-main">
        <div className="marketplace-content">
        <h1>Marketplace</h1>
        <p className="stock-summary">{inStock} of {visible.length} products in stock</p>

        <div className="product-grid">
          {visible.map((p) => (
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
        </div>
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
