package com.mystreet.order;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mystreet.order.dto.CartItemRequest;
import com.mystreet.order.dto.OrderDetailResponse;
import com.mystreet.order.dto.OrderSummaryResponse;
import com.mystreet.order.dto.PlaceOrderRequest;
import com.mystreet.order.dto.ShippingAddressRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
@Import({OrderTestSecurityConfig.class, com.mystreet.common.GlobalExceptionHandler.class})
class OrderControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean OrderService orderService;

    private static final UUID USER_ID = UUID.randomUUID();

    private PlaceOrderRequest validRequest() {
        var shipping = new ShippingAddressRequest(
            "John Doe", "123 Street", "Mumbai", "400001", "9876543210");
        return new PlaceOrderRequest(
            List.of(new CartItemRequest(UUID.randomUUID(), "9", 1)),
            shipping, "MOCK_COD"
        );
    }

    private OrderDetailResponse fakeDetail() {
        var shipping = new OrderDetailResponse.ShippingInfo(
            "John", "123 St", "Mumbai", "400001", "9876543210");
        var items = List.of(new com.mystreet.order.dto.OrderItemResponse(
            UUID.randomUUID(), UUID.randomUUID(), "Air Max 90",
            new BigDecimal("119.99"), "9", 1, new BigDecimal("119.99")));
        return new OrderDetailResponse(UUID.randomUUID(), "PLACED", "MOCK_COD",
            new BigDecimal("119.99"), shipping, items, Instant.now());
    }

    @Test
    void placeOrder_noAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest())))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void placeOrder_validRequest_returns201() throws Exception {
        var detail = fakeDetail();
        when(orderService.placeOrder(any(), any()))
            .thenReturn(new OrderResult.Success(new Order()));
        when(orderService.getOrderDetail(any(), any())).thenReturn(detail);

        mockMvc.perform(post("/api/orders")
                .with(jwt().jwt(j -> j.subject(USER_ID.toString()).claim("isAdmin", false)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest())))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("PLACED"));
    }

    @Test
    void placeOrder_emptyItems_returns400() throws Exception {
        var shipping = new ShippingAddressRequest("John", "St", "City", "400001", "9876543210");
        var request = new PlaceOrderRequest(List.of(), shipping, "MOCK_COD");

        mockMvc.perform(post("/api/orders")
                .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void placeOrder_invalidPhone_returns400() throws Exception {
        var shipping = new ShippingAddressRequest("John", "St", "City", "400001", "12345");
        var request = new PlaceOrderRequest(
            List.of(new CartItemRequest(UUID.randomUUID(), "9", 1)),
            shipping, "MOCK_COD"
        );

        mockMvc.perform(post("/api/orders")
                .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void placeOrder_insufficientStock_returns400WithMessage() throws Exception {
        when(orderService.placeOrder(any(), any()))
            .thenReturn(new OrderResult.InsufficientStock("Air Max 90", 10, 3));

        mockMvc.perform(post("/api/orders")
                .with(jwt().jwt(j -> j.subject(USER_ID.toString())))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("INSUFFICIENT_STOCK"));
    }

    @Test
    void getMyOrders_authenticated_returns200() throws Exception {
        var summary = new OrderSummaryResponse(UUID.randomUUID(), "PLACED", "MOCK_COD",
            new BigDecimal("119.99"), 1, Instant.now());
        when(orderService.getMyOrders(any())).thenReturn(List.of(summary));

        mockMvc.perform(get("/api/orders/mine")
                .with(jwt().jwt(j -> j.subject(USER_ID.toString()))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1))
            .andExpect(jsonPath("$[0].status").value("PLACED"));
    }

    @Test
    void getOrderDetail_wrongUser_returns403() throws Exception {
        UUID orderId = UUID.randomUUID();
        when(orderService.getOrderDetail(eq(orderId), any()))
            .thenThrow(new AccessDeniedException("You do not have access to this order"));

        mockMvc.perform(get("/api/orders/{id}", orderId)
                .with(jwt().jwt(j -> j.subject(USER_ID.toString()))))
            .andExpect(status().isForbidden());
    }

    @Test
    void getOrderDetail_notFound_returns404() throws Exception {
        UUID orderId = UUID.randomUUID();
        when(orderService.getOrderDetail(eq(orderId), any()))
            .thenThrow(new EntityNotFoundException("Order not found: " + orderId));

        mockMvc.perform(get("/api/orders/{id}", orderId)
                .with(jwt().jwt(j -> j.subject(USER_ID.toString()))))
            .andExpect(status().isNotFound());
    }
}
