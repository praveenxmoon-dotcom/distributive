import { useState, useMemo } from 'react';
import { Package, Search, AlertTriangle, Warehouse } from 'lucide-react';
import { GlassCard, SectionHeader, DemoBadge } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/States';
import { inventoryItems } from '@/data/demoData';
import type { InventoryItem } from '@/types';

const statusVariant: Record<InventoryItem['status'], 'success' | 'warning' | 'danger' | 'neutral'> = {
  'In Stock': 'success',
  'Low Stock': 'warning',
  'Critical': 'danger',
  'Out of Stock': 'neutral',
};

export function InventoryPage() {
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = useMemo(() => {
    return inventoryItems.filter((item) => {
      if (search && !item.sku.toLowerCase().includes(search.toLowerCase()) &&
          !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (warehouseFilter && item.warehouse !== warehouseFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });
  }, [search, warehouseFilter, statusFilter]);

  const delhiItems = inventoryItems.filter((i) => i.warehouse === 'Delhi');
  const chennaiItems = inventoryItems.filter((i) => i.warehouse === 'Chennai');

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <GlassCard className="p-4 animate-slide-up border-electric-200/40">
        <div className="flex items-start gap-3">
          <Warehouse size={18} className="text-electric-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-sm font-semibold text-navy-800">Company Warehouses</span>
            <p className="text-xs text-navy-500 mt-0.5">
              Inventory is tracked only for the two company warehouses: Delhi and Chennai. All quantities are synthetic demo values.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Warehouse summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <WarehouseSummary name="Delhi Warehouse" items={delhiItems} />
        <WarehouseSummary name="Chennai Warehouse" items={chennaiItems} />
      </div>

      {/* Filters */}
      <GlassCard className="p-4 animate-slide-up">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SKU or product name…"
              className="glass-input w-full h-10 rounded-xl text-sm pl-10 pr-3"
            />
          </div>
          <Select
            value={warehouseFilter}
            onChange={setWarehouseFilter}
            placeholder="All Warehouses"
            options={[
              { value: 'Delhi', label: 'Delhi Warehouse' },
              { value: 'Chennai', label: 'Chennai Warehouse' },
            ]}
            className="w-full sm:w-44"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            options={[
              { value: 'In Stock', label: 'In Stock' },
              { value: 'Low Stock', label: 'Low Stock' },
              { value: 'Critical', label: 'Critical' },
              { value: 'Out of Stock', label: 'Out of Stock' },
            ]}
            className="w-full sm:w-40"
          />
        </div>
      </GlassCard>

      {/* Inventory table */}
      <GlassCard className="p-5 animate-slide-up animate-delay-100">
        <SectionHeader
          title="Inventory Items"
          subtitle={`${filtered.length} of ${inventoryItems.length} items`}
          icon={<Package size={18} />}
          action={<DemoBadge />}
        />
        {filtered.length === 0 ? (
          <EmptyState icon={<Package size={24} />} title="No items found" description="Try adjusting your filters." />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100/70">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Product</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Warehouse</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Quantity</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Reorder Level</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-navy-50/50 hover:bg-navy-50/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-navy-800 text-xs">{item.sku}</td>
                    <td className="px-4 py-3 text-navy-700">{item.name}</td>
                    <td className="px-4 py-3 text-navy-500 text-xs">{item.warehouse}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-navy-800">
                      {item.quantity.toLocaleString('en-IN')} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-navy-500 text-xs">
                      {item.reorderLevel.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[item.status]} dot>{item.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function WarehouseSummary({ name, items }: { name: string; items: InventoryItem[] }) {
  const lowStock = items.filter((i) => i.status === 'Low Stock' || i.status === 'Critical').length;
  const outOfStock = items.filter((i) => i.status === 'Out of Stock').length;

  return (
    <GlassCard className="p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-electric-50 border border-electric-100 flex items-center justify-center text-electric-600">
            <Warehouse size={18} />
          </div>
          <div>
            <span className="text-sm font-bold text-navy-900">{name}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-navy-400">{items.length} SKUs</span>
              <DemoBadge className="ml-1" />
            </div>
          </div>
        </div>
        {(lowStock > 0 || outOfStock > 0) && (
          <div className="flex items-center gap-1 text-amber-600">
            <AlertTriangle size={14} />
            <span className="text-xs font-semibold">{lowStock + outOfStock} alerts</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-lg bg-white/50 border border-navy-100/40">
          <div className="text-base font-bold text-emerald-600 tabular-nums">
            {items.filter((i) => i.status === 'In Stock').length}
          </div>
          <div className="text-[10px] text-navy-400">In Stock</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/50 border border-navy-100/40">
          <div className="text-base font-bold text-amber-600 tabular-nums">{lowStock}</div>
          <div className="text-[10px] text-navy-400">Low/Critical</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/50 border border-navy-100/40">
          <div className="text-base font-bold text-red-500 tabular-nums">{outOfStock}</div>
          <div className="text-[10px] text-navy-400">Out of Stock</div>
        </div>
      </div>
    </GlassCard>
  );
}
