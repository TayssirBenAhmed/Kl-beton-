-- KL BETON V3 - Industrial Overhaul Migration
-- Adding fields for professional payroll and industrial tracking

-- Add fields to Employe
ALTER TABLE Employe ADD COLUMN prime_transport REAL NOT NULL DEFAULT 60.0;
ALTER TABLE Employe ADD COLUMN prime_presence REAL NOT NULL DEFAULT 10.0;
ALTER TABLE Employe ADD COLUMN irpp REAL NOT NULL DEFAULT 0.0;
ALTER TABLE Employe ADD COLUMN css REAL NOT NULL DEFAULT 0.0;
ALTER TABLE Employe ADD COLUMN cnss_matricule TEXT;

-- Add fields to Pointage for specific day types
ALTER TABLE Pointage ADD COLUMN is_ferie INTEGER NOT NULL DEFAULT 0;
ALTER TABLE Pointage ADD COLUMN is_dimanche INTEGER NOT NULL DEFAULT 0;
