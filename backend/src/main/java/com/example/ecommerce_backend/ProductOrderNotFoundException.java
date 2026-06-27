package com.example.ecommerce_backend;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ProductOrderNotFoundException extends RuntimeException {
    public ProductOrderNotFoundException(Long id) {
        super("Order not found: " + id);
    }
}
