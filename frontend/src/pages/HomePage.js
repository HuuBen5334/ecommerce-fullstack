import { useFetch } from "../useFetch";
import { Link } from "react-router-dom";

function SummaryCard({ title, data, loading, error, to, stats }) {
  return (
    <Link to={to} className="summary-card">
      <h2>{title}</h2>
      {loading && <p className="card-loading"></p>}
      {error && <p className="card-error">Error: {error}</p>}
      {!loading && !error && (
        <>
          <p className="card-count">{data.length}</p>
          
          {stats && <div className="card-stats">{stats(data)}</div>}
        </>
      )}
    </Link>
  );
}

export default function HomePage() {
  const { data: products, loading: pl, error: pe } = useFetch("/products");
  const { data: users, loading: ul, error: ue } = useFetch("/users");
  const { data: orders, loading: ol, error: oe } = useFetch("/orders");

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <div className="summary-grid">
        <SummaryCard
          title="Products"
          data={products}
          loading={pl}
          error={pe}
          to="/products"
          stats={(data) => {
            if (!data.length) return null;
            const prices = data.map((p) => parseFloat(p.price));
            return (
              <>
                <span>Min: ${Math.min(...prices).toFixed(2)}</span>
                <span>Max: ${Math.max(...prices).toFixed(2)}</span>
              </>
            );
          }}
        />
        <SummaryCard
          title="Users"
          data={users}
          loading={ul}
          error={ue}
          to="/users"
        />
        <SummaryCard
          title="Orders"
          data={orders}
          loading={ol}
          error={oe}
          to="/orders"
          stats={(data) => {
            if (!data.length) return null;
            const pending = data.filter((o) => o.status === "PENDING").length;
            return <span>{pending} pending</span>;
          }}
        />
      </div>
    </div>
  );
}
