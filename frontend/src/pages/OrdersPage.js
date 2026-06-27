import { useOrderNotifications } from "../useOrderNotifications";
import { memo } from "react";

function formatDate(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const OrderRow = memo(function OrderRow({ order }) {
  return (
    <tr>
      <td>{order.id}</td>
      <td>{order.product?.name ?? "—"}</td>
      <td>{order.user?.name ?? "—"}</td>
      <td>{order.quantity}</td>
      <td>${order.priceAtPurchase}</td>
      <td>{order.status}</td>
      <td>{formatDate(order.createdAt)}</td>
    </tr>
  );
});

export default function OrdersPage({ selectedUserId = 1, users = [], orders = [] }) {
  const notifications = useOrderNotifications(selectedUserId, users);

  return (
    <div className="page orders-page">
      <h1>Orders</h1>
      <div className="orders-layout">
        <div className="orders-table-col">
          <table className="table--compact">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>User</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Status</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="orders-feed-col">
          <h2>Live Notifications</h2>
          {notifications.length === 0
            ? <p className="feed-empty">Waiting for orders...</p>
            : (
              <ul>
                {notifications.map((n) => (
                  <li key={`${n.orderId}-${n.status}`}>
                    <span className="feed-order">Order #{n.orderId}</span>
                    <span className={`feed-status feed-status--${n.status.toLowerCase()}`}>{n.status}</span>
                    <span className="feed-price">${Number(n.priceAtPurchase).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )
          }
        </div>
      </div>
    </div>
  );
}
