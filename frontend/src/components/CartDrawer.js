import { memo } from "react";

const CartItem = memo(function CartItem({ item, onRemove, onQtyChange }) {
  return (
    <div className="cart-item">
      <div className="cart-item-info">
        <span className="cart-item-name">{item.product.name}</span>
        <span className="cart-item-price">
          ${(parseFloat(item.product.price) * item.qty).toFixed(2)}
        </span>
      </div>
      <div className="cart-item-controls">
        <button
          className="qty-btn"
          onClick={() => onQtyChange(item.product.id, item.qty - 1)}
          disabled={item.qty <= 1}
        >
          −
        </button>
        <span className="qty-value">{item.qty}</span>
        <button
          className="qty-btn"
          onClick={() => onQtyChange(item.product.id, item.qty + 1)}
        >
          +
        </button>
        <button className="cart-remove" onClick={() => onRemove(item.product.id)}>
          ✕
        </button>
      </div>
    </div>
  );
});

export default function CartDrawer({ open, onClose, items, onRemove, onQtyChange, onCheckout, checking }) {
  if (!open) return null;

  const totalItems = items.reduce((n, i) => n + i.qty, 0);
  const total = items.reduce((sum, i) => sum + parseFloat(i.product.price) * i.qty, 0);

  return (
    <>
      <div className="cart-backdrop" onClick={onClose} />
      <div className="cart-drawer">
        <div className="cart-header">
          <h2>Cart{totalItems > 0 ? ` (${totalItems})` : ""}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {items.length === 0 ? (
          <p className="cart-empty">Your cart is empty.</p>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <CartItem
                  key={item.product.id}
                  item={item}
                  onRemove={onRemove}
                  onQtyChange={onQtyChange}
                />
              ))}
            </div>
            <div className="cart-footer">
              <div className="cart-total">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <button
                className="cart-checkout-btn"
                onClick={onCheckout}
                disabled={checking}
              >
                {checking ? "Placing orders…" : "Checkout"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
