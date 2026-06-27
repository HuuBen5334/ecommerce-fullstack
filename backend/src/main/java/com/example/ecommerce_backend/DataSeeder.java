package com.example.ecommerce_backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;

    public DataSeeder(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Override
    public void run(String... args) {

        if (productRepository.count() > 0) return;

        RestTemplate rest = new RestTemplate();
        DummyJsonResponse response = rest.getForObject(
            "https://dummyjson.com/products?limit=30", DummyJsonResponse.class
        );

        if (response == null || response.products() == null) return;

        List<Product> products = response.products().stream()
            .map(p -> new Product(
                p.title(),
                BigDecimal.valueOf(p.price()).setScale(2, java.math.RoundingMode.HALF_UP),
                p.stock(),
                p.description(),
                p.thumbnail()
            ))
            .toList();

        productRepository.saveAll(products);
        System.out.println("Seeded " + products.size() + " products from DummyJSON.");
    }

    record DummyJsonResponse(List<DummyProduct> products) {}
    record DummyProduct(String title, double price, int stock, String description, String thumbnail) {}
}
