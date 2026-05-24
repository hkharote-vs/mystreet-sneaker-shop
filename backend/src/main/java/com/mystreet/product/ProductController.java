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
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Tag(name = "Products")
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final ProductImportService productImportService;

    public ProductController(ProductService productService, ProductImportService productImportService) {
        this.productService = productService;
        this.productImportService = productImportService;
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

    @Operation(summary = "Export all products as CSV (admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/export")
    ResponseEntity<?> exportProducts() {
        if (!AuthUtils.isCurrentUserAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.of("/api/products/export", "FORBIDDEN", "Admin access required"));
        }
        String csv = productImportService.exportCsv();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"products-export.csv\"")
            .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
            .body(csv);
    }

    @Operation(summary = "Bulk import products from CSV — upserts by name+brand (admin only)", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<?> importProducts(@RequestParam("file") MultipartFile file) {
        if (!AuthUtils.isCurrentUserAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ErrorResponse.of("/api/products/import", "FORBIDDEN", "Admin access required"));
        }
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(ErrorResponse.of("/api/products/import", "EMPTY_FILE", "Uploaded file is empty"));
        }
        try {
            CsvImportResult result = productImportService.importCsv(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(ErrorResponse.of("/api/products/import", "IMPORT_ERROR", e.getMessage()));
        }
    }
}
