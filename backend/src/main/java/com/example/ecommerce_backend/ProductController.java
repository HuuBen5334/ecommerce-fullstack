package com.example.ecommerce_backend;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Sort;

import java.util.List;

// Marks this class as a REST controller — Spring will handle HTTP requests here
// and automatically serialize return values to JSON
@RestController
// All endpoints in this class are prefixed with /products
@RequestMapping("/products")
public class ProductController {

    // Repository is injected by Spring at runtime — we never call "new ProductRepository()"
    private final ProductRepository productRepository;

    // Constructor injection: Spring sees this needs a ProductRepository and provides one
    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // Handles GET /products — returns all rows in the product table as JSON
    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll(Sort.by("id").ascending());
    }

    @GetMapping("/{id}")
    // @PathVariable tells Spring to take the {id} from the URL and pass it as the id parameter to the method.
    public Product getProduct(@PathVariable Long id) {
        return productRepository.findById(id).orElseThrow(() -> new ProductNotFoundException(id));
    }

    // Handles POST /products — creates a new product
    @PostMapping
    public ResponseEntity<Product> createProduct(@RequestBody Product product) {
        // @RequestBody converts incoming JSON into a Product object automatically
        Product saved = productRepository.save(product); // INSERT into database
        // Return 201 Created instead of default 200 OK — signals a resource was created
        return ResponseEntity.status(201).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        try {
            productRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            return ResponseEntity.status(409).build();
        }
    }

    // Update product
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product updated) {
        // Fetch existing product
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));
        // Update product
        product.setStockQuantity(updated.getStockQuantity());
        product.setName(updated.getName());
        product.setPrice(updated.getPrice());

        return ResponseEntity.ok(productRepository.save(product));
    }

}
