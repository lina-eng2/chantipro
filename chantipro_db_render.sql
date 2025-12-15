-- 1. Supprimer les anciennes tables si elles existent
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

-- 2. Recréer la table users avec les bons noms de colonnes
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Recréer la table projects alignée avec ton code back-end
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    surface NUMERIC,
    budget NUMERIC,
    status VARCHAR(50) DEFAULT 'En cours',
    created_at TIMESTAMP DEFAULT NOW()
);
