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
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    ProductRepository productRepository;
    @InjectMocks
    ProductService productService;

    private Product buildProduct(String name, String brand) {
        var p = new Product();
        p.setId(UUID.randomUUID());
        p.setName(name);
        p.setBrand(brand);
        p.setDescription("Test description");
        p.setPrice(new BigDecimal("99.99"));
        p.setImageUrl("https://example.com/img.jpg");
        p.setSizesCsv("8,9,10,11");
        p.setStockQty(20);
        p.setCreatedAt(Instant.now());
        p.setUpdatedAt(Instant.now());
        return p;
    }

    @Test
    @SuppressWarnings("unchecked")
    void listProducts_noBrandFilter_returnsAll() {
        var products = List.of(
            buildProduct("Air Max 90", "Nike"),
            buildProduct("Stan Smith", "Adidas")
        );
        when(productRepository.findAll(any(Specification.class))).thenReturn(products);

        var result = productService.listProducts(null, null);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).brand()).isEqualTo("Nike");
        assertThat(result.get(1).brand()).isEqualTo("Adidas");
    }

    @Test
    @SuppressWarnings("unchecked")
    void listProducts_withBrandFilter_returnsFiltered() {
        var nikeProducts = List.of(buildProduct("Air Max 90", "Nike"));
        when(productRepository.findAll(any(Specification.class))).thenReturn(nikeProducts);

        var result = productService.listProducts("Nike", null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Air Max 90");
    }

    @Test
    void getProduct_exists_returnsDetail() {
        var product = buildProduct("Air Max 90", "Nike");
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));

        var result = productService.getProduct(product.getId());

        assertThat(result.id()).isEqualTo(product.getId());
        assertThat(result.name()).isEqualTo("Air Max 90");
        assertThat(result.description()).isEqualTo("Test description");
    }

    @Test
    void getProduct_notFound_throwsEntityNotFoundException() {
        UUID id = UUID.randomUUID();
        when(productRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getProduct(id))
            .isInstanceOf(EntityNotFoundException.class)
            .hasMessageContaining(id.toString());
    }

    @Test
    void createProduct_validRequest_savesAndReturns() {
        var request = new CreateProductRequest(
            "New Balance 550", "New Balance", "Great shoe",
            new BigDecimal("109.99"), "https://img.url", "8,9,10", 30
        );
        var saved = buildProduct("New Balance 550", "New Balance");
        when(productRepository.save(any())).thenReturn(saved);

        var result = productService.createProduct(request);

        assertThat(result.name()).isEqualTo("New Balance 550");
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void updateProduct_partialUpdate_onlyChangesProvidedFields() {
        var existing = buildProduct("Old Name", "Nike");
        when(productRepository.findById(existing.getId())).thenReturn(Optional.of(existing));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var request = new UpdateProductRequest("New Name", null, null, null, null, null, null);
        var result = productService.updateProduct(existing.getId(), request);

        assertThat(result.name()).isEqualTo("New Name");
        assertThat(result.brand()).isEqualTo("Nike");
    }

    @Test
    void deleteProduct_exists_callsDeleteById() {
        UUID id = UUID.randomUUID();
        when(productRepository.existsById(id)).thenReturn(true);

        productService.deleteProduct(id);

        verify(productRepository).deleteById(id);
    }

    @Test
    void deleteProduct_notFound_throwsEntityNotFoundException() {
        UUID id = UUID.randomUUID();
        when(productRepository.existsById(id)).thenReturn(false);

        assertThatThrownBy(() -> productService.deleteProduct(id))
            .isInstanceOf(EntityNotFoundException.class)
            .hasMessageContaining(id.toString());
    }
}
