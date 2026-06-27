package com.example.ecommerce_backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public DataSeeder(ProductRepository productRepository, UserRepository userRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {

        if (userRepository.count() == 0) {
            userRepository.saveAll(List.of(
                new User("Bob Stewart",  "bob.stewart@example.com"),
                new User("Theresa May",  "theresa.may@example.com"),
                new User("Ben Button",   "ben.button@example.com")
            ));
            System.out.println("Seeded 3 default users.");
        }

        if (productRepository.count() > 0) return;

        RestTemplate rest = new RestTemplate();
        DummyJsonResponse response = rest.getForObject(
            "https://dummyjson.com/products?limit=0", DummyJsonResponse.class
        );

        if (response == null || response.products() == null) return;

        List<Product> products = response.products().stream()
            .map(p -> new Product(
                p.title(),
                BigDecimal.valueOf(p.price()).setScale(2, java.math.RoundingMode.HALF_UP),
                p.stock(),
                p.description(),
                p.thumbnail(),
                p.category()
            ))
            .toList();

        productRepository.saveAll(products);
        System.out.println("Seeded " + products.size() + " products from DummyJSON.");
    }

    record DummyJsonResponse(List<DummyProduct> products) {}
    record DummyProduct(String title, double price, int stock,
                        String description, String thumbnail, String category) {}
}
