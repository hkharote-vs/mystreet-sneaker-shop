package com.mystreet.product.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProductDetailResponse(
    UUID id,
    String name,
    String brand,
    String description,
    BigDecimal price,
    String imageUrl,
    String sizesCsv,
    int stockQty,
    Instant createdAt,
    Instant updatedAt
) {}
