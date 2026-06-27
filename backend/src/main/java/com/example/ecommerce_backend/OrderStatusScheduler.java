package com.example.ecommerce_backend;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class OrderStatusScheduler {

    private final ProductOrderRepository orderRepository;
    private final OrderNotificationService notificationService;

    public OrderStatusScheduler(ProductOrderRepository orderRepository,
                                OrderNotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
    }

    // Fetch all three lists before writing so each order advances exactly one
    // step per tick regardless of how many orders are in flight.
    @Scheduled(fixedDelay = 8000)
    public void advanceOrderStatuses() {
        List<ProductOrder> pending   = orderRepository.findByStatus(OrderStatus.PENDING);
        List<ProductOrder> confirmed = orderRepository.findByStatus(OrderStatus.CONFIRMED);
        List<ProductOrder> shipped   = orderRepository.findByStatus(OrderStatus.SHIPPED);

        advance(pending,   OrderStatus.CONFIRMED);
        advance(confirmed, OrderStatus.SHIPPED);
        advance(shipped,   OrderStatus.DELIVERED);
    }

    private void advance(List<ProductOrder> orders, OrderStatus next) {
        if (orders.isEmpty()) return;
        orders.forEach(o -> o.setStatus(next));
        orderRepository.saveAll(orders);
        orders.forEach(notificationService::notifyOrderUpdate);
    }
}
