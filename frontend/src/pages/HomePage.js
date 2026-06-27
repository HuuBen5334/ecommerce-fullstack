import { Link } from "react-router-dom";

function SummaryCard({ title, data, to, stats }) {
  return (
    <Link to={to} className="summary-card">
      <h2>{title}</h2>
      <p className="card-count">{data.length}</p>
      {stats && <div className="card-stats">{stats(data)}</div>}
    </Link>
  );
}

const STEPS = [
  {
    number: "1",
    title: "Browse the Marketplace",
    description:
      "Head to the Marketplace to see all available products. Use the category sidebar to filter by type, and click any product card to view details or buy manually.",
    link: "/marketplace",
    linkLabel: "Go to Marketplace",
  },
  {
    number: "2",
    title: "Pick a User",
    description:
      'Select a user from the dropdown in the header. Choose a specific user to buy as them, or pick "🎲 Random User" to have the simulation rotate through all users automatically.',
  },
  {
    number: "3",
    title: "Run the Simulation",
    description:
      "Hit Simulate in the header. The system will continuously place random orders at the interval shown by the speed slider. Watch stock levels drop in real time.",
  },
  {
    number: "4",
    title: "Watch Live Orders",
    description:
      "Open the Orders page while the simulation is running. The right column shows a live notification feed pushed over WebSocket as each order changes status: Pending → Confirmed → Shipped → Delivered.",
    link: "/orders",
    linkLabel: "Go to Orders",
  },
  {
    number: "5",
    title: "Replenish Stock",
    description:
      "When products sell out the simulation stops automatically. Go to the Products page to replenish any out-of-stock item back to 100 units, then resume.",
    link: "/products",
    linkLabel: "Go to Products",
  },
];

export default function HomePage({ products = [], users = [], orders = [] }) {
  return (
    <div className="page">
      <h1>Dashboard</h1>
      <div className="summary-grid">
        <SummaryCard
          title="Products"
          data={products}
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
        <SummaryCard title="Users" data={users} to="/users" />
        <SummaryCard
          title="Orders"
          data={orders}
          to="/orders"
          stats={(data) => {
            if (!data.length) return null;
            const pending = data.filter((o) => o.status === "PENDING").length;
            return <span>{pending} pending</span>;
          }}
        />
      </div>

      <div className="guide">
        <h2 className="guide-title">How to use this project</h2>
        <p className="guide-subtitle">
          This is a full-stack e-commerce simulation. You can browse products, place orders manually,
          or run an automated simulation to stress-test the system in real time.
        </p>
        <div className="guide-steps">
          {STEPS.map((step) => (
            <div key={step.number} className="guide-step">
              <div className="guide-step-number">{step.number}</div>
              <div className="guide-step-body">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                {step.link && (
                  <Link to={step.link} className="guide-link">{step.linkLabel}</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
