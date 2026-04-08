import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Table = ({ 
  columns, 
  data, 
  onRowClick,
  itemsPerPage = 10,
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...paginatedData].sort((a, b) => {
    if (!sortField) return 0;
    
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  return (
    <div className={`bg-white rounded-3xl shadow-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`
                    px-6 py-5 text-left font-bold text-gray-700 text-xl
                    ${col.sortable ? 'cursor-pointer hover:bg-gray-200' : ''}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && sortField === col.key && (
                      <span className="text-gray-500">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr
                key={row.id || index}
                onClick={() => onRowClick?.(row)}
                className="hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-0"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-5 text-xl">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl disabled:opacity-50"
          >
            <ChevronLeft size={20} />
            <span>Précédent</span>
          </button>
          <span className="font-bold">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl disabled:opacity-50"
          >
            <span>Suivant</span>
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};