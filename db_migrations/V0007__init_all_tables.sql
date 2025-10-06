-- V0001: Create users, categories, cards tables
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  category_id INTEGER REFERENCES categories(id),
  russian VARCHAR(255) NOT NULL,
  russian_example TEXT,
  english VARCHAR(255) NOT NULL,
  english_example TEXT,
  learned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_category_id ON cards(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- V0002: Create global words dictionary
CREATE TABLE IF NOT EXISTS global_words (
  id SERIAL PRIMARY KEY,
  russian VARCHAR(255) UNIQUE NOT NULL,
  english VARCHAR(255) NOT NULL,
  russian_example TEXT,
  english_example TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE cards ADD COLUMN IF NOT EXISTS word_id INTEGER REFERENCES global_words(id);

CREATE INDEX IF NOT EXISTS idx_cards_word_id ON cards(word_id);
CREATE INDEX IF NOT EXISTS idx_global_words_russian ON global_words(russian);

-- V0003: Create card decks system
CREATE TABLE IF NOT EXISTS card_decks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  is_public BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deck_words (
  id SERIAL PRIMARY KEY,
  deck_id INTEGER REFERENCES card_decks(id),
  word_id INTEGER REFERENCES global_words(id),
  position INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(deck_id, word_id)
);

CREATE TABLE IF NOT EXISTS user_deck_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  deck_id INTEGER REFERENCES card_decks(id),
  word_id INTEGER REFERENCES global_words(id),
  learned BOOLEAN DEFAULT FALSE,
  last_reviewed TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, deck_id, word_id)
);

CREATE INDEX IF NOT EXISTS idx_card_decks_public ON card_decks(is_public);
CREATE INDEX IF NOT EXISTS idx_card_decks_created_by ON card_decks(created_by);
CREATE INDEX IF NOT EXISTS idx_deck_words_deck_id ON deck_words(deck_id);
CREATE INDEX IF NOT EXISTS idx_user_deck_progress_user_deck ON user_deck_progress(user_id, deck_id);

-- V0004: Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- V0005: Create user progress table
CREATE TABLE IF NOT EXISTS user_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    card_id INTEGER NOT NULL REFERENCES cards(id),
    is_learned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_card_id ON user_progress(card_id);

-- V0006: Create groups and card_groups tables
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS card_groups (
    card_id INTEGER NOT NULL REFERENCES cards(id),
    group_id INTEGER NOT NULL REFERENCES groups(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (card_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_card_groups_group_id ON card_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_card_groups_card_id ON card_groups(card_id);