import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useEmployeStore } from '../../stores/employeStore';
import { usePointageStore } from '../../stores/pointageStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Search, Save, Clock, Wallet,
    CheckCircle2, XCircle, Sun, Coffee, Heart,
    Minus, Plus, Lock, Filter, LayoutGrid, List,
    ChevronDown, RefreshCw, Briefcase, MessageSquare, ShieldCheck,
    AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const STATUS_CONFIG = (t) => ({
    PRESENT: { label: 'Présent',   icon: CheckCircle2, color: '#059669', bg: '#F0FDF4', border: '#BBF7D0' },
    ABSENT:  { label:  'Absent',     icon: XCircle,      color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    FERIE:   { label:   'Férié',     icon: Sun,          color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
    CONGE:   { label:  'Congé',       icon: Coffee,       color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    MALADIE: { label:  'Maladie', icon: Heart,        color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
});

const BLOCK_HS = ['ABSENT', 'MALADIE'];

function isMonthLocked(dateStr) {
    const today = new Date();
    const d = new Date(dateStr);
    return d.getFullYear() < today.getFullYear() ||
        (d.getFullYear() === today.getFullYear() && d.getMonth() < today.getMonth());
}

export const ChefPointage = () => {
    const { t } = useLanguage();
    const location = useLocation();
    const todayDate = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(location.state?.editDate || todayDate);
    const [searchTerm, setSearchTerm] = useState('');
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);
    const [filterPoste, setFilterPoste] = useState('');
    const [showSuccessAnim, setShowSuccessAnim] = useState(false);

    const { employes, fetchAll } = useEmployeStore();
    const { fetchByDate, getPointagesForDate, updateLocal, saveAll } = usePointageStore();

    const isLocked = isMonthLocked(selectedDate);
    const sheetEntries = getPointagesForDate(selectedDate);
    const config = STATUS_CONFIG(t);

    useEffect(() => { fetchAll(); }, [fetchAll]);
    useEffect(() => { fetchByDate(selectedDate); }, [selectedDate, fetchByDate]);

    useEffect(() => {
        if (selectedDate !== todayDate) return;
        const timer = setTimeout(() => {
            const entries = getPointagesForDate(selectedDate);
            const hasEntries = Object.values(entries).some(e => e?.statut);
            if (!hasEntries) {
                toast.error('⚠ Rappel : Le pointage du jour n\'a pas encore été saisi !', {
                    duration: 6000,
                    style: { borderLeft: '4px solid #DC2626', fontWeight: 700, fontSize: '15px' },
                    id: 'pointage-reminder',
                });
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [selectedDate, todayDate]);

    const handleStatutChange = (employeId, statut) => {
        if (isLocked) return;
        updateLocal(selectedDate, employeId, 'statut', statut);
        if (BLOCK_HS.includes(statut)) {
            updateLocal(selectedDate, employeId, 'heures_supp', 0);
            updateLocal(selectedDate, employeId, 'jours_travailles', 0);
        } else if (statut === 'FERIE') {
            updateLocal(selectedDate, employeId, 'jours_travailles', 0);
        } else {
            updateLocal(selectedDate, employeId, 'jours_travailles', 1);
        }
    };

    const handleHeuresSuppChange = (employeId, value) => {
        if (isLocked) return;
        const p = sheetEntries[employeId];
        if (BLOCK_HS.includes(p?.statut)) return;
        updateLocal(selectedDate, employeId, 'heures_supp', Math.max(0, Math.min(12, value)));
    };

    const handleAvanceChange = (employeId, value) => {
        if (isLocked) return;
        updateLocal(selectedDate, employeId, 'avance', parseFloat(value) || 0);
    };

    const handleNotesChange = (employeId, note) => {
        if (isLocked) return;
        updateLocal(selectedDate, employeId, 'note', note);
    };

    const handleSave = async () => {
        setSaving(true);
        const result = await saveAll(selectedDate, employes);
        if (result.success) {
            setShowSuccessAnim(true);
            setTimeout(() => setShowSuccessAnim(false), 2500);
            await fetchByDate(selectedDate);
        } else {
            toast.error(result.error || t('updateError'));
        }
        setSaving(false);
    };

    const filteredEmployes = useMemo(() => employes.filter(emp => {
        const matchesSearch = `${emp.nom} ${emp.prenom}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPoste = !filterPoste || emp.poste === filterPoste;
        return matchesSearch && matchesPoste;
    }), [employes, searchTerm, filterPoste]);

    const stats = (() => {
        const entries = Object.values(sheetEntries);
        return {
            presents: entries.filter(e => e?.statut === 'PRESENT').length,
            heuresSupp: entries.reduce((s, e) => s + (e?.heures_supp || 0), 0),
            avances: entries.reduce((s, e) => s + (e?.avance || 0), 0),
        };
    })();

    const postes = useMemo(() => [...new Set(employes.map(e => e.poste))].filter(Boolean), [employes]);
    const todayHasNoPointage = selectedDate === todayDate && !Object.values(sheetEntries).some(e => e?.statut);

    return (
        <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '24px 28px' }}>

            {/* ─── RAPPEL POINTAGE ─── */}
            {todayHasNoPointage && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
                        padding: '14px 20px', borderRadius: 12, backgroundColor: '#FEF2F2',
                        border: '1px solid #FECACA' }}>
                    <AlertTriangle size={20} style={{ color: '#DC2626', flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: '14px', color: '#DC2626' }}>
                        Le pointage du jour n'a pas encore été saisi. Veuillez saisir la présence avant la fin de journée.
                    </span>
                </motion.div>
            )}

            {/* ─── EN-TÊTE ─── */}
            <div style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
                <div>
                    <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500, marginBottom: 4 }}>Gestion du personnel</p>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', margin: 0, letterSpacing: '-0.02em' }}>
                        Feuille de <span style={{ color: '#1E40AF' }}>présence</span>
                    </h1>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px',
                        height: 44, backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10 }}>
                        <Calendar size={16} style={{ color: '#1E40AF' }} />
                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                            style={{ background: 'transparent', border: 'none', outline: 'none',
                                fontSize: '14px', fontWeight: 600, color: '#1E293B', cursor: 'pointer' }} />
                    </div>
                    <button onClick={handleSave} disabled={saving || isLocked}
                        style={{ height: 44, paddingLeft: 20, paddingRight: 20, borderRadius: 10,
                            backgroundColor: isLocked ? '#94A3B8' : '#1E40AF', color: '#FFFFFF',
                            border: 'none', fontWeight: 700, fontSize: '14px', cursor: isLocked ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 8,
                            boxShadow: isLocked ? 'none' : '0 4px 12px rgba(30,64,175,0.25)',
                            opacity: saving ? 0.7 : 1, transition: 'all 0.2s' }}>
                        {isLocked ? <Lock size={16} /> : saving ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                        {saving ? 'Sauvegarde...' : isLocked ? 'Verrouillé' : t('save') || 'Enregistrer'}
                    </button>
                </div>
            </div>

            {/* ─── KPI ─── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                    { label: t('present') || 'Présents',         value: stats.presents,                   color: '#059669', icon: CheckCircle2 },
                    { label: t('overtime') || 'Heures Supp.',    value: `${stats.heuresSupp.toFixed(1)}H`, color: '#1E40AF', icon: Clock },
                    { label: t('advances') || 'Avances (TND)',   value: `${stats.avances.toFixed(0)} TND`, color: '#D97706', icon: Wallet },
                ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '16px 20px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', right: -8, top: -8, opacity: 0.06, color: s.color }}>
                            <s.icon size={64} strokeWidth={1} />
                        </div>
                        <s.icon size={18} style={{ color: s.color, marginBottom: 8 }} />
                        <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500, margin: 0, marginBottom: 4 }}>{s.label}</p>
                        <p style={{ fontSize: '28px', fontWeight: 800, color: s.color, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* ─── BARRE RECHERCHE + VUES ─── */}
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px', marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input type="text" placeholder={`${t('search') || 'Rechercher'}...`}
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                            borderRadius: 8, border: '1px solid #E2E8F0', outline: 'none',
                            fontSize: '13px', fontWeight: 500, color: '#1E293B',
                            backgroundColor: '#F8FAFC', boxSizing: 'border-box' }} />
                </div>
                <button onClick={() => setShowFilters(!showFilters)}
                    style={{ height: 38, paddingLeft: 14, paddingRight: 14, borderRadius: 8, border: '1px solid #E2E8F0',
                        backgroundColor: showFilters ? '#EFF6FF' : '#F8FAFC', color: showFilters ? '#1E40AF' : '#64748B',
                        fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <Filter size={14} />
                    {t('filter') || 'Filtrer'}
                    <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                <div style={{ display: 'flex', borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden', backgroundColor: '#F8FAFC' }}>
                    {[{ mode: 'grid', Icon: LayoutGrid }, { mode: 'table', Icon: List }].map(({ mode, Icon }) => (
                        <button key={mode} onClick={() => setViewMode(mode)}
                            style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
                                backgroundColor: viewMode === mode ? '#1E40AF' : 'transparent',
                                color: viewMode === mode ? '#FFFFFF' : '#94A3B8', transition: 'all 0.15s' }}>
                            <Icon size={16} />
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── FILTRES POSTES ─── */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', marginBottom: 12 }}>
                        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 14px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {['', ...postes].map((p, i) => (
                                <button key={i} onClick={() => setFilterPoste(p)}
                                    style={{ padding: '6px 14px', borderRadius: 8, fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                                        backgroundColor: filterPoste === p ? '#1E40AF' : '#F8FAFC',
                                        color: filterPoste === p ? '#FFFFFF' : '#475569',
                                        border: `1px solid ${filterPoste === p ? '#1E40AF' : '#E2E8F0'}` }}>
                                    {p || 'Tous les postes'}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── GRILLE / TABLEAU ─── */}
            <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (

                    /* ── GRILLE ── */
                    <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))', gap: 14 }}>
                        {filteredEmployes.map(emp => {
                            const p = sheetEntries[emp.id] || {};
                            const isHsLocked = BLOCK_HS.includes(p.statut);
                            return (
                                <motion.div key={emp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' }}>

                                    {/* En-tête employé */}
                                    <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#FAFBFC', borderBottom: '1px solid #F1F5F9' }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#1E40AF', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
                                            {emp.prenom?.[0]}{emp.nom?.[0]}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.01em' }}>{emp.prenom} {emp.nom}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                                                <Briefcase size={12} style={{ color: '#94A3B8' }} />
                                                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{emp.poste}</span>
                                            </div>
                                        </div>
                                        {p.statut && (() => { const conf = config[p.statut]; return (
                                            <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: '10px', fontWeight: 700, backgroundColor: conf.bg, color: conf.color, border: `1px solid ${conf.border}` }}>
                                                {conf.label}
                                            </span>
                                        ); })()}
                                    </div>

                                    {/* Boutons statut */}
                                    <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                                        {Object.entries(config).map(([key, conf]) => {
                                            const Icon = conf.icon;
                                            const isActive = p.statut === key;
                                            return (
                                                <button key={key} onClick={() => handleStatutChange(emp.id, key)}
                                                    style={{ height: 68, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                                                        ...(isActive
                                                            ? { backgroundColor: conf.color, color: '#FFFFFF', boxShadow: `0 4px 12px ${conf.color}40`, transform: 'scale(1.04)' }
                                                            : { backgroundColor: conf.bg, color: conf.color, border: `1px solid ${conf.border}` }) }}>
                                                    <Icon size={isActive ? 22 : 18} strokeWidth={isActive ? 2.5 : 2} />
                                                    <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{conf.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* HS + Avance + Note */}
                                    <div style={{ padding: '0 14px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        {/* Heures supp */}
                                        <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px' }}>
                                            <p style={{ margin: 0, marginBottom: 10, fontSize: '11px', fontWeight: 700, color: isHsLocked ? '#CBD5E1' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                {t('overtime') || 'Heures Supp.'} (H)
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <button onClick={() => handleHeuresSuppChange(emp.id, (p.heures_supp || 0) - .5)} disabled={isHsLocked}
                                                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isHsLocked ? 'not-allowed' : 'pointer', opacity: isHsLocked ? 0.3 : 1 }}>
                                                    <Minus size={14} strokeWidth={3} />
                                                </button>
                                                <span style={{ fontSize: '28px', fontWeight: 800, color: isHsLocked ? '#CBD5E1' : '#1E293B', letterSpacing: '-0.02em' }}>
                                                    {(p.heures_supp || 0).toFixed(1)}
                                                </span>
                                                <button onClick={() => handleHeuresSuppChange(emp.id, (p.heures_supp || 0) + .5)} disabled={isHsLocked}
                                                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isHsLocked ? 'not-allowed' : 'pointer', opacity: isHsLocked ? 0.3 : 1 }}>
                                                    <Plus size={14} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Avance */}
                                        <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '12px 14px' }}>
                                            <p style={{ margin: 0, marginBottom: 10, fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                {t('advances') || 'Avance'} (TND)
                                            </p>
                                            <input type="number" value={p.avance || 0}
                                                onChange={e => handleAvanceChange(emp.id, e.target.value)}
                                                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', textAlign: 'center', fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.02em' }}
                                                step="5" />
                                        </div>

                                        {/* Note */}
                                        <div style={{ gridColumn: '1 / -1', position: 'relative' }}>
                                            <MessageSquare size={14} style={{ position: 'absolute', right: 12, top: 12, color: '#CBD5E1' }} />
                                            <textarea value={p.note || ''} onChange={e => handleNotesChange(emp.id, e.target.value)}
                                                style={{ width: '100%', borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 36px 10px 12px', fontSize: '13px', color: '#475569', backgroundColor: '#FFFFFF', outline: 'none', resize: 'none', fontWeight: 500, boxSizing: 'border-box' }}
                                                placeholder="Justification..." rows={2} />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                ) : (

                    /* ── TABLEAU ── */
                    <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                                        {['Employé', 'Statut', 'H. Supp.', 'Avance', 'justification'].map(h => (
                                            <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployes.map((emp, rowIdx) => {
                                        const p = sheetEntries[emp.id] || {};
                                        const isHsLocked = BLOCK_HS.includes(p.statut);
                                        return (
                                            <tr key={emp.id} style={{ backgroundColor: rowIdx % 2 === 0 ? '#FFFFFF' : '#FAFBFC', borderBottom: '1px solid #F1F5F9' }}>
                                                {/* Employé */}
                                                <td style={{ padding: '12px 18px', whiteSpace: 'nowrap' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                        <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#1E40AF', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                                                            {emp.prenom?.[0]}{emp.nom?.[0]}
                                                        </div>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{emp.prenom} {emp.nom}</p>
                                                            <p style={{ margin: 0, fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{emp.poste}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Statut */}
                                                <td style={{ padding: '12px 18px' }}>
                                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                        {Object.entries(config).map(([key, conf]) => {
                                                            const Icon = conf.icon;
                                                            const isActive = p.statut === key;
                                                            return (
                                                                <button key={key} onClick={() => handleStatutChange(emp.id, key)}
                                                                    style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                                                                        ...(isActive
                                                                            ? { backgroundColor: conf.color, color: '#FFF', transform: 'scale(1.1)', boxShadow: `0 3px 8px ${conf.color}40` }
                                                                            : { backgroundColor: conf.bg, color: conf.color, border: `1px solid ${conf.border}` }) }}>
                                                                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                {/* Heures supp */}
                                                <td style={{ padding: '12px 18px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <button onClick={() => handleHeuresSuppChange(emp.id, (p.heures_supp || 0) - .5)} disabled={isHsLocked}
                                                            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isHsLocked ? 'not-allowed' : 'pointer', opacity: isHsLocked ? 0.3 : 1 }}>
                                                            <Minus size={12} strokeWidth={3} />
                                                        </button>
                                                        <span style={{ fontSize: '16px', fontWeight: 800, color: isHsLocked ? '#CBD5E1' : '#1E293B', minWidth: 40, textAlign: 'center' }}>
                                                            {(p.heures_supp || 0).toFixed(1)}
                                                        </span>
                                                        <button onClick={() => handleHeuresSuppChange(emp.id, (p.heures_supp || 0) + .5)} disabled={isHsLocked}
                                                            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isHsLocked ? 'not-allowed' : 'pointer', opacity: isHsLocked ? 0.3 : 1 }}>
                                                            <Plus size={12} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                </td>
                                                {/* Avance */}
                                                <td style={{ padding: '12px 18px' }}>
                                                    <input type="number" value={p.avance || 0}
                                                        onChange={e => handleAvanceChange(emp.id, e.target.value)}
                                                        style={{ width: 90, padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '14px', fontWeight: 700, color: '#1E293B', textAlign: 'center', outline: 'none' }} />
                                                </td>
                                                {/* Note */}
                                                <td style={{ padding: '12px 18px' }}>
                                                    <textarea value={p.note || ''} onChange={e => handleNotesChange(emp.id, e.target.value)}
                                                        style={{ minWidth: 180, padding: '8px 10px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', fontSize: '13px', color: '#475569', resize: 'none', outline: 'none', fontWeight: 500 }}
                                                        rows={2} placeholder="..." />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── OVERLAY SUCCÈS ─── */}
            <AnimatePresence>
                {showSuccessAnim && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248,250,252,0.9)', backdropFilter: 'blur(6px)' }}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            style={{ backgroundColor: '#FFFFFF', border: '1px solid #BBF7D0', borderRadius: 24, padding: '48px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, boxShadow: '0 20px 60px rgba(5,150,105,0.15)' }}>
                            <div style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(5,150,105,0.3)' }}>
                                <ShieldCheck size={38} color="#FFFFFF" strokeWidth={2.5} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', margin: 0, marginBottom: 8 }}>{t('updateSuccess') || 'Enregistré !'}</h2>
                                <p style={{ fontSize: '14px', color: '#64748B', fontWeight: 500, margin: 0 }}>Pointage sauvegardé avec succès.</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                input[type=number]::-webkit-inner-spin-button,
                input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};