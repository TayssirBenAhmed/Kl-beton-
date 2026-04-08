const sqlite3 = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Path to the database file in src-tauri
const dbPath = path.join(__dirname, '..', 'src-tauri', 'dev.db');

// Ensure directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

console.log('--- SEEDING KL BETON V3 (SQLITE) ---');
console.log('Target DB:', dbPath);

const db = new sqlite3(dbPath);

// 1. Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS Employe (
    id TEXT PRIMARY KEY,
    nom TEXT,
    prenom TEXT,
    poste TEXT,
    employee_id TEXT UNIQUE,
    salaire_base REAL,
    solde_conges REAL DEFAULT 18.0,
    solde_maladie REAL DEFAULT 10.0,
    date_embauche TEXT,
    actif INTEGER DEFAULT 1,
    created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS Avance (
    id TEXT PRIMARY KEY,
    montant REAL,
    date TEXT,
    statut TEXT,
    employe_id TEXT,
    created_at TEXT,
    FOREIGN KEY(employe_id) REFERENCES Employe(id)
  );
`);

// 2. Clear existing data
db.prepare('DELETE FROM User').run();
db.prepare('DELETE FROM Employe').run();

// 3. Seed Users
const salt = bcrypt.genSaltSync(10);
const adminPass = bcrypt.hashSync('admin123', salt);
const chefPass = bcrypt.hashSync('chef123', salt);

db.prepare('INSERT INTO User (id, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)')
  .run('admin-1', 'admin@klbeton.tn', adminPass, 'ADMIN', new Date().toISOString());

db.prepare('INSERT INTO User (id, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)')
  .run('chef-1', 'chef@klbeton.tn', chefPass, 'CHEF', new Date().toISOString());

// 4. Seed Employees
const empData = [
  ['BEN ALI', 'Ahmed', 'Chauffeur Malaxeur', 'MAT-001', 1200],
  ['TRABELSI', 'Sami', 'Opérateur Centrale', 'MAT-002', 1500],
  ['GHERIBI', 'Mouna', 'Secrétaire Polyvalente', 'MAT-003', 1100],
];

const insertEmp = db.prepare('INSERT INTO Employe (id, nom, prenom, poste, employee_id, salaire_base, date_embauche, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

empData.forEach((emp, i) => {
  insertEmp.run(`emp-${i}`, emp[0], emp[1], emp[2], emp[3], emp[4], '2024-01-01', new Date().toISOString());
});

console.log('✅ Seeding terminé avec succès !');
console.log('Utilisateurs créés:');
console.log('- admin@klbeton.tn / admin123');
console.log('- chef@klbeton.tn / chef123');
db.close();