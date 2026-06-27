package com.example.ecommerce_backend;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class OrderNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public OrderNotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyOrderUpdate(ProductOrder order) {
        String destination = "/topic/orders/user/" + order.getUser().getId();
        messagingTemplate.convertAndSend(destination, new OrderUpdateMessage(
                order.getId(),
                order.getUser().getId(),
                order.getStatus().name(),    // assuming OrderStatus is an enum
                order.getPriceAtPurchase()
        ));
    }
}
