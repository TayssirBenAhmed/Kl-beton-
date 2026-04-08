import { useState, useEffect, useMemo } from 'react';
import { useEmployeStore } from '../../stores/employeStore';
import { usePointageStore } from '../../stores/pointageStore';
import { useAvanceStore } from '../../stores/avanceStore';
import { usePretStore } from '../../stores/pretStore';
import { useMeritStore } from '../../stores/meritStore';
import { Printer, Search, FileSpreadsheet, ShieldCheck, Zap, Activity, HardHat, TrendingUp } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { payrollCalculator } from '../../utils/payrollCalculator';
import { payrollPdfService } from '../../lib/services/payrollPdfService';

export const AdminRapports = () => {
   const { employes, fetchAll: fetchEmployes } = useEmployeStore();
   const { pointagesMois, fetchByMonth } = usePointageStore();
   const { avances, fetchAll: fetchAvances } = useAvanceStore();
   const { prets, fetchAll: fetchPrets } = usePretStore();
   const { meritMap, fetchMois, toggle: toggleMerit } = useMeritStore();

   const [search, setSearch] = useState('');
   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

   useEffect(() => {
      fetchEmployes();
      fetchByMonth(selectedMonth, selectedYear);
      fetchAvances();
      fetchPrets();
      fetchMois(selectedMonth, selectedYear);   // Load persisted merit from SQLite
   }, [fetchEmployes, fetchByMonth, fetchAvances, fetchPrets, fetchMois, selectedMonth, selectedYear]);

   const reportData = useMemo(() => {
      return employes.map(emp => {
         const empPointages = pointagesMois.filter(p => p.employe_id === emp.id);
         const empAvances   = avances.filter(a => {
            if (a.employe_id !== emp.id || a.statut !== 'APPROVED') return false;
            const d = new Date(a.date);
            return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
         });
         const hasBonus  = meritMap[emp.id] || false;
         const pretActif = prets.find(pr => pr.employe_id === emp.id && pr.statut === 'ACTIF') || null;
         const payroll   = payrollCalculator.calculateMonthly(emp, empPointages, empAvances, hasBonus, pretActif);
         return { ...emp, payroll, hasBonus, pretActif, empPointages, empAvances };
      });
   }, [employes, pointagesMois, avances, prets, selectedMonth, selectedYear, meritMap]);

   const filtered = reportData.filter(e =>
      `${e.nom} ${e.prenom}`.toLowerCase().includes(search.toLowerCase()) ||
      (e.employee_id && e.employee_id.toLowerCase().includes(search.toLowerCase()))
   );

   const totals = useMemo(() => {
      return reportData.reduce((acc, item) => ({
         brut:    acc.brut    + parseFloat(item.payroll.brut),
         net:     acc.net     + parseFloat(item.payroll.net),
         avances: acc.avances + parseFloat(item.payroll.avances),
         hs:      acc.hs      + parseFloat(item.payroll.hs),
      }), { brut: 0, net: 0, avances: 0, hs: 0 });
   }, [reportData]);

   const handleGenerateRecap = async () => {
      if (reportData.length === 0) return toast.error("Aucune donnée à exporter");
      await payrollPdfService.generateGlobalRecap(selectedMonth, selectedYear, reportData);
      toast.success("Récapitulatif global généré");
   };

   const handleGeneratePayslip = async (emp) => {
      await payrollPdfService.generatePayslip(
         selectedMonth, selectedYear, emp,
         emp.empPointages, emp.empAvances,
         emp.hasBonus || false,
         emp.pretActif || null
      );
      // Déduire le montant effectivement prélevé (peut être < mensualite si salaire insuffisant)
      const montantEffectif = parseFloat(emp.payroll.mensualitePret || 0);
      if (emp.pretActif && montantEffectif > 0) {
         await usePretStore.getState().rembourser(emp.pretActif.id, montantEffectif);
      }
      toast.success(`Fiche de paie générée pour ${emp.nom}`);
   };

   const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

   return (
      <div className="relative p-6" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
         {/* HEADER */}
         <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div>
               <p className="font-medium mb-1" style={{ fontSize: '12px', color: '#94A3B8' }}>KL Béton · Rapports de Paie</p>
               <h1 className="font-bold" style={{ fontSize: '24px', color: '#1E293B' }}>États de <span style={{ color: '#1E40AF' }}>Paie</span></h1>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
               <div className="flex flex-col px-3" style={{ borderRight: '1px solid #F1F5F9' }}>
                  <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>Période</span>
                  <select className="bg-transparent font-semibold outline-none cursor-pointer" style={{ fontSize: '15px', color: '#1E293B' }}
                     value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}>
                     {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
               </div>
               <div className="flex flex-col px-3">
                  <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>Année</span>
                  <select className="bg-transparent font-semibold outline-none cursor-pointer" style={{ fontSize: '15px', color: '#1E293B' }}
                     value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}>
                     {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
               </div>
               <button onClick={handleGenerateRecap}
                  className="h-10 px-5 rounded-lg font-semibold flex items-center gap-2 transition-all active:scale-[0.98]"
                  style={{ backgroundColor: '#1E40AF', color: '#FFFFFF', fontSize: '13px' }}>
                  <FileSpreadsheet size={16} /> Générer récap global
               </button>
            </div>
         </div>

         {/* KPI */}
         <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
               { label: 'Brut mensuel total',   val: totals.brut.toFixed(3),    color: '#1E293B', icon: TrendingUp },
               { label: 'Total Avances déduit', val: totals.avances.toFixed(3), color: '#DC2626', icon: ShieldCheck },
               { label: 'Total H. Supp (h)',    val: totals.hs.toFixed(1),      color: '#D97706', icon: Activity },
               { label: 'Net global à payer',   val: totals.net.toFixed(3),     color: '#059669', icon: Zap },
            ].map((k, i) => (
               <div key={i} className="rounded-xl p-5 relative overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                  <p className="font-medium mb-2" style={{ fontSize: '12px', color: '#94A3B8' }}>{k.label}</p>
                  <div className="flex items-baseline gap-1.5">
                     <span className="font-bold" style={{ fontSize: '22px', color: k.color }}>{k.val}</span>
                     <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>TND</span>
                  </div>
               </div>
            ))}
         </div>

         {/* ── RECAP TABLE ─────────────────────────────────────────────────────── */}
         <div className="rounded-xl overflow-hidden mb-8" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
               <div>
                  <h3 className="font-bold" style={{ fontSize: '15px', color: '#1E293B' }}>Tableau Récapitulatif de Paie</h3>
                  <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                     {MONTHS[selectedMonth - 1]} {selectedYear} · (Présence × TJ) + Bonus + HS + Fériés − Absences − Maladie − Avances − Prêt
                  </p>
               </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                     <tr style={{ backgroundColor: '#142141' }}>
                        {[
                           { label: 'Nom & Prénom',  align: 'left'   },
                           { label: 'Fonction',      align: 'left'   },
                           { label: 'Sal. Base',     align: 'right'  },
                           { label: 'TJ',            align: 'right'  },
                           { label: 'J. Présence',   align: 'right'  },
                           { label: 'Mont. Base',    align: 'right'  },
                           { label: '★ Mérite',      align: 'center' },
                           { label: 'Bonus (TJ)',    align: 'right'  },
                           { label: 'H. Supp',       align: 'right'  },
                           { label: 'Mont. HS',      align: 'right'  },
                           { label: 'J. Fériés',     align: 'right'  },
                           { label: '− Absences',    align: 'right'  },
                           { label: '− Maladie',     align: 'right'  },
                           { label: '− Avances',     align: 'right'  },
                           { label: '− Prêt',        align: 'right'  },
                           { label: 'TOTAL NET',     align: 'right'  },
                        ].map(col => (
                           <th key={col.label} style={{ padding: '10px 14px', textAlign: col.align, color: '#FCA311', fontWeight: 700, fontSize: '11px', whiteSpace: 'nowrap' }}>
                              {col.label}
                           </th>
                        ))}
                     </tr>
                  </thead>
                  <tbody>
                     {reportData.map((emp, idx) => {
                        const p     = emp.payroll;
                        const tj    = parseFloat(p.tauxJ             || 0);
                        const base  = parseFloat(p.salairePresence   || 0);
                        const bonus = parseFloat(p.montantBonus      || 0);
                        const hs    = parseFloat(p.montantHS         || 0);
                        const abs   = parseFloat(p.deductionAbsences || 0);
                        const mal   = parseFloat(p.deductionMaladie  || 0);
                        const avs   = parseFloat(p.avances           || 0);
                        const pret  = parseFloat(p.mensualitePret    || 0);
                        const net   = parseFloat(p.net               || 0);
                        return (
                           <tr key={emp.id} style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                              <td style={{ padding: '8px 14px', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' }}>{emp.nom} {emp.prenom}</td>
                              <td style={{ padding: '8px 14px', color: '#5B72AD', whiteSpace: 'nowrap' }}>{emp.poste || '—'}</td>
                              <td style={{ padding: '8px 14px', textAlign: 'right', color: '#64748B' }}>{parseFloat(emp.salaire_base || 0).toFixed(3)}</td>
                              <td style={{ padding: '8px 14px', textAlign: 'right', color: '#64748B' }}>{tj.toFixed(3)}</td>
                              <td style={{ padding: '8px 14px', textAlign: 'right', color: '#059669', fontWeight: 600 }}>{parseFloat(p.presence || 0).toFixed(1)}</td>
                              <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 600, color: '#1E293B' }}>{base.toFixed(3)}</td>
                              {/* Mérite checkbox */}
                              <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                 <input
                                    type="checkbox"
                                    checked={emp.hasBonus}
                                    onChange={e => toggleMerit(emp.id, selectedMonth, selectedYear, e.target.checked)}
                                    title={emp.hasBonus ? 'Retirer le bonus' : 'Attribuer le bonus (1 × TJ)'}
                                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#1E40AF' }}
                                 />
                              </td>
                              <td style={{ padding: '8px 14px', textAlign: 'right', color: emp.hasBonus ? '#059669' : '#94A3B8', fontWeight: emp.hasBonus ? 600 : 400 }}>{bonus.toFixed(3)}</td>
                              <td style={{ padding: '8px 14px', textAlign: 'right', color: '#1E40AF' }}>{parseFloat(p.hs || 0).toFixed(2)}</td>
                              <td style={{ padding: '8px 14px', textAlign: 'right', color: '#1E40AF' }}>{hs.toFixed(3)}</td>
                              <td style={{ padding: '8px 14px', textAlign: 'right', color: '#D97706' }}>{parseFloat(p.feries || 0).toFixed(1)}</td>
                              <td style={{ padding: '8px 14px', textAlign: 'right', color: '#DC2626', fontWeight: 600 }}>−{abs.toFixed(3)}</td>
                              <td style={{ padding: '8px 14px', textAlign: 'right', color: '#7C3AED', fontWeight: 600 }}>−{mal.toFixed(3)}</td>
                              <td style={{ padding: '8px 14px', textAlign: 'right', color: '#DC2626' }}>−{avs.toFixed(3)}</td>
                              <td style={{ padding: '8px 14px', textAlign: 'right', color: pret > 0 ? '#7C3AED' : '#94A3B8', fontWeight: pret > 0 ? 600 : 400 }}>
                                 {pret > 0 ? `−${pret.toFixed(3)}` : '—'}
                              </td>
                              <td style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 800, fontSize: '13px', color: net > 0 ? '#059669' : '#DC2626' }}>{net.toFixed(3)}</td>
                           </tr>
                        );
                     })}
                  </tbody>
                  <tfoot>
                     {(() => {
                        const T = reportData.reduce((acc, emp) => {
                           const p = emp.payroll;
                           return {
                              salBase:   acc.salBase   + parseFloat(emp.salaire_base   || 0),
                              montBase:  acc.montBase  + parseFloat(p.salairePresence  || 0),
                              bonusTJ:   acc.bonusTJ   + parseFloat(p.montantBonus     || 0),
                              hs:        acc.hs        + parseFloat(p.hs               || 0),
                              montHS:    acc.montHS    + parseFloat(p.montantHS        || 0),
                              feries:    acc.feries    + parseFloat(p.feries           || 0),
                              deductAbs: acc.deductAbs + parseFloat(p.deductionAbsences|| 0),
                              deductMal: acc.deductMal + parseFloat(p.deductionMaladie || 0),
                              avances:   acc.avances   + parseFloat(p.avances          || 0),
                              pret:      acc.pret      + parseFloat(p.mensualitePret   || 0),
                              net:       acc.net       + parseFloat(p.net              || 0),
                           };
                        }, { salBase:0, montBase:0, bonusTJ:0, hs:0, montHS:0, feries:0, deductAbs:0, deductMal:0, avances:0, pret:0, net:0 });
                        return (
                           <tr style={{ backgroundColor: '#F0F4F8', borderTop: '2px solid #CBD5E1' }}>
                              <td colSpan={2} style={{ padding: '10px 14px', fontWeight: 800, fontSize: '12px', color: '#1E293B' }}>TOTAL</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#1E293B' }}>{T.salBase.toFixed(3)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', color: '#94A3B8' }}>—</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', color: '#94A3B8' }}>—</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#1E293B' }}>{T.montBase.toFixed(3)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'center', color: '#94A3B8' }}>—</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>{T.bonusTJ.toFixed(3)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', color: '#94A3B8' }}>—</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#1E40AF' }}>{T.montHS.toFixed(3)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', color: '#94A3B8' }}>—</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>−{T.deductAbs.toFixed(3)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#7C3AED' }}>−{T.deductMal.toFixed(3)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#DC2626' }}>−{T.avances.toFixed(3)}</td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#7C3AED' }}>
                                 {T.pret > 0 ? `−${T.pret.toFixed(3)}` : '—'}
                              </td>
                              <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 900, fontSize: '14px', color: '#059669' }}>{T.net.toFixed(3)}</td>
                           </tr>
                        );
                     })()}
                  </tfoot>
               </table>
            </div>
         </div>

         {/* INDIVIDUAL SECTION */}
         <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <div>
               <h3 className="font-bold" style={{ fontSize: '18px', color: '#1E293B' }}>Contrôle individuel</h3>
               <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>Édition des fiches de paie</p>
            </div>
            <div className="relative w-full md:w-[400px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: '#94A3B8' }} />
               <input type="text" placeholder="Filtrer par nom ou matricule..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg outline-none" style={{ fontSize: '14px', fontWeight: 500, color: '#1E293B', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }} />
            </div>
         </div>

         {/* EMPLOYEE CARDS */}
         <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 mb-12">
            <AnimatePresence>
               {filtered.map((emp) => {
                  const pretActif = emp.pretActif;
                  const pretMens  = parseFloat(emp.payroll.mensualitePret || 0);
                  return (
                     <div key={emp.id} className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-10 h-10 rounded-lg flex items-center justify-center font-semibold"
                             style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', fontSize: '14px' }}>{emp.prenom?.[0]}{emp.nom?.[0]}</div>
                           <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate" style={{ fontSize: '15px', color: '#1E293B' }}>{emp.nom} {emp.prenom}</p>
                              <p className="truncate" style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{emp.poste}</p>
                           </div>
                        </div>
                        <div className="space-y-2 mb-auto">
                           <div className="flex justify-between items-center px-3 py-2 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
                              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>Brut mensuel</span>
                              <span className="font-semibold" style={{ fontSize: '14px', color: '#1E293B' }}>{emp.payroll.brut} TND</span>
                           </div>
                           <div className="flex justify-between items-center px-3 py-2 rounded-lg" style={{ backgroundColor: '#F0FDF4' }}>
                              <span style={{ fontSize: '12px', color: '#059669', fontWeight: 500 }}>Net à payer</span>
                              <span className="font-bold" style={{ fontSize: '15px', color: '#059669' }}>{emp.payroll.net} TND</span>
                           </div>
                           {pretActif && pretMens > 0 && (
                              <div className="flex justify-between items-center px-3 py-2 rounded-lg" style={{ backgroundColor: '#FAF5FF' }}>
                                 <span style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 500 }}>Remb. prêt</span>
                                 <span style={{ fontSize: '12px', color: '#7C3AED', fontWeight: 600 }}>−{pretMens.toFixed(3)} TND</span>
                              </div>
                           )}
                           {pretActif && (
                              <div className="flex justify-between items-center px-3 py-1 rounded-lg" style={{ backgroundColor: '#F5F3FF' }}>
                                 <span style={{ fontSize: '10px', color: '#A78BFA', fontWeight: 500 }}>Solde prêt restant</span>
                                 <span style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 600 }}>
                                    {emp.payroll.soldePretApres} TND
                                 </span>
                              </div>
                           )}
                        </div>
                        <button onClick={() => handleGeneratePayslip(emp)}
                           className="w-full h-10 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-3"
                           style={{ backgroundColor: '#1E293B', color: '#FFFFFF', fontSize: '13px' }}>
                           <Printer size={15} /> Générer fiche paie
                        </button>
                     </div>
                  );
               })}
            </AnimatePresence>
         </div>

         {filtered.length === 0 && (
            <div className="py-20 text-center rounded-xl" style={{ border: '1px dashed #E2E8F0' }}>
               <HardHat size={48} style={{ color: '#E2E8F0' }} className="mx-auto mb-3" />
               <p style={{ fontSize: '13px', color: '#94A3B8' }}>Aucun employé trouvé</p>
            </div>
         )}
      </div>
   );
};
