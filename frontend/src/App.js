import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useFetch } from "./useFetch";
import { placeOrder } from "./api";
import "./App.css";

const HomePage      = lazy(() => import("./pages/HomePage"));
const ProductsPage  = lazy(() => import("./pages/ProductsPage"));
const UsersPage     = lazy(() => import("./pages/UsersPage"));
const OrdersPage    = lazy(() => import("./pages/OrdersPage"));
const MarketplacePage = lazy(() => import("./pages/MarketplacePage"));

export default function App() {
  const [selectedUserId, setSelectedUserId] = useState(1);
  const [simulating, setSimulating]         = useState(false);
  const [speed, setSpeed]                   = useState(1000);

  const { data: products, refetch } = useFetch("/products");
  const { data: users }             = useFetch("/users");
  const productsRef = useRef(products);

  useEffect(() => { productsRef.current = products; }, [products]);

  useEffect(() => {
    if (!simulating) return;

    const id = setInterval(async () => {
      const inStock = productsRef.current.filter((p) => p.stockQuantity > 0);
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
      <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          <Route path="/"           element={<HomePage />} />
          <Route path="/products"   element={<ProductsPage />} />
          <Route path="/users"      element={<UsersPage />} />
          <Route path="/orders"     element={<OrdersPage selectedUserId={selectedUserId} />} />
          <Route path="/marketplace" element={
            <MarketplacePage
              selectedUserId={selectedUserId}
              products={products}
              refetch={refetch}
            />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
