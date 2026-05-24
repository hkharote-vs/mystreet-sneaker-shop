package com.mystreet.order.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
    UUID id,
    UUID productId,
    String productName,
    BigDecimal productPrice,
    String size,
    int quantity,
    BigDecimal subtotal
) {}
