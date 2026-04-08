-- KL BETON V4 - MeritBonus Table Migration
-- Persists the monthly merit bonus assignment per employee.
-- mois format: "YYYY-MM" (e.g. "2026-04")

CREATE TABLE IF NOT EXISTS "MeritBonus" (
    employe_id TEXT NOT NULL,
    mois       TEXT NOT NULL,
    PRIMARY KEY (employe_id, mois),
    FOREIGN KEY (employe_id) REFERENCES Employe(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_merit_mois ON MeritBonus(mois);
