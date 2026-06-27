package com.example.ecommerce_backend;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class OrderStatusScheduler {

    private final ProductOrderRepository orderRepository;
    private final OrderNotificationService notificationService;

    public OrderStatusScheduler(ProductOrderRepository orderRepository,
                                OrderNotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
    }

    @Scheduled(fixedDelay = 8000)
    public void advanceOrderStatuses() {
        Map<OrderStatus, List<ProductOrder>> byStatus = orderRepository
                .findByStatusIn(List.of(OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.SHIPPED))
                .stream()
                .collect(Collectors.groupingBy(ProductOrder::getStatus));

        advance(byStatus.getOrDefault(OrderStatus.PENDING,   Collections.emptyList()), OrderStatus.CONFIRMED);
        advance(byStatus.getOrDefault(OrderStatus.CONFIRMED, Collections.emptyList()), OrderStatus.SHIPPED);
        advance(byStatus.getOrDefault(OrderStatus.SHIPPED,   Collections.emptyList()), OrderStatus.DELIVERED);
    }

    private void advance(List<ProductOrder> orders, OrderStatus next) {
        if (orders.isEmpty()) return;
        orders.forEach(o -> o.setStatus(next));
        orderRepository.saveAll(orders);
        orders.forEach(notificationService::notifyOrderUpdate);
    }
}
