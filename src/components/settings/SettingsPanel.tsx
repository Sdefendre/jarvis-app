'use client';

import { useGraphStore } from '@/stores/graph-store';
import { useUIStore } from '@/stores/ui-store';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs tabular-nums text-foreground">{value.toFixed(step < 0.1 ? 2 : 1)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 appearance-none rounded-sm cursor-pointer accent-[#6366f1]"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">{children}</h3>
  );
}

export function SettingsPanel() {
  const { settings, updateSettings } = useGraphStore();
  const { toggleSettings, editorLightMode, toggleEditorTheme } = useUIStore();

  return (
    <div className="flex flex-col h-full" style={{ color: 'var(--text)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pt-12 pb-3 relative z-[60]"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-sm font-medium">Settings</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggleSettings}
          title="Close settings"
          className="titlebar-no-drag text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Graph Settings */}
        <div>
          <SectionHeader>Graph</SectionHeader>
          <div className="space-y-4">
            <SliderRow
              label="Node Size"
              value={settings.nodeSize}
              min={0.5}
              max={4.0}
              step={0.1}
              onChange={(v) => updateSettings({ nodeSize: v })}
            />
            <ToggleRow
              label="Show Labels"
              checked={settings.showLabels}
              onChange={(v) => updateSettings({ showLabels: v })}
            />
            <SliderRow
              label="Line Thickness"
              value={settings.lineThickness}
              min={0.5}
              max={3.0}
              step={0.1}
              onChange={(v) => updateSettings({ lineThickness: v })}
            />
            <ToggleRow
              label="Auto Rotate"
              checked={settings.autoRotate}
              onChange={(v) => updateSettings({ autoRotate: v })}
            />
            <SliderRow
              label="Rotate Speed"
              value={settings.rotateSpeed}
              min={0}
              max={1.0}
              step={0.05}
              onChange={(v) => updateSettings({ rotateSpeed: v })}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Line Color</span>
              <input
                type="color"
                value={settings.lineColor || '#27272a'}
                onInput={(e) => updateSettings({ lineColor: (e.target as HTMLInputElement).value })}
                onChange={(e) => updateSettings({ lineColor: e.target.value })}
                className="w-7 h-5 border border-white/10 rounded cursor-pointer p-0 bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Editor Settings */}
        <div>
          <SectionHeader>Editor</SectionHeader>
          <div className="space-y-4">
            <ToggleRow
              label="Light Mode"
              checked={editorLightMode}
              onChange={() => toggleEditorTheme()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
