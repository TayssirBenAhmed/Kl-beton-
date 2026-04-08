import { forwardRef } from 'react';

export const Input = forwardRef(({ 
  label,
  error,
  icon: Icon,
  className = '',
  ...props 
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block font-bold text-gray-700 text-xl">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            <Icon size={24} className="text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full ${Icon ? 'pl-14' : 'pl-4'} pr-4 py-4
            text-xl border-2 rounded-xl
            ${error ? 'border-red-500' : 'border-gray-200 focus:border-primary-500'}
            focus:ring-4 focus:ring-primary-100
            transition-all outline-none
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-red-500 text-lg font-medium">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';