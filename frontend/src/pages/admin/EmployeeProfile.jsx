import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, Clock,
  User, History, Wallet, Palmtree,
  Briefcase, Activity, UserCheck, ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown, Hash
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import toast from 'react-hot-toast';
import { payrollCalculator } from '../../utils/payrollCalculator';

const STATUS_COLORS = {
  PRESENT:  { bg: '#F0FDF4', text: '#059669', border: '#BBF7D0' },
  ABSENT:   { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  CONGE:    { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  FERIE:    { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
  MALADIE:  { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
};

const StatusPill = ({ statut }) => {
  const s = STATUS_COLORS[statut] || { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
  return (
    <span style={{
      backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}`,
      borderRadius: 8, padding: '4px 12px', fontSize: 11,
      fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    }}>
      {statut}
    </span>
  );
};

/** Format a number to 3 decimal places with TND suffix */
const fmt = (n) => `${(n || 0).toFixed(3)} TND`;

export const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('INFOS');
  const [advances, setAdvances] = useState([]);
  const [pointages, setPointages] = useState([]);
  const [pretActif, setPretActif] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const MONTH_NAMES = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  const loadEmployee = useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoke('get_employe_by_id', { id });
      setEmployee(data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadTabData = useCallback(async () => {
    if (!employee) return;
    setIsDataLoading(true);
    try {
      // Use backend month command which uses `date LIKE 'YYYY-MM-%'`
      const mois = viewMonth + 1;
      const annee = viewYear;

      if (activeTab === 'AVANCES') {
        const allAdvances = await invoke('get_all_advances');
        setAdvances(allAdvances.filter(a => a.employe_id === employee.id));
      } else if (activeTab === 'HISTORIQUE' || activeTab === 'CONGES') {
        const allPointages = await invoke('get_pointages_mois', { mois, annee });
        setPointages((allPointages || []).filter(p => p.employe_id === employee.id));
        // Also load advances for net calculation
        const allAdvances = await invoke('get_all_advances');
        setAdvances((allAdvances || []).filter(a => a.employe_id === employee.id));
      }
    } catch (err) {
      console.error('Tab data error:', err);
    } finally {
      setIsDataLoading(false);
    }
  }, [employee, activeTab, viewMonth, viewYear]);

  // Load pointages + prêt actif on mount/month change
  useEffect(() => {
    const loadInitialData = async () => {
      if (!employee) return;
      try {
        const mois = viewMonth + 1;
        const annee = viewYear;
        const [allPointages, allAdvances, prets] = await Promise.all([
          invoke('get_pointages_mois', { mois, annee }),
          invoke('get_all_advances'),
          invoke('get_prets_employe', { employeId: employee.id }),
        ]);
        setPointages((allPointages || []).filter(p => p.employe_id === employee.id));
        setAdvances((allAdvances || []).filter(a => a.employe_id === employee.id));
        setPretActif((prets || []).find(p => p.statut === 'ACTIF') || null);
      } catch (err) {
        console.error('Initial data error:', err);
      }
    };
    loadInitialData();
  }, [employee, viewMonth, viewYear]);

  useEffect(() => { loadEmployee(); }, [loadEmployee]);
  useEffect(() => { loadTabData(); }, [loadTabData]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  if (loading || !employee) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#1E40AF' }}
        />
      </div>
    );
  }

  // ── Calculs du mois (via Moteur Centralisé) ──────────────────────────────
  const stats = payrollCalculator.calculateMonthly(
    employee,
    pointages,
    advances.filter(a => {
      if (a.statut !== 'APPROVED') return false;
      const d = new Date(a.date);
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
    }),
    false, // Bonus mérite géré dans AdminRapports
    pretActif
  );

  // Pour compatibilité avec le reste du JSX existant
  const TJ              = parseFloat(stats.tauxJ);
  const TH_HS           = parseFloat(stats.tauxH_HS);
  const joursPresent    = stats.presence;
  const totalHS         = stats.hs;
  const joursFeries     = stats.feries;
  const joursAbsents    = stats.absences;
  const joursMaladie    = stats.maladie;
  const totalAvances    = parseFloat(stats.avances);
  const salairePresence = parseFloat(stats.salairePresence);
  const gainHS          = parseFloat(stats.montantHS);
  const gainFeries      = parseFloat(stats.montantFeries);
  const deductAbs       = parseFloat(stats.deductionAbsences);
  const deductMal       = parseFloat(stats.deductionMaladie);
  const mensualitePret  = parseFloat(stats.mensualitePret);
  const soldePretApres  = stats.soldePretApres !== null ? parseFloat(stats.soldePretApres) : null;
  const netPositif      = parseFloat(stats.net);
  const dette           = parseFloat(stats.dette);

  // Pour l'affichage spécifique dans l'onglet Historique
  const avancesJour = pointages.reduce((s, p) => s + (p.avance || 0), 0);
  const avancesApproved = advances
    .filter(a => a.statut === 'APPROVED')
    .reduce((s, a) => s + (a.montant || 0), 0);

  // ── Shared style tokens ───────────────────────────────────────────────────
  const card   = { backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 24 };
  const sLabel = { fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, marginBottom: 4 };
  const thStyle = { padding: '11px 18px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#FFFFFF', backgroundColor: '#1E40AF', whiteSpace: 'nowrap', textAlign: 'left' };
  const tdStyle = { padding: '14px 18px', fontSize: 14, fontWeight: 500, color: '#1E293B', borderBottom: '1px solid #F1F5F9' };

  const TABS = [
    { id: 'INFOS',      label: 'Informations',  icon: User },
    { id: 'HISTORIQUE', label: 'Pointage',       icon: History },
    { id: 'AVANCES',    label: 'Avances',        icon: Wallet },
    { id: 'CONGES',     label: 'Congés',         icon: Palmtree },
  ];

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '24px 28px' }}>

      {/* ── HEADER ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        style={{ ...card, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/admin/employes')}
          style={{ width: 40, height: 40, borderRadius: 10, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={18} color="#64748B" />
        </button>

        <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#1E40AF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(30,64,175,0.25)' }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#FFF', textTransform: 'uppercase' }}>
            {employee.prenom?.[0]}{employee.nom?.[0]}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 180 }}>
          <p style={{ ...sLabel, marginBottom: 6 }}>Fiche collaborateur</p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
            {employee.prenom} <span style={{ color: '#1E40AF' }}>{employee.nom}</span>
          </h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#64748B', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 7, padding: '4px 10px' }}>
              <Briefcase size={12} color="#1E40AF" /> {employee.poste}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#059669', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 7, padding: '4px 10px' }}>
              <UserCheck size={12} /> Actif
            </span>
          </div>
        </div>

        {/* Quick stats: Salaire Base + Net du mois */}
        <div style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 18px', textAlign: 'right' }}>
            <p style={sLabel}>Salaire Base</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', margin: 0 }}>{fmt(employee.salaire_base)}</p>
          </div>
          <div style={{ backgroundColor: netPositif > 0 ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${netPositif > 0 ? '#BBF7D0' : '#FECACA'}`, borderRadius: 12, padding: '12px 18px', textAlign: 'right' }}>
            <p style={{ ...sLabel, color: netPositif > 0 ? '#059669' : '#DC2626' }}>
              Net à Payer — {MONTH_NAMES[viewMonth]} {viewYear}
            </p>
            <p style={{ fontSize: 22, fontWeight: 800, color: netPositif > 0 ? '#059669' : '#DC2626', margin: 0 }}>
              {fmt(netPositif)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 5, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
              backgroundColor: activeTab === tab.id ? '#1E40AF' : 'transparent',
              color: activeTab === tab.id ? '#FFF' : '#64748B',
              transition: 'all 0.15s' }}>
            <tab.icon size={15} strokeWidth={2.5} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

          {/* ════ INFOS ════ */}
          {activeTab === 'INFOS' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* ── Bloc Contrat (Fixe) ── */}
              <div style={card}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #EFF6FF', margin: 0, marginBottom: 16 }}>
                  📋 Contrat (données fixes)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Matricule',         value: employee.employee_id || '—',                                     icon: Hash },
                    { label: 'Date d\'embauche',  value: employee.date_embauche ? new Date(employee.date_embauche).toLocaleDateString('fr-FR') : 'N/A', icon: Calendar },
                    { label: 'Salaire de Base',   value: fmt(employee.salaire_base),                                       icon: null },
                    { label: 'Taux Journalier',   value: fmt(TJ),                                                          icon: null },
                    { label: 'Taux HS 100% (TH)', value: fmt(TH_HS),                                                       icon: null },
                  ].map(row => (
                    <div key={row.label} style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: '10px 14px', border: '1px solid #F1F5F9' }}>
                      <p style={sLabel}>{row.label}</p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: 0 }}>{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Bloc Activité du Mois (Dynamique) ── */}
              <div style={{ ...card, border: '1px solid #BFDBFE' }}>
                {/* Month nav header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '2px solid #EFF6FF' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                    📊 Activité — {MONTH_NAMES[viewMonth]} {viewYear}
                  </p>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={prevMonth} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChevronLeft size={14} color="#1E40AF" />
                    </button>
                    <button onClick={nextMonth} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #BFDBFE', backgroundColor: '#EFF6FF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChevronRight size={14} color="#1E40AF" />
                    </button>
                  </div>
                </div>

                {/* Stats grille */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Jours Présent',   value: joursPresent,              suffix: 'j',   color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
                    { label: 'Heures Supp',      value: totalHS,                   suffix: 'h',   color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
                    { label: 'Jours Fériés',     value: joursFeries,               suffix: 'j',   color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                    { label: 'Absences',         value: joursAbsents,              suffix: 'j',   color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
                    { label: 'Maladie',          value: joursMaladie,              suffix: 'j',   color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
                    { label: 'Total Avances',    value: fmt(totalAvances),         suffix: '',    color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
                  ].map(s => (
                    <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: 10, padding: '10px 14px', border: `1px solid ${s.border}` }}>
                      <p style={{ ...sLabel, color: s.color }}>{s.label}</p>
                      <p style={{ fontSize: 15, fontWeight: 800, color: s.color, margin: 0 }}>
                        {typeof s.value === 'number' ? `${s.value}${s.suffix}` : s.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Décomposition du NET */}
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
                  <p style={{ ...sLabel, marginBottom: 8 }}>Décomposition du Net</p>
                  {[
                    { label: `Présence (${joursPresent}j × TJ)`, value: fmt(salairePresence), plus: true  },
                    { label: `HS × TH 100% (${totalHS}h)`,       value: fmt(gainHS),           plus: true  },
                    { label: `Jours Fériés (${joursFeries}j)`,   value: fmt(gainFeries),       plus: true  },
                    { label: `Absences (${joursAbsents}j)`,      value: `− ${fmt(deductAbs)}`, plus: false },
                    { label: `Maladie (${joursMaladie}j)`,       value: `− ${fmt(deductMal)}`, plus: false },
                    { label: 'Total Avances',                    value: `− ${fmt(totalAvances)}`, plus: false },
                    ...(mensualitePret > 0 ? [{ label: 'Remboursement Prêt', value: `− ${fmt(mensualitePret)}`, plus: false, purple: true }] : []),
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px dashed #F1F5F9' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: r.purple ? '#7C3AED' : '#64748B' }}>{r.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: r.purple ? '#7C3AED' : r.plus ? '#059669' : '#DC2626' }}>{r.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '2px solid #1E40AF' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#1E293B', textTransform: 'uppercase' }}>NET À PAYER</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: netPositif > 0 ? '#059669' : '#DC2626' }}>{fmt(netPositif)}</span>
                  </div>
                  {dette > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, padding: '6px 8px', backgroundColor: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>Reste à récupérer</span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#DC2626' }}>{fmt(dette)}</span>
                    </div>
                  )}
                  {soldePretApres !== null && mensualitePret > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, padding: '6px 10px', backgroundColor: '#F5F3FF', borderRadius: 8, border: '1px solid #DDD6FE' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>Solde prêt après déduction</span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#7C3AED' }}>{fmt(soldePretApres)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Bloc Gestion du Prêt ── (pleine largeur si prêt actif) */}
              {pretActif ? (
                <div style={{ ...card, gridColumn: '1 / -1', border: '1px solid #DDD6FE' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 12, borderBottom: '2px solid #F5F3FF', margin: 0, marginBottom: 16 }}>
                    💳 Gestion du Prêt
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'Montant Total',   value: fmt(pretActif.montant_total),  color: '#1E293B' },
                      { label: 'Mensualité',       value: fmt(pretActif.mensualite),     color: '#7C3AED' },
                      { label: 'Solde Restant',    value: fmt(pretActif.solde_restant),  color: pretActif.solde_restant > 0 ? '#DC2626' : '#059669' },
                    ].map(s => (
                      <div key={s.label} style={{ backgroundColor: '#F5F3FF', borderRadius: 10, padding: '12px 16px', border: '1px solid #EDE9FE' }}>
                        <p style={{ ...sLabel, color: '#7C3AED' }}>{s.label}</p>
                        <p style={{ fontSize: 16, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  {/* Barre de progression remboursement */}
                  {(() => {
                    const total    = Number(pretActif.montant_total) || 1;
                    const restant  = Number(pretActif.solde_restant) || 0;
                    const rembourse = Math.max(0, total - restant);
                    const pct       = Math.min(100, (rembourse / total) * 100);
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#7C3AED' }}>Remboursé : {fmt(rembourse)}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>Restant : {fmt(restant)}</span>
                        </div>
                        <div style={{ height: 8, backgroundColor: '#EDE9FE', borderRadius: 10, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#7C3AED', borderRadius: 10, transition: 'width 0.6s ease' }} />
                        </div>
                        <p style={{ ...sLabel, marginTop: 6, textAlign: 'right' }}>{pct.toFixed(1)}% remboursé</p>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ ...card, gridColumn: '1 / -1', border: '1px dashed #E2E8F0', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px' }}>
                  <Wallet size={18} color="#94A3B8" />
                  <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500, margin: 0 }}>Aucun prêt actif — attribuez un prêt depuis la fiche employé.</p>
                </div>
              )}
            </div>
          )}

          {/* ════ HISTORIQUE ════ */}
          {activeTab === 'HISTORIQUE' && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={sLabel}>Historique de pointage</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', margin: 0 }}>{MONTH_NAMES[viewMonth]} {viewYear}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Jours Présent', value: joursPresent,         color: '#059669' },
                    { label: 'H. Supp',       value: `${totalHS}h`,        color: '#1E40AF' },
                    { label: 'Avances Jour',  value: fmt(avancesJour),     color: '#DC2626' },
                  ].map(s => (
                    <div key={s.label} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 100 }}>
                      <p style={sLabel}>{s.label}</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={prevMonth} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #E2E8F0', backgroundColor: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChevronLeft size={15} color="#64748B" />
                    </button>
                    <button onClick={nextMonth} style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #E2E8F0', backgroundColor: '#FFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChevronRight size={15} color="#64748B" />
                    </button>
                  </div>
                </div>
              </div>

              {isDataLoading ? (
                <div style={{ padding: '48px 0', textAlign: 'center' }}>
                  <p style={{ color: '#1E40AF', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Chargement…</p>
                </div>
              ) : pointages.length === 0 ? (
                <div style={{ padding: '48px 0', textAlign: 'center' }}>
                  <Clock size={36} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                  <p style={{ color: '#94A3B8', fontWeight: 600, fontSize: 13 }}>Aucun pointage ce mois</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Date', 'Statut', 'Heures Sup', 'Avance du Jour', 'Note'].map((h, i, arr) => (
                          <th key={h} style={{ ...thStyle, ...(i === 0 ? { borderRadius: '10px 0 0 10px' } : i === arr.length - 1 ? { borderRadius: '0 10px 10px 0' } : {}) }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pointages.sort((a, b) => new Date(b.date) - new Date(a.date)).map((p, ri) => (
                        <tr key={p.id} style={{ backgroundColor: ri % 2 === 0 ? '#FFFFFF' : '#FAFBFC', borderLeft: p.statut === 'ABSENT' ? '3px solid #DC2626' : '3px solid transparent' }}>
                          <td style={tdStyle}>{new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td style={tdStyle}><StatusPill statut={p.statut} /></td>
                          <td style={{ ...tdStyle, color: '#1E40AF', fontWeight: 700 }}>{p.heures_supp > 0 ? `${p.heures_supp}h` : '—'}</td>
                          <td style={{ ...tdStyle, color: p.avance > 0 ? '#DC2626' : '#94A3B8', fontWeight: 700 }}>{p.avance > 0 ? fmt(p.avance) : '—'}</td>
                          <td style={{ ...tdStyle, color: '#94A3B8', fontStyle: 'italic', maxWidth: 200 }}>{p.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ════ AVANCES ════ */}
          {activeTab === 'AVANCES' && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={sLabel}>Avances sur salaire</p>
                  <p style={{ fontSize: 20, fontWeight: 800, color: '#1E293B', margin: 0 }}>Historique complet</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { label: 'Total Avances', value: fmt(advances.reduce((s, a) => s + (a.montant || 0), 0)), color: '#DC2626' },
                    { label: 'Approuvées',    value: fmt(avancesApproved),                                    color: '#059669' },
                  ].map(s => (
                    <div key={s.label} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 16px', textAlign: 'right', minWidth: 140 }}>
                      <p style={sLabel}>{s.label}</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {isDataLoading ? (
                <div style={{ padding: '48px 0', textAlign: 'center' }}>
                  <p style={{ color: '#1E40AF', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Chargement…</p>
                </div>
              ) : advances.length === 0 ? (
                <div style={{ padding: '48px 0', textAlign: 'center' }}>
                  <Wallet size={36} color="#CBD5E1" style={{ margin: '0 auto 10px' }} />
                  <p style={{ color: '#94A3B8', fontWeight: 600, fontSize: 13 }}>Aucune avance enregistrée</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Date', 'Montant', 'Statut'].map((h, i, arr) => (
                          <th key={h} style={{ ...thStyle, ...(i === 0 ? { borderRadius: '10px 0 0 10px' } : i === arr.length - 1 ? { borderRadius: '0 10px 10px 0' } : {}) }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {advances.sort((a, b) => new Date(b.date) - new Date(a.date)).map((a, ri) => {
                        const approved = a.statut === 'APPROVED';
                        const rejected = a.statut === 'REJECTED';
                        return (
                          <tr key={a.id} style={{ backgroundColor: ri % 2 === 0 ? '#FFFFFF' : '#FAFBFC' }}>
                            <td style={tdStyle}>{new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td style={{ ...tdStyle, fontWeight: 700, color: '#DC2626' }}>{fmt(a.montant)}</td>
                            <td style={tdStyle}>
                              <span style={{
                                backgroundColor: approved ? '#F0FDF4' : rejected ? '#FEF2F2' : '#FFFBEB',
                                color: approved ? '#059669' : rejected ? '#DC2626' : '#D97706',
                                border: `1px solid ${approved ? '#BBF7D0' : rejected ? '#FECACA' : '#FDE68A'}`,
                                borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                              }}>
                                {approved ? 'Approuvé' : rejected ? 'Rejeté' : 'En attente'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ════ CONGÉS ════ */}
          {activeTab === 'CONGES' && (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
              {/* Solde */}
              <div style={card}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #F1F5F9', margin: 0, marginBottom: 16 }}>
                  Solde de congés
                </p>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <p style={{ fontSize: 52, fontWeight: 900, color: '#059669', lineHeight: 1, margin: 0 }}>{employee.solde_conges ?? 18}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', marginTop: 6 }}>Jours restants</p>
                </div>
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, border: '1px solid #F1F5F9' }}>
                  {[
                    { label: 'Total annuel', value: '18 J',                                    color: '#64748B' },
                    { label: 'Consommés',    value: `${18 - (employee.solde_conges ?? 18)} J`, color: '#DC2626' },
                    { label: 'Restants',     value: `${employee.solde_conges ?? 18} J`,        color: '#059669' },
                  ].map(r => (
                    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #F1F5F9' }}>
                      <p style={sLabel}>{r.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: r.color, margin: 0 }}>{r.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ height: 6, backgroundColor: '#F1F5F9', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', backgroundColor: '#059669', borderRadius: 10, width: `${((employee.solde_conges ?? 18) / 18) * 100}%`, transition: 'width 0.6s ease' }} />
                  </div>
                  <p style={{ ...sLabel, marginTop: 6, textAlign: 'right' }}>{Math.round(((employee.solde_conges ?? 18) / 18) * 100)}% restant</p>
                </div>
              </div>

              {/* Info panel */}
              <div style={card}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #F1F5F9', margin: 0, marginBottom: 16 }}>
                  Congés &amp; Absences
                </p>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Jours CONGÉ',   value: pointages.filter(p => p.statut === 'CONGE').length,   color: '#1E40AF' },
                    { label: 'Jours ABSENCE', value: pointages.filter(p => p.statut === 'ABSENT').length,  color: '#DC2626' },
                    { label: 'Jours MALADIE', value: pointages.filter(p => p.statut === 'MALADIE').length, color: '#7C3AED' },
                  ].map(s => (
                    <div key={s.label} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 18px', flex: 1, minWidth: 120 }}>
                      <p style={sLabel}>{s.label}</p>
                      <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 16, backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Activity size={16} color="#1E40AF" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF', margin: 0, marginBottom: 4 }}>Déduction automatique</p>
                      <p style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.6, margin: 0 }}>
                        Le solde de congés est automatiquement déduit lors de chaque saisie de pointage avec le statut <strong>CONGÉ</strong>. Aucune action manuelle n'est requise.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};