package com.mystreet.integration;

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
    void fullOrderFlow_registerLoginBrowseProducts_placeOrder_success() {
        // 1. Register a new user
        var registerReq = new RegisterRequest("flow@test.com", "Test@1234", "Flow User");
        var regResponse = restTemplate.postForEntity("/api/auth/register", registerReq, Map.class);
        assertThat(regResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        var token = (String) regResponse.getBody().get("token");
        assertThat(token).isNotBlank();

        // 2. Browse the product catalog (no auth required)
        var productsResponse = restTemplate.getForEntity("/api/products", Object[].class);
        assertThat(productsResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        var products = productsResponse.getBody();
        assertThat(products).hasSizeGreaterThan(0);

        // Find a product with stock
        Map<?, ?> inStockProduct = null;
        for (var raw : products) {
            var p = (Map<?, ?>) raw;
            if (((Number) p.get("stockQty")).intValue() > 0) {
                inStockProduct = p;
                break;
            }
        }
        assertThat(inStockProduct).as("Need at least one in-stock product from seed data").isNotNull();

        var productId = (String) inStockProduct.get("id");
        var stockBefore = ((Number) inStockProduct.get("stockQty")).intValue();

        // 3. Place an order
        var orderRequest = Map.of(
            "items", new Object[]{Map.of("productId", productId, "size", "9", "quantity", 1)},
            "shippingAddress", Map.of(
                "name", "Flow User",
                "addressLine", "123 Test Street",
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
        assertThat(orderResponse.getBody().get("status")).isEqualTo("PLACED");

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
        var updatedProductResponse = restTemplate.getForEntity("/api/products/" + productId, Map.class);
        assertThat(updatedProductResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        var stockAfter = ((Number) updatedProductResponse.getBody().get("stockQty")).intValue();
        assertThat(stockAfter).isEqualTo(stockBefore - 1);
    }

    @Test
    void placeOrder_withoutAuth_returns401() {
        var orderRequest = Map.of(
            "items", new Object[]{Map.of("productId", "00000000-0000-0000-0000-000000000000", "size", "9", "quantity", 1)},
            "shippingAddress", Map.of(
                "name", "Test", "addressLine", "123 St", "city", "City",
                "pin", "400001", "phone", "9876543210"
            ),
            "paymentMode", "MOCK_COD"
        );

        var response = restTemplate.postForEntity("/api/orders", orderRequest, Map.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void register_duplicateEmail_returns409() {
        var req = new RegisterRequest("dup@integration.com", "Test@1234", "Dup User");
        restTemplate.postForEntity("/api/auth/register", req, Map.class);

        var secondResponse = restTemplate.postForEntity("/api/auth/register", req, Map.class);
        assertThat(secondResponse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void productCatalog_filterByBrand_returnsMatchingProducts() {
        var response = restTemplate.getForEntity("/api/products?brand=Nike", Object[].class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        var products = response.getBody();
        assertThat(products).isNotEmpty();
        for (var raw : products) {
            var p = (Map<?, ?>) raw;
            assertThat((String) p.get("brand")).isEqualTo("Nike");
        }
    }
}
