USE online_super_shop;

INSERT INTO users (name, email, phone, password_hash, role, status) VALUES
('Admin User', 'admin@nityomartbd.com', '01700000000', 'temporary_hash_replace_in_auth_step', 'admin', 'active'),
('Fresh Mart Vendor', 'freshmart@nityomartbd.com', '01711111111', 'temporary_hash_replace_in_auth_step', 'vendor', 'active'),
('Resale Corner Vendor', 'resalecorner@nityomartbd.com', '01722222222', 'temporary_hash_replace_in_auth_step', 'vendor', 'active');

INSERT INTO vendor_profiles (user_id, shop_name, shop_phone, shop_address, approval_status) VALUES
(2, 'Fresh Mart Supplier', '01711111111', 'Dhaka, Bangladesh', 'approved'),
(3, 'Resale Corner BD', '01722222222', 'Gazipur, Bangladesh', 'approved');

INSERT INTO categories (name, slug, image_url) VALUES
('Grocery', 'grocery', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=900'),
('Fresh Fruits', 'fresh-fruits', 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=900'),
('Vegetables', 'vegetables', 'https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=900'),
('Personal Care', 'personal-care', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900'),
('Resale Items', 'resale-items', 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=900');

INSERT INTO products
(seller_id, category_id, name, slug, description, product_type, product_condition, price, old_price, stock, unit, image_url, approval_status, is_featured)
VALUES
(NULL, 1, 'Premium Basmati Rice 5kg', 'premium-basmati-rice-5kg', 'Long grain premium basmati rice for daily family meals.', 'super_shop', 'new', 780.00, 850.00, 40, 'bag', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=900', 'approved', TRUE),
(NULL, 1, 'Soybean Oil 5L', 'soybean-oil-5l', 'Refined soybean oil for cooking.', 'super_shop', 'new', 820.00, 860.00, 35, 'bottle', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=900', 'approved', TRUE),
(2, 2, 'Fresh Apple 1kg', 'fresh-apple-1kg', 'Fresh imported apples supplied by verified vendor.', 'super_shop', 'new', 320.00, NULL, 50, 'kg', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=900', 'approved', TRUE),
(2, 3, 'Tomato 1kg', 'tomato-1kg', 'Fresh red tomatoes from local supplier.', 'super_shop', 'new', 90.00, NULL, 70, 'kg', 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=900', 'approved', TRUE),
(NULL, 4, 'Herbal Shampoo 340ml', 'herbal-shampoo-340ml', 'Gentle herbal shampoo for regular use.', 'super_shop', 'new', 390.00, 450.00, 25, 'bottle', 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=900', 'approved', TRUE),
(3, 5, 'Resale Electric Kettle', 'resale-electric-kettle', 'Pre-owned electric kettle in good working condition.', 'resale', 'used_good', 650.00, 950.00, 1, 'piece', 'https://images.unsplash.com/photo-1594213114663-d94db9b17125?w=900', 'approved', TRUE),
(3, 5, 'Resale Study Table', 'resale-study-table', 'Used study table suitable for home and student use.', 'resale', 'used_fair', 1800.00, 2500.00, 1, 'piece', 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=900', 'approved', FALSE),
(3, 5, 'Resale Backpack', 'resale-backpack', 'Used backpack in clean and usable condition.', 'resale', 'used_like_new', 550.00, 900.00, 1, 'piece', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900', 'approved', FALSE);

INSERT INTO banners (title, subtitle, image_url, button_text, button_link, sort_order) VALUES
('NityoMart BD Daily Essentials', 'Shop grocery, fresh items, personal care, and verified resale products from one platform.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400', 'Shop Now', '/shop', 1),
('Multi-Vendor Super Shop & Resale Marketplace', 'Buy new daily products and selected resale items from verified vendors.', 'https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=1400', 'Explore Products', '/shop', 2);
