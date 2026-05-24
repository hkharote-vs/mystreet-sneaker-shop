CREATE TABLE orders (
    id             UUID           DEFAULT RANDOM_UUID() NOT NULL,
    user_id        UUID           NOT NULL,
    status         VARCHAR(50)    NOT NULL DEFAULT 'PLACED',
    payment_mode   VARCHAR(50)    NOT NULL,
    total_amount   DECIMAL(10, 2) NOT NULL,
    shipping_name  VARCHAR(255)   NOT NULL,
    shipping_addr  VARCHAR(1000)  NOT NULL,
    shipping_city  VARCHAR(100)   NOT NULL,
    shipping_pin   VARCHAR(20)    NOT NULL,
    shipping_phone VARCHAR(20)    NOT NULL,
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id            UUID           DEFAULT RANDOM_UUID() NOT NULL,
    order_id      UUID           NOT NULL,
    product_id    UUID,
    product_name  VARCHAR(255)   NOT NULL,
    product_price DECIMAL(10, 2) NOT NULL,
    size          VARCHAR(10)    NOT NULL,
    quantity      INTEGER        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)   REFERENCES orders(id),
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT chk_quantity_positive  CHECK (quantity > 0)
);

CREATE INDEX idx_orders_user_id         ON orders(user_id);
CREATE INDEX idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
