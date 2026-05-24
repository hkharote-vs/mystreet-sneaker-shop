# SPEC-01: Database Schema & Migrations

**Status:** `[x] Complete`  
**Depends on:** SPEC-00 (project setup)  
**Blocks:** SPEC-02, SPEC-03, SPEC-04  

---

## Overview

Define the complete PostgreSQL schema via Flyway versioned migrations. All schema changes in this project go through Flyway — Hibernate never creates or alters tables (`ddl-auto: validate`). This spec covers all four tables, indexes, constraints, seed data, and the Flyway configuration.

---

## Flyway Configuration

Location: `backend/src/main/resources/db/migration/`  
Naming convention: `V{version}__{description}.sql`

```yaml
# application.yml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: false
    validate-on-migrate: true
    out-of-order: false
```

---

## Migration Files

### `V1__create_users.sql`

```sql
CREATE TABLE users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255),
    is_admin      BOOLEAN     NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
```

**Notes:**
- `gen_random_uuid()` — available in PostgreSQL 13+; Neon supports it
- Email is the login key — must be unique and indexed
- `password_hash` stores the BCrypt output (~60 chars, VARCHAR 255 is safe)
- `full_name` is nullable (not required at registration in MVP)

---

### `V2__create_products.sql`

```sql
CREATE TABLE products (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255)   NOT NULL,
    brand       VARCHAR(100)   NOT NULL,
    description TEXT,
    price       NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    image_url   VARCHAR(500),
    sizes_csv   VARCHAR(100),
    stock_qty   INTEGER        NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_stock ON products(stock_qty);
```

**Notes:**
- `price > 0` constraint — enforced at DB level (defense in depth)
- `stock_qty >= 0` constraint — prevents negative stock at DB level
- `sizes_csv` stores comma-separated sizes: `"7,8,9,10,11"`; simple for MVP
- `updated_at` is updated via application (`@PreUpdate`) or trigger (V5 stretch)
- Brand index enables efficient brand-based filtering

---

### `V3__create_orders.sql`

```sql
CREATE TABLE orders (
    id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID           NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    status         VARCHAR(50)    NOT NULL DEFAULT 'PLACED',
    payment_mode   VARCHAR(50)    NOT NULL,
    total_amount   NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    shipping_name  VARCHAR(255)   NOT NULL,
    shipping_addr  TEXT           NOT NULL,
    shipping_city  VARCHAR(100)   NOT NULL,
    shipping_pin   VARCHAR(20)    NOT NULL,
    shipping_phone VARCHAR(20)    NOT NULL,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
    id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id      UUID           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id    UUID           REFERENCES products(id) ON DELETE SET NULL,
    product_name  VARCHAR(255)   NOT NULL,
    product_price NUMERIC(10, 2) NOT NULL CHECK (product_price > 0),
    size          VARCHAR(10)    NOT NULL,
    quantity      INTEGER        NOT NULL CHECK (quantity > 0)
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

**Notes:**
- `ON DELETE RESTRICT` on `orders.user_id` — prevents deleting a user who has orders
- `ON DELETE SET NULL` on `order_items.product_id` — allows product deletion without losing order history
- `product_name` and `product_price` are **snapshots** at order time — if a product is edited or deleted, the order history is preserved
- `ON DELETE CASCADE` on `order_items.order_id` — deleting an order removes its items
- Valid `status` values: `PLACED`, `CONFIRMED`, `SHIPPED` (enforced at service layer; DB stores any string for extensibility)
- Valid `payment_mode` values: `MOCK_COD`, `MOCK_UPI`

---

### `V4__seed_data.sql`

```sql
-- Admin user
-- Password is "Admin@1234" hashed with BCrypt strength 12
-- Regenerate with: spring security BCryptPasswordEncoder with strength 12
INSERT INTO users (id, email, password_hash, full_name, is_admin, created_at)
VALUES (
    gen_random_uuid(),
    'admin@mystreet.com',
    '$2a$12$LBZJMq8cXGlWdIUvOo88QOVuLs.VFSeyTp.dS0K.HxV65Gu8S5AEu',
    'MyStreeT Admin',
    true,
    now()
);

-- Regular test user
-- Password is "User@1234" hashed with BCrypt strength 12
INSERT INTO users (id, email, password_hash, full_name, is_admin, created_at)
VALUES (
    gen_random_uuid(),
    'user@mystreet.com',
    '$2a$12$H5jXzL9K2QrN7YmVw3TkOu1pGdsFbEiAWcvMnJxR4ZqPL6hDtUyI8',
    'Test User',
    false,
    now()
);

-- Products (10 seeded sneakers)
INSERT INTO products (id, name, brand, description, price, image_url, sizes_csv, stock_qty, created_at, updated_at)
VALUES
(gen_random_uuid(), 'Air Max 90',    'Nike',    'Classic retro cushioning with bold color blocking. A streetwear icon since 1990.',     119.99, 'https://picsum.photos/seed/airmax90/600/600',    '7,8,9,10',       50, now(), now()),
(gen_random_uuid(), 'Air Force 1',   'Nike',    'Timeless court silhouette crafted for everyday street style.',                           89.99, 'https://picsum.photos/seed/airforce1/600/600',  '7,8,9,10,11',    40, now(), now()),
(gen_random_uuid(), 'Dunk Low',      'Nike',    'Reimagined court classic with premium leather and bold colorways.',                       99.99, 'https://picsum.photos/seed/dunklow/600/600',    '7,8,9,10,11',    55, now(), now()),
(gen_random_uuid(), 'Ultraboost 23', 'Adidas',  'Maximum Boost cushioning for energy return on every stride.',                           139.99, 'https://picsum.photos/seed/ultra23/600/600',    '7,8,9,10,11',    35, now(), now()),
(gen_random_uuid(), 'Stan Smith',    'Adidas',  'Minimalist tennis classic with perforated three-stripe branding.',                        79.99, 'https://picsum.photos/seed/stansmith/600/600',  '6,7,8,9,10',     60, now(), now()),
(gen_random_uuid(), 'Samba OG',      'Adidas',  'Vintage court shoe with suede toe cap and gum sole. Born on the ice, made for streets.', 89.99, 'https://picsum.photos/seed/sambaog/600/600',    '7,8,9,10',       40, now(), now()),
(gen_random_uuid(), 'Chuck Taylor',  'Converse','Iconic canvas high-top with vulcanized rubber sole. A cultural staple.',                  59.99, 'https://picsum.photos/seed/chucktaylor/600/600','6,7,8,9,10,11',  80, now(), now()),
(gen_random_uuid(), 'Old Skool',     'Vans',    'Low-profile skate shoe with the signature side stripe. Built for the streets.',           69.99, 'https://picsum.photos/seed/oldskool/600/600',   '7,8,9,10',       45, now(), now()),
(gen_random_uuid(), 'Speedcat OG',   'Puma',    'Racing-inspired silhouette from the archives. Suede upper, slim profile.',               89.99, 'https://picsum.photos/seed/speedcatog/600/600', '7,8,9,10,11',    30, now(), now()),
(gen_random_uuid(), 'Gel-Kayano 31', 'ASICS',   'Premium stability running shoe with Gel cushioning and Dynamic DuoMax support.',        159.99, 'https://picsum.photos/seed/kayano31/600/600',   '7,8,9,10',       25, now(), now());
```

---

## JPA Entity Mapping Requirements

Hibernate must map to the above schema without any DDL generation. Required configurations on each entity:

### `User` Entity
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "full_name", length = 255)
    private String fullName;

    @Column(name = "is_admin", nullable = false)
    private boolean isAdmin;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
```

### `Product` Entity
```java
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 100)
    private String brand;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "sizes_csv", length = 100)
    private String sizesCsv;

    @Column(name = "stock_qty", nullable = false)
    private int stockQty;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
```

### `Order` Entity
```java
@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "payment_mode", nullable = false, length = 50)
    private String paymentMode;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "shipping_name", nullable = false, length = 255)
    private String shippingName;

    @Column(name = "shipping_addr", nullable = false, columnDefinition = "TEXT")
    private String shippingAddr;

    @Column(name = "shipping_city", nullable = false, length = 100)
    private String shippingCity;

    @Column(name = "shipping_pin", nullable = false, length = 20)
    private String shippingPin;

    @Column(name = "shipping_phone", nullable = false, length = 20)
    private String shippingPhone;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OrderItem> items = new ArrayList<>();

    @PrePersist
    void onCreate() { createdAt = Instant.now(); }
}
```

### `OrderItem` Entity
```java
@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "product_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal productPrice;

    @Column(nullable = false, length = 10)
    private String size;

    @Column(nullable = false)
    private int quantity;
}
```

---

## Verification Steps

```bash
# Start Postgres
docker compose up -d postgres

# Run backend — Flyway will apply all migrations
cd backend
SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun

# Expected logs on first run:
# Flyway: Migrating schema "public" to version 1 - create users
# Flyway: Migrating schema "public" to version 2 - create products
# Flyway: Migrating schema "public" to version 3 - create orders
# Flyway: Migrating schema "public" to version 4 - seed data
# Flyway: Successfully applied 4 migrations

# Connect to DB and verify (using psql or any client)
psql postgresql://mystreet:mystreet_dev@localhost:5432/mystreet

SELECT count(*) FROM products;   -- should return 10
SELECT count(*) FROM users;      -- should return 2
SELECT email, is_admin FROM users;
```

---

## Acceptance Criteria

- [ ] `./gradlew bootRun` applies all 4 migrations without error on a fresh DB
- [ ] Re-running bootRun on an already-migrated DB logs "Flyway: Current version of schema: 4" (no re-apply)
- [ ] `SELECT count(*) FROM products` returns 10
- [ ] `SELECT count(*) FROM users` returns 2 (admin + test user)
- [ ] Admin user has `is_admin = true`
- [ ] `SELECT count(*) FROM orders` returns 0 (no orders seeded)
- [ ] DB constraints validated: inserting `price = -1` should fail with a DB-level error
- [ ] `./gradlew test` passes (Hibernate schema validation matches Flyway schema)
