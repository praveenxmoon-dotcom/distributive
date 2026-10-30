import { useState } from 'react';
import { User, Palette, Sliders, Info, Check, Bell, Globe, Moon, Sun } from 'lucide-react';
import { GlassCard, SectionHeader, DemoBadge } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { DEMO_USER, APPROVAL_RULES } from '@/data/demoData';

export function SettingsPage() {
  const { addToast } = useApp();
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const handleSave = () => {
    addToast('Settings saved (DEMO — preferences stored in browser only)', 'success');
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Profile */}
      <GlassCard className="p-5 animate-slide-up">
        <SectionHeader title="Profile" subtitle="Your demo account information" icon={<User size={18} />} action={<DemoBadge />} />
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-600 to-electric-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {DEMO_USER.avatar}
          </div>
          <div>
            <div className="text-base font-bold text-navy-900">{DEMO_USER.name}</div>
            <div className="text-sm text-navy-500">{DEMO_USER.role}</div>
            <div className="text-xs text-navy-400 mt-0.5">{DEMO_USER.email}</div>
          </div>
        </div>
      </GlassCard>

      {/* Appearance */}
      <GlassCard className="p-5 animate-slide-up animate-delay-100">
        <SectionHeader title="Appearance" subtitle="Customize how the dashboard looks" icon={<Palette size={18} />} />

        {/* Theme */}
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-navy-700 mb-2">Theme Preference</div>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  theme === 'light' ? 'border-electric-400 bg-electric-50/60 shadow-glass-sm' : 'border-navy-100 bg-white/50 hover:bg-white/70'
                }`}
              >
                <Sun size={18} className="text-amber-500" />
                <span className="text-sm font-medium text-navy-700">Light</span>
                {theme === 'light' && <Check size={15} className="text-electric-600 ml-auto" />}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  theme === 'dark' ? 'border-electric-400 bg-electric-50/60 shadow-glass-sm' : 'border-navy-100 bg-white/50 hover:bg-white/70'
                }`}
              >
                <Moon size={18} className="text-navy-500" />
                <span className="text-sm font-medium text-navy-700">Dark</span>
                {theme === 'dark' && <Check size={15} className="text-electric-600 ml-auto" />}
              </button>
            </div>
            <p className="text-xs text-navy-400 mt-2">Dark theme is not yet implemented. Selecting it will be saved as a preference.</p>
          </div>

          {/* Density */}
          <div>
            <div className="text-sm font-medium text-navy-700 mb-2">Layout Density</div>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                onClick={() => setDensity('comfortable')}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  density === 'comfortable' ? 'border-electric-400 bg-electric-50/60 shadow-glass-sm' : 'border-navy-100 bg-white/50 hover:bg-white/70'
                }`}
              >
                <Sliders size={18} className="text-electric-500" />
                <span className="text-sm font-medium text-navy-700">Comfortable</span>
                {density === 'comfortable' && <Check size={15} className="text-electric-600 ml-auto" />}
              </button>
              <button
                onClick={() => setDensity('compact')}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  density === 'compact' ? 'border-electric-400 bg-electric-50/60 shadow-glass-sm' : 'border-navy-100 bg-white/50 hover:bg-white/70'
                }`}
              >
                <Sliders size={18} className="text-navy-500" />
                <span className="text-sm font-medium text-navy-700">Compact</span>
                {density === 'compact' && <Check size={15} className="text-electric-600 ml-auto" />}
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard className="p-5 animate-slide-up animate-delay-200">
        <SectionHeader title="Notifications" subtitle="Manage alert preferences" icon={<Bell size={18} />} />
        <div className="space-y-3">
          <ToggleRow
            label="Disruption alerts"
            description="Get notified when new disruptions are detected"
            value={notifications}
            onChange={setNotifications}
          />
          <ToggleRow
            label="Auto-refresh dashboard"
            description="Automatically refresh KPI data every 30 seconds"
            value={autoRefresh}
            onChange={setAutoRefresh}
          />
        </div>
      </GlassCard>

      {/* Demo Settings */}
      <GlassCard className="p-5 animate-slide-up animate-delay-300">
        <SectionHeader title="Demo Settings" subtitle="This dashboard runs in simulation mode" icon={<Info size={18} />} action={<DemoBadge />} />
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/40 border border-amber-100/50">
            <div>
              <div className="text-sm font-medium text-navy-700">Simulation Mode</div>
              <div className="text-xs text-navy-400">All data is synthetic. No real backend operations are performed.</div>
            </div>
            <Badge variant="warning" dot>Active</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-navy-100/40">
            <div>
              <div className="text-sm font-medium text-navy-700">Data Source</div>
              <div className="text-xs text-navy-400">Frontend synthetic state — no database connected</div>
            </div>
            <Badge variant="info">Local State</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-navy-100/40">
            <div>
              <div className="text-sm font-medium text-navy-700">Language / Region</div>
              <div className="text-xs text-navy-400">Display format for dates and currency</div>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-navy-600">
              <Globe size={14} />
              English (India)
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Business rules reference */}
      <GlassCard className="p-5 animate-slide-up animate-delay-300">
        <SectionHeader title="Business Rules" subtitle="Approval and plan execution policies" icon={<Check size={18} />} />
        <ul className="space-y-2">
          {APPROVAL_RULES.map((rule, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-navy-600">
              <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
              {rule}
            </li>
          ))}
        </ul>
      </GlassCard>

      {/* Save button */}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => addToast('Changes discarded (DEMO)', 'info')}>Discard</Button>
        <Button variant="primary" onClick={handleSave} icon={<Check size={16} />}>Save Preferences</Button>
      </div>
    </div>
  );
}

function ToggleRow({
  label, description, value, onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-navy-100/40">
      <div>
        <div className="text-sm font-medium text-navy-700">{label}</div>
        <div className="text-xs text-navy-400">{description}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          value ? 'bg-electric-600' : 'bg-navy-200'
        }`}
        role="switch"
        aria-checked={value}
        aria-label={label}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            value ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}
