-- KL BETON V3 - Initial Schema Migration
-- SQLite schema for all tables

CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'EMPLOYE',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "Employe" (
    id TEXT PRIMARY KEY,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    poste TEXT NOT NULL,
    employee_id TEXT UNIQUE NOT NULL,
    salaire_base REAL NOT NULL,
    solde_conges REAL NOT NULL DEFAULT 18.0,
    solde_maladie REAL NOT NULL DEFAULT 10.0,
    date_embauche TEXT NOT NULL DEFAULT (datetime('now')),
    actif INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS "Pointage" (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    statut TEXT NOT NULL DEFAULT 'PRESENT',
    heures_supp REAL NOT NULL DEFAULT 0.0,
    jours_travailles REAL NOT NULL DEFAULT 1.0,
    avance REAL NOT NULL DEFAULT 0.0,
    note TEXT,
    employe_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employe_id) REFERENCES Employe(id) ON DELETE CASCADE,
    UNIQUE(employe_id, date)
);

CREATE TABLE IF NOT EXISTS "Avance" (
    id TEXT PRIMARY KEY,
    montant REAL NOT NULL,
    date TEXT NOT NULL DEFAULT (datetime('now')),
    statut TEXT NOT NULL DEFAULT 'PENDING',
    employe_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employe_id) REFERENCES Employe(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Message" (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    FOREIGN KEY (sender_id) REFERENCES "User"(id),
    FOREIGN KEY (receiver_id) REFERENCES "User"(id)
);

CREATE INDEX IF NOT EXISTS idx_pointage_employe_date ON Pointage(employe_id, date);
CREATE INDEX IF NOT EXISTS idx_avance_employe ON Avance(employe_id);
CREATE INDEX IF NOT EXISTS idx_message_receiver ON Message(receiver_id);
CREATE INDEX IF NOT EXISTS idx_message_sender ON Message(sender_id);
