package com.mystreet.order;

import com.mystreet.auth.AuthUtils;
import com.mystreet.common.ErrorResponse;
import com.mystreet.order.dto.OrderDetailResponse;
import com.mystreet.order.dto.OrderSummaryResponse;
import com.mystreet.order.dto.PlaceOrderRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Orders")
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @Operation(summary = "Place a new order", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    ResponseEntity<?> placeOrder(
            @Valid @RequestBody PlaceOrderRequest request,
            HttpServletRequest httpRequest) {

        var userId = AuthUtils.currentUserId();
        var result = orderService.placeOrder(userId, request);

        return switch (result) {
            case OrderResult.Success(var order) ->
                ResponseEntity.status(HttpStatus.CREATED)
                    .body(orderService.getOrderDetail(order.getId(), userId));

            case OrderResult.InsufficientStock(var name, var requested, var available) ->
                ResponseEntity.badRequest()
                    .body(ErrorResponse.of(
                        httpRequest.getRequestURI(), "INSUFFICIENT_STOCK",
                        String.format("'%s' only has %d in stock (requested %d)",
                            name, available, requested)));

            case OrderResult.ProductNotFound(var productId) ->
                ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ErrorResponse.of(
                        httpRequest.getRequestURI(), "PRODUCT_NOT_FOUND",
                        "Product not found: " + productId));
        };
    }

    @Operation(summary = "Get current user's orders", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/mine")
    ResponseEntity<List<OrderSummaryResponse>> getMyOrders() {
        return ResponseEntity.ok(orderService.getMyOrders(AuthUtils.currentUserId()));
    }

    @Operation(summary = "Get order detail by ID", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/{id}")
    ResponseEntity<OrderDetailResponse> getOrderDetail(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getOrderDetail(id, AuthUtils.currentUserId()));
    }
}
