package com.example.ecommerce_backend;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.transaction.annotation.EnableTransactionManagement;

// Retry interceptor runs at Ordered.LOWEST_PRECEDENCE by default.
// Setting transaction order one step lower (higher number = lower priority = inner proxy)
// guarantees each retry attempt gets a fresh transaction rather than retrying inside one.
@Configuration
@EnableTransactionManagement(order = Ordered.LOWEST_PRECEDENCE - 1)
public class TransactionConfig {}
