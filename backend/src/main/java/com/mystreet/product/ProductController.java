package com.mystreet.product;

import com.mystreet.auth.AuthUtils;
import com.mystreet.common.ErrorResponse;
import com.mystreet.product.dto.CreateProductRequest;
import com.mystreet.product.dto.ProductDetailResponse;
import com.mystreet.product.dto.ProductSummaryResponse;
import com.mystreet.product.dto.UpdateProductRequest;
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
