package com.mystreet.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateProductRequest(
    @NotBlank(message = "Name is required") String name,
    @NotBlank(message = "Brand is required") String brand,
    String description,
    @NotNull @DecimalMin(value = "0.01", message = "Price must be greater than 0") BigDecimal price,
    String imageUrl,
    String sizesCsv,
    @NotNull @Min(value = 0, message = "Stock quantity cannot be negative") Integer stockQty
) {}
