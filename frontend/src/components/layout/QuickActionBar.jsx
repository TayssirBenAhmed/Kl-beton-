import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Save, AlertTriangle, Lock, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMonthLock } from '../../hooks/useMonthLock';
import { format } from 'date-fns';
import { fr, enUS, arSA } from 'date-fns/locale';

const locales = {
    fr,
    en: enUS,
    ar: arSA
};

export const QuickActionBar = ({
    selectedDate,
    onDateChange,
    onSave,
    totalEmployees,
    pointagesCount,
    isSaving,
    userRole = 'chef'
}) => {
    const { language, t } = useLanguage();
    const { isLocked, lockMessage } = useMonthLock(selectedDate, userRole);

    const completionPercentage = (pointagesCount / totalEmployees) * 100;
    const missingCount = totalEmployees - pointagesCount;

    const getStatusColor = () => {
        if (isLocked) return 'bg-gray-400';
        if (missingCount === 0) return 'bg-green-500';
        if (missingCount > 0) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getStatusIcon = () => {
        if (isLocked) return <Lock className="w-5 h-5" />;
        if (missingCount === 0) return <CheckCircle className="w-5 h-5" />;
        return <AlertTriangle className="w-5 h-5" />;
    };

    return (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-2 border-primary-red/20 shadow-lg"
        >
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Date Selector */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-primary-cream rounded-xl px-4 py-2 border-2 border-primary-lightBlue">
                            <Calendar className="text-primary-red" size={20} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => onDateChange(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="bg-transparent border-none outline-none text-lg font-bold"
                                disabled={isLocked}
                            />
                        </div>

                        {/* Lock Status */}
                        {isLocked && (
                            <div className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-xl border-2 border-gray-300">
                                <Lock size={18} />
                                <span className="font-bold text-sm">{lockMessage}</span>
                            </div>
                        )}
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex items-center gap-4 flex-1 max-w-md">
                        <div className="flex items-center gap-2">
                            {getStatusIcon()}
                            <span className="font-bold">
                                {pointagesCount}/{totalEmployees}
                            </span>
                        </div>
                        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${completionPercentage}%` }}
                                className={`h-full ${getStatusColor()}`}
                            />
                        </div>
                        {missingCount > 0 && !isLocked && (
                            <span className="text-orange-600 font-bold text-sm whitespace-nowrap">
                                {missingCount} manquant(s)
                            </span>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        {missingCount > 0 && !isLocked && (
                            <button
                                onClick={() => {
                                    const firstMissing = document.querySelector('[data-missing="true"]');
                                    firstMissing?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-xl border-2 border-orange-200 hover:bg-orange-200 transition-all"
                            >
                                <AlertTriangle size={18} />
                                <span className="font-bold">Rattrapage</span>
                            </button>
                        )}

                        <button
                            onClick={onSave}
                            disabled={isLocked || isSaving}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all ${isLocked
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-primary-red text-white hover:bg-red-700 active:scale-95'
                                }`}
                        >
                            {isSaving ? (
                                <Clock className="animate-spin" size={18} />
                            ) : (
                                <Save size={18} />
                            )}
                            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};