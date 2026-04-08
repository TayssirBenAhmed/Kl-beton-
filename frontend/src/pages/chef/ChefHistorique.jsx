import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePointageStore } from '../../stores/pointageStore';
import { useEmployeStore } from '../../stores/employeStore';
import { pointagesAPI } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line
import { Calendar, ChevronLeft, ChevronRight, Edit2, X, Clock, CheckCircle2, XCircle, Sun, Coffee, Heart, Save, AlertCircle, Users, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const STATUS_CFG = {
  PRESENT: { label: 'Présent', color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
  ABSENT:  { label: 'Absent',  color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  FERIE:   { label: 'Férié',   color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
  CONGE:   { label: 'Congé',   color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  MALADIE: { label: 'Maladie', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
};
const STATUS_ICONS = { PRESENT: CheckCircle2, ABSENT: XCircle, FERIE: Sun, CONGE: Coffee, MALADIE: Heart };
const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const pad2 = n => String(n).padStart(2, '0');

/* ─── EDIT MODAL ─── */
function EditModal({ pointage, onClose, onSaved }) {
  const [form, setForm] = useState({ statut: pointage.statut || 'PRESENT', heures_supp: pointage.heures_supp ?? 0, avance: pointage.avance ?? 0, note: pointage.note || '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      const payload = [{ employe_id: pointage.employe_id, date: pointage.date, statut: form.statut, heures_supp: parseFloat(form.heures_supp) || 0, jours_travailles: pointage.jours_travailles ?? 1, avance: parseFloat(form.avance) || 0, note: form.note || null }];
      const res = await pointagesAPI.savePointages(pointage.date, payload);
      if (res.success === false) { setErr(res.error || 'Erreur'); setSaving(false); return; }
      onSaved();
    } catch (e) { setErr(String(e)); setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>Modifier pointage</p>
            <p className="font-semibold" style={{ fontSize: '15px', color: '#1E293B' }}>{pointage.employe_prenom} {pointage.employe_nom}</p>
            <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
              {new Date(pointage.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}><X size={14} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block mb-1.5" style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Statut</label>
            <div className="grid grid-cols-5 gap-1.5">
              {Object.entries(STATUS_CFG).map(([key, cfg]) => {
                const Icon = STATUS_ICONS[key]; const active = form.statut === key;
                return (
                  <button key={key} onClick={() => set('statut', key)} className="flex flex-col items-center gap-1 py-2.5 rounded-lg transition-all"
                    style={{ backgroundColor: active ? cfg.bg : '#FAFBFC', border: active ? `2px solid ${cfg.color}` : '1px solid #E2E8F0' }}>
                    <Icon size={14} style={{ color: active ? cfg.color : '#CBD5E1' }} />
                    <span style={{ fontSize: '9px', fontWeight: 600, color: active ? cfg.color : '#CBD5E1' }}>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1" style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>Heures supp.</label>
              <input type="number" min="0" step="0.5" value={form.heures_supp} onChange={e => set('heures_supp', e.target.value)}
                className="w-full rounded-lg px-3 py-2 outline-none" style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }} />
            </div>
            <div>
              <label className="block mb-1" style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>Avance (TND)</label>
              <input type="number" min="0" step="1" value={form.avance} onChange={e => set('avance', e.target.value)}
                className="w-full rounded-lg px-3 py-2 outline-none" style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }} />
            </div>
          </div>
          <div>
            <label className="block mb-1" style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>Note</label>
            <textarea rows={2} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Remarque..."
              className="w-full rounded-lg px-3 py-2 outline-none resize-none" style={{ fontSize: '14px', fontWeight: 500, color: '#1E293B', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }} />
          </div>
          {err && <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}><AlertCircle size={14} color="#DC2626" /><span style={{ fontSize: '12px', fontWeight: 600, color: '#DC2626' }}>{err}</span></div>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg font-medium" style={{ fontSize: '13px', backgroundColor: '#F1F5F9', color: '#64748B' }}>Annuler</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold transition-all"
            style={{ fontSize: '13px', backgroundColor: saving ? '#93C5FD' : '#1E40AF', color: '#FFFFFF' }}>
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><Save size={14} /> Enregistrer</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── MAIN ─── */
export const ChefHistorique = () => {
  const { language } = useLanguage();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [editPointage, setEditPointage] = useState(null);

  const { fetchByMonth, pointagesMois, loading } = usePointageStore();
  const { employes, fetchAll: fetchEmployes } = useEmployeStore();

  const reload = useCallback(() => { fetchByMonth(month + 1, year); }, [month, year, fetchByMonth]);
  useEffect(() => { reload(); setSelectedDay(null); }, [month, year, fetchByMonth]);
  useEffect(() => { fetchEmployes(); }, [fetchEmployes]);

  const enriched = useMemo(() => {
    const map = {}; employes.forEach(e => { map[e.id] = e; });
    return (pointagesMois || []).map(p => { const emp = map[p.employe_id] || {}; return { ...p, employe_nom: emp.nom || '', employe_prenom: emp.prenom || '', employe_poste: emp.poste || '' }; });
  }, [pointagesMois, employes]);

  const byDate = useMemo(() => { const m = {}; enriched.forEach(p => { const k = p.date?.slice(0, 10); if (!k) return; (m[k] = m[k] || []).push(p); }); return m; }, [enriched]);
  const kpi = useMemo(() => ({ total: enriched.length, presents: enriched.filter(p => p.statut === 'PRESENT').length, absents: enriched.filter(p => p.statut === 'ABSENT').length, hs: enriched.reduce((s, p) => s + (parseFloat(p.heures_supp) || 0), 0) }), [enriched]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7;
  const cells = []; for (let i = 0; i < startOffset; i++) cells.push(null); for (let d = 1; d <= daysInMonth; d++) cells.push(d); while (cells.length % 7 !== 0) cells.push(null);

  const monthName = new Intl.DateTimeFormat(language === 'ar' ? 'ar-TN' : 'fr-FR', { month: 'long' }).format(new Date(year, month));
  const todayStr = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const handleDayClick = (day) => { if (!day) return; const key = `${year}-${pad2(month + 1)}-${pad2(day)}`; setSelectedDay(prev2 => (prev2 === key ? null : key)); };
  const detailList = selectedDay ? (byDate[selectedDay] || []) : [];

  return (
    <div className="p-6" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <div className="max-w-[1400px] mx-auto">
        {/* HEADER */}
        <div className="mb-5">
          <p className="font-medium mb-1" style={{ fontSize: '12px', color: '#94A3B8' }}>Chef · Historique</p>
          <h1 className="font-bold" style={{ fontSize: '24px', color: '#1E293B' }}>Calendrier <span style={{ color: '#1E40AF' }}>mensuel</span></h1>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-2.5 mb-5">
          {[
            { label: 'Saisies', value: kpi.total, color: '#D97706', Icon: Calendar },
            { label: 'Présents', value: kpi.presents, color: '#059669', Icon: CheckCircle2 },
            { label: 'Absents', value: kpi.absents, color: '#DC2626', Icon: XCircle },
            { label: 'H. Supp', value: kpi.hs.toFixed(1) + 'H', color: '#1E40AF', Icon: TrendingUp },
          ].map(({ label, value, color, Icon }) => (
            <div key={label} className="rounded-xl p-3.5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <Icon size={16} color={color} style={{ marginBottom: 4 }} />
              <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{label}</p>
              <p className="font-bold" style={{ fontSize: '20px', color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* CALENDAR + DETAIL */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div className="flex" style={{ minHeight: 460 }}>
            {/* LEFT: CALENDAR */}
            <div className={`flex flex-col transition-all duration-300 ${selectedDay ? 'w-[60%]' : 'w-full'}`} style={{ borderRight: '1px solid #F1F5F9' }}>
              <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <button onClick={prev} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}><ChevronLeft size={16} /></button>
                <span className="font-semibold flex items-center gap-1.5" style={{ fontSize: '14px', color: '#1E293B' }}>
                  <Calendar size={14} color="#1E40AF" /> {monthName} {year}
                </span>
                <button onClick={next} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}><ChevronRight size={16} /></button>
              </div>
              <div className="grid grid-cols-7" style={{ borderBottom: '1px solid #F1F5F9' }}>
                {DAY_LABELS.map(d => (<div key={d} className="py-2 text-center" style={{ fontSize: '11px', fontWeight: 600, color: d === 'Sam' || d === 'Dim' ? '#D97706' : '#94A3B8' }}>{d}</div>))}
              </div>
              {loading ? (
                <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: '#E2E8F0', borderTopColor: '#1E40AF' }} /></div>
              ) : (
                <div className="grid grid-cols-7 flex-1">
                  {cells.map((day, idx) => {
                    if (!day) return <div key={`e-${idx}`} style={{ minHeight: 60, borderBottom: '1px solid #FAFBFC', borderRight: '1px solid #FAFBFC', backgroundColor: '#FAFBFC' }} />;
                    const key = `${year}-${pad2(month + 1)}-${pad2(day)}`;
                    const entries = byDate[key] || []; const count = entries.length;
                    const isToday = key === todayStr; const isSel = key === selectedDay;
                    const col = idx % 7; const isWeekend = col === 5 || col === 6;
                    return (
                      <div key={key} onClick={() => handleDayClick(day)} className="p-1.5 flex flex-col gap-0.5 cursor-pointer transition-all"
                        style={{ minHeight: 60, borderBottom: '1px solid #F8FAFC', borderRight: '1px solid #F8FAFC',
                          backgroundColor: isSel ? '#EFF6FF' : isToday ? '#FFFBEB' : isWeekend ? '#FAFBFC' : '#FFFFFF',
                          boxShadow: isSel ? 'inset 0 0 0 2px #1E40AF' : isToday ? 'inset 0 0 0 1px #FDE68A' : 'none' }}>
                        <span className="font-medium" style={{ fontSize: '12px', color: isToday ? '#D97706' : isWeekend ? '#D97706' : '#475569' }}>{day}</span>
                        {count > 0 && <span className="px-1 py-0.5 rounded text-center" style={{ fontSize: '9px', fontWeight: 600, backgroundColor: '#EFF6FF', color: '#1E40AF' }}>{count} emp.</span>}
                        {count > 0 && <div className="flex flex-wrap gap-0.5 mt-auto">{entries.slice(0, 5).map((p, pi) => (<span key={pi} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_CFG[p.statut]?.color || '#CBD5E1' }} />))}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* RIGHT: DETAIL */}
            <AnimatePresence>
              {selectedDay && (
                <motion.div key="panel" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col overflow-hidden" style={{ width: '40%' }}>
                  <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>Pointages</p>
                      <p className="font-semibold" style={{ fontSize: '13px', color: '#1E293B' }}>
                        {new Date(selectedDay + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                    <button onClick={() => setSelectedDay(null)} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}><X size={12} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {detailList.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
                        <Users size={28} style={{ color: '#E2E8F0' }} />
                        <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>Aucun pointage ce jour</p>
                      </div>
                    )}
                    {detailList.map((p, i) => {
                      const cfg = STATUS_CFG[p.statut] || STATUS_CFG.ABSENT;
                      const Icon = STATUS_ICONS[p.statut] || XCircle;
                      return (
                        <div key={i} className="px-4 py-3" style={{ borderBottom: '1px solid #F8FAFC' }}>
                          <div className="flex items-center gap-2.5 mb-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold"
                              style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', fontSize: '11px' }}>{p.employe_prenom?.[0]}{p.employe_nom?.[0]}</div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate" style={{ fontSize: '13px', color: '#1E293B' }}>{p.employe_prenom} {p.employe_nom}</p>
                              <p className="truncate" style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{p.employe_poste || '—'}</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-md flex items-center gap-1" style={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: '10px', fontWeight: 600 }}>
                              <Icon size={10} /> {cfg.label}
                            </span>
                          </div>
                          <div className="flex gap-3 mb-2">
                            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>HS: <strong style={{ color: '#1E293B' }}>{p.heures_supp || 0}H</strong></span>
                            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Avance: <strong style={{ color: '#D97706' }}>{p.avance || 0} TND</strong></span>
                          </div>
                          <button onClick={() => setEditPointage(p)} className="w-full py-1.5 rounded-lg font-medium transition-all"
                            style={{ fontSize: '12px', backgroundColor: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }}>
                            <Edit2 size={12} className="inline mr-1" /> Modifier
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <AnimatePresence>{editPointage && <EditModal key="edit-modal" pointage={editPointage} onClose={() => setEditPointage(null)} onSaved={() => { setEditPointage(null); reload(); }} />}</AnimatePresence>
    </div>
  );
};