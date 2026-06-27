import { lazy, Suspense, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useFetch } from "./useFetch";
import { placeOrder } from "./api";
import CartDrawer from "./CartDrawer";
import "./App.css";

const HomePage        = lazy(() => import("./pages/HomePage"));
const ProductsPage    = lazy(() => import("./pages/ProductsPage"));
const UsersPage       = lazy(() => import("./pages/UsersPage"));
const OrdersPage      = lazy(() => import("./pages/OrdersPage"));
const MarketplacePage = lazy(() => import("./pages/MarketplacePage"));

export default function App() {
  const [selectedUserId, setSelectedUserId] = useState(1);
  const [simulating, setSimulating]         = useState(false);
  const [speed, setSpeed]                   = useState(1000);
  const [cart, setCart]                     = useState([]);
  const [cartOpen, setCartOpen]             = useState(false);
  const [checking, setChecking]             = useState(false);

  const { data: products, refetch }               = useFetch("/products");
  const { data: users,    refetch: refetchUsers }  = useFetch("/users");
  const { data: orders,   refetch: refetchOrders } = useFetch("/orders");
  const productsRef = useRef(products);
  const usersRef    = useRef(users);

  const usersMap = useMemo(() =>
    new Map(users.map((u) => [u.id, u])),
  [users]);

  const cartMap = useMemo(() =>
    new Map(cart.map((i) => [i.product.id, i.qty])),
  [cart]);

  const cartCount = useMemo(() => cart.reduce((n, i) => n + i.qty, 0), [cart]);

  useEffect(() => { productsRef.current = products; }, [products]);
  useEffect(() => { usersRef.current    = users; },    [users]);

  useEffect(() => {
    if (!simulating) return;

    const id = setInterval(async () => {
      const inStock     = productsRef.current.filter((p) => p.stockQuantity > 0);
      const activeUsers = usersRef.current;
      if (inStock.length === 0 || activeUsers.length === 0) { setSimulating(false); return; }

      const p      = inStock[Math.floor(Math.random() * inStock.length)];
      const userId = selectedUserId === 0
        ? activeUsers[Math.floor(Math.random() * activeUsers.length)].id
        : selectedUserId;
      try {
        await placeOrder(p.id, userId, 1);
        refetch();
      } catch (e) {
        console.error(e);
      }
    }, speed);

    return () => clearInterval(id);
  }, [simulating, speed, refetch, selectedUserId]);

  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.product.id === product.id);
      if (exists) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const setCartQty = useCallback((productId, qty) => {
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, qty } : i));
  }, []);

  async function checkout() {
    if (cart.length === 0) return;
    const resolvedUserId = selectedUserId === 0 && users.length > 0
      ? users[Math.floor(Math.random() * users.length)].id
      : selectedUserId;
    if (!resolvedUserId) return;
    setChecking(true);
    try {
      for (const item of cart) {
        await placeOrder(item.product.id, resolvedUserId, item.qty);
      }
      setCart([]);
      setCartOpen(false);
      refetch();
      refetchOrders();
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  }

  return (
    <BrowserRouter>
      <header className="title-bar">
        <Link to="/" className="title-link">E-Commerce Dashboard</Link>
        <nav>
          <Link to="/products">Products</Link>
          <Link to="/users">Users</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/marketplace">Marketplace</Link>
        </nav>
        <div className="header-controls">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
            className="user-select"
          >
            <option value={0}>🎲 Random User</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <button
            className={`sim-btn ${simulating ? "sim-btn--active" : ""}`}
            onClick={() => setSimulating((s) => !s)}
          >
            {simulating ? "Stop" : "Simulate"}
          </button>
          <input
            type="range"
            min="200"
            max="3000"
            step="100"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="speed-slider"
          />
          <span className="speed-label">{speed}ms</span>
        </div>
      </header>
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onRemove={removeFromCart}
        onQtyChange={setCartQty}
        onCheckout={checkout}
        checking={checking}
      />
      <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          <Route path="/"           element={<HomePage products={products} users={users} orders={orders} />} />
          <Route path="/products"   element={<ProductsPage products={products} refetch={refetch} />} />
          <Route path="/users"      element={<UsersPage users={users} refetch={refetchUsers} />} />
          <Route path="/orders"     element={<OrdersPage selectedUserId={selectedUserId} users={users} orders={orders} refetch={refetchOrders} />} />
          <Route path="/marketplace" element={
            <MarketplacePage
              selectedUserId={selectedUserId}
              products={products}
              users={users}
              refetch={refetch}
              onAddToCart={addToCart}
              cartMap={cartMap}
              cartCount={cartCount}
              onCartOpen={() => setCartOpen(true)}
            />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
