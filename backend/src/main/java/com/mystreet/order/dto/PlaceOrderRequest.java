package com.mystreet.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.List;

public record PlaceOrderRequest(
    @NotEmpty(message = "Order must have at least one item") List<@Valid CartItemRequest> items,
    @NotNull @Valid ShippingAddressRequest shippingAddress,
    @NotNull @Pattern(regexp = "MOCK_COD|MOCK_UPI", message = "Payment mode must be MOCK_COD or MOCK_UPI")
    String paymentMode
) {}
