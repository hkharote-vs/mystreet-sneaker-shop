package com.mystreet.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OrderSummaryResponse(
    UUID id,
    String status,
    String paymentMode,
    BigDecimal totalAmount,
    int itemCount,
    Instant createdAt
) {}
