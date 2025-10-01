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