package com.mystreet.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface ProductRepository
        extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    @Modifying
    @Query("""
        UPDATE Product p
        SET p.stockQty = p.stockQty - :quantity
        WHERE p.id = :id AND p.stockQty >= :quantity
        """)
    int decrementStock(UUID id, int quantity);

    Optional<Product> findByNameIgnoreCaseAndBrandIgnoreCase(String name, String brand);
}
