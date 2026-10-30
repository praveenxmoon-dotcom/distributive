import { type ReactNode, useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { EmptyState } from '@/components/ui/States';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyMessage = 'No records found',
  emptyDescription,
  emptyIcon,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return data;
    const sorted = [...data].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === 'number' && typeof bv === 'number') return av - bv;
      return String(av).localeCompare(String(bv));
    });
    return sortDir === 'desc' ? sorted.reverse() : sorted;
  }, [data, sortKey, sortDir, columns]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (data.length === 0) {
    return <EmptyState title={emptyMessage} description={emptyDescription} icon={emptyIcon} />;
  }

  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy-100/70">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider whitespace-nowrap ${col.className || ''}`}
              >
                {col.sortable ? (
                  <button
                    onClick={() => handleSort(col.key)}
                    className="inline-flex items-center gap-1 hover:text-navy-800 transition-colors"
                  >
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                    ) : (
                      <ArrowUpDown size={12} className="opacity-40" />
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={`border-b border-navy-50/50 transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-electric-50/40' : 'hover:bg-navy-50/30'
              }`}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 text-navy-700 ${col.className || ''}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
