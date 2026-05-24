package com.mystreet.order;

import com.mystreet.order.dto.OrderDetailResponse;
import com.mystreet.order.dto.OrderItemResponse;
import com.mystreet.order.dto.OrderSummaryResponse;
import com.mystreet.order.dto.PlaceOrderRequest;
import com.mystreet.product.ProductRepository;
import com.mystreet.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
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
            var product = productRepository.findById(itemReq.productId()).orElse(null);

            if (product == null) {
                return new OrderResult.ProductNotFound(itemReq.productId().toString());
            }

            if (product.getStockQty() < itemReq.quantity()) {
                return new OrderResult.InsufficientStock(
                    product.getName(), itemReq.quantity(), product.getStockQty());
            }

            int updated = productRepository.decrementStock(product.getId(), itemReq.quantity());
            if (updated == 0) {
                return new OrderResult.InsufficientStock(
                    product.getName(), itemReq.quantity(), product.getStockQty());
            }

            var item = new OrderItem();
            item.setProduct(product);
            item.setProductName(product.getName());
            item.setProductPrice(product.getPrice());
            item.setSize(itemReq.size());
            item.setQuantity(itemReq.quantity());

            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(itemReq.quantity())));
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
            .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));
        if (!order.getUser().getId().equals(requestingUserId)) {
            throw new AccessDeniedException("You do not have access to this order");
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
