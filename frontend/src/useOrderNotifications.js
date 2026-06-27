import { useState, useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export function useOrderNotifications(userId, users = []) {
  const [notifications, setNotifications] = useState([]);

  // Stable string dep — avoids reconnecting on every render when users array ref changes
  const userIds = users.map((u) => u.id).join(",");

  useEffect(() => {
    const topics =
      userId === 0
        ? users.map((u) => `/topic/orders/user/${u.id}`)
        : [`/topic/orders/user/${userId}`];

    if (topics.length === 0) return;

    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      onConnect: () => {
        topics.forEach((topic) => {
          client.subscribe(topic, (message) => {
            const body = JSON.parse(message.body);
            setNotifications((prev) => [body, ...prev]);
          });
        });
      },
    });

    client.activate();
    return () => client.deactivate();
  }, [userId, userIds]); // eslint-disable-line react-hooks/exhaustive-deps

  return notifications;
}
