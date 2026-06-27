package com.example.ecommerce_backend;

import jakarta.transaction.Transactional;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import pricing.Pricing;
import pricing.PricingServiceGrpc;

import java.math.BigDecimal;

@Service
public class ProductOrderService {
    private final ProductRepository productRepository;
    private final ProductOrderRepository productOrderRepository;
    private final UserRepository userRepository;
    private final PricingServiceGrpc.PricingServiceBlockingStub pricingStub;
    private final OrderNotificationService orderNotificationService;

    public ProductOrderService(ProductRepository productRepository,
                               ProductOrderRepository productOrderRepository,
                               UserRepository userRepository,
                               PricingServiceGrpc.PricingServiceBlockingStub pricingStub,
                               OrderNotificationService orderNotificationService) {
        this.productRepository = productRepository;
        this.productOrderRepository = productOrderRepository;
        this.userRepository = userRepository;
        this.pricingStub = pricingStub;
        this.orderNotificationService = orderNotificationService;
    }

    // 1. Find the product by id — it might not exist
    // 2. Check stock > 0 — if not, reject the order
    // 3. Decrement stockQuantity by the requested quantity
    // 4. Save the updated product — @Version check happens here automatically
    //    if another thread modified it first, JPA throws OptimisticLockException
    // 5. Create and save the ProductOrder
    // 6. Return the saved order
    @Retryable(retryFor = ObjectOptimisticLockingFailureException.class, maxAttempts = 3,
               backoff = @Backoff(delay = 50, multiplier = 2))
    @Transactional
    public ProductOrder placeOrder(Long productId, Long userId, Integer quantity) {
        if (quantity <= 0) throw new IllegalArgumentException("Quantity must be positive");
        // 1.
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException(productId));
        // 2.
        if(product.getStockQuantity() < quantity) {
            throw new OutOfStockException(productId);
        }
        // 3.
        product.setStockQuantity(product.getStockQuantity() - quantity);
        // 4.
        Product savedProduct = productRepository.save(product);

        BigDecimal computedPrice = BigDecimal.valueOf(
                pricingStub.getPrice(Pricing.PriceRequest.newBuilder()
                        .setProductId(savedProduct.getId())
                        .setQuantity(quantity)
                        .setBasePrice(savedProduct.getPrice().doubleValue())
                        .setStockQuantity(savedProduct.getStockQuantity())
                        .build()
                ).getComputedPrice()
        ).setScale(2, java.math.RoundingMode.HALF_UP);

        // 5.
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        ProductOrder newOrder = new ProductOrder();

        newOrder.setQuantity(quantity);
        newOrder.setPriceAtPurchase(computedPrice);
        newOrder.setStatus(OrderStatus.PENDING);
        newOrder.setProduct(savedProduct);
        newOrder.setUser(user);

        ProductOrder savedOrder = productOrderRepository.save(newOrder);
        orderNotificationService.notifyOrderUpdate(savedOrder);
        return savedOrder;
    }

}
