import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, Users, DollarSign, Download, Activity, Zap, PieChart as PieIcon, BarChart as BarIcon, Calendar, Filter, ArrowUpRight, TrendingDown, ShieldCheck, Terminal, Cpu, Layers } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

export const Statistiques = () => {
  const { t, language } = useLanguage();
  const { isDarkMode } = useTheme();
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadStats = useCallback(async () => {
    try { setLoading(true); await new Promise(r => setTimeout(r, 600)); } catch (err) { toast.error(t('updateError')); } finally { setLoading(false); }
  }, [t]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const salaryEvolutionData = [
    { name: 'Jan', masse: 42000, net: 38500 }, { name: 'Fév', masse: 43500, net: 39800 },
    { name: 'Mar', masse: 44800, net: 41000 }, { name: 'Avr', masse: 45200, net: 41500 },
    { name: 'Mai', masse: 46800, net: 42800 }, { name: 'Jun', masse: 47500, net: 43500 },
    { name: 'Jul', masse: 48900, net: 44800 }, { name: 'Aoû', masse: 49500, net: 45200 },
    { name: 'Sep', masse: 50200, net: 46000 }, { name: 'Oct', masse: 51800, net: 47500 },
    { name: 'Nov', masse: 52500, net: 48200 }, { name: 'Déc', masse: 53800, net: 49200 },
  ];

  const postesData = [
    { name: 'Chef Centrale', value: 5, color: '#1E40AF' }, { name: 'Opérateur', value: 12, color: '#059669' },
    { name: 'Chauffeur', value: 18, color: '#D97706' }, { name: 'Maintenance', value: 4, color: '#7C3AED' },
    { name: 'Support', value: 6, color: '#DC2626' },
  ];

  const tooltipStyle = { background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#1E293B', fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#F8FAFC' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 rounded-full mb-4" style={{ border: '3px solid #E2E8F0', borderTopColor: '#1E40AF' }} />
      <p className="font-semibold" style={{ fontSize: '14px', color: '#1E40AF' }}>Chargement des statistiques...</p>
    </div>
  );

  return (
    <div className="p-6" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* HEADER */}
      <div className="mb-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div>
          <p className="font-medium mb-1" style={{ fontSize: '12px', color: '#94A3B8' }}>Analytiques</p>
          <h1 className="font-bold" style={{ fontSize: '24px', color: '#1E293B' }}>Statistiques <span style={{ color: '#1E40AF' }}>avancées</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-0.5 rounded-lg gap-0.5" style={{ backgroundColor: '#F1F5F9' }}>
            {['month', 'year'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-4 py-2 rounded-md font-medium transition-all"
                style={{ fontSize: '13px', backgroundColor: period === p ? '#1E40AF' : 'transparent', color: period === p ? '#FFFFFF' : '#64748B' }}>
                {p === 'month' ? 'Mensuel' : 'Annuel'}
              </button>
            ))}
          </div>
          <select className="px-3 py-2 rounded-lg font-medium outline-none cursor-pointer"
            style={{ fontSize: '14px', color: '#1E293B', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}
            value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="h-10 px-4 rounded-lg font-semibold flex items-center gap-2 transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#1E40AF', color: '#FFFFFF', fontSize: '13px' }}>
            <Download size={16} /> Exporter
          </button>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Masse salariale', val: '53,800', unit: 'DT', color: '#D97706', trend: '+8.2%', icon: DollarSign },
          { label: 'Moyenne unité', val: '2,242', unit: 'DT', color: '#1E40AF', trend: '+3.1%', icon: Users },
          { label: 'Taux opérationnel', val: '94.2', unit: '%', color: '#059669', trend: '+2.5%', icon: Activity },
          { label: 'Heures supp', val: '12.4', unit: 'H', color: '#DC2626', trend: '+5.8%', icon: TrendingUp }
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="rounded-xl p-5 relative overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <div className="flex justify-between items-start mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${k.color}10` }}>
                <k.icon size={18} color={k.color} />
              </div>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ fontSize: '11px', fontWeight: 600, color: '#059669', backgroundColor: '#F0FDF4' }}>
                <ArrowUpRight size={12} /> {k.trend}
              </span>
            </div>
            <p className="font-medium mb-0.5" style={{ fontSize: '12px', color: '#94A3B8' }}>{k.label}</p>
            <div className="flex items-baseline gap-1">
              <span className="font-bold" style={{ fontSize: '24px', color: '#1E293B' }}>{k.val}</span>
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>{k.unit}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* AREA CHART */}
        <div className="xl:col-span-2 rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold" style={{ fontSize: '16px', color: '#1E293B' }}>Évolution salariale</h3>
              <p className="font-medium mt-0.5" style={{ fontSize: '12px', color: '#94A3B8' }}>Masse vs Net sur 12 mois</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: '#D97706' }} /><span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Masse</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: '#059669' }} /><span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>Net</span></div>
            </div>
          </div>
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salaryEvolutionData}>
                <defs>
                  <linearGradient id="gradMasse" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D97706" stopOpacity={0.15}/><stop offset="95%" stopColor="#D97706" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#059669" stopOpacity={0.15}/><stop offset="95%" stopColor="#059669" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} fontWeight={500} fill="#64748B" />
                <YAxis hide />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="masse" stroke="#D97706" strokeWidth={2.5} fill="url(#gradMasse)" />
                <Area type="monotone" dataKey="net" stroke="#059669" strokeWidth={2.5} fill="url(#gradNet)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PIE + EFFICIENCY */}
        <div className="space-y-4">
          <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <h3 className="font-semibold mb-4 text-center" style={{ fontSize: '15px', color: '#1E293B' }}>Répartition par poste</h3>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={postesData} innerRadius={55} outerRadius={80} paddingAngle={6} dataKey="value">
                    {postesData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} stroke="none" />))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px', fontSize: '12px', fontWeight: 500, color: '#475569' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
            <p className="font-medium mb-2" style={{ fontSize: '12px', color: '#94A3B8' }}>Efficacité opérationnelle</p>
            <h4 className="font-semibold mb-4" style={{ fontSize: '16px', color: '#1E293B' }}>Objectif de rendement</h4>
            <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: '94.5%' }}
                className="h-full rounded-full" style={{ backgroundColor: '#1E40AF' }} />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: 500 }}>Performance globale</span>
              <span className="font-bold" style={{ fontSize: '16px', color: '#1E40AF' }}>94.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};