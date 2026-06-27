package com.example.ecommerce_backend;

import io.grpc.ManagedChannel;
import io.grpc.ManagedChannelBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import pricing.PricingServiceGrpc;

@Configuration
public class GrpcConfig {

    @Bean
    public ManagedChannel pricingChannel() {
        return ManagedChannelBuilder
                .forAddress("localhost", 50051)
                .usePlaintext()
                .build();
    }

    @Bean
    public PricingServiceGrpc.PricingServiceBlockingStub pricingStub(ManagedChannel channel) {
        return PricingServiceGrpc.newBlockingStub(channel);
    }
}
