# KL Béton Construction — V4

Application de gestion RH et paie pour **KL Béton Construction**, développée avec **Tauri v1 + Rust + React + SQLite**.

---

## Stack Technique

| Couche | Technologie |
|---|---|
| Desktop shell | Tauri v1 (Rust) |
| Backend / DB | Rust + SQLx + SQLite |
| Frontend | React 18 + Vite |
| State management | Zustand |
| PDF | jsPDF + jsPDF-AutoTable |
| Auth | bcrypt (Rust) |
| Style | Tailwind CSS + inline styles |

---

## Fonctionnalités

### Authentification
- Connexion sécurisée avec rôles **ADMIN** et **CHEF**
- Mots de passe hashés bcrypt — seed automatique au démarrage

### Gestion des Employés
- Fiche collaborateur complète (matricule, poste, salaire de base, date d'embauche)
- Calcul dynamique du **Taux Journalier (TJ)** et **Taux Horaire HS**

### Pointage
- Saisie journalière : `PRESENT`, `ABSENT`, `CONGE`, `MALADIE`, `FERIE`
- Heures supplémentaires et avances par jour
- Décrémentation automatique du **solde congés** jour par jour

### Calcul de Paie — Mode Simplifié
```
TJ  = Salaire_Base / 26
TH  = TJ / 8

GAINS     = (Présence × TJ) + (HS × TH) + (Fériés × TJ) + Bonus_Mérite
DÉDUCTIONS = (Absences × TJ) + (Maladie × TJ) + Avances + Remb. Prêt
NET       = max(0, GAINS − DÉDUCTIONS)
```
> Pas de CNSS / CSS / IRPP (mode tunisien simplifié)

### Gestion des Prêts (Crédits)
- Création d'un prêt avec montant total et mensualité
- Déduction mensuelle plafonnée au salaire disponible
- Solde restant mis à jour à chaque génération de fiche de paie
- Règle : `MontantPrélevé = min(Mensualité, SoldeRestant, SalaireDispo)`

### Rapports & PDF
- **Bulletin Individuel de Paie** (Portrait A4) — logo + cercle doré
- **Récapitulatif Global** (Paysage A4) — tous les employés du mois
- **Rapport de Conformité** — audit pointages chef de chantier
- Nommage automatique : `Bulletin_Individuel_NOM_PRENOM_MM_YYYY.pdf`

### Tableau de Bord
- KPIs temps réel : présents, absents, congés, total paie nette
- Graphiques ChartJS (Doughnut présence, Bar heures supp)

---

## Structure du Projet

```
kl-beton-construction/
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminEmployes.jsx
│   │   │   │   ├── AdminRapports.jsx
│   │   │   │   ├── AdminPointageView.jsx
│   │   │   │   ├── AdminAvances.jsx
│   │   │   │   ├── EmployeeProfile.jsx
│   │   │   │   └── Statistiques.jsx
│   │   │   └── auth/
│   │   ├── stores/            # Zustand stores
│   │   │   ├── employeStore.js
│   │   │   ├── pointageStore.js
│   │   │   ├── avanceStore.js
│   │   │   ├── pretStore.js
│   │   │   └── meritStore.js
│   │   ├── utils/
│   │   │   └── payrollCalculator.js   # Moteur de paie unique
│   │   └── lib/services/
│   │       └── payrollPdfService.js   # Génération PDF
│   └── package.json
│
└── backend/                   # Rust + Tauri
    ├── src-tauri/
    │   └── src/
    │       ├── main.rs
    │       ├── db.rs
    │       └── commands/
    │           ├── employes.rs
    │           ├── pointages.rs
    │           ├── avances.rs
    │           ├── prets.rs
    │           ├── stats.rs
    │           └── rapports.rs
    └── package.json
```

---

## Installation & Lancement

### Prérequis
- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) + Cargo
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Application Desktop (Tauri)
```bash
cd backend
npm install
npm run tauri dev
```

### Build Production
```bash
cd backend
npm run tauri build
```

---

## Comptes par défaut

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@klbeton.tn | admin123 |
| Chef | chef@klbeton.tn | chef123 |

> Les comptes sont re-seedés automatiquement à chaque démarrage.

---

## Variables d'environnement

Créez un fichier `.env` dans `backend/` :
```env
DATABASE_URL=sqlite:./data/klbeton.db
```

---

## Logique Prêt — Règle Clé

Quand `Mensualité > Salaire disponible` :
```
MontantPrélevé = min(Mensualité, SoldeRestant, SalaireDispo)
Net            = SalaireDispo − MontantPrélevé  → 0.000 TND
SoldeRestant   -= MontantPrélevé  (pas la mensualité complète)
```

---

## Licence

Usage interne — KL Béton Construction © 2026
