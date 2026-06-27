import { lazy, Suspense, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";

const HomePage = lazy(() => import("./pages/HomePage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const MarketplacePage = lazy(() => import("./pages/MarketplacePage"));

export default function App() {
  const [selectedUserId, setSelectedUserId] = useState(1);

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
      </header>
      <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/orders" element={<OrdersPage selectedUserId={selectedUserId} />} />
          <Route path="/marketplace" element={
            <MarketplacePage
              selectedUserId={selectedUserId}
              onUserChange={setSelectedUserId}
            />}
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
