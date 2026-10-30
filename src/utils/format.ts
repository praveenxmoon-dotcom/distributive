export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

export function getCostTypeLabel(type: 'confirmed' | 'estimated' | 'synthetic'): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function getCostTypeColor(type: 'confirmed' | 'estimated' | 'synthetic'): string {
  switch (type) {
    case 'confirmed': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'estimated': return 'text-electric-600 bg-electric-50 border-electric-200';
    case 'synthetic': return 'text-amber-600 bg-amber-50 border-amber-200';
  }
}
