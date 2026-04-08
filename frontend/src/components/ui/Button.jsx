import { motion } from 'framer-motion';

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'large',
  icon: Icon,
  onClick,
  disabled = false,
  fullWidth = false,
  type = 'button',
  className = ''
}) => {
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-gray-900 border-2 border-primary-600',
    secondary: 'bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-300 hover:border-primary-500',
    danger: 'bg-red-500 hover:bg-red-600 text-white border-2 border-red-600',
    success: 'bg-green-500 hover:bg-green-600 text-white border-2 border-green-600',
  };

  const sizes = {
    large: 'py-4 px-8 text-xl',
    medium: 'py-3 px-6 text-lg',
    small: 'py-2 px-4 text-base',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''}
        font-bold rounded-xl shadow-lg hover:shadow-xl 
        transition-all duration-300 disabled:opacity-50 
        disabled:cursor-not-allowed flex items-center justify-center gap-3
        ${className}
      `}
    >
      {Icon && <Icon size={size === 'large' ? 28 : 24} />}
      {children}
    </motion.button>
  );
};