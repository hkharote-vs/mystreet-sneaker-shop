CREATE TABLE products (
    id          UUID           DEFAULT RANDOM_UUID() NOT NULL,
    name        VARCHAR(255)   NOT NULL,
    brand       VARCHAR(100)   NOT NULL,
    description VARCHAR(2000),
    price       DECIMAL(10, 2) NOT NULL,
    image_url   VARCHAR(500),
    sizes_csv   VARCHAR(100),
    stock_qty   INTEGER        NOT NULL DEFAULT 0,
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT chk_price_positive CHECK (price > 0),
    CONSTRAINT chk_stock_non_negative CHECK (stock_qty >= 0)
);

CREATE INDEX idx_products_brand ON products(brand);
