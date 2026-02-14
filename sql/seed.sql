-- Default admin (change later)
INSERT INTO admins(username, pass_hash)
VALUES ('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
ON CONFLICT(username) DO NOTHING;

-- Default settings
INSERT INTO settings(key,value) VALUES ('shop_open','1') ON CONFLICT(key) DO NOTHING;
INSERT INTO settings(key,value) VALUES ('shop_message','') ON CONFLICT(key) DO NOTHING;
INSERT INTO settings(key,value) VALUES ('theme_bg','#07100c') ON CONFLICT(key) DO NOTHING;
INSERT INTO settings(key,value) VALUES ('theme_card','#0b1a12') ON CONFLICT(key) DO NOTHING;
INSERT INTO settings(key,value) VALUES ('theme_line','rgba(156,255,200,.14)') ON CONFLICT(key) DO NOTHING;
INSERT INTO settings(key,value) VALUES ('theme_mint','#19ff8f') ON CONFLICT(key) DO NOTHING;
INSERT INTO settings(key,value) VALUES ('receipt_prefix','T') ON CONFLICT(key) DO NOTHING;
INSERT INTO settings(key,value) VALUES ('receipt_counter','0') ON CONFLICT(key) DO NOTHING;
INSERT INTO settings(key,value) VALUES ('receipt_day','') ON CONFLICT(key) DO NOTHING;

-- Sample menu
INSERT INTO categories(name,sort_order,is_active) VALUES
('قهوه',1,1),('شیک',2,1),('دمنوش',3,1)
ON CONFLICT DO NOTHING;

-- items (category_id assumed 1..3 by insert order in fresh DB)
INSERT INTO items(category_id,name,price,image_url,description,is_available,sort_order) VALUES
(1,'اسپرسو',90000,'','',1,1),
(1,'لاته',120000,'','',1,2),
(1,'آمریکانو',100000,'','',1,3),
(2,'شیک شکلات',160000,'','',1,1),
(2,'شیک نوتلا',180000,'','',1,2),
(3,'دمنوش آرامش',110000,'','',1,1)
ON CONFLICT DO NOTHING;

-- Featured items (پیشنهاد روز)
INSERT INTO featured_items(item_id,sort_order,is_active) VALUES
(2,1,1),(4,2,1)
ON CONFLICT(item_id) DO UPDATE SET sort_order=excluded.sort_order, is_active=excluded.is_active;

-- Discounts
INSERT INTO discount_rules(scope,target_id,percent,is_active) VALUES
('category',2,10,1)
ON CONFLICT(scope,target_id) DO UPDATE SET percent=excluded.percent, is_active=excluded.is_active;
