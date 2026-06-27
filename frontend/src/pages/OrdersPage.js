// OrdersPage.js
import { useFetch } from "../useFetch";
import { useOrderNotifications } from "../useOrderNotifications";
import { memo } from "react";

const OrderRow = memo(function OrderRow({ order }) {
  return (
    <tr>
      <td>{order.id}</td>
      <td>{order.quantity}</td>
      <td>${order.priceAtPurchase}</td>
      <td>{order.status}</td>
    </tr>
  );
});

export default function OrdersPage() {
    const { data: orders, error } = useFetch("/orders");
    const notifications = useOrderNotifications(1);
    if (error) return <p>Error: {error}</p>;
  return (
    <div className="page">
      <h1>Orders</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
            {orders.map((order) => (
                <OrderRow key={order.id} order={order} />
            ))}
        </tbody>
        </table>

        <h2>Live Order Notifications</h2>
        {notifications.length === 0 && <p>Waiting for orders...</p>}
        <ul>
        {notifications.map((n) => (
            <li key={n.orderId}>
            Order #{n.orderId} — {n.status} — ${n.priceAtPurchase}
            </li>
        ))}
        </ul>

    </div>
  );
}
