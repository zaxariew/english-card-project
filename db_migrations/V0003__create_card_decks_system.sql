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