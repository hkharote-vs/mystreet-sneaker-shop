package com.mystreet.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderDetailResponse(
    UUID id,
    String status,
    String paymentMode,
    BigDecimal totalAmount,
    ShippingInfo shippingAddress,
    List<OrderItemResponse> items,
    Instant createdAt
) {
    public record ShippingInfo(
        String name,
        String addressLine,
        String city,
        String pin,
        String phone
    ) {}
}
