package com.example.ecommerce_backend;

import java.math.BigDecimal;

public record OrderUpdateMessage(
        Long orderId,
        Long userId,
        String status,
        BigDecimal priceAtPurchase
) {}