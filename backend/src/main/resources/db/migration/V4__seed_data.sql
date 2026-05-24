-- Admin user (password: Admin@1234, BCrypt strength 12)
INSERT INTO users (id, email, password_hash, full_name, is_admin, created_at)
VALUES (
    gen_random_uuid(),
    'admin@mystreet.com',
    '$2a$12$uv90XpxrnG.kRA2VWMFc5ek9czxSRCcsjB0EcheL561mkOj5kjWgC',
    'MyStreeT Admin',
    TRUE,
    CURRENT_TIMESTAMP
);

-- Regular test user (password: User@1234, BCrypt strength 12)
INSERT INTO users (id, email, password_hash, full_name, is_admin, created_at)
VALUES (
    gen_random_uuid(),
    'user@mystreet.com',
    '$2a$12$kGuECWqHykkYQsl44X2WTOq38NlgsbPFqwLWofjoELMLBBKgACZQW',
    'Test User',
    FALSE,
    CURRENT_TIMESTAMP
);

-- 10 seeded sneakers
INSERT INTO products (id, name, brand, description, price, image_url, sizes_csv, stock_qty, created_at, updated_at) VALUES
(gen_random_uuid(), 'Air Max 90',    'Nike',    'Classic retro cushioning with bold color blocking.',          119.99, 'https://picsum.photos/seed/airmax90/600/600',    '7,8,9,10',       50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Air Force 1',   'Nike',    'Timeless court silhouette crafted for everyday street style.', 89.99, 'https://picsum.photos/seed/airforce1/600/600',  '7,8,9,10,11',    40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Dunk Low',      'Nike',    'Reimagined court classic with premium leather.',               99.99, 'https://picsum.photos/seed/dunklow/600/600',    '7,8,9,10,11',    55, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Ultraboost 23', 'Adidas',  'Maximum Boost cushioning for energy return on every stride.', 139.99, 'https://picsum.photos/seed/ultra23/600/600',    '7,8,9,10,11',    35, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Stan Smith',    'Adidas',  'Minimalist tennis classic with perforated three-stripe branding.', 79.99, 'https://picsum.photos/seed/stansmith/600/600', '6,7,8,9,10',   60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Samba OG',      'Adidas',  'Vintage court shoe with suede toe cap and gum sole.',          89.99, 'https://picsum.photos/seed/sambaog/600/600',    '7,8,9,10',       40, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Chuck Taylor',  'Converse', 'Iconic canvas high-top. A cultural staple.',                  59.99, 'https://picsum.photos/seed/chucktaylor/600/600','6,7,8,9,10,11',  80, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Old Skool',     'Vans',    'Low-profile skate shoe with the signature side stripe.',       69.99, 'https://picsum.photos/seed/oldskool/600/600',   '7,8,9,10',       45, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Speedcat OG',   'Puma',    'Racing-inspired silhouette from the archives.',                89.99, 'https://picsum.photos/seed/speedcatog/600/600', '7,8,9,10,11',    30, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'Gel-Kayano 31', 'ASICS',   'Premium stability running shoe with Gel cushioning.',         159.99, 'https://picsum.photos/seed/kayano31/600/600',   '7,8,9,10',       25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
