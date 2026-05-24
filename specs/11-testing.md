# SPEC-11: Testing Strategy & Execution

**Status:** `[x] Complete`  
**Depends on:** SPEC-02, SPEC-03, SPEC-04 (all backend features implemented)  
**Blocks:** SPEC-12 (deployment — CI must pass)  

---

## Overview

This spec defines the complete testing plan for the backend. It includes all unit tests (JUnit 5 + Mockito) and integration tests (Spring Boot Test + Testcontainers + real PostgreSQL). The goal is ≥ 70% method-level coverage across service and controller layers. It also defines the Postman collection structure for API testing documentation.

---

## Backend Test Structure

```
backend/src/test/java/com/mystreet/
  ├── auth/
  │   ├── AuthServiceTest.java           (Unit)
  │   └── AuthControllerTest.java        (MockMvc / slice test)
  ├── product/
  │   ├── ProductServiceTest.java        (Unit)
  │   └── ProductControllerTest.java     (MockMvc / slice test)
  ├── order/
  │   ├── OrderServiceTest.java          (Unit)
  │   └── OrderControllerTest.java       (MockMvc / slice test)
  └── integration/
      └── OrderFlowIntegrationTest.java  (Testcontainers — full flow)
```

---

## Testcontainers Setup

### `build.gradle.kts` — add BOM and dependencies

```kotlin
dependencies {
    // Testcontainers BOM (manages versions)
    testImplementation(platform("org.testcontainers:testcontainers-bom:1.20.4"))
    testImplementation("org.testcontainers:junit-jupiter")
    testImplementation("org.testcontainers:postgresql")
}
```

### Base class for integration tests

```java
// src/test/java/com/mystreet/integration/BaseIntegrationTest.java
package com.mystreet.integration;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public abstract class BaseIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("mystreet_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
        registry.add("spring.flyway.enabled", () -> "true");
    }
}
```

---

## Unit Tests

### `AuthServiceTest.java`

```java
package com.mystreet.auth;

import com.mystreet.auth.dto.LoginRequest;
import com.mystreet.auth.dto.RegisterRequest;
import com.mystreet.auth.exception.EmailAlreadyExistsException;
import com.mystreet.user.User;
import com.mystreet.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @InjectMocks AuthService authService;

    @Test
    void register_newEmail_savesUserAndReturnsToken() {
        // Arrange
        var request = new RegisterRequest("new@test.com", "password123", "Test User");
        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        var savedUser = new User();
        savedUser.setId(UUID.randomUUID());
        savedUser.setEmail("new@test.com");
        savedUser.setAdmin(false);
        when(userRepository.save(any())).thenReturn(savedUser);
        when(jwtService.generateToken(savedUser)).thenReturn("token123");

        // Act
        var response = authService.register(request);

        // Assert
        assertThat(response.token()).isEqualTo("token123");
        assertThat(response.user().email()).isEqualTo("new@test.com");
        assertThat(response.user().isAdmin()).isFalse();
        verify(userRepository).save(any(User.class));
    }

    @Test
    void register_duplicateEmail_throwsEmailAlreadyExistsException() {
        when(userRepository.existsByEmail("existing@test.com")).thenReturn(true);
        assertThatThrownBy(() ->
            authService.register(new RegisterRequest("existing@test.com", "pass", null)))
            .isInstanceOf(EmailAlreadyExistsException.class);
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_correctCredentials_returnsToken() {
        var user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("user@test.com");
        user.setPasswordHash("hashed");
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "hashed")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("jwt");

        var response = authService.login(new LoginRequest("user@test.com", "password"));

        assertThat(response.token()).isEqualTo("jwt");
    }

    @Test
    void login_wrongPassword_throwsBadCredentials() {
        var user = new User();
        user.setPasswordHash("hashed");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() ->
            authService.login(new LoginRequest("user@test.com", "wrong")))
            .isInstanceOf(BadCredentialsException.class)
            .hasMessageContaining("Invalid credentials");
    }

    @Test
    void login_unknownEmail_throwsBadCredentials() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            authService.login(new LoginRequest("ghost@test.com", "pass")))
            .isInstanceOf(BadCredentialsException.class);
    }
}
```

### `ProductServiceTest.java`

```java
package com.mystreet.product;

import com.mystreet.product.dto.CreateProductRequest;
import com.mystreet.product.dto.UpdateProductRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock ProductRepository productRepository;
    @InjectMocks ProductService productService;

    private Product sampleProduct(String name, String brand) {
        var p = new Product();
        p.setId(UUID.randomUUID());
        p.setName(name);
        p.setBrand(brand);
        p.setPrice(BigDecimal.valueOf(99.99));
        p.setStockQty(10);
        return p;
    }

    @Test
    void listProducts_noFilters_returnsAll() {
        var products = List.of(
            sampleProduct("Air Max 90", "Nike"),
            sampleProduct("Stan Smith", "Adidas")
        );
        when(productRepository.findAll(any(Specification.class))).thenReturn(products);

        var result = productService.listProducts(null, null);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).name()).isEqualTo("Air Max 90");
    }

    @Test
    void getProduct_exists_returnsDetail() {
        var id = UUID.randomUUID();
        var product = sampleProduct("Air Force 1", "Nike");
        product.setId(id);
        when(productRepository.findById(id)).thenReturn(Optional.of(product));

        var result = productService.getProduct(id);

        assertThat(result.id()).isEqualTo(id);
        assertThat(result.name()).isEqualTo("Air Force 1");
    }

    @Test
    void getProduct_notFound_throwsEntityNotFoundException() {
        var id = UUID.randomUUID();
        when(productRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProduct(id))
            .isInstanceOf(EntityNotFoundException.class)
            .hasMessageContaining(id.toString());
    }

    @Test
    void createProduct_validRequest_savesAndReturnsDetail() {
        var request = new CreateProductRequest(
            "New Shoe", "Brand", "Description",
            BigDecimal.valueOf(99.99), null, "8,9,10", 30
        );
        var saved = sampleProduct("New Shoe", "Brand");
        when(productRepository.save(any())).thenReturn(saved);

        var result = productService.createProduct(request);

        assertThat(result.name()).isEqualTo("New Shoe");
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void updateProduct_partialUpdate_onlyChangesProvidedFields() {
        var id = UUID.randomUUID();
        var existing = sampleProduct("Old Name", "Old Brand");
        existing.setId(id);
        when(productRepository.findById(id)).thenReturn(Optional.of(existing));
        when(productRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // Only update price, leave everything else null
        var result = productService.updateProduct(id,
            new UpdateProductRequest(null, null, null, BigDecimal.valueOf(149.99), null, null, null));

        assertThat(result.name()).isEqualTo("Old Name");   // unchanged
        assertThat(result.brand()).isEqualTo("Old Brand"); // unchanged
        assertThat(result.price()).isEqualByComparingTo("149.99"); // updated
    }

    @Test
    void deleteProduct_exists_callsDeleteById() {
        var id = UUID.randomUUID();
        when(productRepository.existsById(id)).thenReturn(true);

        productService.deleteProduct(id);

        verify(productRepository).deleteById(id);
    }

    @Test
    void deleteProduct_notFound_throwsEntityNotFoundException() {
        var id = UUID.randomUUID();
        when(productRepository.existsById(id)).thenReturn(false);

        assertThatThrownBy(() -> productService.deleteProduct(id))
            .isInstanceOf(EntityNotFoundException.class);
    }
}
```

### `OrderServiceTest.java`

```java
package com.mystreet.order;

import com.mystreet.order.dto.*;
import com.mystreet.product.Product;
import com.mystreet.product.ProductRepository;
import com.mystreet.user.User;
import com.mystreet.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository orderRepository;
    @Mock ProductRepository productRepository;
    @Mock UserRepository userRepository;
    @InjectMocks OrderService orderService;

    private User testUser(UUID id) {
        var user = new User();
        user.setId(id);
        user.setEmail("test@example.com");
        return user;
    }

    private Product testProduct(UUID id, BigDecimal price, int stock) {
        var p = new Product();
        p.setId(id);
        p.setName("Test Shoe");
        p.setPrice(price);
        p.setStockQty(stock);
        return p;
    }

    @Test
    void placeOrder_validSingleItem_returnsSuccessWithCorrectTotal() {
        var userId = UUID.randomUUID();
        var productId = UUID.randomUUID();
        var user = testUser(userId);
        var product = testProduct(productId, BigDecimal.valueOf(119.99), 50);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.decrementStock(productId, 1)).thenReturn(1);
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var request = new PlaceOrderRequest(
            List.of(new CartItemRequest(productId, "9", 1)),
            new ShippingAddressRequest("John", "123 St", "City", "400001", "9876543210"),
            "MOCK_COD"
        );

        var result = orderService.placeOrder(userId, request);

        assertThat(result).isInstanceOf(OrderResult.Success.class);
        var success = (OrderResult.Success) result;
        assertThat(success.order().getTotalAmount())
            .isEqualByComparingTo("119.99");
    }

    @Test
    void placeOrder_multipleItems_sumsTotalCorrectly() {
        var userId = UUID.randomUUID();
        var p1Id = UUID.randomUUID();
        var p2Id = UUID.randomUUID();
        var user = testUser(userId);
        var p1 = testProduct(p1Id, BigDecimal.valueOf(100.00), 10);
        var p2 = testProduct(p2Id, BigDecimal.valueOf(50.00), 10);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(productRepository.findById(p1Id)).thenReturn(Optional.of(p1));
        when(productRepository.findById(p2Id)).thenReturn(Optional.of(p2));
        when(productRepository.decrementStock(p1Id, 2)).thenReturn(1);
        when(productRepository.decrementStock(p2Id, 3)).thenReturn(1);
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var request = new PlaceOrderRequest(
            List.of(
                new CartItemRequest(p1Id, "9", 2),  // 100 * 2 = 200
                new CartItemRequest(p2Id, "8", 3)   // 50 * 3 = 150
            ),
            new ShippingAddressRequest("A", "B", "C", "400001", "9876543210"),
            "MOCK_UPI"
        );

        var result = orderService.placeOrder(userId, request);

        assertThat(result).isInstanceOf(OrderResult.Success.class);
        var success = (OrderResult.Success) result;
        assertThat(success.order().getTotalAmount())
            .isEqualByComparingTo("350.00");
    }

    @Test
    void placeOrder_insufficientStock_returnsInsufficientStockResult() {
        var userId = UUID.randomUUID();
        var productId = UUID.randomUUID();
        var user = testUser(userId);
        var product = testProduct(productId, BigDecimal.valueOf(99.99), 2); // only 2 in stock

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));

        var request = new PlaceOrderRequest(
            List.of(new CartItemRequest(productId, "9", 10)), // request 10
            new ShippingAddressRequest("A", "B", "C", "400001", "9876543210"),
            "MOCK_COD"
        );

        var result = orderService.placeOrder(userId, request);

        assertThat(result).isInstanceOf(OrderResult.InsufficientStock.class);
        var insufficient = (OrderResult.InsufficientStock) result;
        assertThat(insufficient.requested()).isEqualTo(10);
        assertThat(insufficient.available()).isEqualTo(2);
    }

    @Test
    void placeOrder_productNotFound_returnsProductNotFoundResult() {
        var userId = UUID.randomUUID();
        var productId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser(userId)));
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        var request = new PlaceOrderRequest(
            List.of(new CartItemRequest(productId, "9", 1)),
            new ShippingAddressRequest("A", "B", "C", "400001", "9876543210"),
            "MOCK_COD"
        );

        var result = orderService.placeOrder(userId, request);

        assertThat(result).isInstanceOf(OrderResult.ProductNotFound.class);
    }

    @Test
    void placeOrder_snapshotsProductNameAndPrice() {
        var userId = UUID.randomUUID();
        var productId = UUID.randomUUID();
        var user = testUser(userId);
        var product = testProduct(productId, BigDecimal.valueOf(149.99), 10);
        product.setName("Special Edition Shoe");

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.decrementStock(productId, 1)).thenReturn(1);
        when(orderRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var request = new PlaceOrderRequest(
            List.of(new CartItemRequest(productId, "9", 1)),
            new ShippingAddressRequest("A", "B", "C", "400001", "9876543210"),
            "MOCK_COD"
        );

        var result = orderService.placeOrder(userId, request);

        assertThat(result).isInstanceOf(OrderResult.Success.class);
        var order = ((OrderResult.Success) result).order();
        var item = order.getItems().get(0);
        assertThat(item.getProductName()).isEqualTo("Special Edition Shoe");
        assertThat(item.getProductPrice()).isEqualByComparingTo("149.99");
    }

    @Test
    void getOrderDetail_anotherUsersOrder_throwsAccessDeniedException() {
        var ownerId = UUID.randomUUID();
        var requesterId = UUID.randomUUID();
        var orderId = UUID.randomUUID();
        var owner = testUser(ownerId);
        var order = new Order();
        order.setId(orderId);
        order.setUser(owner);
        order.setItems(List.of());

        when(orderRepository.findByIdWithItems(orderId)).thenReturn(Optional.of(order));

        assertThatThrownBy(() ->
            orderService.getOrderDetail(orderId, requesterId))
            .isInstanceOf(AccessDeniedException.class);
    }
}
```

---

## Integration Test

### `OrderFlowIntegrationTest.java`

```java
package com.mystreet.integration;

import com.mystreet.auth.dto.LoginRequest;
import com.mystreet.auth.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class OrderFlowIntegrationTest extends BaseIntegrationTest {

    @Autowired
    TestRestTemplate restTemplate;

    @Test
    void fullOrderFlow_registerLoginAddProduct_placeOrder_success() {
        // 1. Register a user
        var registerReq = new RegisterRequest("flow@test.com", "Test@1234", "Flow User");
        var regResponse = restTemplate.postForEntity("/api/auth/register", registerReq, Map.class);
        assertThat(regResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        var token = (String) regResponse.getBody().get("token");
        assertThat(token).isNotBlank();

        // 2. Get a product ID from the catalog
        var productsResponse = restTemplate.getForEntity("/api/products", Object[].class);
        assertThat(productsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        var products = productsResponse.getBody();
        assertThat(products).hasSizeGreaterThan(0);
        // Extract first product's id
        var firstProduct = (Map<?, ?>) products[0];
        var productId = (String) firstProduct.get("id");
        var stockQty = ((Number) firstProduct.get("stockQty")).intValue();

        if (stockQty == 0) return; // skip if seeded product has 0 stock

        // 3. Place an order
        var orderRequest = Map.of(
            "items", new Object[]{Map.of("productId", productId, "size", "9", "quantity", 1)},
            "shippingAddress", Map.of(
                "name", "Flow User",
                "addressLine", "123 Test St",
                "city", "Mumbai",
                "pin", "400001",
                "phone", "9876543210"
            ),
            "paymentMode", "MOCK_COD"
        );

        var headers = new HttpHeaders();
        headers.setBearerAuth(token);
        var orderResponse = restTemplate.exchange(
            "/api/orders",
            HttpMethod.POST,
            new HttpEntity<>(orderRequest, headers),
            Map.class
        );
        assertThat(orderResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        var orderId = (String) orderResponse.getBody().get("id");
        assertThat(orderId).isNotBlank();

        // 4. Verify order appears in "my orders"
        var myOrdersResponse = restTemplate.exchange(
            "/api/orders/mine",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            Object[].class
        );
        assertThat(myOrdersResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(myOrdersResponse.getBody()).hasSizeGreaterThan(0);

        // 5. Verify stock was decremented
        var updatedProductResponse = restTemplate.getForEntity(
            "/api/products/" + productId, Map.class);
        var updatedStock = ((Number) updatedProductResponse.getBody().get("stockQty")).intValue();
        assertThat(updatedStock).isEqualTo(stockQty - 1);
    }

    @Test
    void placeOrder_withoutAuth_returns401() {
        var orderRequest = Map.of(
            "items", new Object[]{},
            "shippingAddress", Map.of(),
            "paymentMode", "MOCK_COD"
        );

        var response = restTemplate.postForEntity("/api/orders", orderRequest, Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
```

---

## Running Tests

```bash
cd backend

# All tests
./gradlew test

# Only unit tests (fast, no Docker)
./gradlew test --tests "*.AuthServiceTest" --tests "*.ProductServiceTest" --tests "*.OrderServiceTest"

# Only integration tests (requires Docker for Testcontainers)
./gradlew test --tests "*.integration.*"

# Test report
open build/reports/tests/test/index.html

# Coverage report (add JaCoCo plugin to build.gradle.kts)
./gradlew jacocoTestReport
open build/reports/jacoco/test/html/index.html
```

### JaCoCo Setup in `build.gradle.kts`

```kotlin
plugins {
    // Add:
    jacoco
}

tasks.jacocoTestReport {
    dependsOn(tasks.test)
    reports {
        xml.required = true
        html.required = true
    }
}

tasks.jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                minimum = "0.70".toBigDecimal() // 70% minimum
            }
        }
    }
}

// Auto-generate report after tests
tasks.test {
    finalizedBy(tasks.jacocoTestReport)
}
```

---

## Postman Collection Structure

Export to `postman/MyStreeT.postman_collection.json`. Collection variables:
- `{{base_url}}`: `http://localhost:8080/api`
- `{{token}}`: Set by "Login" request's test script

```javascript
// "Login" request test script (Postman Tests tab):
if (pm.response.code === 200) {
    pm.collectionVariables.set("token", pm.response.json().token);
    pm.collectionVariables.set("user_id", pm.response.json().user.id);
}
```

**Folders:**

```
Auth/
  POST Register (new user)
  POST Register (duplicate — expect 409)
  POST Login (admin)
  POST Login (user)
  POST Login (wrong password — expect 401)

Products/
  GET List all products
  GET Filter by brand
  GET Filter by size
  GET Product detail (valid ID)
  GET Product detail (invalid ID — expect 404)
  POST Create product (admin token)
  POST Create product (no auth — expect 401)
  POST Create product (user token — expect 403)
  PUT Update product (admin token)
  DELETE Delete product (admin token)

Orders/
  POST Place order (user token — valid)
  POST Place order (no auth — expect 401)
  POST Place order (empty items — expect 400)
  POST Place order (invalid phone — expect 400)
  GET My orders
  GET Order detail (own order)
  GET Order detail (another user's order — expect 403)
```

---

## Acceptance Criteria

- [ ] All unit tests pass: `./gradlew test --tests "com.mystreet.auth.*" --tests "com.mystreet.product.*" --tests "com.mystreet.order.*"`
- [ ] Integration test passes with Testcontainers (Postgres starts, migrations run, full order flow completes)
- [ ] JaCoCo coverage report shows ≥ 70% method coverage
- [ ] `./gradlew check` passes (test + checkstyle + spotbugs)
- [ ] Postman collection exported to `postman/` directory and all requests return expected status codes
- [ ] Test report HTML is generated at `build/reports/tests/test/index.html`
