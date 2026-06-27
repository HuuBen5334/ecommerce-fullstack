package com.example.ecommerce_backend;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(indexes = {
        @Index(name = "idx_product_order_product_id", columnList = "product_id"),
        @Index(name = "idx_product_order_user_id",    columnList = "user_id")
})
public class ProductOrder {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private BigDecimal priceAtPurchase;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @ManyToOne
    @JoinColumn(nullable = false)
    private Product product;

    @ManyToOne
    @JoinColumn(nullable = false)
    private User user;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    public ProductOrder() {}

    public ProductOrder(Integer quantity, BigDecimal priceAtPurchase, OrderStatus status, Product product, User user) {
        this.quantity = quantity;
        this.priceAtPurchase = priceAtPurchase;
        this.status = status;
        this.product = product;
        this.user = user;
    }

    public Long getId() { return id; }
    public Integer getQuantity() { return quantity; }
    public BigDecimal getPriceAtPurchase() { return priceAtPurchase; }
    public OrderStatus getStatus() { return status; }
    public Product getProduct() { return product; }
    public User getUser() { return user; }
    public Instant getCreatedAt() { return createdAt; }

    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public void setPriceAtPurchase(BigDecimal priceAtPurchase) { this.priceAtPurchase = priceAtPurchase; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public void setProduct(Product product) { this.product = product; }
    public void setUser(User user) { this.user = user; }
}