import React, { useState, useEffect, useMemo } from 'react';
import { useEmployeStore } from '../../stores/employeStore';
import { usePointageStore } from '../../stores/pointageStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Clock, FileText, ChevronLeft, ChevronRight, Zap, Activity, ShieldCheck, Download, AlertCircle, CheckCircle2, Search, UserCircle2, Database } from 'lucide-react';
import { generateChefAuditPDF } from '../../lib/services/chefAuditPdfService.js';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

export const ChefAudit = () => {
    const { t, language } = useLanguage();
    useTheme();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { employes, fetchAll: fetchEmployes } = useEmployeStore();
    const { pointagesMois, fetchByMonth, loading } = usePointageStore();
    const monthName = new Intl.DateTimeFormat(language === 'ar' ? 'ar-TN' : 'fr-FR', { month: 'long' }).format(new Date(selectedYear, selectedMonth));

    useEffect(() => { fetchEmployes(); }, [fetchEmployes]);
    useEffect(() => { fetchByMonth(selectedMonth + 1, selectedYear); }, [selectedMonth, selectedYear, fetchByMonth]);

    const getAuditStatus = (pointage) => {
        if (!pointage || !pointage.statut) return { type: 'OUBLI', color: '#D97706', icon: AlertCircle, label: t('missing') || 'Oubli' };
        if (pointage.statut === 'ABSENT' && (!pointage.note || pointage.note.trim() === '')) return { type: 'ERREUR', color: '#DC2626', icon: AlertCircle, label: t('error') || 'Erreur' };
        if ((pointage.statut === 'MALADIE' || pointage.statut === 'CONGE') && (pointage.heures_supp > 0)) return { type: 'ERREUR', color: '#DC2626', icon: AlertCircle, label: t('error') || 'Erreur' };
        return { type: 'OK', color: '#059669', icon: CheckCircle2, label: 'OK' };
    };

    const auditResults = useMemo(() => {
        if (!pointagesMois) return [];
        return pointagesMois.map(p => {
            const emp = employes.find(e => e.id === p.employe_id);
            return {
                ...p,
                employe_nom:    emp?.nom    ?? p.employe_nom    ?? '',
                employe_prenom: emp?.prenom ?? p.employe_prenom ?? '',
                audit: getAuditStatus(p),
            };
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pointagesMois, employes, t]);
    const filteredResults = useMemo(() => auditResults.filter(r => `${r.employe_prenom} ${r.employe_nom}`.toLowerCase().includes(searchTerm.toLowerCase())), [auditResults, searchTerm]);
    const stats = useMemo(() => {
        const total = auditResults.length, ok = auditResults.filter(r => r.audit.type === 'OK').length;
        const errors = auditResults.filter(r => r.audit.type === 'ERREUR').length, missing = auditResults.filter(r => r.audit.type === 'OUBLI').length;
        return { total, ok, errors, missing };
    }, [auditResults]);

    const handleGeneratePDF = async () => {
        setIsGenerating(true);
        try {
            if (!auditResults || auditResults.length === 0) { toast.error(t('updateError') || 'Aucune donnée'); return; }
            await generateChefAuditPDF(auditResults, { month: selectedMonth + 1, year: selectedYear, chefName: 'Chef Centrale', language });
            toast.success(t('updateSuccess'));
        } catch (error) { toast.error(t('updateError')); console.error(error); } finally { setIsGenerating(false); }
    };

    const prevMonth = () => { setSelectedMonth(prev => { if (prev === 0) { setSelectedYear(y => y - 1); return 11; } return prev - 1; }); };
    const nextMonth = () => { setSelectedMonth(prev => { if (prev === 11) { setSelectedYear(y => y + 1); return 0; } return prev + 1; }); };

    return (
        <div className="p-6" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
            {/* HEADER */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="font-medium mb-1" style={{ fontSize: '12px', color: '#94A3B8' }}>Contrôle qualité</p>
                    <h1 className="font-bold" style={{ fontSize: '24px', color: '#1E293B' }}>Rapport d'<span style={{ color: '#1E40AF' }}>audit</span></h1>
                </div>
                <button onClick={handleGeneratePDF} disabled={isGenerating}
                    className="h-10 px-5 rounded-lg font-semibold flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{ backgroundColor: '#1E40AF', color: '#FFFFFF', fontSize: '13px' }}>
                    {isGenerating ? <Zap className="animate-spin" size={16} /> : <FileText size={16} />}
                    {isGenerating ? 'Génération...' : t('generatePDF')}
                </button>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total saisies', value: stats.total, icon: Activity, color: '#1E293B' },
                    { label: 'Conformes', value: stats.ok, icon: CheckCircle2, color: '#059669' },
                    { label: 'Erreurs', value: stats.errors, icon: AlertCircle, color: '#DC2626' },
                    { label: 'Manquants', value: stats.missing, icon: Clock, color: '#D97706' },
                ].map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .04 }}
                        className="rounded-xl p-4" style={{ backgroundColor: '#FFFFFF', border: s.value > 0 && s.label === 'Erreurs' ? '2px solid #FECACA' : '1px solid #E2E8F0' }}>
                        <s.icon size={18} style={{ color: s.color, marginBottom: 6 }} />
                        <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{s.label}</p>
                        <p className="font-bold" style={{ fontSize: '28px', color: s.color }}>{s.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* CONTROL + RESULTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                <div className="space-y-4">
                    {/* Scope */}
                    <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                        <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <h3 className="font-semibold" style={{ fontSize: '14px', color: '#1E293B' }}>Période</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={prevMonth} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}><ChevronLeft size={14}/></button>
                                <span className="font-medium min-w-[100px] text-center" style={{ fontSize: '13px', color: '#1E293B' }}>{monthName} {selectedYear}</span>
                                <button onClick={nextMonth} className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}><ChevronRight size={14}/></button>
                            </div>
                        </div>
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: '#94A3B8' }} />
                            <input type="text" placeholder="Filtrer par nom..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 rounded-lg outline-none" style={{ fontSize: '13px', fontWeight: 500, color: '#1E293B', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }} />
                        </div>
                        <div className="p-3 rounded-lg flex items-center gap-2" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stats.errors === 0 ? '#059669' : '#DC2626' }} />
                            <span style={{ fontSize: '12px', fontWeight: 500, color: stats.errors === 0 ? '#059669' : '#DC2626' }}>
                                {stats.errors === 0 ? 'Données conformes' : 'Anomalies détectées'}
                            </span>
                        </div>
                    </div>
                    {/* Compliance progress */}
                    <div className="rounded-xl p-5" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                        <p className="font-medium mb-2" style={{ fontSize: '12px', color: '#94A3B8' }}>Conformité</p>
                        <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
                            <div className="h-full rounded-full transition-all" style={{ backgroundColor: '#059669', width: `${stats.total > 0 ? (stats.ok / stats.total) * 100 : 0}%` }} />
                        </div>
                        <p className="font-semibold mt-2" style={{ fontSize: '14px', color: '#059669' }}>
                            {stats.total > 0 ? Math.round((stats.ok / stats.total) * 100) : 0}% conforme
                        </p>
                    </div>
                </div>

                {/* RESULTS LIST */}
                <div className="lg:col-span-2 rounded-xl overflow-hidden flex flex-col" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', maxHeight: 520 }}>
                    <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <h3 className="font-semibold flex items-center gap-2" style={{ fontSize: '14px', color: '#1E293B' }}>
                            <Activity size={16} style={{ color: '#1E40AF' }} /> Résultats d'audit
                        </h3>
                        <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{filteredResults.length} entrées</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {filteredResults.map((res, i) => (
                            <div key={res.id} className="p-4 rounded-xl transition-all"
                                style={{ backgroundColor: res.audit.type === 'ERREUR' ? '#FEF2F2' : '#FAFBFC', border: '1px solid #F1F5F9' }}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', fontSize: '12px', fontWeight: 600 }}>
                                            <UserCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="font-semibold" style={{ fontSize: '14px', color: '#1E293B' }}>{res.employe_nom} {res.employe_prenom}</p>
                                            <div className="flex gap-3 mt-0.5">
                                                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>Statut: <span style={{ color: '#475569' }}>{res.statut || 'N/A'}</span></span>
                                                <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>HS: <span style={{ color: '#D97706' }}>{res.heures_supp}H</span></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {res.audit.type === 'ERREUR' ? (
                                            <span className="font-bold" style={{ fontSize: '15px', color: '#DC2626' }}>Erreur</span>
                                        ) : (
                                            <span className="flex items-center gap-1 font-semibold" style={{ fontSize: '12px', color: res.audit.color }}>
                                                <res.audit.icon size={14} /> {res.audit.label}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredResults.length === 0 && !loading && (
                            <div className="py-16 text-center">
                                <Database size={40} style={{ color: '#E2E8F0' }} className="mx-auto mb-3" />
                                <p style={{ fontSize: '13px', color: '#94A3B8' }}>Aucune donnée pour cette période</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};