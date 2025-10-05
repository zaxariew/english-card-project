-- Создаем таблицу групп
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создаем таблицу связей многие-ко-многим между карточками и группами
CREATE TABLE card_groups (
    card_id INTEGER NOT NULL REFERENCES cards(id),
    group_id INTEGER NOT NULL REFERENCES groups(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (card_id, group_id)
);

-- Создаем индексы для быстрого поиска
CREATE INDEX idx_card_groups_group_id ON card_groups(group_id);
CREATE INDEX idx_card_groups_card_id ON card_groups(card_id);