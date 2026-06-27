import { useState, useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export function useOrderNotifications(userId) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      onConnect: () => {
        client.subscribe(`/topic/orders/user/${userId}`, (message) => {
          const body = JSON.parse(message.body);
          setNotifications((prev) => [body, ...prev]);
        });
      },
    });

    client.activate();

    return () => client.deactivate();
  }, [userId]);

  return notifications;
}
