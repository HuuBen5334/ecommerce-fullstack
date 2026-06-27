import { useState, useMemo } from "react";
import { placeOrder } from "../api";
import cartIcon from "../assets/shoppingcart.png";

const PAGE_SIZE = 24;

function ProductModal({ product, onClose, onBuy, buying, onAddToCart, cartQty }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.name} className="modal-image" loading="lazy" />
        )}
        <h2>{product.name}</h2>
        {product.description && <p className="modal-description">{product.description}</p>}
        <p className="product-price">${product.price}</p>
        <p className="product-stock">Stock: {product.stockQuantity}</p>
        <button
          className="modal-buy"
          onClick={() => onAddToCart(product)}
          disabled={product.stockQuantity === 0}
        >
          {product.stockQuantity === 0
            ? "Out of Stock"
            : cartQty > 0
            ? `Add to Cart (${cartQty} in cart)`
            : "Add to Cart"}
        </button>
        <button
          className="modal-buy modal-buy--secondary"
          onClick={() => onBuy(product.id)}
          disabled={buying === product.id || product.stockQuantity === 0}
        >
          {buying === product.id ? "Ordering..." : "Buy Now"}
        </button>
      </div>
    </div>
  );
}

export default function MarketplacePage({ selectedUserId, products, users, refetch, onAddToCart, cartMap, cartCount, onCartOpen }) {
  const [buying, setBuying]                   = useState(null);
  const [expanded, setExpanded]               = useState(null);
  const [activeCategory, setActiveCategory]   = useState("All");
  const [page, setPage]                       = useState(1);

  const byCategory = useMemo(() =>
    products.reduce((map, p) => {
      const key = p.category ?? "Uncategorized";
      (map[key] ??= []).push(p);
      return map;
    }, {}),
  [products]);

  const categories = useMemo(() =>
    ["All", ...Object.keys(byCategory).sort()],
  [byCategory]);

  const visible = activeCategory === "All" ? products : (byCategory[activeCategory] ?? []);

  const totalPages = Math.ceil(visible.length / PAGE_SIZE);
  const page_items  = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function selectCategory(cat) {
    setActiveCategory(cat);
    setPage(1);
  }

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
      <button className="cart-float-btn" onClick={onCartOpen} aria-label="Open cart">
        <img src={cartIcon} alt="Cart" />
        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
      </button>
      <aside className="category-sidebar">
        <h3>Categories</h3>
        <ul>
          {categories.map((cat) => (
            <li key={cat}>
              <button
                className={`cat-btn ${activeCategory === cat ? "cat-btn--active" : ""}`}
                onClick={() => selectCategory(cat)}
              >
                {cat}
                <span className="cat-count">
                  {cat === "All" ? products.length : (byCategory[cat]?.length ?? 0)}
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
            {page_items.map((p) => {
              const cartQty = cartMap?.get(p.id) ?? 0;
              return (
                <div
                  key={p.id}
                  className="product-card"
                  onClick={() => setExpanded(p)}
                  style={{ cursor: "pointer" }}
                >
                  {p.imageUrl && (
                    <img src={p.imageUrl} alt={p.name} className="product-image" loading="lazy" />
                  )}
                  <h3>{p.name}</h3>
                  {p.description && <p className="product-description">{p.description}</p>}
                  <p className="product-price">${p.price}</p>
                  <p className="product-stock">Stock: {p.stockQuantity}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAddToCart(p); }}
                    disabled={p.stockQuantity === 0}
                  >
                    {p.stockQuantity === 0
                      ? "Out of Stock"
                      : cartQty > 0
                      ? `In Cart (${cartQty})`
                      : "Add to Cart"}
                  </button>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ‹ Prev
              </button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      </div>

      {expandedProduct && (
        <ProductModal
          product={expandedProduct}
          onClose={() => setExpanded(null)}
          onBuy={handleBuy}
          buying={buying}
          onAddToCart={onAddToCart}
          cartQty={cartMap?.get(expandedProduct.id) ?? 0}
        />
      )}
    </div>
  );
}
