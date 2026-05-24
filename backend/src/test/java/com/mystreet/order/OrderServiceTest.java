package com.mystreet.order;

import com.mystreet.order.dto.CartItemRequest;
import com.mystreet.order.dto.PlaceOrderRequest;
import com.mystreet.order.dto.ShippingAddressRequest;
import com.mystreet.product.Product;
import com.mystreet.product.ProductRepository;
import com.mystreet.user.User;
import com.mystreet.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository orderRepository;
    @Mock ProductRepository productRepository;
    @Mock UserRepository userRepository;
    @InjectMocks OrderService orderService;

    private User buildUser() {
        var u = new User();
        u.setId(UUID.randomUUID());
        u.setEmail("user@test.com");
        u.setPasswordHash("hash");
        return u;
    }

    private Product buildProduct(String name, int stock, double price) {
        var p = new Product();
        p.setId(UUID.randomUUID());
        p.setName(name);
        p.setBrand("Brand");
        p.setPrice(new BigDecimal(String.valueOf(price)));
        p.setStockQty(stock);
        p.setSizesCsv("8,9,10");
        p.setCreatedAt(Instant.now());
        p.setUpdatedAt(Instant.now());
        return p;
    }

    private PlaceOrderRequest buildRequest(UUID productId, int qty) {
        var shipping = new ShippingAddressRequest(
            "John", "123 Street", "Mumbai", "400001", "9876543210");
        return new PlaceOrderRequest(
            List.of(new CartItemRequest(productId, "9", qty)),
            shipping, "MOCK_COD"
        );
    }

    private Order buildSavedOrder(User user, Product product, int qty) {
        var item = new OrderItem();
        item.setId(UUID.randomUUID());
        item.setProduct(product);
        item.setProductName(product.getName());
        item.setProductPrice(product.getPrice());
        item.setSize("9");
        item.setQuantity(qty);

        var order = new Order();
        order.setId(UUID.randomUUID());
        order.setUser(user);
        order.setStatus("PLACED");
        order.setPaymentMode("MOCK_COD");
        order.setTotalAmount(product.getPrice().multiply(BigDecimal.valueOf(qty)));
        order.setShippingName("John");
        order.setShippingAddr("123 Street");
        order.setShippingCity("Mumbai");
        order.setShippingPin("400001");
        order.setShippingPhone("9876543210");
        order.setCreatedAt(Instant.now());
        item.setOrder(order);
        order.getItems().add(item);
        return order;
    }

    @Test
    void placeOrder_validItems_createsOrderAndDecrementsStock() {
        var user = buildUser();
        var product = buildProduct("Air Max 90", 50, 119.99);
        var request = buildRequest(product.getId(), 1);
        var savedOrder = buildSavedOrder(user, product, 1);

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(productRepository.decrementStock(product.getId(), 1)).thenReturn(1);
        when(orderRepository.save(any())).thenReturn(savedOrder);

        var result = orderService.placeOrder(user.getId(), request);

        assertThat(result).isInstanceOf(OrderResult.Success.class);
        var success = (OrderResult.Success) result;
        assertThat(success.order().getStatus()).isEqualTo("PLACED");
    }

    @Test
    void placeOrder_insufficientStock_returnsInsufficientStockResult() {
        var user = buildUser();
        var product = buildProduct("Air Max 90", 1, 119.99);
        var request = buildRequest(product.getId(), 5);

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));

        var result = orderService.placeOrder(user.getId(), request);

        assertThat(result).isInstanceOf(OrderResult.InsufficientStock.class);
        var insufficient = (OrderResult.InsufficientStock) result;
        assertThat(insufficient.requested()).isEqualTo(5);
        assertThat(insufficient.available()).isEqualTo(1);
    }

    @Test
    void placeOrder_productNotFound_returnsProductNotFoundResult() {
        var user = buildUser();
        UUID bogusId = UUID.randomUUID();
        var request = buildRequest(bogusId, 1);

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(productRepository.findById(bogusId)).thenReturn(Optional.empty());

        var result = orderService.placeOrder(user.getId(), request);

        assertThat(result).isInstanceOf(OrderResult.ProductNotFound.class);
        assertThat(((OrderResult.ProductNotFound) result).productId()).isEqualTo(bogusId.toString());
    }

    @Test
    void placeOrder_multipleItems_calculatesTotalCorrectly() {
        var user = buildUser();
        var p1 = buildProduct("Shoe A", 50, 100.00);
        var p2 = buildProduct("Shoe B", 50, 50.00);

        var shipping = new ShippingAddressRequest("John", "St", "City", "400001", "9876543210");
        var request = new PlaceOrderRequest(
            List.of(
                new CartItemRequest(p1.getId(), "9", 2),
                new CartItemRequest(p2.getId(), "10", 3)
            ),
            shipping, "MOCK_UPI"
        );

        var savedOrder = new Order();
        savedOrder.setId(UUID.randomUUID());
        savedOrder.setUser(user);
        savedOrder.setStatus("PLACED");
        savedOrder.setPaymentMode("MOCK_UPI");
        savedOrder.setTotalAmount(new BigDecimal("350.00"));
        savedOrder.setShippingName("John");
        savedOrder.setShippingAddr("St");
        savedOrder.setShippingCity("City");
        savedOrder.setShippingPin("400001");
        savedOrder.setShippingPhone("9876543210");
        savedOrder.setCreatedAt(Instant.now());

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(productRepository.findById(p1.getId())).thenReturn(Optional.of(p1));
        when(productRepository.findById(p2.getId())).thenReturn(Optional.of(p2));
        when(productRepository.decrementStock(eq(p1.getId()), eq(2))).thenReturn(1);
        when(productRepository.decrementStock(eq(p2.getId()), eq(3))).thenReturn(1);
        when(orderRepository.save(any())).thenReturn(savedOrder);

        var result = orderService.placeOrder(user.getId(), request);

        assertThat(result).isInstanceOf(OrderResult.Success.class);
        assertThat(((OrderResult.Success) result).order().getTotalAmount())
            .isEqualByComparingTo(new BigDecimal("350.00"));
    }

    @Test
    void placeOrder_snapshotsProductNameAndPrice() {
        var user = buildUser();
        var product = buildProduct("Air Max 90", 50, 119.99);
        var savedOrder = buildSavedOrder(user, product, 1);

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(productRepository.decrementStock(product.getId(), 1)).thenReturn(1);
        when(orderRepository.save(any())).thenReturn(savedOrder);

        var result = (OrderResult.Success) orderService.placeOrder(user.getId(), buildRequest(product.getId(), 1));

        assertThat(result.order().getItems().get(0).getProductName()).isEqualTo("Air Max 90");
        assertThat(result.order().getItems().get(0).getProductPrice())
            .isEqualByComparingTo(new BigDecimal("119.99"));
    }

    @Test
    void getMyOrders_returnsOnlyCurrentUserOrders() {
        var user = buildUser();
        var product = buildProduct("Air Max 90", 50, 119.99);
        var order = buildSavedOrder(user, product, 1);

        when(orderRepository.findAllByUserIdWithItems(user.getId())).thenReturn(List.of(order));

        var result = orderService.getMyOrders(user.getId());

        assertThat(result).hasSize(1);
        assertThat(result.get(0).status()).isEqualTo("PLACED");
        assertThat(result.get(0).itemCount()).isEqualTo(1);
    }

    @Test
    void getOrderDetail_ownOrder_returnsDetail() {
        var user = buildUser();
        var product = buildProduct("Air Max 90", 50, 119.99);
        var order = buildSavedOrder(user, product, 1);

        when(orderRepository.findByIdWithItems(order.getId())).thenReturn(Optional.of(order));

        var result = orderService.getOrderDetail(order.getId(), user.getId());

        assertThat(result.id()).isEqualTo(order.getId());
        assertThat(result.items()).hasSize(1);
        assertThat(result.items().get(0).productName()).isEqualTo("Air Max 90");
    }

    @Test
    void getOrderDetail_anotherUsersOrder_throwsAccessDeniedException() {
        var owner = buildUser();
        var product = buildProduct("Air Max 90", 50, 119.99);
        var order = buildSavedOrder(owner, product, 1);
        UUID otherUserId = UUID.randomUUID();

        when(orderRepository.findByIdWithItems(order.getId())).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.getOrderDetail(order.getId(), otherUserId))
            .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void getOrderDetail_notFound_throwsEntityNotFoundException() {
        UUID bogusId = UUID.randomUUID();
        when(orderRepository.findByIdWithItems(bogusId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.getOrderDetail(bogusId, UUID.randomUUID()))
            .isInstanceOf(EntityNotFoundException.class)
            .hasMessageContaining(bogusId.toString());
    }
}
