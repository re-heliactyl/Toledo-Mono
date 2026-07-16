import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Command, FileCode, Layers, Loader2, MessageSquare, Save, Settings, Swords, Timer } from 'lucide-react';
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
      { path: 'settings.debug',              label: 'Debug',               type: 'bool',   desc: 'Enable debug logging.' },
      { path: 'settings.bungeecord',          label: 'BungeeCord',          type: 'bool',   desc: 'Enable BungeeCord / Velocity support.' },
      { path: 'settings.sample-count',        label: 'Sample Count',        type: 'number', desc: 'Number of players shown in server list ping.' },
      { path: 'settings.player-shuffle',      label: 'Player Shuffle',      type: 'number', desc: 'Ticks between shuffling the tab list. 0 = off.' },
      { path: 'settings.user-cache-size',     label: 'User Cache Size',     type: 'number', desc: 'Max entries in user cache.' },
      { path: 'settings.save-user-cache-on-stop-only', label: 'Save Cache on Stop', type: 'bool', desc: 'Only save user cache on server stop.' },
      { path: 'settings.timeout-time',        label: 'Timeout (seconds)',   type: 'number', desc: 'Timeout for client-server connection.' },
      { path: 'settings.restart-on-crash',    label: 'Restart on Crash',    type: 'bool',   desc: 'Auto-restart server on crash.' },
      { path: 'settings.restart-script',      label: 'Restart Script',      type: 'text',   desc: 'Path to the restart script (./start.sh).' },
      { path: 'settings.netty-threads',       label: 'Netty Threads',       type: 'number', desc: 'Number of Netty network threads.' },
      { path: 'settings.log-villager-deaths', label: 'Log Villager Deaths', type: 'bool' },
      { path: 'settings.log-named-deaths',    label: 'Log Named Deaths',    type: 'bool' },
    ],
  },
  {
    id: 'attributes', label: 'Attributes', icon: Swords,
    fields: [
      { path: 'settings.attribute.maxAbsorption.max',   label: 'Max Absorption',   type: 'number', desc: 'Max absorption hearts.' },
      { path: 'settings.attribute.maxHealth.max',        label: 'Max Health',       type: 'number', desc: 'Max health value.' },
      { path: 'settings.attribute.movementSpeed.max',    label: 'Movement Speed',   type: 'number', desc: 'Max movement speed.' },
      { path: 'settings.attribute.attackDamage.max',     label: 'Attack Damage',    type: 'number', desc: 'Max attack damage.' },
    ],
  },
  {
    id: 'messages', label: 'Messages', icon: MessageSquare,
    fields: [
      { path: 'messages.whitelist',         label: 'Whitelist Message',  type: 'text', desc: 'Shown when non-whitelisted player tries to join.' },
      { path: 'messages.unknown-command',   label: 'Unknown Command',    type: 'text', desc: 'Shown when player types unknown command.' },
      { path: 'messages.server-full',       label: 'Server Full',        type: 'text', desc: 'Shown when server is full.' },
      { path: 'messages.outdated-client',   label: 'Outdated Client',    type: 'text', desc: '{0} = client version.' },
      { path: 'messages.outdated-server',   label: 'Outdated Server',    type: 'text', desc: '{0} = server version.' },
      { path: 'messages.restart',           label: 'Restart Message',    type: 'text', desc: 'Broadcast on restart.' },
    ],
  },
  {
    id: 'world', label: 'World', icon: Layers,
    fields: [
      { path: 'world-settings.default.view-distance', label: 'View Distance',      type: 'text', desc: '"default" or chunk count (3-32).' },
      { path: 'world-settings.default.simulation-distance', label: 'Simulation Distance', type: 'text', desc: '"default" or chunk count (3-32).' },
      { path: 'world-settings.default.merge-radius.item', label: 'Item Merge Radius', type: 'number', desc: 'Radius for item stacking on ground.' },
      { path: 'world-settings.default.merge-radius.exp',   label: 'EXP Merge Radius', type: 'number', desc: 'Radius for EXP orb merging. Negative = default.' },
      { path: 'world-settings.default.mob-spawn-range',    label: 'Mob Spawn Range',  type: 'number', desc: 'Max distance from player for mob spawns.' },
      { path: 'world-settings.default.item-despawn-rate',   label: 'Item Despawn Rate', type: 'number', desc: 'Ticks before items despawn (6000 = 5 min).' },
      { path: 'world-settings.default.arrow-despawn-rate',  label: 'Arrow Despawn Rate', type: 'number', desc: 'Ticks before arrows despawn.' },
      { path: 'world-settings.default.trident-despawn-rate', label: 'Trident Despawn Rate', type: 'number', desc: 'Ticks before tridents despawn.' },
      { path: 'world-settings.default.nerf-spawner-mobs',   label: 'Nerf Spawner Mobs', type: 'bool', desc: 'Remove AI from spawner-spawned mobs.' },
      { path: 'world-settings.default.thunder-chance',      label: 'Thunder Chance',    type: 'number', desc: '1 in X chance per tick for thunder.' },
      { path: 'world-settings.default.hanging-tick-frequency', label: 'Hanging Tick Freq.', type: 'number', desc: 'Tick frequency for hanging entities.' },
    ],
  },
  {
    id: 'activation', label: 'Entity Activation', icon: Timer,
    fields: [
      { path: 'world-settings.default.entity-activation-range.animals', label: 'Animals', type: 'number', desc: 'Range for animal activation.' },
      { path: 'world-settings.default.entity-activation-range.monsters', label: 'Monsters', type: 'number', desc: 'Range for monster activation.' },
      { path: 'world-settings.default.entity-activation-range.raiders', label: 'Raiders', type: 'number', desc: 'Range for raider activation.' },
      { path: 'world-settings.default.entity-activation-range.misc', label: 'Misc', type: 'number' },
      { path: 'world-settings.default.entity-activation-range.water', label: 'Water', type: 'number' },
      { path: 'world-settings.default.entity-activation-range.villagers', label: 'Villagers', type: 'number' },
      { path: 'world-settings.default.entity-activation-range.flying-monsters', label: 'Flying Monsters', type: 'number' },
      { path: 'world-settings.default.entity-activation-range.ignore-spectators', label: 'Ignore Spectators', type: 'bool', desc: 'Don\'t activate entities near spectators.' },
      { path: 'world-settings.default.entity-activation-range.tick-inactive-villagers', label: 'Tick Inactive Villagers', type: 'bool' },
    ],
  },
  {
    id: 'tracking', label: 'Tracking Range', icon: Layers,
    fields: [
      { path: 'world-settings.default.entity-tracking-range.players',  label: 'Players', type: 'number' },
      { path: 'world-settings.default.entity-tracking-range.animals',  label: 'Animals', type: 'number' },
      { path: 'world-settings.default.entity-tracking-range.monsters', label: 'Monsters', type: 'number' },
      { path: 'world-settings.default.entity-tracking-range.misc',     label: 'Misc',    type: 'number' },
      { path: 'world-settings.default.entity-tracking-range.display',  label: 'Display', type: 'number' },
      { path: 'world-settings.default.entity-tracking-range.other',    label: 'Other',   type: 'number' },
    ],
  },
  {
    id: 'hunger', label: 'Hunger', icon: Swords,
    fields: [
      { path: 'world-settings.default.hunger.jump-walk-exhaustion',    label: 'Jump Walk',        type: 'number', desc: 'Exhaustion from jumping while walking.' },
      { path: 'world-settings.default.hunger.jump-sprint-exhaustion',  label: 'Jump Sprint',      type: 'number', desc: 'Exhaustion from jumping while sprinting.' },
      { path: 'world-settings.default.hunger.combat-exhaustion',       label: 'Combat',           type: 'number', desc: 'Exhaustion from attacking.' },
      { path: 'world-settings.default.hunger.regen-exhaustion',        label: 'Regen',            type: 'number', desc: 'Exhaustion from health regen.' },
      { path: 'world-settings.default.hunger.swim-multiplier',         label: 'Swim Multiplier',  type: 'number' },
      { path: 'world-settings.default.hunger.sprint-multiplier',       label: 'Sprint Multiplier', type: 'number' },
      { path: 'world-settings.default.hunger.other-multiplier',        label: 'Other Multiplier', type: 'number' },
    ],
  },
  {
    id: 'commands', label: 'Commands', icon: Command,
    fields: [
      { path: 'commands.log',                        label: 'Log Commands',          type: 'bool', desc: 'Log all commands.' },
      { path: 'commands.tab-complete',               label: 'Tab Complete Mode',    type: 'number', desc: '0 = all, 1 = ops only, 2 = ops + console.' },
      { path: 'commands.send-namespaced',            label: 'Send Namespaced',      type: 'bool', desc: 'Send namespaced command suggestions.' },
      { path: 'commands.silent-commandblock-console', label: 'Silent CmdBlock Console', type: 'bool', desc: 'Don\'t log command block output.' },
      { path: 'commands.enable-spam-exclusions',     label: 'Enable Spam Exclusions', type: 'bool' },
    ],
  },
];

const CATEGORIES = [
  { id: 'settings',    label: 'Settings',            icon: Settings },
  { id: 'attributes',  label: 'Attributes',           icon: Swords },
  { id: 'messages',    label: 'Messages',             icon: MessageSquare },
  { id: 'world',       label: 'World Settings',       icon: Layers },
  { id: 'activation',  label: 'Entity Activation',    icon: Timer },
  { id: 'tracking',    label: 'Tracking Range',       icon: Layers },
  { id: 'hunger',      label: 'Hunger',               icon: Swords },
  { id: 'commands',    label: 'Commands',             icon: Command },
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

export default function SpigotConfigPanel({ serverId, currentPath, open, onOpenChange, onOpenRawFile }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/server/${serverId}/files/contents?file=${encodeURIComponent(`${currentPath}spigot.yml`)}`);
      if (!r.ok) throw new Error('Failed to read spigot.yml');
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
      const r = await fetch(`/api/server/${serverId}/files/write?file=${encodeURIComponent(`${currentPath}spigot.yml`)}`, { method: 'POST', body: serializeYaml(data) });
      if (!r.ok) throw new Error('Save failed');
      setDirty(false); toast({ title: 'Saved', description: 'spigot.yml saved. Restart to apply changes.' });
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
              <span className="font-bold tracking-tight">Spigot Configuration</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px] md:text-xs font-mono bg-neutral-900 border border-neutral-800 text-neutral-400">spigot.yml</Badge>
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
            <div className="flex items-center gap-3"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /><span className="text-neutral-400">Reading spigot.yml...</span></div>
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
                    {isActive && <motion.div layoutId="spigotActiveTab" className="absolute left-0 top-2.5 bottom-2.5 w-0.75 rounded-r bg-white" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
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
                      <CardDescription className="text-neutral-500 text-[11px] font-normal mt-1 leading-normal">Restart your server for Spigot config changes to take effect.</CardDescription>
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
