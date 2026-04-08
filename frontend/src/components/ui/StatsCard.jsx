 

import { ArrowUp, ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon,
  trend, 
  trendValue,
  color = 'primary',
  delay = 0 
}) => {
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    danger: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    purple: 'bg-purple-500',
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString('fr-TN', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      }) + ' DT';
    }
    return val;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className={`flex items-start justify-between mb-6 ${trend ? '' : 'items-center'}`}>
        <div>
          <p className="text-gray-500 font-medium text-xl mb-2">{title}</p>
          <p className="font-mono font-bold text-5xl text-gray-900">{formatValue(value)}</p>
        </div>
        <div className={`${colorClasses[color]} p-5 rounded-2xl shadow-lg`}>
          <Icon size={36} className="text-white" />
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          {trend === 'up' ? (
            <ArrowUp className="text-green-500" size={24} />
          ) : (
            <ArrowDown className="text-red-500" size={24} />
          )}
          <span className={`font-bold text-lg ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trendValue}
          </span>
          <span className="text-gray-500 text-lg">vs mois dernier</span>
        </div>
      )}
    </motion.div>
  );
};