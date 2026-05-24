package com.mystreet.product;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mystreet.product.dto.CreateProductRequest;
import com.mystreet.product.dto.ProductDetailResponse;
import com.mystreet.product.dto.ProductSummaryResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
@Import({ProductTestSecurityConfig.class, com.mystreet.common.GlobalExceptionHandler.class})
class ProductControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    ProductService productService;

    private ProductSummaryResponse fakeSummary(String name, String brand) {
        return new ProductSummaryResponse(UUID.randomUUID(), name, brand,
            new BigDecimal("99.99"), "https://img.url", "8,9,10", 20);
    }

    private ProductDetailResponse fakeDetail(String name) {
        return new ProductDetailResponse(UUID.randomUUID(), name, "Nike", "desc",
            new BigDecimal("99.99"), "https://img.url", "8,9,10", 20,
            Instant.now(), Instant.now());
    }

    @Test
    void listProducts_noAuth_returns200() throws Exception {
        when(productService.listProducts(null, null))
            .thenReturn(List.of(fakeSummary("Air Max 90", "Nike"), fakeSummary("Stan Smith", "Adidas")));

        mockMvc.perform(get("/api/products"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void getProduct_noAuth_returns200() throws Exception {
        var id = UUID.randomUUID();
        when(productService.getProduct(id)).thenReturn(fakeDetail("Air Max 90"));

        mockMvc.perform(get("/api/products/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Air Max 90"));
    }

    @Test
    void getProduct_notFound_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(productService.getProduct(id)).thenThrow(new EntityNotFoundException("Product not found: " + id));

        mockMvc.perform(get("/api/products/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }

    @Test
    void createProduct_noAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/products")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void createProduct_userJwt_returns403() throws Exception {
        var request = new CreateProductRequest("Shoe", "Brand", null,
            new BigDecimal("99.99"), null, "8,9", 10);

        mockMvc.perform(post("/api/products")
                .with(jwt().jwt(j -> j.claim("isAdmin", false)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isForbidden());
    }

    @Test
    void createProduct_adminJwt_returns201() throws Exception {
        var request = new CreateProductRequest("New Balance 550", "New Balance", "Great shoe",
            new BigDecimal("109.99"), "https://img.url", "8,9,10", 30);
        when(productService.createProduct(any())).thenReturn(fakeDetail("New Balance 550"));

        mockMvc.perform(post("/api/products")
                .with(jwt().jwt(j -> j.claim("isAdmin", true)))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("New Balance 550"));
    }

    @Test
    void deleteProduct_adminJwt_returns204() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/products/{id}", id)
                .with(jwt().jwt(j -> j.claim("isAdmin", true))))
            .andExpect(status().isNoContent());
    }

    @Test
    void deleteProduct_adminJwt_notFound_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new EntityNotFoundException("Product not found: " + id))
            .when(productService).deleteProduct(eq(id));

        mockMvc.perform(delete("/api/products/{id}", id)
                .with(jwt().jwt(j -> j.claim("isAdmin", true))))
            .andExpect(status().isNotFound());
    }
}
