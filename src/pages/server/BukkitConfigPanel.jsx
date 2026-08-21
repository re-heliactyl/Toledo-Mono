import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, FileCode, Layers, Loader2, Save, Settings, Timer, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { getPath, parseYaml, serializeYaml, setPath } from '@/lib/yamlConfigParser';

const SECTIONS = [
  {
    id: 'settings', label: 'Settings', icon: Settings,
    fields: [
      { path: 'settings.allow-end',            label: 'Allow End',            type: 'bool',   desc: 'Allow players to travel to the End.' },
      { path: 'settings.warn-on-overload',     label: 'Warn on Overload',     type: 'bool',   desc: 'Warn when server is overloaded.' },
      { path: 'settings.connection-throttle',  label: 'Connection Throttle',  type: 'number', desc: 'Time (ms) between connection attempts from same IP.' },
      { path: 'settings.query-plugins',        label: 'Query Plugins',        type: 'bool',   desc: 'Show plugins in server query responses.' },
      { path: 'settings.plugin-profiling',     label: 'Plugin Profiling',     type: 'bool',   desc: 'Enable plugin timing profiling.' },
      { path: 'settings.shutdown-message',     label: 'Shutdown Message',     type: 'text',   desc: 'Message shown to players on shutdown.' },
      { path: 'settings.minimum-api',          label: 'Minimum API',          type: 'text',   desc: 'Minimum Bukkit API version. "none" = no restriction.' },
    ],
  },
  {
    id: 'spawn-limits', label: 'Spawn Limits', icon: Layers,
    fields: [
      { path: 'spawn-limits.monsters',                label: 'Monsters',               type: 'number', desc: 'Max monsters per player.' },
      { path: 'spawn-limits.animals',                 label: 'Animals',                type: 'number', desc: 'Max animals per player.' },
      { path: 'spawn-limits.water-animals',           label: 'Water Animals',          type: 'number', desc: 'Max fish / squid per player.' },
      { path: 'spawn-limits.water-ambient',           label: 'Water Ambient',          type: 'number', desc: 'Max ambient water mobs (cod, salmon).' },
      { path: 'spawn-limits.water-underground-creature', label: 'Water Underground',   type: 'number', desc: 'Max glow squid / underground water mobs.' },
      { path: 'spawn-limits.axolotls',                label: 'Axolotls',               type: 'number', desc: 'Max axolotls per player.' },
      { path: 'spawn-limits.ambient',                 label: 'Ambient',                type: 'number', desc: 'Max ambient mobs (bats).' },
    ],
  },
  {
    id: 'ticks', label: 'Ticks Per', icon: Timer,
    fields: [
      { path: 'ticks-per.animal-spawns',  label: 'Animal Spawns',  type: 'number', desc: 'Ticks between animal spawn attempts.' },
      { path: 'ticks-per.monster-spawns', label: 'Monster Spawns', type: 'number', desc: 'Ticks between monster spawn attempts.' },
      { path: 'ticks-per.water-spawns',   label: 'Water Spawns',  type: 'number' },
      { path: 'ticks-per.water-ambient-spawns', label: 'Water Ambient Spawns', type: 'number' },
      { path: 'ticks-per.water-underground-creature-spawns', label: 'Water Underg. Spawns', type: 'number' },
      { path: 'ticks-per.axolotl-spawns', label: 'Axolotl Spawns', type: 'number' },
      { path: 'ticks-per.ambient-spawns', label: 'Ambient Spawns', type: 'number' },
      { path: 'ticks-per.autosave',       label: 'Autosave (ticks)', type: 'number', desc: '6000 ticks = ~5 minutes.' },
    ],
  },
  {
    id: 'gc', label: 'Chunk GC', icon: Trash2,
    fields: [
      { path: 'chunk-gc.period-in-ticks', label: 'GC Period (ticks)', type: 'number', desc: 'Ticks between chunk garbage collection runs.' },
    ],
  },
];

const CATEGORIES = [
  { id: 'settings',    label: 'Settings',    icon: Settings },
  { id: 'spawn-limits', label: 'Spawn Limits', icon: Layers },
  { id: 'ticks',       label: 'Ticks Per',   icon: Timer },
  { id: 'gc',          label: 'Chunk GC',    icon: Trash2 },
];

function YamlBoolField({ field, value, onChange }) {
  const checked = value === true || value === 'true';
  return (
    <div className={`flex items-center justify-between rounded-xl border p-5 transition-all duration-300 ${
      checked ? 'border-neutral-700/80 bg-neutral-900/20 shadow-[0_4px_20px_rgba(255,255,255,0.01)]' : 'border-neutral-800/40 bg-neutral-950/10 hover:border-neutral-800/70 hover:bg-neutral-900/10'}`}>
      <div className="space-y-2 pr-4 flex-1">
        <div className="flex items-center gap-2.5">
          <Label className="text-sm font-semibold text-neutral-200 tracking-wide cursor-pointer">{field.label}</Label>
          {checked && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
        </div>
        {field.desc && <p className="text-xs text-neutral-500 leading-relaxed font-normal">{field.desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={(v) => onChange(v)} className="data-[state=checked]:bg-white data-[state=unchecked]:bg-neutral-800" />
    </div>
  );
}

function YamlTextField({ field, value, onChange }) {
  return (
    <div className="space-y-3.5 rounded-xl border border-neutral-800/40 bg-neutral-950/10 p-5 transition-all duration-300 hover:border-neutral-800/70 hover:bg-neutral-900/10">
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-neutral-200 tracking-wide">{field.label}</Label>
        {field.desc && <p className="text-xs text-neutral-500 leading-relaxed font-normal">{field.desc}</p>}
      </div>
      <Input type={field.type === 'number' ? 'number' : 'text'}
        value={value === true ? 'true' : value === false ? 'false' : String(value ?? '')}
        onChange={(e) => onChange(field.type === 'number' ? Number(e.target.value) : e.target.value)}
        className="bg-[#111216]/50 border-neutral-800 font-mono text-neutral-300 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-700 rounded-lg h-10" placeholder={field.label} />
    </div>
  );
}

function YamlField({ field, value, onChange }) {
  if (field.type === 'bool') return <YamlBoolField field={field} value={value} onChange={onChange} />;
  return <YamlTextField field={field} value={value} onChange={onChange} />;
}

export default function BukkitConfigPanel({ serverId, currentPath, open, onOpenChange, onOpenRawFile }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/server/${serverId}/files/contents?file=${encodeURIComponent(`${currentPath}bukkit.yml`)}`);
      if (!r.ok) throw new Error('Failed to read bukkit.yml');
      setData(parseYaml(await r.text())); setDirty(false);
    } catch (err) {
      setError(err.message); toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setLoading(false); }
  }, [serverId, currentPath]);

  useEffect(() => { if (open) fetchConfig(); }, [open, fetchConfig]);

  const handleChange = useCallback((path, value) => {
    setData((prev) => { const n = JSON.parse(JSON.stringify(prev)); setPath(n, path, value); return n; });
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/server/${serverId}/files/write?file=${encodeURIComponent(`${currentPath}bukkit.yml`)}`, { method: 'POST', body: serializeYaml(data) });
      if (!r.ok) throw new Error('Save failed');
      setDirty(false); toast({ title: 'Saved', description: 'bukkit.yml saved. Restart to apply changes.' });
    } catch (err) { toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally { setSaving(false); }
  }, [serverId, currentPath, data]);

  const handleClose = useCallback(() => {
    if (dirty && !window.confirm('You have unsaved changes. Close anyway?')) return;
    onOpenChange(false);
  }, [dirty, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex flex-col p-0 gap-0 overflow-hidden bg-[#08090b] border-neutral-900 w-full h-full md:w-[90vw] md:max-w-5xl md:h-[85vh] md:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:border border-neutral-800/60">
        <div className="flex items-center justify-between px-4 py-3.5 md:px-6 md:py-4 border-b border-neutral-900/60 bg-[#0d0e12]/60 shrink-0 backdrop-blur-md">
          <DialogTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg text-neutral-100">
            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800/80">
              <FileCode className="h-4.5 w-4.5 text-neutral-200" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <span className="font-bold tracking-tight">Bukkit Configuration</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px] md:text-xs font-mono bg-neutral-900 border border-neutral-800 text-neutral-400">bukkit.yml</Badge>
                {dirty && <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/5 text-[10px] md:text-xs font-medium animate-pulse">Modified</Badge>}
              </div>
            </div>
          </DialogTitle>
          <div className="flex items-center gap-1.5 md:gap-3 pr-8 md:pr-10">
            <Button variant="ghost" size="sm" onClick={onOpenRawFile}
              className="text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/60 p-2 md:px-3 md:py-1.5 h-auto rounded-lg transition-colors">
              <FileCode className="h-4 w-4 md:mr-1.5" /><span className="hidden md:inline text-xs font-medium">Open Raw</span>
            </Button>
            <div className="w-[1px] h-5 bg-neutral-800 hidden md:block" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={dirty ? 'default' : 'outline'} size="sm" onClick={handleSave} disabled={!dirty || saving}
                    className={`h-8.5 rounded-lg px-3 md:px-4 text-xs font-semibold tracking-wide transition-all duration-200 ${
                      dirty ? 'bg-neutral-950/80 text-emerald-400 border border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-950/30 hover:shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-95'
                        : 'bg-transparent border-neutral-800 text-neutral-500 hover:bg-neutral-900/40'}`}>
                    {saving ? <Loader2 className="h-3.5 w-3.5 md:mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 md:mr-1.5" />}
                    <span className="hidden md:inline">Save Changes</span><span className="md:hidden">Save</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-900 border-neutral-800 text-neutral-300 text-xs">Restart required to apply changes</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <AnimatePresence>
          {error && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm"><AlertTriangle className="h-4 w-4 shrink-0" /> {error}</div>
          </motion.div>)}
        </AnimatePresence>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /><span className="text-neutral-400">Reading bukkit.yml...</span></div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            <div className="hidden md:flex flex-col w-60 border-r border-neutral-900/60 bg-[#0a0b0d]/50 shrink-0 p-5 space-y-2 overflow-y-auto">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon; const isActive = activeTab === cat.id;
                const section = SECTIONS.find(s => s.id === cat.id);
                return (
                  <button key={cat.id} onClick={() => setActiveTab(cat.id)}
                    className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                      isActive ? 'bg-neutral-900 text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-neutral-800/80'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/20 border border-transparent'}`}>
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-400'}`} />
                      <span>{cat.label}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isActive ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-950/40 text-neutral-600 group-hover:text-neutral-500'}`}>{section?.fields.length || 0}</span>
                    {isActive && <motion.div layoutId="bukkitActiveTab" className="absolute left-0 top-2.5 bottom-2.5 w-0.75 rounded-r bg-white" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
                  </button>
                );
              })}
            </div>

            <div className="flex md:hidden shrink-0 border-b border-neutral-900/60 bg-[#0a0b0d]/50 p-3">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full bg-[#111216]/50 border-neutral-850 text-neutral-300"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent className="bg-[#111216] border-neutral-850 text-neutral-300">
                  {CATEGORIES.map((cat) => { const Icon = cat.icon; return (
                    <SelectItem key={cat.id} value={cat.id} className="focus:bg-neutral-800 focus:text-white cursor-pointer">
                      <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-neutral-400" /><span className="text-xs font-semibold">{cat.label}</span></span>
                    </SelectItem>); })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-h-0 bg-[#060709]/10 relative">
              <ScrollArea className="h-full">
                <div className="p-5 md:p-8 space-y-6">
                  <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }} className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                      {SECTIONS.find(s => s.id === activeTab)?.fields.map((field) => (
                        <div key={field.path} className="col-span-1">
                          <YamlField field={field} value={getPath(data, field.path)} onChange={(v) => handleChange(field.path, v)} />
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                  <Card className="border-neutral-800 bg-neutral-900/10 mt-4 rounded-xl shadow-none">
                    <CardHeader className="p-4">
                      <CardTitle className="flex items-center gap-2 text-neutral-300 text-xs font-bold"><AlertTriangle className="h-4 w-4 text-neutral-400" /> Restart Required</CardTitle>
                      <CardDescription className="text-neutral-500 text-[11px] font-normal mt-1 leading-normal">Restart your server for Bukkit config changes to take effect.</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
