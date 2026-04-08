import React, { useEffect, useMemo, useState } from 'react';
import { useAvanceStore } from '../../stores/avanceStore';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
   CheckCircle2, XCircle, Clock, Loader2, ShieldCheck, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

const AVANCE_T = {
   fr: {
      title: 'Contrôle des', titleAccent: 'Avances', subtitle: 'KL Béton · Contrôle Finances',
      pendingSuffix: 'en attente', requestDate: 'Date requête', requestedAmount: 'Montant sollicité',
      approve: 'Approuver', reject: 'Rejeter', noPending: 'Aucune avance en attente',
      history: 'Historique des transactions', colEmployee: 'Collaborateur', colDate: 'Date',
      colStatus: 'Statut', colAmount: 'Valeur TND', noHistory: 'Aucune transaction',
      approved: 'Approuvée', rejected: 'Rejetée',
      toastApproved: 'Avance approuvée avec succès', toastRejected: 'Avance rejetée',
   },
   ar: {
      title: 'مراقبة', titleAccent: 'السلف', subtitle: 'KL Béton · مراقبة المالية',
      pendingSuffix: 'في الانتظار', requestDate: 'تاريخ الطلب', requestedAmount: 'المبلغ المطلوب',
      approve: 'قبول', reject: 'رفض', noPending: 'لا توجد سلف في الانتظار',
      history: 'سجل المعاملات', colEmployee: 'الموظف', colDate: 'التاريخ',
      colStatus: 'الحالة', colAmount: 'القيمة (د.ت)', noHistory: 'لا توجد معاملات',
      approved: 'مقبولة', rejected: 'مرفوضة',
      toastApproved: 'تمت الموافقة على السلفة', toastRejected: 'تم رفض السلفة',
   },
   en: {
      title: 'Advance', titleAccent: 'Control', subtitle: 'KL Béton · Financial Control',
      pendingSuffix: 'pending', requestDate: 'Request Date', requestedAmount: 'Requested Amount',
      approve: 'Approve', reject: 'Reject', noPending: 'No pending advances',
      history: 'Transaction History', colEmployee: 'Employee', colDate: 'Date',
      colStatus: 'Status', colAmount: 'Amount TND', noHistory: 'No transactions',
      approved: 'Approved', rejected: 'Rejected',
      toastApproved: 'Advance approved successfully', toastRejected: 'Advance rejected',
   },
};

export const AdminAvances = () => {
   const { language } = useLanguage();
   const at = AVANCE_T[language] || AVANCE_T.fr;
   const isRTL = language === 'ar';

   const { avances, fetchAll, approve, reject, loading } = useAvanceStore();
   const [actionLoading, setActionLoading] = useState(null);

   useEffect(() => { fetchAll(); }, [fetchAll]);

   const pending = useMemo(() => avances.filter(a => a.statut === 'PENDING'), [avances]);
   const history = useMemo(() =>
      avances.filter(a => a.statut !== 'PENDING').sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20),
   [avances]);

   const handleApprove = async (id) => {
      setActionLoading(id);
      const res = await approve(id);
      setActionLoading(null);
      if (res.success) toast.success(at.toastApproved);
      else toast.error(res.error || 'Erreur');
   };

   const handleReject = async (id) => {
      setActionLoading(id);
      const res = await reject(id);
      setActionLoading(null);
      if (res.success) toast.success(at.toastRejected);
      else toast.error(res.error || 'Erreur');
   };

   return (
      <div className="relative p-6" dir={isRTL ? 'rtl' : 'ltr'} style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
         {/* HEADER */}
         <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <p className="font-medium mb-1" style={{ fontSize: '12px', color: '#94A3B8' }}>{at.subtitle}</p>
               <h1 className="font-bold" style={{ fontSize: '24px', color: '#1E293B' }}>
                  {at.title} <span style={{ color: '#1E40AF' }}>{at.titleAccent}</span>
               </h1>
            </div>
            {pending.length > 0 && (
               <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E' }}>
                  <Clock size={16} /> <span className="font-semibold" style={{ fontSize: '13px' }}>{pending.length} {at.pendingSuffix}</span>
               </div>
            )}
         </div>

         {/* PENDING CARDS */}
         <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 mb-10">
            <AnimatePresence>
               {pending.map((av, idx) => (
                  <motion.div key={av.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: idx * 0.04 }}
                     className="rounded-2xl p-6 flex flex-col" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                           <div className="w-11 h-11 rounded-xl flex items-center justify-center font-semibold"
                              style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', fontSize: '14px' }}>
                              {av.employe_prenom?.[0]}{av.employe_nom?.[0]}
                           </div>
                           <div>
                              <p className="font-semibold" style={{ fontSize: '15px', color: '#1E293B' }}>{av.employe_nom} {av.employe_prenom}</p>
                              <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{av.employe_poste}</p>
                           </div>
                        </div>
                        <div className={isRTL ? 'text-left' : 'text-right'}>
                           <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{at.requestDate}</p>
                           <p className="font-medium" style={{ fontSize: '13px', color: '#475569' }}>
                              {new Date(av.date).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'en' ? 'en-GB' : 'fr-FR')}
                           </p>
                        </div>
                     </div>

                     <div className="mb-6 p-5 rounded-xl text-center" style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                        <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500, marginBottom: 4 }}>{at.requestedAmount}</p>
                        <div className="flex items-center justify-center gap-2">
                           <span className="font-bold" style={{ fontSize: '32px', color: '#1E293B' }}>{av.montant?.toLocaleString()}</span>
                           <span className="font-semibold" style={{ fontSize: '14px', color: '#D97706' }}>TND</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleApprove(av.id)} disabled={actionLoading === av.id}
                           className="h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                           style={{ backgroundColor: '#059669', color: '#FFFFFF', fontSize: '13px' }}>
                           {actionLoading === av.id ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} /> {at.approve}</>}
                        </button>
                        <button onClick={() => handleReject(av.id)} disabled={actionLoading === av.id}
                           className="h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                           style={{ backgroundColor: '#FEF2F2', color: '#DC2626', fontSize: '13px', border: '1px solid #FECACA' }}>
                           {actionLoading === av.id ? <Loader2 className="animate-spin" size={18} /> : <><XCircle size={18} /> {at.reject}</>}
                        </button>
                     </div>
                  </motion.div>
               ))}
            </AnimatePresence>
         </div>

         {pending.length === 0 && !loading && (
            <div className="py-16 text-center rounded-2xl mb-10" style={{ backgroundColor: '#FFFFFF', border: '1px dashed #E2E8F0' }}>
               <ShieldCheck size={48} className="mx-auto mb-4" style={{ color: '#BBF7D0' }} />
               <p style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 500 }}>{at.noPending}</p>
            </div>
         )}

         {/* HISTORY TABLE */}
         <div className="rounded-2xl overflow-hidden mb-12" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div className="px-6 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #F1F5F9' }}>
               <Zap size={16} style={{ color: '#D97706' }} />
               <h3 className="font-semibold" style={{ fontSize: '15px', color: '#1E293B' }}>{at.history}</h3>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr style={{ backgroundColor: '#F8FAFC' }}>
                        <th className="px-6 py-3" style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{at.colEmployee}</th>
                        <th className="px-6 py-3" style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{at.colDate}</th>
                        <th className="px-6 py-3" style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{at.colStatus}</th>
                        <th className={`px-6 py-3 ${isRTL ? 'text-left' : 'text-right'}`} style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{at.colAmount}</th>
                     </tr>
                  </thead>
                  <tbody>
                     {history.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-10 text-center" style={{ fontSize: '13px', color: '#94A3B8' }}>{at.noHistory}</td></tr>
                     ) : history.map((av) => (
                        <tr key={av.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                           <td className="px-6 py-3">
                              <p className="font-semibold" style={{ fontSize: '14px', color: '#1E293B' }}>{av.employe_nom} {av.employe_prenom}</p>
                              <p style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{av.employe_poste}</p>
                           </td>
                           <td className="px-6 py-3" style={{ fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
                              {new Date(av.date).toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'en' ? 'en-GB' : 'fr-FR')}
                           </td>
                           <td className="px-6 py-3">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md" style={{
                                 fontSize: '12px', fontWeight: 600,
                                 backgroundColor: av.statut === 'APPROVED' ? '#F0FDF4' : '#FEF2F2',
                                 color: av.statut === 'APPROVED' ? '#059669' : '#DC2626',
                                 border: `1px solid ${av.statut === 'APPROVED' ? '#BBF7D0' : '#FECACA'}`,
                              }}>
                                 <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: av.statut === 'APPROVED' ? '#059669' : '#DC2626' }} />
                                 {av.statut === 'APPROVED' ? at.approved : at.rejected}
                              </span>
                           </td>
                           <td className={`px-6 py-3 ${isRTL ? 'text-left' : 'text-right'}`}>
                              <p className="font-semibold" style={{ fontSize: '16px', color: '#1E293B' }}>{av.montant?.toLocaleString()}</p>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};