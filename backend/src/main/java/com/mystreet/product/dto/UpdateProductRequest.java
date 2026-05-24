package com.mystreet.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;

public record UpdateProductRequest(
    String name,
    String brand,
    String description,
    @DecimalMin(value = "0.01", message = "Price must be greater than 0") BigDecimal price,
    String imageUrl,
    String sizesCsv,
    @Min(value = 0, message = "Stock quantity cannot be negative") Integer stockQty
) {}
