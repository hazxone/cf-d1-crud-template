-- Migration: Create products table for CRUD demo
DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT DEFAULT 'general',
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);

-- Insert sample data
INSERT INTO products (name, description, price, stock, category, image_url) VALUES
('Wireless Mouse', 'Ergonomic wireless mouse with 2.4GHz connectivity', 29.99, 150, 'electronics', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'),
('Mechanical Keyboard', 'RGB backlit mechanical keyboard with blue switches', 89.99, 75, 'electronics', 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400'),
('USB-C Hub', '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader', 45.50, 200, 'accessories', 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400'),
('Laptop Stand', 'Adjustable aluminum laptop stand for better ergonomics', 34.99, 120, 'accessories', 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400'),
('Webcam HD', '1080p HD webcam with built-in microphone', 59.99, 90, 'electronics', 'https://images.unsplash.com/photo-1589594551399-763f4d3ee3fd?w=400'),
('Desk Lamp', 'LED desk lamp with adjustable brightness and color temperature', 39.99, 85, 'furniture', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400'),
('Phone Stand', 'Foldable phone stand compatible with all smartphones', 15.99, 300, 'accessories', 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400'),
('Bluetooth Speaker', 'Portable Bluetooth speaker with 12-hour battery life', 49.99, 110, 'electronics', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'),
('Monitor', '27-inch 4K UHD monitor with HDR support', 399.99, 45, 'electronics', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400'),
('Office Chair', 'Ergonomic office chair with lumbar support', 249.99, 30, 'furniture', 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400');
