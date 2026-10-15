'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const FILTERS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'SHOPPING', label: 'Compra' },
  { value: 'GENERAL', label: 'General' },
  { value: 'TODO', label: 'Pendientes' },
];

export function NoteFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get('type') ?? 'ALL';
  const currentCompleted = searchParams.get('completed') ?? 'ALL';

  function updateFilter(key: 'type' | 'completed', value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'ALL') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/notas?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="flex gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => updateFilter('type', f.value)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
              ${currentType === f.value
                ? 'bg-brand-50 border-brand-300 text-brand-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1 ml-auto">
        {[
          { value: 'ALL', label: 'Todos' },
          { value: 'false', label: 'Pendientes' },
          { value: 'true', label: 'Completados' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => updateFilter('completed', f.value)}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
              ${currentCompleted === f.value
                ? 'bg-brand-50 border-brand-300 text-brand-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
