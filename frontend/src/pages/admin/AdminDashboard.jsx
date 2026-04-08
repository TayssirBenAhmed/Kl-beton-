"use client";

import { useEffect, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import {
    Clock,
    CheckCircle2,
    Calendar as CalendarIcon,
    XCircle,
    TrendingUp,
    Wallet,
    Users,
    ChevronLeft,
    ChevronRight,
    Sun,
    Coffee,
    Heart,
    Lock,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { payrollPdfService } from '../../lib/services/payrollPdfService';
import API from '../../services/api';
import { Modal } from '../../components/ui/Modal';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, ArcElement,
    LineElement, PointElement, Title, Tooltip, Legend, Filler
);

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400, backgroundColor:'#F8FAFC' }}>
                <div style={{ width:40, height:40, border:'3px solid #E2E8F0', borderTopColor:'#1E40AF', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        }>
            <AdminDashboardContent />
        </Suspense>
    );
}

export const AdminDashboard = AdminDashboardPage;

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function AdminDashboardContent() {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const isRTL = language === 'ar';

    const todayStr = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(todayStr);
    const [, setSelectedPeriod] = useState('today');
    const [customDate, ] = useState(date);
    const [stats, setStats] = useState(null);
    const [todayDistribution, setTodayDistribution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [, setGeneratingPDF] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => { if (date) fetchStats(); }, [date]);

    useEffect(() => {
        const interval = setInterval(() => { if (date) fetchStats(); }, 10000);
        return () => clearInterval(interval);
    }, [date]);

    const handlePeriodChange = (period) => {
        setSelectedPeriod(period);
        switch (period) {
            case 'today': setDate(new Date().toISOString().split('T')[0]); break;
            case 'thisWeek': {
                const cur = new Date();
                const diff = cur.getDate() - cur.getDay() + (cur.getDay() === 0 ? -6 : 1);
                const mon = new Date(cur); mon.setDate(diff);
                setDate(mon.toISOString().split('T')[0]); break;
            }
            case 'thisMonth': {
                const first = new Date(); first.setDate(1);
                setDate(first.toISOString().split('T')[0]); break;
            }
            case 'custom': setDate(customDate); break;
        }
    };

    const getLocale = () => language === 'ar' ? 'ar-SA' : language === 'en' ? 'en-US' : 'fr-FR';

    const dateObj  = new Date(date + 'T12:00:00');
    const month    = dateObj.getMonth();
    const year     = dateObj.getFullYear();
    const monthLabel = (language === 'ar' ? MONTHS_AR : MONTHS_FR)[month];

    const prevMonth = () => {
        const d = new Date(date + 'T12:00:00');
        d.setDate(1); d.setMonth(d.getMonth() - 1);
        setDate(d.toISOString().split('T')[0]);
    };
    const nextMonth = () => {
        const d = new Date(date + 'T12:00:00');
        d.setDate(1); d.setMonth(d.getMonth() + 1);
        setDate(d.toISOString().split('T')[0]);
    };

    const fetchStats = async () => {
        try {
            setLoading(true);
            const m   = new Date(date).getMonth() + 1;
            const y   = new Date(date).getFullYear();
            const res = await API.stats.getDashboard(m, y);
            if (!res.success) throw new Error(res.error || 'Erreur API');
            setStats(res.data || {});
            try {
                const pRes = await API.pointages.getByDate(date);
                if (pRes.success && Array.isArray(pRes.data)) {
                    const map = {};
                    pRes.data.forEach(r => { if (r?.employe_id) map[r.employe_id] = r.statut; });
                    const counts = {};
                    Object.values(map).forEach(s => { counts[s] = (counts[s] || 0) + 1; });
                    setTodayDistribution(counts);
                } else setTodayDistribution(null);
            } catch { setTodayDistribution(null); }
        } catch (err) {
            console.error('Erreur chargement stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = () => {
        setGeneratingPDF(true);
        try {
            const m = new Date(date).getMonth() + 1;
            const y = new Date(date).getFullYear();
            payrollPdfService.generateGlobalRecap(m, y, stats.employes || []);
            setShowSuccess(true);
        } catch (err) {
            console.error('Erreur génération rapport:', err);
        } finally {
            setGeneratingPDF(false);
        }
    };

    /* ── LOADING ── */
    if (loading) return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', backgroundColor:'#F8FAFC', gap:12 }}>
            <div style={{ width:40, height:40, border:'3px solid #E2E8F0', borderTopColor:'#1E40AF', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
            <p style={{ fontSize:13, color:'#94A3B8', fontWeight:500 }}>Chargement...</p>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    if (!stats) return null;

    /* ── LOGIQUE ORIGINALE INTACTE ── */
    const allEmployees    = stats.employe_stats || [];
    const totalEmployes   = stats.employes_count || allEmployees.length || 0;
    const totalAvances    = allEmployees.reduce((s, e) => s + (e.avances || 0), 0);
    const totalSalaireNet = stats.net_total || allEmployees.reduce((s, e) => s + (e.net || 0), 0);

    const dist    = stats.distribution || [];
    const getDist = (key) => {
        if (todayDistribution) return todayDistribution[key] || 0;
        const row = dist.find(r => r.statut === key);
        return row ? (row.count || 0) : 0;
    };
    const presents = getDist('PRESENT');
    const absents  = getDist('ABSENT');
    const conges   = getDist('CONGE');
    const maladies = getDist('MALADIE');
    const feries   = getDist('FERIE');

    const totalAttendus = totalEmployes;
    const totalSaisis   = (presents + absents + conges + maladies + feries) || (stats.pointages_today || 0);

    let validationState = 'NONE';
    if (totalSaisis === 0) validationState = 'NONE';
    else if (totalSaisis < totalAttendus) validationState = 'PARTIAL';
    else validationState = 'VALIDATED';

    const getStatusConfig = () => {
        switch (validationState) {
            case 'VALIDATED': return { color:'#059669', bg:'#F0FDF4', border:'#BBF7D0', Icon: CheckCircle2, text: 'Journée entièrement saisie et validée' };
            case 'PARTIAL':   return { color:'#D97706', bg:'#FFFBEB', border:'#FDE68A', Icon: Clock,        text: `Saisie en cours (${totalSaisis}/${totalAttendus})` };
            default:          return { color:'#DC2626', bg:'#FEF2F2', border:'#FECACA', Icon: XCircle,      text: 'Aucune saisie détectée' };
        }
    };
    const statusCfg  = getStatusConfig();
    const StatusIcon = statusCfg.Icon;

    const hsDataSource = stats.hs_par_employe || [];

    /* ── CHART DATA (options identiques à l'original) ── */
    const doughnutData = {
        labels: ['Présents', 'Absents', 'Congés', 'Maladie', 'Férié'],
        datasets: [{
            data: [presents, absents, conges, maladies, feries],
            backgroundColor: ['#059669','#DC2626','#D97706','#7C3AED','#1E40AF'],
            borderWidth: 0,
            hoverOffset: 4,
        }]
    };

    const doughnutOptions = {
        responsive: false,
        cutout: '80%',
        plugins: {
            legend: { display: false },
            tooltip: { backgroundColor:'#1E293B', padding:10 }
        }
    };

    const barData = {
        labels: hsDataSource.map(e => (e.nom || '').toUpperCase()),
        datasets: [{
            label: 'Heures sup (h)',
            data: hsDataSource.map(e => e.hs || 0),
            backgroundColor: '#1E293B',
            borderRadius: 4,
            barThickness: 24,
        }]
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend:{ display:false }, tooltip:{ backgroundColor:'#1E293B', padding:10 } },
        scales: {
            y: { grid:{ color:'#F1F5F9' }, ticks:{ color:'#94A3B8', font:{ size:11 } } },
            x: { grid:{ display:false },   ticks:{ color:'#64748B', font:{ size:11, weight:'bold' } } }
        }
    };

    /* ── DONNÉES UI ── */
    const presenceCfg = [
        { key:'PRESENT', label:'Présents', count:presents, color:'#059669', bg:'#F0FDF4', border:'#BBF7D0', Icon:CheckCircle2 },
        { key:'ABSENT',  label:'Absents',  count:absents,  color:'#DC2626', bg:'#FEF2F2', border:'#FECACA', Icon:XCircle      },
        { key:'CONGE',   label:'Congés',   count:conges,   color:'#D97706', bg:'#FFFBEB', border:'#FDE68A', Icon:Coffee       },
        { key:'MALADIE', label:'Maladie',  count:maladies, color:'#7C3AED', bg:'#F5F3FF', border:'#DDD6FE', Icon:Heart        },
        { key:'FERIE',   label:'Fériés',   count:feries,   color:'#1E40AF', bg:'#EFF6FF', border:'#BFDBFE', Icon:Sun          },
    ];

    const kpiFinanciers = [
        { label:'Net à payer',     value:totalSalaireNet.toFixed(3),         color:'#059669', Icon:Wallet     },
        { label:'Dette totale',    value:(stats.dette_total||0).toFixed(3),  color:'#DC2626', Icon:XCircle    },
        { label:'Avances du mois', value:totalAvances.toFixed(3),            color:'#D97706', Icon:TrendingUp  },
        { label:'Brut total',      value:(stats.brut_total||0).toFixed(3),   color:'#1E293B', Icon:Users      },
    ];

    /* ─────────────────────────────────────────
       RENDER
    ───────────────────────────────────────── */
    return (
        <div
            dir={isRTL ? 'rtl' : 'ltr'}
            className="p-6 pb-12"
            style={{ backgroundColor:'#F8FAFC', minHeight:'100vh' }}
        >
            {/* ── HEADER ── */}
            <div className="mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div>
                    <p className="font-medium mb-1" style={{ fontSize:'12px', color:'#94A3B8' }}>Admin · Tableau de bord</p>
                    <h1 className="font-bold" style={{ fontSize:'24px', color:'#1E293B' }}>
                        Vue d'<span style={{ color:'#1E40AF' }}>ensemble</span>
                    </h1>
                    <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md w-fit"
                        style={{ backgroundColor:'#F1F5F9', border:'1px solid #E2E8F0' }}>
                        <Lock size={11} style={{ color:'#94A3B8' }} />
                        <span style={{ fontSize:'11px', fontWeight:500, color:'#94A3B8' }}>Mode consultation</span>
                    </div>
                </div>

                {/* nav mois + date picker */}
                <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={prevMonth}
                        className="w-8 h-8 flex items-center justify-center rounded-lg"
                        style={{ backgroundColor:'#FFFFFF', border:'1px solid #E2E8F0', color:'#64748B', cursor:'pointer' }}>
                        <ChevronLeft size={15} />
                    </button>
                    <div className="px-4 py-1.5 rounded-lg font-semibold text-center"
                        style={{ backgroundColor:'#EFF6FF', border:'1px solid #BFDBFE', color:'#1E40AF', fontSize:'13px', minWidth:140 }}>
                        {monthLabel} {year}
                    </div>
                    <button onClick={nextMonth}
                        className="w-8 h-8 flex items-center justify-center rounded-lg"
                        style={{ backgroundColor:'#FFFFFF', border:'1px solid #E2E8F0', color:'#64748B', cursor:'pointer' }}>
                        <ChevronRight size={15} />
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor:'#FFFFFF', border:'1px solid #E2E8F0' }}>
                        <CalendarIcon size={13} style={{ color:'#94A3B8' }} />
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            style={{ background:'transparent', border:'none', outline:'none', fontSize:'12px', fontWeight:500, color:'#64748B', cursor:'pointer' }}
                        />
                    </div>
                </div>
            </div>

            {/* ── ZONE A : KPI FINANCIERS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
                {kpiFinanciers.map((k, i) => (
                    <div key={i} className="rounded-xl p-3"
                        style={{ backgroundColor:'#FFFFFF', border:'1px solid #E2E8F0' }}>
                        <k.Icon size={14} style={{ color:k.color, marginBottom:6 }} />
                        <p style={{ fontSize:'10px', color:'#94A3B8', fontWeight:500 }}>{k.label}</p>
                        <p className="font-bold" style={{ fontSize:'20px', color:k.color, fontFamily:'monospace' }}>{k.value}</p>
                        <p style={{ fontSize:'10px', color:'#94A3B8', fontWeight:500, marginTop:2 }}>TND</p>
                    </div>
                ))}
            </div>

            {/* ── ZONE B : PRÉSENCES KPI (calqué AdminPointageView) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 mb-4">
                {/* total */}
                <div className="rounded-xl p-3" style={{ backgroundColor:'#FFFFFF', border:'1px solid #E2E8F0' }}>
                    <Users size={14} style={{ color:'#D97706', marginBottom:6 }} />
                    <p style={{ fontSize:'10px', color:'#94A3B8', fontWeight:500 }}>Total</p>
                    <p className="font-bold" style={{ fontSize:'20px', color:'#1E293B' }}>{totalEmployes}</p>
                </div>
                {/* statuts */}
                {presenceCfg.map(({ key, label, count, color, bg, border, Icon }) => (
                    <div key={key} className="rounded-xl p-3"
                        style={{ backgroundColor:'#FFFFFF', border:`1px solid ${border}` }}>
                        <Icon size={14} style={{ color, marginBottom:6 }} />
                        <p style={{ fontSize:'10px', color:'#94A3B8', fontWeight:500 }}>{label}</p>
                        <p className="font-bold" style={{ fontSize:'20px', color }}>{count}</p>
                    </div>
                ))}
                {/* taux présence */}
                <div className="rounded-xl p-3" style={{ backgroundColor:'#FFFFFF', border:'1px solid #E2E8F0' }}>
                    <TrendingUp size={14} style={{ color:'#059669', marginBottom:6 }} />
                    <p style={{ fontSize:'10px', color:'#94A3B8', fontWeight:500 }}>Taux présence</p>
                    <p className="font-bold" style={{ fontSize:'20px', color:'#059669' }}>
                        {totalSaisis > 0 ? Math.round((presents / totalSaisis) * 100) : 0}%
                    </p>
                </div>
            </div>

            {/* ── ZONE C : BANDEAU STATUT SAISIE ── */}
            <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between flex-wrap gap-3"
                style={{ backgroundColor:'#FFFFFF', border:'1px solid #E2E8F0' }}>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                        style={{ backgroundColor:statusCfg.bg, color:statusCfg.color, border:`1px solid ${statusCfg.border}`, fontSize:'11px', fontWeight:600 }}>
                        <StatusIcon size={12} />
                        {statusCfg.text}
                    </span>
                </div>
                <span style={{ fontSize:'12px', color:'#94A3B8', fontWeight:500 }}>
                    Progression : <strong style={{ color:'#1E293B' }}>{totalSaisis} / {totalAttendus}</strong>
                </span>
            </div>

            {/* ── ZONE D : GRAPHIQUES ── */}
            <div className="grid gap-3" style={{ gridTemplateColumns:'260px 1fr' }}>

                {/* Doughnut */}
                <div className="rounded-xl p-5 flex flex-col items-center"
                    style={{ backgroundColor:'#FFFFFF', border:'1px solid #E2E8F0' }}>
                    <p className="font-semibold mb-4" style={{ fontSize:'12px', color:'#64748B' }}>Répartition présences</p>
                    <div style={{ position:'relative', width:180, height:180, marginBottom:16 }}>
                        <Doughnut data={doughnutData} options={doughnutOptions} width={180} height={180} />
                        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                            <span style={{ fontSize:32, fontWeight:700, color:'#1E293B', fontFamily:'monospace', lineHeight:1 }}>{presents}</span>
                            <span style={{ fontSize:10, color:'#94A3B8', fontWeight:500, marginTop:3 }}>présents</span>
                        </div>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px 14px', width:'100%' }}>
                        {presenceCfg.map(li => (
                            <div key={li.key} style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <div style={{ width:8, height:8, borderRadius:'50%', backgroundColor:li.color, flexShrink:0 }} />
                                <span style={{ fontSize:11, fontWeight:500, color:'#64748B' }}>{li.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bar chart */}
                <div className="rounded-xl p-5" style={{ backgroundColor:'#FFFFFF', border:'1px solid #E2E8F0' }}>
                    <p className="font-semibold mb-4" style={{ fontSize:'12px', color:'#64748B' }}>
                        Analyse des heures supplémentaires
                    </p>
                    <div style={{ height:280 }}>
                        <Bar data={barData} options={barOptions} />
                    </div>
                </div>
            </div>

            {/* ── MODAL SUCCESS (logique originale) ── */}
            <Modal isOpen={showSuccess} onClose={() => setShowSuccess(false)} title={t('reportGeneratedTitle') || 'Rapport généré'}>
                <div className="space-y-4">
                    <p style={{ fontSize:'13px', color:'#64748B', fontWeight:500 }}>
                        {t('reportGeneratedMessage') || 'Le rapport a été généré et téléchargé.'}
                    </p>
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowSuccess(false)}
                            className="px-4 py-2 rounded-xl font-semibold"
                            style={{ backgroundColor:'#1E293B', color:'#fff', fontSize:'13px' }}>
                            OK
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}