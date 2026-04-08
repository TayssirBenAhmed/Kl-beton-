import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { payrollCalculator } from '../../utils/payrollCalculator';

// ── LOGO ──────────────────────────────────────────────────────────────────────
// Option 1 (recommandée) : placez votre logo dans frontend/src/assets/logo-kl-beton.png
//   → il sera chargé automatiquement.
// Option 2 : remplacez null par votre chaîne data:image/png;base64,...
const LOGO_OVERRIDE = null;

/** Résout le logo en base64 (priorité : override manuel → fichier PNG → null) */
const loadLogo = () => new Promise((resolve) => {
  if (LOGO_OVERRIDE) return resolve(LOGO_OVERRIDE);
  let src;
  try { src = new URL('../../assets/logo-kl-beton.png', import.meta.url).href; }
  catch { return resolve(null); }
  const img = new window.Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const c = document.createElement('canvas');
      c.width  = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d').drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    } catch { resolve(null); }
  };
  img.onerror = () => resolve(null);
  img.src = src;
});

// Palette de couleurs
const C = {
  navyBg:   [20,  33,  61],   // #14213D  fond en-tête
  gold:     [252, 163,  17],  // #FCA311  texte doré
  red:      [180,  30,  30],  // rouge déductions
  purple:   [130,  60, 180],  // violet prêt
  green:    [  5, 150, 105],  // vert net positif
  darkText: [ 20,  20,  40],
  midText:  [ 60,  60,  80],
  lightBg:  [248, 249, 252],
};

/**
 * Professional Payroll PDF Service for KL Beton
 * Generates Master Recap and Individual Payslips
 *
 * Formula (Mode Simplifié):
 *   GAINS = Salaire_Base + hasBonus×TJ + (HS × TH) + (Feriés × TJ)
 *   NET   = GAINS − Absences − Maladie − Avances − Pret_Mensualite
 */
export const payrollPdfService = {

  /**
   * Generates a Global Recap Report.
   * Columns: NOM | FONCTION | SAL.BASE | TJ | J.PRES | MONT.BASE | BONUS
   *         | H.SUPP | MONT.HS | J.FERIES | ABSENCES | MALADIE | AVANCES
   *         | PRET | TOTAL NET
   */
  generateGlobalRecap: async (month, year, data) => {
    const logo = await loadLogo();
    const doc  = new jsPDF('l', 'mm', 'a4');
    const monthNames = ["Janvier","Février","Mars","Avril","Mai","Juin",
      "Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
    const pageW      = doc.internal.pageSize.getWidth();
    const generatedAt = new Date().toLocaleString('fr-FR');

    // ── HEADER ───────────────────────────────────────────────────────────────
    if (logo) {
      doc.addImage(logo, 'PNG', 8, 6, 30, 30);
    } else {
      doc.setDrawColor(...C.navyBg);
      doc.setLineWidth(0.5);
      doc.circle(22, 22, 14);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...C.navyBg);
      doc.text("KL BETON", 22, 21, { align: 'center' });
      doc.text("CONSTRUCTION", 22, 25, { align: 'center' });
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("KL BETON", pageW / 2, 14, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`RECAPITULATIF GLOBAL DE PAIE - ${monthNames[month - 1].toUpperCase()} ${year}`, pageW / 2, 22, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Genere le : ${generatedAt}`, pageW / 2, 28, { align: 'center' });

    const rightX = pageW - 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("Ste KL BETON", rightX, 12, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);
    ["000, RTE MARMATA ELMODOU","Gabes - 6022 - TUNISIE",
      "TEL : 29 239 001 / 28 333 595","FAX : 75 271 004",
      "Email : klbetonconstruction@gmail.com","TVA : 1867624BAM000",
    ].forEach((line, i) => doc.text(line, rightX, 17 + i * 4.5, { align: 'right' }));

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.4);
    doc.line(14, 44, pageW - 14, 44);

    // ── FORMULE UNIQUE ────────────────────────────────────────────────────────
    const computeRow = (item) => {
      const salBase  = parseFloat(item.salaire_base || 0);
      const TJ       = salBase / 26;
      const TH       = TJ / 8;
      const p        = item.payroll || {};

      const presence   = parseFloat(p.presence       || 0);
      const hs         = parseFloat(p.hs             || 0);
      const feries     = parseFloat(p.feries         || 0);
      const absences   = parseFloat(p.absences       || 0);
      const maladie    = parseFloat(p.maladie        || 0);
      const avances    = parseFloat(p.avances        || 0);
      const mensualite = parseFloat(p.mensualitePret || 0);  // Prêt mensuel

      const montBase   = presence * TJ;
      const montBonus  = item.hasBonus ? TJ : 0;
      const montHS     = hs * TH;
      const montFeries = feries * TJ;
      const montAbs    = absences * TJ;
      const montMal    = maladie * TJ;

      const totalNet = Math.max(0,
        (montBase + montBonus + montHS + montFeries) - (montAbs + montMal + avances + mensualite)
      );

      return { salBase, TJ, presence, hs, feries, absences, maladie, avances,
               montBase, montBonus, montHS, montFeries, montAbs, montMal, mensualite, totalNet };
    };

    // ── TABLE ─────────────────────────────────────────────────────────────────
    const head = [[
      'NOM ET PRENOM', 'FONCTION', 'SAL. BASE', 'TJ',
      'J. PRES.', 'MONT. BASE', 'BONUS (TJ)',
      'H. SUPP', 'MONT. HS', 'J. FERIES',
      'ABSENCES', 'MALADIE', 'AVANCES',
      'PRET', 'TOTAL NET',
    ]];

    const fmt = v => parseFloat(v || 0).toFixed(3);

    const tableRows = data.map(item => {
      const r   = computeRow(item);
      const nom = `${item.nom || ''} ${item.prenom || ''}`.trim() || 'N/D';
      return [
        nom,
        item.poste || '',
        fmt(r.salBase),
        fmt(r.TJ),
        r.presence.toFixed(1),
        fmt(r.montBase),
        fmt(r.montBonus),
        r.hs.toFixed(2),
        fmt(r.montHS),
        r.feries.toFixed(1),
        fmt(r.montAbs),
        fmt(r.montMal),
        fmt(r.avances),
        r.mensualite > 0 ? fmt(r.mensualite) : '-',
        fmt(r.totalNet),
      ];
    });

    // ── LIGNE TOTAL ───────────────────────────────────────────────────────────
    const T = data.reduce((acc, item) => {
      const r = computeRow(item);
      return {
        salBase:    acc.salBase    + r.salBase,
        presence:   acc.presence   + r.presence,
        montBase:   acc.montBase   + r.montBase,
        montBonus:  acc.montBonus  + r.montBonus,
        hs:         acc.hs         + r.hs,
        montHS:     acc.montHS     + r.montHS,
        feries:     acc.feries     + r.feries,
        montAbs:    acc.montAbs    + r.montAbs,
        montMal:    acc.montMal    + r.montMal,
        avances:    acc.avances    + r.avances,
        mensualite: acc.mensualite + r.mensualite,
        net:        acc.net        + r.totalNet,
      };
    }, { salBase:0, presence:0, montBase:0, montBonus:0, hs:0, montHS:0,
         feries:0, montAbs:0, montMal:0, avances:0, mensualite:0, net:0 });

    tableRows.push([
      'TOTAL', '',
      fmt(T.salBase), '-',
      T.presence.toFixed(1), fmt(T.montBase),
      fmt(T.montBonus),
      T.hs.toFixed(2), fmt(T.montHS),
      T.feries.toFixed(1),
      fmt(T.montAbs), fmt(T.montMal), fmt(T.avances),
      T.mensualite > 0 ? fmt(T.mensualite) : '-',
      fmt(T.net),
    ]);

    autoTable(doc, {
      startY: 48,
      head,
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2.5, textColor: [30, 30, 30] },
      headStyles: {
        fillColor: [20, 33, 61], textColor: [252, 163, 17],
        fontStyle: 'bold', fontSize: 7, halign: 'center',
        lineWidth: 0.3, lineColor: [20, 33, 61],
      },
      bodyStyles: { halign: 'center', lineWidth: 0.3, lineColor: [210, 210, 210] },
      columnStyles: {
        0:  { halign: 'left', fontStyle: 'bold' },
        1:  { halign: 'left', textColor: [80, 80, 200] },
        13: { textColor: [130, 60, 180] },            // PRET — violet
        14: { fontStyle: 'bold', textColor: [5, 150, 105] }, // TOTAL NET — vert
      },
      didParseCell: (hookData) => {
        const isTotal = hookData.row.index === tableRows.length - 1;
        if (isTotal) {
          hookData.cell.styles.fillColor = [235, 235, 235];
          hookData.cell.styles.fontStyle = 'bold';
        }
        // Déductions en rouge discret (ABSENCES=10, MALADIE=11, AVANCES=12, PRET=13)
        if ([10, 11, 12, 13].includes(hookData.column.index) && hookData.section === 'body' && !isTotal) {
          if (hookData.cell.text[0] !== '-')
            hookData.cell.styles.textColor = hookData.column.index === 13 ? [130, 60, 180] : [160, 40, 40];
        }
        if (hookData.column.index === 14 && hookData.section === 'body' && !isTotal) {
          const val = parseFloat(hookData.cell.text[0] || '1');
          if (val === 0) hookData.cell.styles.textColor = [180, 0, 0];
        }
      },
      alternateRowStyles: { fillColor: [250, 250, 252] },
    });

    // ── SIGNATURE & STAMP ────────────────────────────────────────────────────
    const finalY = doc.lastAutoTable.finalY + 16;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text("Signature du Responsable", 30, finalY, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.text(".................................", 30, finalY + 10, { align: 'center' });

    const stampX = pageW - 80;
    doc.setFont("helvetica", "bold");
    doc.text("Cachet de l'Entreprise", stampX + 25, finalY, { align: 'center' });
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.4);
    doc.rect(stampX, finalY + 4, 50, 22);

    doc.save(`Recap_Paie_${monthNames[month - 1]}_${year}.pdf`);
  },

  /**
   * Generates a detailed Individual Payslip (Portrait A4).
   *
   * @param {boolean}     hasBonus  - Bonus mérite 1×TJ
   * @param {Object|null} pretActif - { id, mensualite, solde_restant } or null
   */
  generatePayslip: async (month, year, employe, pointages, avances, hasBonus = false, pretActif = null) => {
    const logo = await loadLogo();
    const doc  = new jsPDF('p', 'mm', 'a4');

    // ── Calcul paie (source unique de vérité) ────────────────────────────────
    const p = payrollCalculator.calculateMonthly(employe, pointages, avances, hasBonus, pretActif);

    const MONTHS  = ["Janvier","Février","Mars","Avril","Mai","Juin",
                     "Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
    const pageW   = doc.internal.pageSize.getWidth();   // 210 mm (A4)
    const M       = 14;                                  // margin
    const W       = pageW - M * 2;                       // content width
    const fmt3    = v => parseFloat(v || 0).toFixed(3);
    const mPad    = String(month).padStart(2, '0');
    const lastDay = new Date(year, month, 0).getDate();

    // Noms : fallbacks explicites pour éviter "undefined"
    const empNom    = String(employe.nom    || '').toUpperCase() || '—';
    const empPrenom = String(employe.prenom || '').toUpperCase() || '—';
    const fullName  = `${empNom} ${empPrenom}`.trim();

    // ── 1. HEADER BAND ────────────────────────────────────────────────────────
    const hY = 8;
    const hH = 44;
    doc.setFillColor(...C.navyBg);
    doc.rect(M, hY, W, hH, 'F');

    // ── Logo dans un cercle (blanc + bordure dorée) ───────────────────────────
    const lx = M + 22;        // centre X
    const ly = hY + hH / 2;   // centre Y
    const lr = 18;             // rayon

    // Cercle blanc + bordure dorée (fond blanc pour que les couleurs du logo ressortent)
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...C.gold);
    doc.setLineWidth(1.2);
    doc.circle(lx, ly, lr, 'FD');

    // Logo inscrit dans le cercle
    if (logo) {
      const side = lr * Math.SQRT2 * 0.92;
      doc.addImage(logo, 'PNG', lx - side / 2, ly - side / 2, side, side);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...C.navyBg);
      doc.text('KL',    lx, ly - 2, { align: 'center' });
      doc.text('BETON', lx, ly + 5, { align: 'center' });
    }

    // ── Titre centré ─────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...C.gold);
    doc.text('KL BETON', pageW / 2, hY + 11, { align: 'center' });

    // "BULLETIN INDIVIDUEL DE PAIE — NOM PRÉNOM" sur une ligne, blanc
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text(
      `BULLETIN INDIVIDUEL DE PAIE  —  ${fullName}`,
      pageW / 2, hY + 20, { align: 'center' }
    );

    // Numéro + période
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 220);
    doc.text(`Réf : FP-${year}-${mPad}  ·  ${MONTHS[month - 1]} ${year}`, pageW / 2, hY + 28, { align: 'center' });

    // Coordonnées société (droite)
    const rx = M + W - 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.gold);
    doc.text('000, RTE MARMATA ELMODOU', rx, hY + 10, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 220);
    ['Gabes - 6022 - TUNISIE',
     'TEL : 29 239 001 / 28 333 595',
     'FAX : 75 271 004',
     'Email : klbetonconstruction@gmail.com',
    ].forEach((ln, i) => doc.text(ln, rx, hY + 16 + i * 4.5, { align: 'right' }));

    // ── 2. INFO BOXES (Période | Collaborateur) ───────────────────────────────
    const iY = hY + hH + 6;
    const iH = 18;

    // Période
    doc.setDrawColor(...C.navyBg);
    doc.setLineWidth(0.4);
    doc.rect(M, iY, 80, iH);
    doc.setFillColor(240, 243, 250);
    doc.rect(M, iY, 80, iH, 'F');
    doc.setDrawColor(...C.navyBg);
    doc.setLineWidth(0.4);
    doc.rect(M, iY, 80, iH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.navyBg);
    doc.text('PERIODE :', M + 3, iY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...C.darkText);
    doc.text(`Du : 01/${mPad}/${year}`, M + 3, iY + 12);
    doc.text(`Au : ${lastDay}/${mPad}/${year}`, M + 3, iY + 17);

    // Collaborateur
    const cx = M + 86;
    const cw = W - 86;
    doc.setFillColor(240, 243, 250);
    doc.rect(cx, iY, cw, iH, 'F');
    doc.setDrawColor(...C.navyBg);
    doc.setLineWidth(0.4);
    doc.rect(cx, iY, cw, iH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.navyBg);
    doc.text('COLLABORATEUR :', cx + 3, iY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.darkText);
    doc.text(fullName, cx + 40, iY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...C.midText);
    doc.text(
      `Poste : ${employe.poste || '—'}     Matricule : ${employe.employee_id || 'N/A'}`,
      cx + 3, iY + 14
    );

    // ── 3. TABLE PRINCIPALE ───────────────────────────────────────────────────
    const dailyRate = parseFloat(p.tauxJ);
    const hsRate    = parseFloat(p.tauxH_HS);
    const presence  = p.presence;
    const hs        = p.hs;
    const feries    = p.feries;
    const absences  = p.absences;
    const maladie   = p.maladie;
    const avancesV  = parseFloat(p.avances);
    const pretV     = parseFloat(p.mensualitePret);

    const GAIN_ROWS = new Set([
      'Jours Travailles (Presence)',
      'Bonus Presence (1 TJ)',
      'Jours Feries',
      'Heures Supplementaires (100%)',
    ]);
    const DED_ROWS = new Set([
      'Absences (Deduction)',
      'Maladie (Deduction)',
      'Avances sur salaire',
      'Remboursement Pret',
    ]);

    const tableBody = [
      ['Jours Travailles (Presence)', 'JOURS',   presence.toFixed(1), fmt3(dailyRate), fmt3(p.salairePresence)],
    ];
    if (p.hasBonus) {
      tableBody.push(['Bonus Presence (1 TJ)', 'JOURS', '1.0', fmt3(dailyRate), fmt3(p.montantBonus)]);
    }
    tableBody.push(
      ['Jours Feries',                  'JOURS',  feries.toFixed(1),   fmt3(dailyRate), fmt3(p.montantFeries)],
      ['Heures Supplementaires (100%)', 'HEURES', hs.toFixed(2),       fmt3(hsRate),    fmt3(p.montantHS)],
      ['Absences (Deduction)',          'JOURS',  absences.toFixed(1), `- ${fmt3(dailyRate)}`, `- ${fmt3(p.deductionAbsences)}`],
      ['Maladie (Deduction)',           'JOURS',  maladie.toFixed(1),  `- ${fmt3(dailyRate)}`, `- ${fmt3(p.deductionMaladie)}`],
      ['Avances sur salaire',           'AVANCES','',                  '',              `- ${fmt3(avancesV)}`],
    );
    if (pretV > 0) {
      tableBody.push(['Remboursement Pret', 'MENSUAL', '', '', `- ${fmt3(pretV)}`]);
    }

    autoTable(doc, {
      startY: iY + iH + 6,
      head: [['DESIGNATION', 'UNITE', 'QTE', 'P.U. (TND)', 'TOTAL (TND)']],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 8.5, cellPadding: 4,
        textColor: C.darkText, lineColor: [210, 215, 230], lineWidth: 0.3,
      },
      headStyles: {
        fillColor: C.navyBg, textColor: C.gold,
        fontStyle: 'bold', fontSize: 8.5, halign: 'center',
        lineWidth: 0.4, lineColor: C.navyBg,
      },
      bodyStyles: { halign: 'center' },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', cellWidth: 78 },
        1: { cellWidth: 22 },
        2: { cellWidth: 18 },
        3: { cellWidth: 32 },
        4: { fontStyle: 'bold', cellWidth: 32 },
      },
      alternateRowStyles: { fillColor: C.lightBg },
      didParseCell: (hd) => {
        if (hd.section !== 'body') return;
        const label = hd.row.cells[0]?.text?.[0] || '';
        if (DED_ROWS.has(label)) {
          hd.cell.styles.textColor = C.red;
        } else if (GAIN_ROWS.has(label)) {
          hd.cell.styles.textColor = C.darkText;
        }
      },
    });

    // ── 4. BOÎTE RÉCAPITULATIF ────────────────────────────────────────────────
    const tblEnd = doc.lastAutoTable.finalY;
    const sY     = tblEnd + 8;
    const sX     = M + W - 96;
    const sW     = 96;

    const gainsTotal = parseFloat(p.brut);
    const netVal     = parseFloat(p.net);
    const detteVal   = parseFloat(p.dette);
    const deductTotal = parseFloat(p.deductionAbsences)
                      + parseFloat(p.deductionMaladie)
                      + avancesV + pretV;

    // Fond blanc + bordure
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...C.navyBg);
    doc.setLineWidth(0.5);

    // Ligne 1 — Gains
    doc.rect(sX, sY, sW, 11, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.midText);
    doc.text('TOTAL DES GAINS :', sX + 4, sY + 7.5);
    doc.text(`${fmt3(gainsTotal)} TND`, sX + sW - 4, sY + 7.5, { align: 'right' });

    // Ligne 2 — Déductions
    doc.setFillColor(255, 245, 245);
    doc.rect(sX, sY + 11, sW, 11, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.red);
    doc.text('TOTAL DES DEDUCTIONS :', sX + 4, sY + 18.5);
    doc.text(`${fmt3(deductTotal)} TND`, sX + sW - 4, sY + 18.5, { align: 'right' });

    // Ligne 3 — NET À PAYER (fond bleu nuit, texte doré)
    doc.setFillColor(...C.navyBg);
    doc.rect(sX, sY + 22, sW, 14, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...C.gold);
    doc.text('NET A PAYER :', sX + 4, sY + 31);
    doc.text(`${fmt3(netVal)} TND`, sX + sW - 4, sY + 31, { align: 'right' });

    let cursorY = sY + 36;

    // Reste à récupérer (si dette)
    if (detteVal > 0) {
      doc.setFillColor(255, 235, 235);
      doc.setDrawColor(...C.red);
      doc.setLineWidth(0.4);
      doc.rect(sX, cursorY, sW, 10, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...C.red);
      doc.text('RESTE A RECUPERER :', sX + 4, cursorY + 7);
      doc.text(`${fmt3(detteVal)} TND`, sX + sW - 4, cursorY + 7, { align: 'right' });
      cursorY += 12;
    }

    // Solde restant du prêt (bien visible, fond violet clair)
    if (pretV > 0 && p.soldePretApres !== null) {
      doc.setFillColor(245, 240, 255);
      doc.setDrawColor(...C.purple);
      doc.setLineWidth(0.5);
      doc.rect(sX, cursorY, sW, 12, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...C.purple);
      doc.text('SOLDE RESTANT DU PRET :', sX + 4, cursorY + 8.5);
      doc.text(`${parseFloat(p.soldePretApres).toFixed(3)} TND`, sX + sW - 4, cursorY + 8.5, { align: 'right' });
      cursorY += 14;
    }

    // ── 5. FOOTER (signatures) ────────────────────────────────────────────────
    const fY = cursorY + 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...C.midText);
    doc.text("Signature du Beneficiaire", M, fY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(".....................................", M, fY + 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text("Cachet de l'Entreprise", sX + sW / 2, fY, { align: 'center' });
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.rect(sX, fY + 3, sW, 22);

    // Pied de page
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(160, 160, 175);
    const pgH = doc.internal.pageSize.getHeight();
    doc.text('Document confidentiel — KL BETON CONSTRUCTION', M, pgH - 8);
    doc.text('SYSTEME KL BETON V4', M + W, pgH - 8, { align: 'right' });

    const safeName = `${employe.nom || 'Employe'}_${employe.prenom || ''}`.trim().replace(/\s+/g, '_');
    doc.save(`Bulletin_Individuel_${safeName}_${mPad}_${year}.pdf`);
  },

  /**
   * Audit report — delegated to chefAuditPdfService (kept for back-compat)
   */
  generateAuditReport: (month, year, data, chefNom = 'Chef Centrale') => {
    const doc    = new jsPDF('p', 'mm', 'a4');
    const pageW  = doc.internal.pageSize.getWidth();
    const pageH  = doc.internal.pageSize.getHeight();
    const margin = 14;
    const monthNames = ["Janvier","Fevrier","Mars","Avril","Mai","Juin",
      "Juillet","Aout","Septembre","Octobre","Novembre","Decembre"];
    const monthLabel   = monthNames[month - 1];
    const generatedAt  = new Date().toLocaleString('fr-FR');
    const generateId   = `ALPHA-${Math.floor(100000 + Math.random() * 900000)}`;

    const localizeStatus = (s) => ({
      PRESENT:'PRESENT', ABSENT:'ABSENT', MALADIE:'MALADIE', FERIE:'FERIE', CONGE:'CONGE',
    }[s] || s || '-');

    const barH = 22;
    doc.setFillColor(20, 33, 61);
    doc.rect(0, 0, pageW, barH, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(252, 163, 17);
    doc.text("KL BETON", margin, 13);
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("RAPPORT DE CONFORMITE JOURNALIER", margin + 40, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`PERIODE: ${month}/${year}`,    margin,         barH + 9);
    doc.text(`RESPONSABLE: ${chefNom}`,       margin,         barH + 16);
    doc.text(`GENERATE_ID: ${generateId}`,    pageW - margin, barH + 9,  { align: 'right' });
    doc.text(`Genere le : ${generatedAt}`,    pageW - margin, barH + 16, { align: 'right' });
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, barH + 20, pageW - margin, barH + 20);

    const tableRows = data.map(item => {
      const nom = (item.nom && item.prenom)
        ? `${item.nom} ${item.prenom}`
        : `${item.employe_nom || ''} ${item.employe_prenom || ''}`.trim() || 'NOM INCONNU';
      const audit = item.audit_result || (item.statut === 'ABSENT' && !item.note ? 'ERREUR' : 'OK');
      return [nom.toUpperCase(), localizeStatus(item.statut), item.heures_supp ? `${item.heures_supp}H` : '0H', item.note || '-', audit];
    });

    autoTable(doc, {
      startY: barH + 24,
      head: [['NOM', 'STATUT', 'HS', 'NOTES', 'AUDIT']],
      body: tableRows,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3, textColor: [30, 30, 30] },
      headStyles: { fillColor: [20, 33, 61], textColor: [252, 163, 17], fontStyle: 'bold', fontSize: 9, halign: 'center' },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold', cellWidth: 58 },
        1: { halign: 'center', cellWidth: 28 },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'left' },
        4: { halign: 'center', cellWidth: 22 },
      },
      didParseCell: (h) => {
        if (h.section !== 'body') return;
        if (h.column.index === 4) {
          const v = h.cell.text[0];
          if (v === 'ERREUR') { h.cell.styles.textColor = [180, 0, 0]; h.cell.styles.fontStyle = 'bold'; }
          else if (v === 'OK') h.cell.styles.textColor = [0, 150, 0];
        }
        if (h.column.index === 1) {
          const v = h.cell.text[0];
          if      (v === 'PRESENT') h.cell.styles.textColor = [0, 130, 0];
          else if (v === 'ABSENT')  h.cell.styles.textColor = [180, 0, 0];
          else if (v === 'MALADIE') h.cell.styles.textColor = [120, 0, 180];
          else if (v === 'FERIE')   h.cell.styles.textColor = [0, 80, 180];
          else if (v === 'CONGE')   h.cell.styles.textColor = [180, 100, 0];
        }
      },
      didDrawPage: (h) => {
        doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
        doc.line(margin, pageH - 16, pageW - margin, pageH - 16);
        doc.setFont("helvetica", "italic"); doc.setFontSize(7); doc.setTextColor(120, 120, 120);
        doc.text("Document confidentiel KL BETON", margin, pageH - 10);
        doc.text(`Page ${h.pageNumber}`, pageW / 2, pageH - 10, { align: 'center' });
        doc.text("SYSTEME KL BETON V4", pageW - margin, pageH - 10, { align: 'right' });
      },
    });

    doc.save(`Audit_Conformite_${monthLabel}_${year}.pdf`);
  },
};
