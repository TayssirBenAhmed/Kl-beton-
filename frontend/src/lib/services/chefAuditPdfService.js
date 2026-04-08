import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

// Save your logo to: frontend/src/assets/logo-kl-beton.png
let _logoSrc = null;
try { _logoSrc = new URL('../../assets/logo-kl-beton.png', import.meta.url).href; } catch { /* no logo */ }

const _loadLogo = () => new Promise(resolve => {
    if (!_logoSrc) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        try {
            const c = document.createElement('canvas');
            c.width = img.naturalWidth; c.height = img.naturalHeight;
            c.getContext('2d').drawImage(img, 0, 0);
            resolve(c.toDataURL('image/png'));
        } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = _logoSrc;
});

/**
 * Generates a professional Audit PDF for the Chef Centrale.
 * @param {Array} data - The array of audited pointage objects.
 * @param {Object} metadata - Month, Year, ChefName, Language.
 */
export const generateChefAuditPDF = async (data, metadata) => {
    const { month, year, chefName, language } = metadata;
    const isArabic = language === 'ar';

    const logo = await _loadLogo().catch(() => null);

    try {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
            putOnlyUsedFonts: true
        });

        // 1. Header with Industrial Style
        doc.setFillColor(20, 33, 61);
        doc.rect(0, 0, 210, 40, 'F');

        // Logo inside the blue bar
        if (logo) {
            doc.addImage(logo, 'PNG', 5, 4, 32, 32);
        } else {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(252, 163, 17);
            doc.text('KL BETON', 20, 22, { align: 'center' });
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(252, 163, 17);
        doc.text('KL BETON', logo ? 50 : 45, 16);
        doc.setTextColor(255, 255, 255);
        const title = isArabic ? 'تقرير التدقيق اليومي' : 'RAPPORT DE CONFORMITE JOURNALIER';
        const titleX = isArabic ? 195 : 105;
        doc.text(title, titleX, 28, { align: isArabic ? 'right' : 'center' });

        // 2. Metadata Section
        doc.setTextColor(20, 33, 61);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const dateLabel = isArabic ? `الشهر: ${month} / السنة: ${year}` : `PÉRIODE: ${month}/${year}`;
        doc.text(dateLabel, 15, 50);
        
        const chefLabel = isArabic ? `المسؤول: ${chefName}` : `RESPONSABLE: ${chefName}`;
        doc.text(chefLabel, 15, 55);


        // 3. Table Structure
        const localizeStatus = (statut) => ({
            PRESENT: 'PRÉSENT',
            ABSENT:  'ABSENT',
            MALADIE: 'MALADIE',
            FERIE:   'FÉRIÉ',
            CONGE:   'CONGÉ',
        }[statut] || statut || '—');

        // Formate "YYYY-MM-DD" → "DD/MM/YYYY"
        const formatDate = (raw) => {
            if (!raw) return '—';
            const parts = raw.split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
            return raw;
        };

        const tableColumn = isArabic
            ? ['الحالة', 'ملاحظة', 'ساعات إضافية', 'الوضعية', 'التاريخ', 'الاسم']
            : ['NOM', 'DATE', 'STATUT', 'HS', 'NOTES', 'AUDIT'];

        const tableRows = data.map(item => {
            // Résolution robuste du nom (jointure SQL absente → enrichi dans ChefAudit)
            const nomComplet = (item.employe_nom || item.nom)
                ? `${item.employe_nom || item.nom || ''} ${item.employe_prenom || item.prenom || ''}`.trim()
                : 'NOM INCONNU';

            const auditLabel = item.audit?.type || (item.statut === 'ABSENT' && !item.note ? 'ERREUR' : 'OK');

            const row = [
                nomComplet.toUpperCase(),
                formatDate(item.date),
                isArabic ? (item.statut || '—') : localizeStatus(item.statut),
                item.heures_supp != null ? `${item.heures_supp}H` : '0H',
                item.note || '—',
                auditLabel,
            ];
            return isArabic ? row.reverse() : row;
        });

        const pageH = doc.internal.pageSize.getHeight();

        autoTable(doc, {
            startY: 65,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            styles: {
                fontSize:    9,
                cellPadding: 3,
                textColor:   [30, 30, 30],
                lineColor:   [210, 210, 210],
                lineWidth:   0.2,
            },
            headStyles: {
                fillColor:  [20, 33, 61],
                textColor:  [252, 163, 17],
                fontSize:   9,
                fontStyle:  'bold',
                halign:     isArabic ? 'right' : 'center',
                lineWidth:  0.3,
                lineColor:  [20, 33, 61],
            },
            columnStyles: {
                0: { halign: 'left',   fontStyle: 'bold', cellWidth: 50 }, // NOM
                1: { halign: 'center', cellWidth: 24 },                     // DATE
                2: { halign: 'center', cellWidth: 26 },                     // STATUT
                3: { halign: 'center', cellWidth: 15 },                     // HS
                4: { halign: 'left' },                                       // NOTES (auto)
                5: { halign: 'center', cellWidth: 20 },                     // AUDIT
            },
            didParseCell: (hookData) => {
                if (hookData.section !== 'body') return;
                // Colonne AUDIT (index 5) : ERREUR rouge gras, OK vert
                if (hookData.column.index === 5) {
                    const val = hookData.cell.text[0];
                    if (val === 'ERREUR') {
                        hookData.cell.styles.textColor = [180, 0, 0];
                        hookData.cell.styles.fontStyle = 'bold';
                    } else if (val === 'OK') {
                        hookData.cell.styles.textColor = [0, 150, 0];
                    }
                }
                // Colonne STATUT (index 2) : couleur par statut
                if (hookData.column.index === 2) {
                    const val = hookData.cell.text[0];
                    if      (val === 'PRÉSENT') hookData.cell.styles.textColor = [0,   130, 0];
                    else if (val === 'ABSENT')  hookData.cell.styles.textColor = [180, 0,   0];
                    else if (val === 'MALADIE') hookData.cell.styles.textColor = [120, 0,   180];
                    else if (val === 'FÉRIÉ')   hookData.cell.styles.textColor = [0,   80,  180];
                    else if (val === 'CONGÉ')   hookData.cell.styles.textColor = [180, 100, 0];
                }
                // Colonne DATE (index 1) : gris discret
                if (hookData.column.index === 1) {
                    hookData.cell.styles.textColor = [100, 100, 100];
                }
            },
            didDrawPage: (hookData) => {
                const currentPage = hookData.pageNumber;
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.3);
                doc.line(15, pageH - 16, 195, pageH - 16);
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(7);
                doc.setTextColor(120, 120, 120);
                doc.text('Document confidentiel KL BÉTON', 15, pageH - 10);
                doc.text(`Page ${currentPage}`, 105, pageH - 10, { align: 'center' });
                doc.text('DOCUMENT GÉNÉRÉ PAR LE SYSTÈME KL BETON ', 195, pageH - 10, { align: 'right' });
            },
        });

        // 4. Signature Section
        const finalY = (doc).lastAutoTable.finalY + 20;
        doc.setFontSize(10);
        doc.setTextColor(20, 33, 61);
        doc.setFont('helvetica', 'bold');
        
        const signLabel = isArabic ? 'توقيع رئيس المركز' : 'SIGNATURE CHEF CENTRALE';
        doc.text(signLabel, 150, finalY);
        
        doc.setDrawColor(20, 33, 61);
        doc.line(140, finalY + 10, 200, finalY + 10);
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');

        // Save
        const fileName = `Audit_${month}_${year}_${Date.now()}.pdf`;
        doc.save(fileName);
        
        return true;
    } catch (error) {
        console.error('PDF Generation Error:', error);
        throw error;
    }
};
