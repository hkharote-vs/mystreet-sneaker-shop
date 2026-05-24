package com.mystreet.product;

import com.mystreet.product.dto.CreateProductRequest;
import com.mystreet.product.dto.ProductDetailResponse;
import com.mystreet.product.dto.ProductSummaryResponse;
import com.mystreet.product.dto.UpdateProductRequest;
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
        Specification<Product> spec = Specification.allOf(
            ProductSpecification.hasBrand(brand),
            ProductSpecification.hasSize(size)
        );
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
