import React, { useState, useEffect, useMemo } from 'react';
import { usePointageStore } from '../../stores/pointageStore';
import { useEmployeStore } from '../../stores/employeStore';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line
import {
  ChevronLeft, ChevronRight, Search, Lock,
  CheckCircle2, XCircle, Sun, Coffee, Heart, Clock,
  Users, TrendingUp, Wallet, X,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const STATUS_CFG = {
  PRESENT: { label: 'Présent',  color: '#059669', bg: '#F0FDF4', border: '#BBF7D0', Icon: CheckCircle2 },
  ABSENT:  { label: 'Absent',   color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', Icon: XCircle      },
  FERIE:   { label: 'Férié',    color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE', Icon: Sun          },
  CONGE:   { label: 'Congé',    color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', Icon: Coffee       },
  MALADIE: { label: 'Maladie',  color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', Icon: Heart        },
};

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

export const AdminPointageView = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');

  const { fetchByMonth, pointagesMois, loading } = usePointageStore();
  const { employes, fetchAll: fetchEmployes } = useEmployeStore();

  useEffect(() => { fetchEmployes(); }, [fetchEmployes]);
  useEffect(() => { fetchByMonth(month + 1, year); }, [month, year, fetchByMonth]);

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const monthLabel = (language === 'ar' ? MONTHS_AR : MONTHS_FR)[month];

  const enriched = useMemo(() => {
    const map = {};
    employes.forEach(e => { map[e.id] = e; });
    return (pointagesMois || []).map(p => {
      const emp = map[p.employe_id] || {};
      return { ...p, employe_nom: emp.nom || '', employe_prenom: emp.prenom || '', employe_poste: emp.poste || '' };
    });
  }, [pointagesMois, employes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return enriched.filter(p => {
      const name = `${p.employe_nom} ${p.employe_prenom}`.toLowerCase();
      return name.includes(q) && (!filterStatut || p.statut === filterStatut);
    });
  }, [enriched, search, filterStatut]);

  const kpi = useMemo(() => {
    const counts = { PRESENT: 0, ABSENT: 0, FERIE: 0, CONGE: 0, MALADIE: 0 };
    let hs = 0, avances = 0;
    filtered.forEach(p => {
      if (counts[p.statut] !== undefined) counts[p.statut]++;
      hs += parseFloat(p.heures_supp || 0);
      avances += parseFloat(p.avance || 0);
    });
    return { ...counts, hs, avances, total: filtered.length };
  }, [filtered]);

  return (
    <div className="p-6 pb-12" dir={isRTL ? 'rtl' : 'ltr'} style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* HEADER */}
      <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <p className="font-medium mb-1" style={{ fontSize: '12px', color: '#94A3B8' }}>Admin · Pointages</p>
          <h1 className="font-bold" style={{ fontSize: '24px', color: '#1E293B' }}>
            Contrôle des <span style={{ color: '#1E40AF' }}>pointages</span>
          </h1>
          <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md w-fit"
            style={{ backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
            <Lock size={11} style={{ color: '#94A3B8' }} />
            <span style={{ fontSize: '11px', fontWeight: 500, color: '#94A3B8' }}>Mode consultation</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', color: '#64748B' }}><ChevronLeft size={15} /></button>
          <div className="px-4 py-1.5 rounded-lg font-semibold text-center min-w-[140px]"
            style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: '13px' }}>{monthLabel} {year}</div>
          <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', color: '#64748B' }}><ChevronRight size={15} /></button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 mb-6">
        <div className="rounded-xl p-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <Users size={14} style={{ color: '#D97706', marginBottom: 4 }} />
          <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>Total</p>
          <p className="font-bold" style={{ fontSize: '20px', color: '#1E293B' }}>{kpi.total}</p>
        </div>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <button key={key} onClick={() => setFilterStatut(f => f === key ? '' : key)}
            className="rounded-xl p-3 text-left transition-all"
            style={{ backgroundColor: '#FFFFFF', border: filterStatut === key ? `2px solid ${cfg.color}` : '1px solid #E2E8F0' }}>
            <cfg.Icon size={14} style={{ color: cfg.color, marginBottom: 4 }} />
            <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>{cfg.label}</p>
            <p className="font-bold" style={{ fontSize: '20px', color: cfg.color }}>{kpi[key] ?? 0}</p>
          </button>
        ))}
        <div className="rounded-xl p-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <TrendingUp size={14} style={{ color: '#059669', marginBottom: 4 }} />
          <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>Taux présence</p>
          <p className="font-bold" style={{ fontSize: '20px', color: '#059669' }}>
            {kpi.total > 0 ? Math.round((kpi.PRESENT / kpi.total) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="rounded-xl p-3 mb-4 flex flex-wrap gap-2 items-center"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div className="flex-1 relative min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: '#94A3B8' }} />
          <input type="text" placeholder="Rechercher un employé..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg outline-none" style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }} />
        </div>
        {filterStatut && (
          <button onClick={() => setFilterStatut('')} className="flex items-center gap-1 px-3 py-2 rounded-lg"
            style={{ backgroundColor: STATUS_CFG[filterStatut]?.bg, color: STATUS_CFG[filterStatut]?.color, border: `1px solid ${STATUS_CFG[filterStatut]?.border}`, fontSize: '12px', fontWeight: 600 }}>
            {filterStatut} <X size={12} />
          </button>
        )}
        <span className="px-3 py-2 rounded-lg" style={{ backgroundColor: '#F8FAFC', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{filtered.length} saisie{filtered.length > 1 ? 's' : ''}</span>
      </div>

      {/* TABLE */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-3 rounded-full animate-spin" style={{ borderColor: '#E2E8F0', borderTopColor: '#1E40AF' }} />
            <p style={{ fontSize: '13px', color: '#94A3B8' }}>Chargement...</p>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl p-16 flex flex-col items-center gap-3" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <Users size={36} style={{ color: '#E2E8F0' }} />
            <p style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}>Aucun pointage pour cette période</p>
          </motion.div>
        ) : (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            {/* Header */}
            <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_1.5fr] gap-0" style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              {['Employé', 'Date', 'Statut', 'H. Supp', 'Avance', 'Note'].map((h, i) => (
                <div key={i} className="px-4 py-3"><span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>{h}</span></div>
              ))}
            </div>
            {/* Rows */}
            <div>
              {filtered.map((p, i) => {
                const cfg = STATUS_CFG[p.statut] || STATUS_CFG.ABSENT;
                const isAbsent = p.statut === 'ABSENT';
                const dateObj = new Date(p.date + 'T00:00:00');
                const dateFmt = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
                return (
                  <div key={p.id || i}
                    className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_1fr_1.5fr] gap-0 items-center transition-colors"
                    style={{ minHeight: 56, borderBottom: '1px solid #F1F5F9', borderLeft: isAbsent ? '3px solid #DC2626' : '3px solid transparent' }}>
                    <div className="px-4 py-3 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold"
                        style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', fontSize: '12px' }}>
                        {(p.employe_prenom?.[0] || '').toUpperCase()}{(p.employe_nom?.[0] || '').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ fontSize: '13px', color: '#1E293B' }}>{p.employe_prenom} {p.employe_nom}</p>
                        <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{p.employe_poste || '—'}</p>
                      </div>
                    </div>
                    <div className="px-4 py-3"><p style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>{dateFmt}</p></div>
                    <div className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md"
                        style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: '11px', fontWeight: 600 }}>
                        <cfg.Icon size={11} /> {cfg.label}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <span className="font-semibold" style={{ fontSize: '13px', color: p.heures_supp > 0 ? '#D97706' : '#CBD5E1', fontFamily: 'monospace' }}>
                        {p.heures_supp > 0 ? `${p.heures_supp}h` : '—'}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <span className="font-semibold" style={{ fontSize: '13px', color: p.avance > 0 ? '#D97706' : '#CBD5E1', fontFamily: 'monospace' }}>
                        {p.avance > 0 ? `${Number(p.avance).toLocaleString()} TND` : '—'}
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="truncate" style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic', fontWeight: 500, maxWidth: 140 }}>{p.note || '—'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Footer */}
            <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
              <div className="flex items-center gap-3">
                {Object.entries(STATUS_CFG).map(([key, cfg]) => kpi[key] > 0 && (
                  <div key={key} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>{cfg.label}: {kpi[key]}</span>
                  </div>
                ))}
              </div>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{monthLabel} {year} · {filtered.length} entrées</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};