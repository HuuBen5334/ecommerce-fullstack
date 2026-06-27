package com.example.ecommerce_backend;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductOrderRepository extends JpaRepository<ProductOrder, Long> {

    @EntityGraph(attributePaths = {"product", "user"})
    List<ProductOrder> findAll(Sort sort);

    List<ProductOrder> findByStatus(OrderStatus status);

    List<ProductOrder> findByStatusIn(List<OrderStatus> statuses);
}
