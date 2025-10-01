-- Создаем таблицу администраторов
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем администратора admin:admin (пароль будет захеширован в бэкенде при первом входе)
INSERT INTO admins (username, password_hash) VALUES ('admin', 'admin');