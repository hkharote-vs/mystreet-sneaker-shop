package com.mystreet.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    @Query("""
        SELECT DISTINCT o FROM Order o
        LEFT JOIN FETCH o.items i
        LEFT JOIN FETCH i.product
        WHERE o.user.id = :userId
        ORDER BY o.createdAt DESC
        """)
    List<Order> findAllByUserIdWithItems(UUID userId);

    @Query("""
        SELECT o FROM Order o
        LEFT JOIN FETCH o.items i
        LEFT JOIN FETCH i.product
        WHERE o.id = :id
        """)
    Optional<Order> findByIdWithItems(UUID id);
}
