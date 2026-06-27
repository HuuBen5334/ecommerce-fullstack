package com.example.ecommerce_backend;

import jakarta.persistence.*;

import java.math.BigDecimal;

// Tells JPA this class maps to a database table called "product"
@Entity
public class Product {
    // Marks this field as the primary key in the table
    @Id
    // Tells PostgreSQL to auto-increment this value (like SERIAL in SQL)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;            // Long (not long) because JPA needs nullable types for PKs
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private BigDecimal price;   // Exact decimal — never use double for money
    @Column(nullable = false)
    private Integer stockQuantity;

    @Column(length = 1000)
    private String description;

    private String imageUrl;

    @Version
    private Long version;

    public Product() {}

    public Product(String name, BigDecimal price, Integer stockQuantity) {
        this.name = name;
        this.price = price;
        this.stockQuantity = stockQuantity;
    }

    public Product(String name, BigDecimal price, Integer stockQuantity,
                   String description, String imageUrl) {
        this.name = name;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.description = description;
        this.imageUrl = imageUrl;
    }

    // Getters

    public Long getId() {
        return id;
    }

    public Integer getStockQuantity() {
        return stockQuantity;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getName() {
        return name;
    }

    public String getDescription() { return description; }

    public String getImageUrl() { return imageUrl; }

    public Long getVersion() {
        return version;
    }

    // Setters
    public void setName(String name) {
        this.name = name;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity;
    }
}

