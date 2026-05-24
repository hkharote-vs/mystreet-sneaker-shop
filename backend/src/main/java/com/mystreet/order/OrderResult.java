package com.mystreet.order;

public sealed interface OrderResult permits
    OrderResult.Success,
    OrderResult.InsufficientStock,
    OrderResult.ProductNotFound {

    record Success(Order order) implements OrderResult {}
    record InsufficientStock(String productName, int requested, int available) implements OrderResult {}
    record ProductNotFound(String productId) implements OrderResult {}
}
