-- Table des utilisateurs
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'MOA',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table des projets
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  surface NUMERIC,
  budget NUMERIC,
  status VARCHAR(50) DEFAULT 'Brouillon',
  created_at TIMESTAMP DEFAULT NOW()
);
