# SPEC-04: Orders — Backend

**Status:** `[x] Complete`  
**Depends on:** SPEC-01 (schema), SPEC-02 (auth), SPEC-03 (product — for stock decrement)  
**Blocks:** SPEC-09 (checkout frontend)  

---

## Overview

Implement order placement and retrieval. When a user places an order, the service validates item stock, snapshots product prices, decrements stock atomically, and creates the order record. Uses a sealed interface result type to handle domain outcomes cleanly in the controller using pattern matching.

---

## Package Structure

```
com.mystreet.order/
  ├── Order.java                   (JPA Entity — defined in SPEC-01)
  ├── OrderItem.java               (JPA Entity — defined in SPEC-01)
  ├── OrderRepository.java
  ├── OrderService.java
  ├── OrderController.java
  ├── OrderResult.java             (Sealed interface)
  └── dto/
      ├── PlaceOrderRequest.java   (Record)
      ├── CartItemRequest.java     (Record — nested in PlaceOrderRequest)
      ├── ShippingAddressRequest.java (Record)
      ├── OrderSummaryResponse.java   (Record)
      ├── OrderDetailResponse.java    (Record)
      └── OrderItemResponse.java      (Record)
```

---

## Implementation

### 1. `OrderResult.java` (Sealed Interface — Java 25 pattern)

```java
package com.mystreet.order;

import java.util.List;

public sealed interface OrderResult permits
    OrderResult.Success,
    OrderResult.InsufficientStock,
    OrderResult.ProductNotFound {

    record Success(Order order) implements OrderResult {}
    record InsufficientStock(String productName, int requested, int available) implements OrderResult {}
    record ProductNotFound(String productId) implements OrderResult {}
}
```

### 2. DTOs (Records)

```java
// CartItemRequest.java
package com.mystreet.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CartItemRequest(
    @NotNull UUID productId,
    @NotBlank String size,
    @NotNull @Min(1) Integer quantity
) {}

// ShippingAddressRequest.java
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

// PlaceOrderRequest.java
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

// OrderItemResponse.java
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

// OrderSummaryResponse.java
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

// OrderDetailResponse.java
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
```

### 3. `OrderRepository.java`

```java
package com.mystreet.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    // Fetch orders with items and product eagerly to avoid N+1
    @Query("""
        SELECT DISTINCT o FROM Order o
        LEFT JOIN FETCH o.items i
        LEFT JOIN FETCH i.product
        WHERE o.user.id = :userId
        ORDER BY o.createdAt DESC
        """)
    List<Order> findAllByUserIdWithItems(UUID userId);

    @Query("""
        SELECT o FROM Order o
        LEFT JOIN FETCH o.items i
        LEFT JOIN FETCH i.product
        WHERE o.id = :id
        """)
    Optional<Order> findByIdWithItems(UUID id);
}
```

### 4. `OrderService.java`

```java
package com.mystreet.order;

import com.mystreet.order.dto.*;
import com.mystreet.product.Product;
import com.mystreet.product.ProductRepository;
import com.mystreet.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public OrderResult placeOrder(UUID userId, PlaceOrderRequest request) {
        var user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalStateException("User not found: " + userId));

        var items = new ArrayList<OrderItem>();
        var total = BigDecimal.ZERO;

        for (var itemReq : request.items()) {
            var product = productRepository.findById(itemReq.productId())
                .orElse(null);

            if (product == null) {
                return new OrderResult.ProductNotFound(itemReq.productId().toString());
            }

            if (product.getStockQty() < itemReq.quantity()) {
                return new OrderResult.InsufficientStock(
                    product.getName(), itemReq.quantity(), product.getStockQty());
            }

            // Decrement stock atomically — returns 0 if stock was insufficient (race condition guard)
            int updated = productRepository.decrementStock(product.getId(), itemReq.quantity());
            if (updated == 0) {
                return new OrderResult.InsufficientStock(
                    product.getName(), itemReq.quantity(), product.getStockQty());
            }

            var item = new OrderItem();
            item.setProduct(product);
            item.setProductName(product.getName());        // snapshot
            item.setProductPrice(product.getPrice());      // snapshot
            item.setSize(itemReq.size());
            item.setQuantity(itemReq.quantity());

            var subtotal = product.getPrice().multiply(BigDecimal.valueOf(itemReq.quantity()));
            total = total.add(subtotal);
            items.add(item);
        }

        var address = request.shippingAddress();
        var order = new Order();
        order.setUser(user);
        order.setStatus("PLACED");
        order.setPaymentMode(request.paymentMode());
        order.setTotalAmount(total);
        order.setShippingName(address.name());
        order.setShippingAddr(address.addressLine());
        order.setShippingCity(address.city());
        order.setShippingPin(address.pin());
        order.setShippingPhone(address.phone());

        items.forEach(item -> item.setOrder(order));
        order.getItems().addAll(items);

        return new OrderResult.Success(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public List<OrderSummaryResponse> getMyOrders(UUID userId) {
        return orderRepository.findAllByUserIdWithItems(userId).stream()
            .map(this::toSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public OrderDetailResponse getOrderDetail(UUID orderId, UUID requestingUserId) {
        var order = orderRepository.findByIdWithItems(orderId)
            .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Order not found: " + orderId));

        if (!order.getUser().getId().equals(requestingUserId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                "You do not have access to this order");
        }
        return toDetail(order);
    }

    private OrderSummaryResponse toSummary(Order o) {
        return new OrderSummaryResponse(
            o.getId(), o.getStatus(), o.getPaymentMode(),
            o.getTotalAmount(), o.getItems().size(), o.getCreatedAt()
        );
    }

    private OrderDetailResponse toDetail(Order o) {
        var items = o.getItems().stream()
            .map(item -> new OrderItemResponse(
                item.getId(),
                item.getProduct() != null ? item.getProduct().getId() : null,
                item.getProductName(),
                item.getProductPrice(),
                item.getSize(),
                item.getQuantity(),
                item.getProductPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
            ))
            .toList();

        var shipping = new OrderDetailResponse.ShippingInfo(
            o.getShippingName(), o.getShippingAddr(),
            o.getShippingCity(), o.getShippingPin(), o.getShippingPhone()
        );

        return new OrderDetailResponse(
            o.getId(), o.getStatus(), o.getPaymentMode(),
            o.getTotalAmount(), shipping, items, o.getCreatedAt()
        );
    }
}
```

### 5. `OrderController.java`

Uses Java 25 pattern matching switch on the sealed `OrderResult`:

```java
package com.mystreet.order;

import com.mystreet.auth.AuthUtils;
import com.mystreet.common.ErrorResponse;
import com.mystreet.order.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    ResponseEntity<OrderDetailResponse> getOrderDetail(@PathVariable java.util.UUID id) {
        return ResponseEntity.ok(orderService.getOrderDetail(id, AuthUtils.currentUserId()));
    }
}
```

---

## API Contracts

### `POST /api/orders`

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "items": [
    { "productId": "uuid", "size": "9", "quantity": 1 },
    { "productId": "uuid", "size": "10", "quantity": 2 }
  ],
  "shippingAddress": {
    "name": "John Doe",
    "addressLine": "123 Street Name",
    "city": "Mumbai",
    "pin": "400001",
    "phone": "9876543210"
  },
  "paymentMode": "MOCK_COD"
}
```

**Response `201 Created`:** Full `OrderDetailResponse`

```json
{
  "id": "uuid",
  "status": "PLACED",
  "paymentMode": "MOCK_COD",
  "totalAmount": 119.99,
  "shippingAddress": {
    "name": "John Doe",
    "addressLine": "123 Street Name",
    "city": "Mumbai",
    "pin": "400001",
    "phone": "9876543210"
  },
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "productName": "Air Max 90",
      "productPrice": 119.99,
      "size": "9",
      "quantity": 1,
      "subtotal": 119.99
    }
  ],
  "createdAt": "2026-05-24T10:00:00Z"
}
```

**Errors:**
- `400` — Validation error (empty items, invalid phone, etc.)
- `400` — `INSUFFICIENT_STOCK` — not enough stock for a product
- `401` — No token
- `404` — `PRODUCT_NOT_FOUND` — a productId doesn't exist

### `GET /api/orders/mine`

**Headers:** `Authorization: Bearer <token>`

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "status": "PLACED",
    "paymentMode": "MOCK_COD",
    "totalAmount": 119.99,
    "itemCount": 1,
    "createdAt": "2026-05-24T10:00:00Z"
  }
]
```

### `GET /api/orders/{id}`

**Headers:** `Authorization: Bearer <token>`

**Response `200`:** Full `OrderDetailResponse` (same as POST response)  
**Error `403`:** Trying to access another user's order  
**Error `404`:** Order not found

---

## Tests

### `OrderServiceTest.java`

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository orderRepository;
    @Mock ProductRepository productRepository;
    @Mock UserRepository userRepository;
    @InjectMocks OrderService orderService;

    @Test
    void placeOrder_validItems_createsOrderAndDecrementsStock() { ... }

    @Test
    void placeOrder_insufficientStock_returnsInsufficientStockResult() { ... }

    @Test
    void placeOrder_productNotFound_returnsProductNotFoundResult() { ... }

    @Test
    void placeOrder_multipleItems_calculatesTotalCorrectly() { ... }

    @Test
    void placeOrder_snapshotsProductNameAndPrice() { ... }

    @Test
    void getMyOrders_returnsOnlyCurrentUserOrders() { ... }

    @Test
    void getOrderDetail_ownOrder_returnsDetail() { ... }

    @Test
    void getOrderDetail_anotherUsersOrder_throwsAccessDeniedException() { ... }

    @Test
    void getOrderDetail_notFound_throwsEntityNotFoundException() { ... }
}
```

### `OrderControllerTest.java`

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Test
    void placeOrder_noAuth_returns401() { ... }

    @Test
    void placeOrder_validRequest_returns201() { ... }

    @Test
    void placeOrder_emptyItems_returns400() { ... }

    @Test
    void placeOrder_invalidPhone_returns400() { ... }

    @Test
    void placeOrder_insufficientStock_returns400WithMessage() { ... }

    @Test
    void getMyOrders_authenticated_returns200() { ... }

    @Test
    void getOrderDetail_wrongUser_returns403() { ... }
}
```

---

## Manual Verification (Postman / curl)

```bash
# Get user token
USER_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@mystreet.com","password":"User@1234"}' | jq -r .token)

# Get product IDs
PRODUCTS=$(curl -s http://localhost:8080/api/products)
PRODUCT_ID=$(echo $PRODUCTS | jq -r '.[0].id')

# Place order
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "{
    \"items\": [{\"productId\": \"$PRODUCT_ID\", \"size\": \"9\", \"quantity\": 1}],
    \"shippingAddress\": {
      \"name\": \"Test User\",
      \"addressLine\": \"123 Test Street\",
      \"city\": \"Mumbai\",
      \"pin\": \"400001\",
      \"phone\": \"9876543210\"
    },
    \"paymentMode\": \"MOCK_COD\"
  }"
# Expected: 201 with full order detail

# Get order list
curl http://localhost:8080/api/orders/mine \
  -H "Authorization: Bearer $USER_TOKEN"
# Expected: 200 with array of 1 order

# Verify stock decremented
curl http://localhost:8080/api/products/$PRODUCT_ID | jq .stockQty
# Expected: original stock - 1

# Place order with no auth
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items":[],"paymentMode":"MOCK_COD"}'
# Expected: 401

# Place order with insufficient stock (order 9999 of same product)
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "{
    \"items\": [{\"productId\": \"$PRODUCT_ID\", \"size\": \"9\", \"quantity\": 9999}],
    \"shippingAddress\": {\"name\": \"A\", \"addressLine\": \"B\", \"city\": \"C\", \"pin\": \"400001\", \"phone\": \"9876543210\"},
    \"paymentMode\": \"MOCK_COD\"
  }"
# Expected: 400 INSUFFICIENT_STOCK
```

---

## Acceptance Criteria

- [ ] `POST /api/orders` with valid request returns `201` with full order detail
- [ ] Stock is decremented in DB after successful order
- [ ] Product name and price are snapshotted in `order_items` (not foreign-key-dependent)
- [ ] `POST /api/orders` with `quantity > stockQty` returns `400 INSUFFICIENT_STOCK`
- [ ] `POST /api/orders` with invalid `productId` returns `404 PRODUCT_NOT_FOUND`
- [ ] `POST /api/orders` with blank shipping fields returns `400` with field errors
- [ ] `POST /api/orders` with invalid PIN (not 6 digits) returns `400`
- [ ] `POST /api/orders` without token returns `401`
- [ ] `GET /api/orders/mine` returns only the authenticated user's orders
- [ ] `GET /api/orders/{id}` for own order returns `200`
- [ ] `GET /api/orders/{id}` for another user's order returns `403`
- [ ] `GET /api/orders/{id}` for non-existent ID returns `404`
- [ ] All order tests pass (`./gradlew test`)
