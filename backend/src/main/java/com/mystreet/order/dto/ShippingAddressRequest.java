package com.mystreet.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ShippingAddressRequest(
    @NotBlank String name,
    @NotBlank String addressLine,
    @NotBlank String city,
    @NotBlank @Pattern(regexp = "\\d{6}", message = "PIN must be 6 digits") String pin,
    @NotBlank @Pattern(regexp = "\\d{10}", message = "Phone must be 10 digits") String phone
) {}
