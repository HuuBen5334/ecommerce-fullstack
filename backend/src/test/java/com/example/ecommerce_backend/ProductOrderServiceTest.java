package com.example.ecommerce_backend;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pricing.Pricing;
import pricing.PricingServiceGrpc;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductOrderServiceTest {

    @Mock ProductRepository productRepository;
    @Mock ProductOrderRepository productOrderRepository;
    @Mock UserRepository userRepository;
    @Mock PricingServiceGrpc.PricingServiceBlockingStub pricingStub;
    @Mock OrderNotificationService orderNotificationService;

    @InjectMocks ProductOrderService service;

    @Test
    void placeOrder_success_decrementsStock() throws Exception {
        Product product = new Product();
        product.setStockQuantity(10);
        product.setPrice(new BigDecimal("99.99"));
        Field productId = Product.class.getDeclaredField("id");
        productId.setAccessible(true);
        productId.set(product, 1L);

        User user = new User();

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);
        when(userRepository.findById(2L)).thenReturn(Optional.of(user));
        when(productOrderRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(pricingStub.getPrice(any())).thenReturn(
                Pricing.PriceResponse.newBuilder().setComputedPrice(99.99).build()
        );

        ProductOrder order = service.placeOrder(1L, 2L, 3);

        assertEquals(7, product.getStockQuantity()); // 10 - 3
        assertEquals(new BigDecimal("99.99"), order.getPriceAtPurchase());
        assertEquals(OrderStatus.PENDING, order.getStatus());
        verify(orderNotificationService).notifyOrderUpdate(order);
    }

    @Test
    void placeOrder_insufficientStock_throwsOutOfStockException() {
        Product product = new Product();
        product.setStockQuantity(2);

        when(productRepository.findById(1L)).thenReturn(Optional.of(product));

        assertThrows(OutOfStockException.class, () -> service.placeOrder(1L, 2L, 5));
    }

    @Test
    void placeOrder_productNotFound_throwsProductNotFoundException() {
        when(productRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ProductNotFoundException.class, () -> service.placeOrder(99L, 1L, 1));
    }

    @Test
    void placeOrder_nonPositiveQuantity_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> service.placeOrder(1L, 1L, 0));
    }
}