
INSERT INTO products
(seller_id, name, description, price_paise, stock)
SELECT s.id, p.name, p.description, p.price_paise, p.stock
FROM (
  VALUES
    ('Sharma Grocery', 'Basmati Rice 1kg', 'Premium basmati rice', 12000, 30),
    ('Sharma Grocery', 'Milk 1L', 'Fresh packaged milk', 6000, 25),
    ('Sharma Grocery', 'Wheat Flour 1kg', 'Whole wheat atta', 5500, 20),
    ('Sharma Grocery', 'Sugar 1kg', 'Refined white sugar', 4800, 15),
    ('Sharma Grocery', 'Cooking Oil 1L', 'Refined sunflower oil', 16000, 12),

    ('Fresh Fruits Corner', 'Apples 1kg', 'Fresh red apples', 18000, 20),
    ('Fresh Fruits Corner', 'Bananas 1 Dozen', 'Fresh ripe bananas', 6000, 25),
    ('Fresh Fruits Corner', 'Oranges 1kg', 'Sweet oranges', 9000, 18),
    ('Fresh Fruits Corner', 'Grapes 500g', 'Fresh green grapes', 7000, 15),
    ('Fresh Fruits Corner', 'Pomegranate 1kg', 'Fresh pomegranates', 20000, 10),

    ('City Stationery', 'Notebook 200 Pages', 'Ruled notebook', 6500, 40),
    ('City Stationery', 'Blue Ball Pen', 'Smooth writing pen', 1000, 100),
    ('City Stationery', 'Pencil Pack', 'Pack of 10 pencils', 5000, 30),
    ('City Stationery', 'Eraser', 'Soft rubber eraser', 500, 60),
    ('City Stationery', 'Geometry Box', 'Student geometry set', 12000, 20)
) AS p(seller_name, name, description, price_paise, stock)
JOIN sellers s ON s.name = p.seller_name
WHERE NOT EXISTS (
  SELECT 1
  FROM products existing
  WHERE existing.seller_id = s.id
    AND existing.name = p.name
);
