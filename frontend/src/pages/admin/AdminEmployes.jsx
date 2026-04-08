import React, { useState, useEffect, useMemo } from 'react';
import { useEmployeStore } from '../../stores/employeStore';
import { useNavigate } from 'react-router-dom';
import { usePointageStore } from '../../stores/pointageStore';
import { useAvanceStore } from '../../stores/avanceStore';
import { usePretStore } from '../../stores/pretStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, UserPlus, Trash2, HardHat, Edit2, X, Filter,
  Download, Briefcase, Wallet, Clock, CheckCircle2,
  Hash, FilterX, User, ShieldCheck, Mail, Calendar, Info,
  Activity, TrendingUp, LayoutGrid, List, ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { payrollCalculator } from '../../utils/payrollCalculator';

export const AdminEmployes = () => {
  const navigate = useNavigate();
  const { employes, fetchAll: fetchEmployes, create, update, delete: remove, loading: empLoading } = useEmployeStore();
  const { pointagesMois, fetchByMonth, loading: pointageLoading } = usePointageStore();
  const { avances, fetchAll: fetchAvances } = useAvanceStore();
  const { prets, fetchAll: fetchPrets, create: createPret } = usePretStore();
  const { t, language } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPoste, setFilterPoste] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmploye, setEditingEmploye] = useState(null);
  const [selectedEmploye, setSelectedEmploye] = useState(null);
  const [isPretModalOpen, setIsPretModalOpen] = useState(false);
  const [pretForm, setPretForm] = useState({ montant_total: '', mensualite: '' });
  const [pretLoading, setPretLoading] = useState(false);

  const [currentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchEmployes();
    fetchByMonth(currentMonth, currentYear);
    fetchAvances();
    fetchPrets();
  }, [fetchEmployes, fetchByMonth, fetchAvances, fetchPrets, currentMonth, currentYear]);

  const pretActifForSelected = selectedEmploye
    ? prets.find(pr => pr.employe_id === selectedEmploye.id && pr.statut === 'ACTIF') || null
    : null;

  const handleCreatePret = async () => {
    const montant = parseFloat(pretForm.montant_total);
    const mensualite = parseFloat(pretForm.mensualite);
    if (!selectedEmploye || isNaN(montant) || montant <= 0 || isNaN(mensualite) || mensualite <= 0) {
      return toast.error('Montant et mensualité requis');
    }
    if (mensualite > montant) {
      return toast.error('La mensualité ne peut pas dépasser le montant total');
    }
    setPretLoading(true);
    const res = await createPret(selectedEmploye.id, montant, mensualite);
    setPretLoading(false);
    if (res.success) {
      toast.success('Prêt attribué avec succès');
      setPretForm({ montant_total: '', mensualite: '' });
      setIsPretModalOpen(false);
    } else {
      toast.error(res.error || 'Erreur lors de la création du prêt');
    }
  };

  const enrichedEmployes = useMemo(() => {
    return employes.map(emp => {
      const empPointages = pointagesMois.filter(p => Number(p.employe_id) === Number(emp.id));
      const empAvances   = avances.filter(a => Number(a.employe_id) === Number(emp.id) && a.statut === 'APPROVED');
      const pretActif    = prets.find(pr => Number(pr.employe_id) === Number(emp.id) && pr.statut === 'ACTIF') || null;
      const payroll      = payrollCalculator.calculateMonthly(emp, empPointages, empAvances, false, pretActif);
      return { ...emp, payroll };
    });
  }, [employes, pointagesMois, avances, prets]);

  const postes = useMemo(() => [...new Set(employes.map(e => e.poste).filter(Boolean))].sort(), [employes]);

  const filtered = enrichedEmployes.filter(e =>
    (`${e.nom} ${e.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.employee_id && e.employee_id.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (!filterPoste || e.poste === filterPoste)
  );

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm(t('delete') + '?')) {
      const res = await remove(id);
      if (res.success) toast.success(t('updateSuccess'));
      else toast.error(res.error);
    }
  };

  const handleEdit = (emp) => { setEditingEmploye(emp); setIsAddModalOpen(true); };
  const isRTL = language === 'ar';

  return (
    <div className="relative p-6" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* HEADER */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="font-medium mb-1" style={{ fontSize: '12px', color: '#94A3B8' }}>Gestion du personnel</p>
          <h1 className="font-bold" style={{ fontSize: '24px', color: '#1E293B' }}>
            {t('employees') || 'Collaborateurs'}
          </h1>
        </div>
        <button onClick={() => setIsAddModalOpen(true)}
          className="h-11 px-6 rounded-xl font-semibold flex items-center gap-2 transition-all active:scale-[0.98]"
          style={{ backgroundColor: '#1E40AF', color: '#FFFFFF', fontSize: '14px', boxShadow: '0 2px 8px rgba(30,64,175,0.2)' }}>
          <UserPlus size={18} /> {isRTL ? 'إضافة موظف' : 'Nouveau collaborateur'}
        </button>
      </div>

      {/* SEARCH BAR */}
      <div className="rounded-xl p-4 mb-6 flex flex-col md:flex-row gap-3 items-center"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: '#94A3B8' }} />
          <input type="text" placeholder={isRTL ? 'بحث عن موظف...' : 'Rechercher un collaborateur...'}
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-lg outline-none transition-all"
            style={{ fontSize: '14px', fontWeight: 500, color: '#1E293B', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }} />
        </div>
        <div className="relative">
          <select value={filterPoste} onChange={e => setFilterPoste(e.target.value)}
            className="h-10 pl-4 pr-8 rounded-lg appearance-none cursor-pointer"
            style={{ fontSize: '13px', fontWeight: 500, color: '#475569', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <option value="">Tous les postes</option>
            {postes.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex rounded-lg p-0.5 gap-0.5" style={{ backgroundColor: '#F1F5F9' }}>
          <button onClick={() => setViewMode('table')}
            className="w-9 h-9 rounded-md flex items-center justify-center transition-all"
            style={{ backgroundColor: viewMode === 'table' ? '#1E40AF' : 'transparent', color: viewMode === 'table' ? '#FFFFFF' : '#94A3B8' }}>
            <List size={16} />
          </button>
          <button onClick={() => setViewMode('grid')}
            className="w-9 h-9 rounded-md flex items-center justify-center transition-all"
            style={{ backgroundColor: viewMode === 'grid' ? '#1E40AF' : 'transparent', color: viewMode === 'grid' ? '#FFFFFF' : '#94A3B8' }}>
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="rounded-2xl overflow-hidden mb-12" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <table className={`w-full text-left border-collapse ${isRTL ? 'text-right' : ''}`}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <th className="px-5 py-3" style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>{isRTL ? 'الموظف' : 'Nom & Prénom'}</th>
                <th className="px-5 py-3" style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>{isRTL ? 'المركز' : 'Poste'}</th>
                <th className="px-5 py-3" style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>{isRTL ? 'أيام العمل' : 'Jours travaillés'}</th>
                <th className="px-5 py-3" style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>{isRTL ? 'ساعات إضافية' : 'Heures sup'}</th>
                <th className="px-5 py-3 text-right" style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>{isRTL ? 'صافي الدفع' : 'Net à payer'}</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((emp, idx) => (
                  <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                    onClick={() => setSelectedEmploye(emp)}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid #F1F5F9' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold"
                          style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', fontSize: '13px' }}>
                          {emp.prenom?.[0]}{emp.nom?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold" style={{ fontSize: '14px', color: '#1E293B' }}>{emp.nom} {emp.prenom}</p>
                          <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{emp.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 rounded-md" style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '12px', fontWeight: 500 }}>{emp.poste}</span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold" style={{ fontSize: '14px', color: '#1E293B' }}>{emp.payroll.presence} <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>jours</span></p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold" style={{ fontSize: '14px', color: '#1E293B' }}>{emp.payroll.hs} <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>heures</span></p>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <p className="font-bold" style={{ fontSize: '16px', color: '#1E293B' }}>
                        {emp.payroll.net} <span style={{ fontSize: '12px', color: '#D97706', fontWeight: 600 }}>TND</span>
                      </p>
                      {parseFloat(emp.payroll.dette) > 0 && (
                        <p style={{ fontSize: '11px', fontWeight: 600, color: '#DC2626', marginTop: 2 }}>Dette: {emp.payroll.dette}</p>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filtered.length === 0 && !empLoading && (
            <div className="py-16 text-center">
              <FilterX size={40} style={{ color: '#E2E8F0' }} className="mx-auto mb-3" />
              <p style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500 }}>Aucun collaborateur trouvé</p>
            </div>
          )}
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-12">
          <AnimatePresence>
            {filtered.map((emp, idx) => (
              <motion.div key={emp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                onClick={() => setSelectedEmploye(emp)}
                className="rounded-xl p-5 cursor-pointer transition-all"
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center font-semibold"
                    style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', fontSize: '14px' }}>
                    {emp.prenom?.[0]}{emp.nom?.[0]}
                  </div>
                  <span className="px-2 py-0.5 rounded-md" style={{ backgroundColor: '#F1F5F9', color: '#64748B', fontSize: '11px', fontWeight: 500 }}>{emp.poste}</span>
                </div>
                <h3 className="font-semibold mb-0.5" style={{ fontSize: '15px', color: '#1E293B' }}>{emp.nom} {emp.prenom}</h3>
                <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500, marginBottom: 12 }}>{emp.employee_id}</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Jours', val: emp.payroll.presence, color: '#1E293B' },
                    { label: 'H. Sup', val: emp.payroll.hs, color: '#7C3AED' },
                    { label: 'Net', val: emp.payroll.net, color: '#059669' },
                  ].map(s => (
                    <div key={s.label} className="p-2 rounded-lg text-center" style={{ backgroundColor: '#F8FAFC' }}>
                      <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, marginBottom: 2 }}>{s.label}</p>
                      <p className="font-semibold" style={{ fontSize: '14px', color: s.color }}>{s.val}</p>
                    </div>
                  ))}
                </div>
                {parseFloat(emp.payroll.dette) > 0 && (
                  <p className="mt-2 text-center" style={{ fontSize: '11px', fontWeight: 600, color: '#DC2626' }}>Dette: {emp.payroll.dette} TND</p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && !empLoading && (
            <div className="col-span-3 py-16 text-center rounded-xl" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
              <FilterX size={40} style={{ color: '#E2E8F0' }} className="mx-auto mb-3" />
              <p style={{ fontSize: '13px', color: '#94A3B8' }}>Aucun collaborateur trouvé</p>
            </div>
          )}
        </div>
      )}

      {/* DETAIL DRAWER */}
      <AnimatePresence>
        {selectedEmploye && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedEmploye(null)} className="fixed inset-0 bg-black/30 z-[200]" />
            <motion.div initial={{ x: isRTL ? -420 : 420 }} animate={{ x: 0 }} exit={{ x: isRTL ? -420 : 420 }}
              className={`fixed top-0 bottom-0 w-[420px] bg-white z-[210] flex flex-col ${isRTL ? 'left-0 border-r' : 'right-0 border-l'}`}
              style={{ borderColor: '#E2E8F0', boxShadow: '-8px 0 24px rgba(0,0,0,0.08)' }}>

              {/* Header */}
              <div className="p-5 pb-4" style={{ borderBottom: '1px solid #F1F5F9' }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-semibold"
                    style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', fontSize: '16px' }}>
                    {selectedEmploye.prenom?.[0]}{selectedEmploye.nom?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold truncate" style={{ fontSize: '17px', color: '#1E293B' }}>
                      {selectedEmploye.prenom} <span style={{ color: '#1E40AF' }}>{selectedEmploye.nom}</span>
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md" style={{ backgroundColor: '#F0FDF4', color: '#059669', fontSize: '11px', fontWeight: 600, border: '1px solid #BBF7D0' }}>Actif</span>
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>ID: {selectedEmploye.employee_id || '—'}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedEmploye(null)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}><X size={14} /></button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Embauche', val: new Date(selectedEmploye.date_embauche).toLocaleDateString('fr-FR') },
                    { label: 'Salaire', val: `${selectedEmploye.salaire_base?.toLocaleString()}` },
                    { label: 'Journalier', val: `${(selectedEmploye.salaire_base / 26).toFixed(2)}` },
                    { label: 'Taux hor.', val: `${(selectedEmploye.salaire_base / 208).toFixed(2)}` },
                  ].map(m => (
                    <div key={m.label} className="rounded-lg p-2 text-center" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                      <p style={{ fontSize: '9px', color: '#94A3B8', fontWeight: 500, marginBottom: 2 }}>{m.label}</p>
                      <p className="font-semibold" style={{ fontSize: '12px', color: '#1E293B' }}>{m.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Stats */}
                <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                  <p className="font-semibold mb-3" style={{ fontSize: '12px', color: '#64748B' }}>Statistiques individuelles</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Présence', val: selectedEmploye.payroll.presence, unit: 'J', color: '#1E293B' },
                      { label: 'H. Supp', val: `+${selectedEmploye.payroll.hs}`, unit: 'H', color: '#D97706' },
                      { label: 'Net TND', val: selectedEmploye.payroll.net, unit: '', color: '#059669' },
                    ].map(s => (
                      <div key={s.label} className="rounded-lg p-2.5 text-center" style={{ backgroundColor: '#FFFFFF', border: '1px solid #F1F5F9' }}>
                        <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, marginBottom: 2 }}>{s.label}</p>
                        <span className="font-bold" style={{ fontSize: '18px', color: s.color }}>{s.val}</span>
                        {s.unit && <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: 2 }}>{s.unit}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Balances */}
                <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                  <p className="font-semibold mb-3" style={{ fontSize: '12px', color: '#D97706' }}>Soldes actuels</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#FFFFFF', border: '1px solid #F1F5F9' }}>
                      <div>
                        <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>Congés payés</p>
                        <span className="font-bold" style={{ fontSize: '17px', color: '#1E293B' }}>{selectedEmploye.solde_conges || 0}</span>
                        <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: 4 }}>jours</span>
                      </div>
                      <Briefcase size={16} style={{ color: '#D97706' }} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#FFFFFF', border: '1px solid #F1F5F9' }}>
                      <div>
                        <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500 }}>Congé maladie</p>
                        <span className="font-bold" style={{ fontSize: '17px', color: '#1E293B' }}>{selectedEmploye.solde_maladie || 0}</span>
                        <span style={{ fontSize: '11px', color: '#94A3B8', marginLeft: 4 }}>jours</span>
                      </div>
                      <Activity size={16} style={{ color: '#DC2626' }} />
                    </div>
                  </div>
                </div>

                {/* Payroll Analysis */}
                <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                  <p className="font-semibold mb-3" style={{ fontSize: '12px', color: '#64748B' }}>Analyse paie courante</p>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Brut calculé', val: selectedEmploye.payroll.brut, sign: '', color: '#1E293B' },
                      { label: 'CNSS (9.18%)', val: selectedEmploye.payroll.cnss, sign: '−', color: '#64748B' },
                      { label: 'IRPP', val: selectedEmploye.payroll.irpp, sign: '−', color: '#64748B' },
                      { label: 'CSS (1%)', val: selectedEmploye.payroll.css, sign: '−', color: '#64748B' },
                      { label: 'Avances déduites', val: selectedEmploye.payroll.avances, sign: '−', color: '#DC2626' },
                      ...(parseFloat(selectedEmploye.payroll.mensualitePret) > 0 ? [
                        { label: 'Remboursement Prêt', val: selectedEmploye.payroll.mensualitePret, sign: '−', color: '#7C3AED' }
                      ] : []),
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: row.color === '#7C3AED' ? '#7C3AED' : '#94A3B8' }}>{row.label}</span>
                        <span className="font-semibold" style={{ fontSize: '13px', color: row.color }}>{row.sign}{row.val} TND</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 flex justify-between items-end" style={{ borderTop: '1px solid #E2E8F0' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 500, marginBottom: 2 }}>Net à débourser</p>
                      <p className="font-bold" style={{ fontSize: '20px', color: '#059669' }}>{selectedEmploye.payroll.net} <span style={{ fontSize: '13px' }}>TND</span></p>
                    </div>
                    {parseFloat(selectedEmploye.payroll.dette) > 0 && (
                      <div className="px-2 py-1 rounded-lg" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
                        <p style={{ fontSize: '10px', fontWeight: 600, color: '#DC2626' }}>Dette: {selectedEmploye.payroll.dette} TND</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Active loan info */}
              {pretActifForSelected && (
                <div className="mx-5 mb-3 p-3 rounded-xl" style={{ backgroundColor: '#FAF5FF', border: '1px solid #E9D5FF' }}>
                  <p style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 600, marginBottom: 4 }}>Prêt actif en cours</p>
                  <div className="flex justify-between" style={{ fontSize: '12px', color: '#6D28D9' }}>
                    <span>Mensualité : <strong>{pretActifForSelected.mensualite.toFixed(3)} TND</strong></span>
                    <span>Solde : <strong>{pretActifForSelected.solde_restant.toFixed(3)} TND</strong></span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="p-4 flex flex-col gap-2" style={{ borderTop: '1px solid #F1F5F9' }}>
                <button onClick={() => { navigate(`/admin/employee/${selectedEmploye.id}`); setSelectedEmploye(null); }}
                  className="w-full h-10 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{ backgroundColor: '#1E40AF', color: '#FFFFFF', fontSize: '13px' }}>
                  Voir profil complet
                </button>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(selectedEmploye)}
                    className="flex-1 h-10 rounded-xl font-medium flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '13px' }}>
                    <Edit2 size={14} /> Modifier
                  </button>
                  <button onClick={() => { setPretForm({ montant_total: '', mensualite: '' }); setIsPretModalOpen(true); }}
                    className="flex-1 h-10 rounded-xl font-medium flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: '#FAF5FF', color: '#7C3AED', fontSize: '13px', border: '1px solid #E9D5FF' }}>
                    <Wallet size={14} /> Prêt
                  </button>
                  <button onClick={e => { e.stopPropagation(); remove(selectedEmploye.id); setSelectedEmploye(null); }}
                    className="h-10 px-4 rounded-xl font-medium flex items-center justify-center"
                    style={{ backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '13px', border: '1px solid #FECACA' }}>
                    Supprimer
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PRET ATTRIBUTION MODAL */}
      <AnimatePresence>
        {isPretModalOpen && selectedEmploye && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsPretModalOpen(false)} className="absolute inset-0 bg-black/50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative z-10 rounded-2xl p-6 w-full max-w-sm"
              style={{ backgroundColor: '#FFFFFF', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>

              {/* Modal header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold" style={{ fontSize: '16px', color: '#1E293B' }}>Attribuer un Prêt</h3>
                  <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>
                    {selectedEmploye.nom} {selectedEmploye.prenom}
                  </p>
                </div>
                <button onClick={() => setIsPretModalOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}>
                  <X size={14} />
                </button>
              </div>

              {/* Existing loan warning */}
              {pretActifForSelected && (
                <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}>
                  <p style={{ fontSize: '12px', color: '#92400E', fontWeight: 600 }}>
                    Prêt actif — solde restant : {pretActifForSelected.solde_restant.toFixed(3)} TND
                  </p>
                  <p style={{ fontSize: '11px', color: '#B45309' }}>Un nouveau prêt sera créé en parallèle.</p>
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                    Montant Total (TND)
                  </label>
                  <input
                    type="number" min="0" step="0.001"
                    placeholder="ex: 3000.000"
                    value={pretForm.montant_total}
                    onChange={e => setPretForm(f => ({ ...f, montant_total: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl outline-none"
                    style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                    Mensualité (TND / mois)
                  </label>
                  <input
                    type="number" min="0" step="0.001"
                    placeholder="ex: 300.000"
                    value={pretForm.mensualite}
                    onChange={e => setPretForm(f => ({ ...f, mensualite: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl outline-none"
                    style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                  />
                  {pretForm.montant_total && pretForm.mensualite && parseFloat(pretForm.mensualite) > 0 && (
                    <p style={{ fontSize: '11px', color: '#7C3AED', marginTop: 6, fontWeight: 500 }}>
                      Durée estimée : {Math.ceil(parseFloat(pretForm.montant_total) / parseFloat(pretForm.mensualite))} mois
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsPretModalOpen(false)}
                  className="flex-1 h-10 rounded-xl font-medium"
                  style={{ backgroundColor: '#F1F5F9', color: '#475569', fontSize: '13px' }}>
                  Annuler
                </button>
                <button onClick={handleCreatePret} disabled={pretLoading}
                  className="flex-1 h-10 rounded-xl font-semibold flex items-center justify-center gap-2"
                  style={{ backgroundColor: pretLoading ? '#A78BFA' : '#7C3AED', color: '#FFFFFF', fontSize: '13px' }}>
                  {pretLoading ? 'Enregistrement...' : 'Confirmer le prêt'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD EMPLOYEE MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-black/40" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="rounded-2xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto relative z-10"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="font-bold" style={{ fontSize: '22px', color: '#1E293B' }}>{editingEmploye ? 'Modifier' : 'Nouveau'} <span style={{ color: '#1E40AF' }}>collaborateur</span></h2>
                  <p style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500, marginTop: 4 }}>{editingEmploye ? 'Mise à jour fiche RH' : 'Nouveau collaborateur RH'}</p>
                </div>
                <button onClick={() => { setIsAddModalOpen(false); setEditingEmploye(null); }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}><X size={18} /></button>
              </div>

              <form onSubmit={async e => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const data = {
                  nom: fd.get('nom'), prenom: fd.get('prenom'), poste: fd.get('poste'),
                  employee_id: fd.get('employee_id'), salaire_base: parseFloat(fd.get('salaire_base')),
                  prime_transport: parseFloat(fd.get('prime_transport')) || 60.0,
                  prime_presence: parseFloat(fd.get('prime_presence')) || 10.0,
                  irpp: parseFloat(fd.get('irpp')) || 0, css: parseFloat(fd.get('css')) || 0
                };
                const res = editingEmploye ? await update(editingEmploye.id, data) : await create(data);
                if (res.success) { toast.success(editingEmploye ? "Mise à jour réussie" : "Collaborateur créé"); setIsAddModalOpen(false); setEditingEmploye(null); }
                else { toast.error(res.error); }
              }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <p className="font-semibold" style={{ fontSize: '13px', color: '#1E40AF', borderBottom: '1px solid #F1F5F9', paddingBottom: 6 }}>Identité & Poste</p>
                    {[{ name: 'nom', ph: 'Nom de famille' }, { name: 'prenom', ph: 'Prénom' }, { name: 'poste', ph: 'Fonction / Poste' }, { name: 'employee_id', ph: 'Matricule' }].map(f => (
                      <div key={f.name}>
                        <label className="block mb-1" style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>{f.ph}</label>
                        <input name={f.name} required className="w-full px-4 py-2.5 rounded-lg outline-none transition-all"
                          style={{ fontSize: '14px', fontWeight: 500, color: '#1E293B', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}
                          placeholder={f.ph} defaultValue={editingEmploye?.[f.name]} />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <p className="font-semibold" style={{ fontSize: '13px', color: '#1E40AF', borderBottom: '1px solid #F1F5F9', paddingBottom: 6 }}>Structure de Paie</p>
                    <div className="rounded-xl p-4" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                      <div className="mb-4">
                        <label className="block mb-1" style={{ fontSize: '12px', fontWeight: 500, color: '#64748B' }}>Salaire de base (TND)</label>
                        <input name="salaire_base" type="number" step="0.001" required className="w-full px-4 py-2.5 rounded-lg outline-none font-bold"
                          style={{ fontSize: '22px', color: '#1E293B', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
                          placeholder="0.000" defaultValue={editingEmploye?.salaire_base} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { name: 'prime_transport', label: 'Prime Transport', def: '60.000' },
                          { name: 'prime_presence', label: 'Prime Présence', def: '10.000' },
                          { name: 'irpp', label: 'IRPP Mensuel', def: '0' },
                          { name: 'css', label: 'CSS', def: '0' },
                        ].map(f => (
                          <div key={f.name}>
                            <label className="block mb-1" style={{ fontSize: '11px', fontWeight: 500, color: '#94A3B8' }}>{f.label}</label>
                            <input name={f.name} type="number" defaultValue={f.def} className="w-full px-3 py-2 rounded-lg outline-none"
                              style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 h-11 rounded-xl font-medium transition-all"
                    style={{ backgroundColor: '#F1F5F9', color: '#64748B', fontSize: '14px' }}>Annuler</button>
                  <button type="submit" className="flex-[2] h-11 rounded-xl font-semibold transition-all active:scale-[0.98]"
                    style={{ backgroundColor: '#1E40AF', color: '#FFFFFF', fontSize: '14px', boxShadow: '0 2px 8px rgba(30,64,175,0.2)' }}>
                    {editingEmploye ? 'Mettre à jour' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};