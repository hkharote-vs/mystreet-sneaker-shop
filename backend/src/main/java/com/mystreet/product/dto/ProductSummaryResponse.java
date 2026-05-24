package com.mystreet.product.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductSummaryResponse(
    UUID id,
    String name,
    String brand,
    BigDecimal price,
    String imageUrl,
    String sizesCsv,
    int stockQty
) {}
