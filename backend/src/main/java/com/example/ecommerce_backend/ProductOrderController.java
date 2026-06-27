package com.example.ecommerce_backend;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Sort;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class ProductOrderController {

    private final ProductOrderRepository productOrderRepository;
    private final ProductOrderService productOrderService;

    // Constructor injection: Spring sees this needs a ProductOrderRepository and provides one
    public ProductOrderController(ProductOrderRepository productOrderRepository,
                                  ProductOrderService productOrderService) {
        this.productOrderRepository = productOrderRepository;
        this.productOrderService = productOrderService;
    }

    // Get all
    @GetMapping
    public List<ProductOrder> getAllProductOrders() {
        return productOrderRepository.findAll(Sort.by("id").ascending());
    }

    // Get
    @GetMapping("/{id}")
    public ProductOrder getProductOrder(@PathVariable Long id) {
        return productOrderRepository.findById(id).orElseThrow(() -> new ProductOrderNotFoundException(id));
    }
    // Add
    @PostMapping
    public ResponseEntity<ProductOrder> createProductOrder(
            @RequestParam Long productId,
            @RequestParam Long userId,
            @RequestParam Integer quantity) {
        ProductOrder order = productOrderService.placeOrder(productId, userId, quantity);
        return ResponseEntity.status(201).body(order);
    }

    // Put
    @PutMapping("/{id}")
    public ResponseEntity<ProductOrder> updateProductOrder(@PathVariable Long id, @RequestBody  ProductOrder updated) {
        // Fetch existing order
        ProductOrder order = productOrderRepository.findById(id)
                .orElseThrow(() -> new ProductOrderNotFoundException(id));
        // Update order
        order.setQuantity(updated.getQuantity());
        order.setStatus(updated.getStatus());

        return ResponseEntity.ok(productOrderRepository.save(order));
    }
    // Delete
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        productOrderRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }



}
