-- KL BETON V4 - Pret (Credit) Table Migration

CREATE TABLE IF NOT EXISTS "Pret" (
    id TEXT PRIMARY KEY,
    employe_id TEXT NOT NULL,
    montant_total REAL NOT NULL DEFAULT 0.0,
    mensualite REAL NOT NULL DEFAULT 0.0,
    solde_restant REAL NOT NULL DEFAULT 0.0,
    date_debut TEXT NOT NULL DEFAULT (datetime('now')),
    statut TEXT NOT NULL DEFAULT 'ACTIF',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (employe_id) REFERENCES Employe(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pret_employe ON Pret(employe_id);
