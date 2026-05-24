# SPEC-03: Product Catalog — Backend

**Status:** `[ ] Not Started`  
**Depends on:** SPEC-01 (schema), SPEC-02 (auth/security config)  
**Blocks:** SPEC-07 (product frontend)  

---

## Overview

Implement the full product management API: public listing with filtering, public detail retrieval, and admin-only CRUD. All write endpoints require a valid JWT with `isAdmin = true`. Uses Spring Data JPA with a `Specification`-based filter for brand/size queries.

---

## Package Structure

```
com.mystreet.product/
  ├── Product.java                    (JPA Entity — defined in SPEC-01)
  ├── ProductRepository.java
  ├── ProductService.java
  ├── ProductController.java
  ├── ProductSpecification.java       (JPA Criteria for filtering)
  └── dto/
      ├── CreateProductRequest.java   (Record)
      ├── UpdateProductRequest.java   (Record)
      ├── ProductSummaryResponse.java (Record)
      └── ProductDetailResponse.java  (Record)
```

---

## Implementation

### 1. DTOs (Records)

```java
// CreateProductRequest.java
package com.mystreet.product.dto;

import jakarta.validation.constraints.*;
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

// UpdateProductRequest.java — all fields optional (partial update)
package com.mystreet.product.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record UpdateProductRequest(
    String name,
    String brand,
    String description,
    @DecimalMin(value = "0.01", message = "Price must be greater than 0") BigDecimal price,
    String imageUrl,
    String sizesCsv,
    @Min(value = 0, message = "Stock quantity cannot be negative") Integer stockQty
) {}

// ProductSummaryResponse.java — used in list endpoint
package com.mystreet.product.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductSummaryResponse(
    UUID id,
    String name,
    String brand,
    BigDecimal price,
    String imageUrl,
    String sizesCsv,
    int stockQty
) {}

// ProductDetailResponse.java — used in detail + write endpoints
package com.mystreet.product.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProductDetailResponse(
    UUID id,
    String name,
    String brand,
    String description,
    BigDecimal price,
    String imageUrl,
    String sizesCsv,
    int stockQty,
    Instant createdAt,
    Instant updatedAt
) {}
```

### 2. `ProductRepository.java`

```java
package com.mystreet.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface ProductRepository
    extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    // Used by OrderService to decrement stock atomically
    @Modifying
    @Query("""
        UPDATE Product p
        SET p.stockQty = p.stockQty - :quantity
        WHERE p.id = :id AND p.stockQty >= :quantity
        """)
    int decrementStock(UUID id, int quantity);
}
```

### 3. `ProductSpecification.java`

```java
package com.mystreet.product;

import org.springframework.data.jpa.domain.Specification;

public final class ProductSpecification {

    private ProductSpecification() {}

    public static Specification<Product> hasBrand(String brand) {
        return (root, query, cb) ->
            brand == null || brand.isBlank()
                ? cb.conjunction()
                : cb.equal(cb.lower(root.get("brand")), brand.toLowerCase());
    }

    public static Specification<Product> hasSize(String size) {
        return (root, query, cb) ->
            size == null || size.isBlank()
                ? cb.conjunction()
                // sizes_csv contains the size as a substring e.g. "7,8,9,10" contains "8"
                : cb.like(root.get("sizesCsv"), "%" + size + "%");
    }

    public static Specification<Product> isInStock() {
        return (root, query, cb) -> cb.greaterThan(root.get("stockQty"), 0);
    }
}
```

### 4. `ProductService.java`

```java
package com.mystreet.product;

import com.mystreet.product.dto.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductSummaryResponse> listProducts(String brand, String size) {
        Specification<Product> spec = Specification
            .where(ProductSpecification.hasBrand(brand))
            .and(ProductSpecification.hasSize(size));

        return productRepository.findAll(spec).stream()
            .map(this::toSummary)
            .toList();
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getProduct(UUID id) {
        return productRepository.findById(id)
            .map(this::toDetail)
            .orElseThrow(() -> new EntityNotFoundException("Product not found: " + id));
    }

    @Transactional
    public ProductDetailResponse createProduct(CreateProductRequest request) {
        var product = new Product();
        product.setName(request.name());
        product.setBrand(request.brand());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setImageUrl(request.imageUrl());
        product.setSizesCsv(request.sizesCsv());
        product.setStockQty(request.stockQty());
        return toDetail(productRepository.save(product));
    }

    @Transactional
    public ProductDetailResponse updateProduct(UUID id, UpdateProductRequest request) {
        var product = productRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Product not found: " + id));

        if (request.name() != null) product.setName(request.name());
        if (request.brand() != null) product.setBrand(request.brand());
        if (request.description() != null) product.setDescription(request.description());
        if (request.price() != null) product.setPrice(request.price());
        if (request.imageUrl() != null) product.setImageUrl(request.imageUrl());
        if (request.sizesCsv() != null) product.setSizesCsv(request.sizesCsv());
        if (request.stockQty() != null) product.setStockQty(request.stockQty());

        return toDetail(productRepository.save(product));
    }

    @Transactional
    public void deleteProduct(UUID id) {
        if (!productRepository.existsById(id)) {
            throw new EntityNotFoundException("Product not found: " + id);
        }
        productRepository.deleteById(id);
    }

    private ProductSummaryResponse toSummary(Product p) {
        return new ProductSummaryResponse(
            p.getId(), p.getName(), p.getBrand(), p.getPrice(),
            p.getImageUrl(), p.getSizesCsv(), p.getStockQty()
        );
    }

    private ProductDetailResponse toDetail(Product p) {
        return new ProductDetailResponse(
            p.getId(), p.getName(), p.getBrand(), p.getDescription(), p.getPrice(),
            p.getImageUrl(), p.getSizesCsv(), p.getStockQty(),
            p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
```

### 5. `ProductController.java`

```java
package com.mystreet.product;

import com.mystreet.auth.AuthUtils;
import com.mystreet.common.ErrorResponse;
import com.mystreet.product.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Products")
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @Operation(summary = "List all products with optional brand/size filter")
    @GetMapping
    ResponseEntity<List<ProductSummaryResponse>> listProducts(
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String size) {
        return ResponseEntity.ok(productService.listProducts(brand, size));
    }

    @Operation(summary = "Get product by ID")
    @GetMapping("/{id}")
    ResponseEntity<ProductDetailResponse> getProduct(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.getProduct(id));
    }

    @Operation(summary = "Create product (admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    ResponseEntity<?> createProduct(@Valid @RequestBody CreateProductRequest request) {
        if (!AuthUtils.isCurrentUserAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.of("/api/products", "FORBIDDEN", "Admin access required"));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(request));
    }

    @Operation(summary = "Update product (admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{id}")
    ResponseEntity<?> updateProduct(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest request) {
        if (!AuthUtils.isCurrentUserAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.of("/api/products/" + id, "FORBIDDEN", "Admin access required"));
        }
        return ResponseEntity.ok(productService.updateProduct(id, request));
    }

    @Operation(summary = "Delete product (admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{id}")
    ResponseEntity<?> deleteProduct(@PathVariable UUID id) {
        if (!AuthUtils.isCurrentUserAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.of("/api/products/" + id, "FORBIDDEN", "Admin access required"));
        }
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}
```

Add `EntityNotFoundException` handler in `GlobalExceptionHandler`:
```java
@ExceptionHandler(EntityNotFoundException.class)
ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException ex, HttpServletRequest req) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(ErrorResponse.of(req.getRequestURI(), "NOT_FOUND", ex.getMessage()));
}
```

---

## API Contracts

### `GET /api/products`

**Query params:** `brand` (optional), `size` (optional)

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "Air Max 90",
    "brand": "Nike",
    "price": 119.99,
    "imageUrl": "https://picsum.photos/seed/airmax90/600/600",
    "sizesCsv": "7,8,9,10",
    "stockQty": 50
  }
]
```

### `GET /api/products/{id}`

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "Air Max 90",
  "brand": "Nike",
  "description": "Classic retro cushioning...",
  "price": 119.99,
  "imageUrl": "...",
  "sizesCsv": "7,8,9,10",
  "stockQty": 50,
  "createdAt": "2026-05-24T00:00:00Z",
  "updatedAt": "2026-05-24T00:00:00Z"
}
```
**Error `404`:** Product not found

### `POST /api/products` (Admin JWT required)

**Request:**
```json
{
  "name": "New Balance 550",
  "brand": "New Balance",
  "description": "Basketball-inspired court shoe",
  "price": 109.99,
  "imageUrl": "https://picsum.photos/seed/nb550/600/600",
  "sizesCsv": "7,8,9,10,11",
  "stockQty": 30
}
```
**Response `201`:** Full `ProductDetailResponse`  
**Error `400`:** Validation errors  
**Error `403`:** Not admin

### `PUT /api/products/{id}` (Admin JWT required)

Same shape as create but all fields optional.  
**Response `200`:** Updated `ProductDetailResponse`  
**Error `403`:** Not admin  
**Error `404`:** Product not found

### `DELETE /api/products/{id}` (Admin JWT required)

**Response `204`:** No content  
**Error `403`:** Not admin  
**Error `404`:** Product not found

---

## Tests

### `ProductServiceTest.java`

```java
@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock ProductRepository productRepository;
    @InjectMocks ProductService productService;

    @Test
    void listProducts_noBrandFilter_returnsAll() { ... }

    @Test
    void listProducts_withBrandFilter_returnsFiltered() { ... }

    @Test
    void getProduct_exists_returnsDetail() { ... }

    @Test
    void getProduct_notFound_throwsEntityNotFoundException() { ... }

    @Test
    void createProduct_validRequest_savesAndReturns() { ... }

    @Test
    void updateProduct_partialUpdate_onlyChangesProvidedFields() { ... }

    @Test
    void deleteProduct_exists_callsDeleteById() { ... }

    @Test
    void deleteProduct_notFound_throwsEntityNotFoundException() { ... }
}
```

### `ProductControllerTest.java` (MockMvc + Spring Security)

```java
@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Test
    void listProducts_noAuth_returns200() { ... }

    @Test
    void getProduct_noAuth_returns200() { ... }

    @Test
    void getProduct_invalidUuid_returns400() { ... }

    @Test
    void createProduct_noAuth_returns401() { ... }

    @Test
    void createProduct_userJwt_returns403() { ... }

    @Test
    void createProduct_adminJwt_returns201() { ... }

    @Test
    void deleteProduct_adminJwt_returns204() { ... }

    @Test
    void deleteProduct_adminJwt_notFound_returns404() { ... }
}
```

---

## Manual Verification (Postman / curl)

```bash
# List all products (no auth)
curl http://localhost:8080/api/products
# Expected: 200 with array of 10 products

# Filter by brand
curl "http://localhost:8080/api/products?brand=Nike"
# Expected: 200 with Nike products only (Air Max 90, Air Force 1, Dunk Low)

# Filter by size
curl "http://localhost:8080/api/products?size=11"
# Expected: 200 with products that have "11" in their sizes_csv

# Get single product
curl http://localhost:8080/api/products/{id}
# Expected: 200 with full detail including description and timestamps

# Get non-existent product
curl http://localhost:8080/api/products/00000000-0000-0000-0000-000000000000
# Expected: 404 NOT_FOUND

# Create product (admin token required)
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mystreet.com","password":"Admin@1234"}' | jq -r .token)

curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Shoe","brand":"TestBrand","price":99.99,"stockQty":10,"sizesCsv":"8,9,10"}'
# Expected: 201 with new product

# Create product without auth
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Shoe","brand":"TestBrand","price":99.99,"stockQty":10}'
# Expected: 401

# Create product with user token (non-admin)
USER_TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@mystreet.com","password":"User@1234"}' | jq -r .token)

curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"name":"Test Shoe","brand":"TestBrand","price":99.99,"stockQty":10}'
# Expected: 403
```

---

## Acceptance Criteria

- [ ] `GET /api/products` returns all 10 seeded products (no auth required)
- [ ] `GET /api/products?brand=Nike` returns only Nike products
- [ ] `GET /api/products?size=11` returns only products with size 11 available
- [ ] `GET /api/products/{valid-id}` returns full product detail
- [ ] `GET /api/products/{invalid-id}` returns 404
- [ ] `POST /api/products` with admin JWT creates and returns 201
- [ ] `POST /api/products` without JWT returns 401
- [ ] `POST /api/products` with non-admin JWT returns 403
- [ ] `POST /api/products` with missing required fields returns 400 with field-level errors
- [ ] `PUT /api/products/{id}` with admin JWT updates only provided fields
- [ ] `DELETE /api/products/{id}` with admin JWT returns 204
- [ ] All product service and controller tests pass (`./gradlew test`)
