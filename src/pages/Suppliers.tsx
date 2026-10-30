import { useState, useMemo } from 'react';
import { Building2, Search, Mail, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GlassCard, SectionHeader, DemoBadge, Tooltip } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/States';
import { suppliers } from '@/data/demoData';
import type { Supplier } from '@/types';

export function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const types = useMemo(() => [...new Set(suppliers.map((s) => s.type))], []);

  const filtered = useMemo(() => {
    return suppliers.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
          !s.location.toLowerCase().includes(search.toLowerCase()) &&
          !s.contactName.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter && s.type !== typeFilter) return false;
      return true;
    });
  }, [search, typeFilter]);

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <GlassCard className="p-4 animate-slide-up border-electric-200/40">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-electric-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-sm font-semibold text-navy-800">Supplier Directory</span>
            <p className="text-xs text-navy-500 mt-0.5">
              Suppliers are external partners, separate from company warehouses (Delhi and Chennai).
              Performance data shown as "Not available" has not been verified.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Filters */}
      <GlassCard className="p-4 animate-slide-up">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search supplier name, location, or contact…"
              className="glass-input w-full h-10 rounded-xl text-sm pl-10 pr-3"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="All Types"
            options={types.map((t) => ({ value: t, label: t }))}
            className="w-full sm:w-56"
          />
        </div>
      </GlassCard>

      {/* Cards */}
      {filtered.length === 0 ? (
        <GlassCard className="p-0">
          <EmptyState icon={<Building2 size={24} />} title="No suppliers found" description="Try adjusting your search." />
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((supplier, i) => (
            <SupplierCard key={supplier.id} supplier={supplier} delay={i * 80} />
          ))}
        </div>
      )}
    </div>
  );
}

function SupplierCard({ supplier, delay }: { supplier: Supplier; delay: number }) {
  return (
    <GlassCard className="p-5 animate-slide-up flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-electric-50 to-navy-50 border border-electric-100/60 flex items-center justify-center text-electric-600">
            <Building2 size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-navy-900">{supplier.name}</span>
              <DemoBadge />
            </div>
            <span className="text-xs text-navy-500">{supplier.type}</span>
          </div>
        </div>
        {supplier.verified ? (
          <Badge variant="success" dot>Verified</Badge>
        ) : (
          <Tooltip text="This supplier has not been verified. Performance data is not available.">
            <Badge variant="neutral">Unverified</Badge>
          </Tooltip>
        )}
      </div>

      <div className="space-y-2 flex-1 mb-3">
        <div className="flex items-center gap-2 text-xs text-navy-500">
          <MapPin size={13} className="text-navy-400" />
          {supplier.location}
        </div>
        <div className="flex items-center gap-2 text-xs text-navy-500">
          <Mail size={13} className="text-navy-400" />
          {supplier.contactEmail}
        </div>
        <div className="text-xs text-navy-500">
          Contact: <span className="font-medium text-navy-700">{supplier.contactName}</span>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {supplier.categories.map((cat) => (
          <span key={cat} className="text-[10px] px-2 py-0.5 rounded-md bg-navy-50 text-navy-600 border border-navy-100 font-medium">
            {cat}
          </span>
        ))}
      </div>

      {/* Performance - shown as Not Available per business rules */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-navy-100/40">
        <div>
          <div className="text-[10px] text-navy-400 uppercase tracking-wider">Rating</div>
          <div className="text-sm font-semibold text-navy-500 flex items-center gap-1">
            {supplier.rating !== null ? (
              <>{supplier.rating}/5</>
            ) : (
              <span className="flex items-center gap-1 text-navy-400">
                <AlertCircle size={12} /> Not available
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-navy-400 uppercase tracking-wider">On-Time Rate</div>
          <div className="text-sm font-semibold text-navy-500 flex items-center gap-1">
            {supplier.onTimeRate !== null ? (
              <>{supplier.onTimeRate}%</>
            ) : (
              <span className="flex items-center gap-1 text-navy-400">
                <AlertCircle size={12} /> Not available
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
