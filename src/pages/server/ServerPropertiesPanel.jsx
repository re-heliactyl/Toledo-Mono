import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  FileCode,
  Globe,
  Loader2,
  Lock,
  Save,
  Server,
  Shield,
  Swords,
  ToggleLeft,
  Wifi,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import { parseProperties, serializeProperties } from '@/lib/propertiesParser';

// ─── Field configuration ────────────────────────────────────────────────────

const FIELD_DEFS = {
  // General
  'max-players':            { label: 'Max Players',              type: 'number', min: 0, max: 2147483647, cat: 'general', desc: 'Maximum number of players that can join simultaneously.' },
  gamemode:                 { label: 'Game Mode',                 type: 'select', options: ['survival', 'creative', 'adventure', 'spectator'], cat: 'general', desc: 'Default game mode for new players.' },
  difficulty:               { label: 'Difficulty',                type: 'select', options: ['peaceful', 'easy', 'normal', 'hard'], cat: 'general', desc: 'Server difficulty level.' },
  hardcore:                 { label: 'Hardcore',                  type: 'bool', cat: 'general', desc: 'Enable hardcore mode: permanent death on max difficulty.' },
  motd:                     { label: 'Message of the Day (MOTD)', type: 'text', cat: 'general', desc: 'Text shown in the server list. Use § for color codes.' },

  // World
  'level-name':             { label: 'World Name',                type: 'text', cat: 'world', desc: 'Folder name containing the world.' },
  'level-seed':             { label: 'Level Seed',                type: 'text', cat: 'world', desc: 'Seed for world generation. Leave empty for random.' },
  'level-type':             { label: 'World Type',                type: 'select', options: ['minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified', 'minecraft:single_biome_surface'], cat: 'world', desc: 'World generator type.' },
  'generate-structures':    { label: 'Generate Structures',       type: 'bool', cat: 'world', desc: 'Generate villages, temples, and other structures.' },
  'spawn-protection':       { label: 'Spawn Protection',          type: 'number', min: 0, max: 2147483647, cat: 'world', desc: 'Spawn protection radius (blocks). 0 = disabled.' },
  'max-world-size':         { label: 'Max World Size',            type: 'number', min: 1, max: 29999984, cat: 'world', desc: 'Maximum world radius from center (blocks).' },

  // Gameplay
  pvp:                      { label: 'PVP',                       type: 'bool', cat: 'gameplay', desc: 'Allow players to deal damage to each other.' },
  'allow-flight':           { label: 'Allow Flight',              type: 'bool', cat: 'gameplay', desc: 'Allow flight in survival (prevents anti-cheat kick).' },
  'force-gamemode':         { label: 'Force Game Mode',           type: 'bool', cat: 'gameplay', desc: 'Force default game mode on every rejoin.' },
  'enable-command-block':   { label: 'Command Blocks',            type: 'bool', cat: 'gameplay', desc: 'Enable command blocks.' },
  'max-chained-neighbor-updates': { label: 'Max Chained Neighbor Updates', type: 'number', min: -1, max: 2147483647, cat: 'gameplay', desc: 'Limit redstone chain updates per tick. Negative = unlimited.' },

  // Performance
  'view-distance':          { label: 'View Distance',             type: 'range', min: 3, max: 32, cat: 'perf', desc: 'Chunk render distance (network/memory load).' },
  'simulation-distance':    { label: 'Simulation Distance',       type: 'range', min: 3, max: 32, cat: 'perf', desc: 'Chunk radius where entities tick. Major performance impact.' },
  'entity-broadcast-range-percentage': { label: 'Entity Broadcast Range', type: 'number', min: 10, max: 1000, cat: 'perf', desc: '% of view distance for sending entities to clients.' },
  'max-tick-time':          { label: 'Max Tick Time (ms)',         type: 'number', min: -1, max: 9223372036854775807, cat: 'perf', desc: 'Max ms per tick before watchdog kills the server. -1 = disabled.' },

  // Security
  'online-mode':            { label: 'Cracked',                   type: 'bool', cat: 'security', desc: 'Disable (False) for a cracked server without Mojang auth.', invert: true },
  'white-list':             { label: 'Whitelist',                 type: 'bool', cat: 'security', desc: 'Enable whitelist. Only listed players can join.' },
  'enforce-whitelist':      { label: 'Enforce Whitelist',         type: 'bool', cat: 'security', desc: 'Kick non-whitelisted players when whitelist reloads.' },
  'enforce-secure-profile': { label: 'Enforce Secure Profile',    type: 'bool', cat: 'security', desc: 'Require Mojang-signed chat keys. Disable for Geyser/Bedrock.' },
  'hide-online-players':    { label: 'Hide Online Players',       type: 'bool', cat: 'security', desc: 'Hide player names in the server list ping.' },
  'prevent-proxy-connections': { label: 'Anti-Proxy',             type: 'bool', cat: 'security', desc: 'Verify IP matches Mojang auth server. Blocks proxy connections.' },
  'enable-code-of-conduct': { label: 'Code of Conduct',           type: 'bool', cat: 'security', desc: 'Show the code of conduct screen on join.' },
  'log-ips':                { label: 'Log IPs',                   type: 'bool', cat: 'security', desc: 'Log player IP addresses to console and logs.' },

  // Communication
  'broadcast-console-to-ops': { label: 'Console → OPs',           type: 'bool', cat: 'comm', desc: 'Broadcast console output to online OPs.' },
  'broadcast-rcon-to-ops':    { label: 'RCON → OPs',              type: 'bool', cat: 'comm', desc: 'Broadcast RCON output to online OPs.' },

  // Resources
  'resource-pack':          { label: 'Resource Pack URL',         type: 'text', cat: 'resources', desc: 'Direct download URL for the server resource pack.' },
  'resource-pack-sha1':     { label: 'Resource Pack SHA-1',       type: 'text', cat: 'resources', desc: 'SHA-1 hash of the resource pack for integrity verification.' },
  'resource-pack-id':       { label: 'Resource Pack UUID',        type: 'text', cat: 'resources', desc: 'Optional UUID for resource pack identification.' },
  'require-resource-pack':  { label: 'Require Resource Pack',     type: 'bool', cat: 'resources', desc: 'Kick players who decline the resource pack.' },

  // Advanced
  'op-permission-level':    { label: 'OP Permission Level',       type: 'select', options: ['1', '2', '3', '4'], cat: 'advanced', desc: '1=bypass spawn, 2=cheat commands, 3=ban/op, 4=stop/restart.' },
  'function-permission-level': { label: 'Function Permission Level', type: 'select', options: ['1', '2', '3', '4'], cat: 'advanced', desc: 'Permission level for commands in functions and mcfunctions.' },
  'network-compression-threshold': { label: 'Network Compression Threshold', type: 'number', min: -1, max: 2147483647, cat: 'advanced', desc: 'Max packet size before compression. -1=off, 0=compress all.' },
  'player-idle-timeout':    { label: 'Player Idle Timeout',       type: 'number', min: 0, max: 2147483647, cat: 'advanced', desc: 'Minutes before kicking idle players. 0 = never.' },
  'rate-limit':             { label: 'Rate Limit',                type: 'number', min: 0, max: 2147483647, cat: 'advanced', desc: 'Max packets per second per player. 0 = unlimited.' },
  'enable-status':          { label: 'Visible in Server List',    type: 'bool', cat: 'advanced', desc: 'Show the server in the public server list.' },
  'enable-query':           { label: 'Query Protocol',            type: 'bool', cat: 'advanced', desc: 'Enable GameSpy4 UDP query protocol.' },
  'server-port':            { label: 'Server Port',               type: 'number', min: 1, max: 65534, cat: 'advanced', desc: 'TCP port the server listens on.' },
};

const CATEGORIES = [
  { id: 'general',    label: 'General',       icon: Server },
  { id: 'world',      label: 'World',         icon: Globe },
  { id: 'gameplay',   label: 'Gameplay',      icon: Swords },
  { id: 'perf',       label: 'Performance',   icon: Zap },
  { id: 'security',   label: 'Security',      icon: Lock },
  { id: 'comm',       label: 'Communication', icon: Wifi },
  { id: 'resources',  label: 'Resources',     icon: ToggleLeft },
  { id: 'advanced',   label: 'Advanced',      icon: Shield },
];

// ─── Field renderers ────────────────────────────────────────────────────────

function BoolField({ def, value, onChange }) {
  const checked = value === 'true';
  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-5 transition-all duration-300 ${
        checked
          ? 'border-neutral-700/80 bg-neutral-900/20 shadow-[0_4px_20px_rgba(255,255,255,0.01)]'
          : 'border-neutral-800/40 bg-neutral-950/10 hover:border-neutral-800/70 hover:bg-neutral-900/10'
      }`}
    >
      <div className="space-y-2 pr-4 flex-1">
        <div className="flex items-center gap-2.5">
          <Label className="text-sm font-semibold text-neutral-200 tracking-wide cursor-pointer">{def.label}</Label>
          {checked && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          )}
        </div>
        {def.desc && <p className="text-xs text-neutral-500 leading-relaxed font-normal">{def.desc}</p>}
      </div>
      <Switch
        checked={def.invert ? !checked : checked}
        onCheckedChange={(v) => onChange(String(def.invert ? !v : v))}
        className="data-[state=checked]:bg-white data-[state=unchecked]:bg-neutral-800"
      />
    </div>
  );
}

function SelectField({ def, value, onChange }) {
  return (
    <div className="space-y-3.5 rounded-xl border border-neutral-800/40 bg-neutral-950/10 p-5 transition-all duration-300 hover:border-neutral-800/70 hover:bg-neutral-900/10">
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-neutral-200 tracking-wide">{def.label}</Label>
        {def.desc && <p className="text-xs text-neutral-500 leading-relaxed font-normal">{def.desc}</p>}
      </div>
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-[#111216]/50 border-neutral-800 text-neutral-300 focus:ring-1 focus:ring-neutral-400 rounded-lg h-10">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent className="bg-[#111216] border-neutral-800 text-neutral-300">
          {def.options.map((opt) => (
            <SelectItem key={opt} value={opt} className="focus:bg-neutral-800 focus:text-white cursor-pointer">
              {opt.replace(/^minecraft:/, '')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function NumberField({ def, value, onChange }) {
  return (
    <div className="space-y-3.5 rounded-xl border border-neutral-800/40 bg-neutral-950/10 p-5 transition-all duration-300 hover:border-neutral-800/70 hover:bg-neutral-900/10">
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-neutral-200 tracking-wide">{def.label}</Label>
        {def.desc && <p className="text-xs text-neutral-500 leading-relaxed font-normal">{def.desc}</p>}
      </div>
      <Input
        type="number"
        min={def.min}
        max={def.max}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#111216]/50 border-neutral-800 font-mono text-neutral-300 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-700 rounded-lg h-10"
      />
    </div>
  );
}

function TextField({ def, value, onChange }) {
  return (
    <div className="space-y-3.5 rounded-xl border border-neutral-800/40 bg-neutral-950/10 p-5 transition-all duration-300 hover:border-neutral-800/70 hover:bg-neutral-900/10">
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold text-neutral-200 tracking-wide">{def.label}</Label>
        {def.desc && <p className="text-xs text-neutral-500 leading-relaxed font-normal">{def.desc}</p>}
      </div>
      <Input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="bg-[#111216]/50 border-neutral-800 font-mono text-neutral-300 focus:ring-1 focus:ring-neutral-400 focus:border-neutral-700 rounded-lg h-10"
        placeholder={def.label}
      />
    </div>
  );
}

function RangeField({ def, value, onChange }) {
  const displayVal = value || def.min;
  return (
    <div className="space-y-4 rounded-xl border border-neutral-800/40 bg-neutral-950/10 p-5 transition-all duration-300 hover:border-neutral-800/70 hover:bg-neutral-900/10">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5 flex-1 pr-4">
          <Label className="text-sm font-semibold text-neutral-200 tracking-wide">{def.label}</Label>
          {def.desc && <p className="text-xs text-neutral-500 leading-relaxed font-normal">{def.desc}</p>}
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-750 font-mono shrink-0">
          {displayVal}
        </span>
      </div>
      <div className="flex items-center gap-3 pt-1.5">
        <span className="text-[10px] text-neutral-600 font-mono w-3">{def.min}</span>
        <input
          type="range"
          min={def.min}
          max={def.max}
          value={Number(value) || def.min}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-neutral-800 accent-white 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border 
            [&::-webkit-slider-thumb]:border-neutral-600 [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(255,255,255,0.15)]
            [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white 
            [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-neutral-600 [&::-moz-range-thumb]:shadow-[0_0_6px_rgba(255,255,255,0.15)]"
        />
        <span className="text-[10px] text-neutral-600 font-mono w-3 text-right">{def.max}</span>
      </div>
    </div>
  );
}

function Field({ def, value, onChange }) {
  switch (def.type) {
    case 'bool':   return <BoolField   def={def} value={value} onChange={onChange} />;
    case 'select': return <SelectField def={def} value={value} onChange={onChange} />;
    case 'number': return <NumberField def={def} value={value} onChange={onChange} />;
    case 'range':  return <RangeField  def={def} value={value} onChange={onChange} />;
    default:       return <TextField   def={def} value={value} onChange={onChange} />;
  }
}

export default function ServerPropertiesPanel({ serverId, currentPath, open, onOpenChange, onOpenRawFile }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [error, setError] = useState(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filePath = `${currentPath}server.properties`;
      const r = await fetch(`/api/server/${serverId}/files/contents?file=${encodeURIComponent(filePath)}`);
      if (!r.ok) throw new Error('Failed to read server.properties');
      setData(parseProperties(await r.text()));
      setDirty(false);
    } catch (err) {
      setError(err.message);
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [serverId, currentPath]);

  useEffect(() => {
    if (open) fetchProperties();
  }, [open, fetchProperties]);

  const handleChange = useCallback((key, value) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const filePath = `${currentPath}server.properties`;
      const content = serializeProperties(data);
      const r = await fetch(`/api/server/${serverId}/files/write?file=${encodeURIComponent(filePath)}`, {
        method: 'POST',
        body: content,
      });
      if (!r.ok) throw new Error('Save failed');
      setDirty(false);
      toast({ title: 'Saved', description: 'server.properties saved. Restart the server to apply changes.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
      setSaving(false);
    }
  }, [serverId, currentPath, data]);

  const handleClose = useCallback(() => {
    if (dirty && !window.confirm('You have unsaved changes. Close anyway?')) return;
    onOpenChange(false);
  }, [dirty, onOpenChange]);

  const hasUnknownKeys = useMemo(() => {
    const known = new Set(Object.keys(FIELD_DEFS));
    return Object.keys(data).some((k) => !known.has(k));
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex flex-col p-0 gap-0 overflow-hidden bg-[#08090b] border-neutral-900 w-full h-full md:w-[90vw] md:max-w-5xl md:h-[85vh] md:rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] md:border border-neutral-800/60">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 md:px-6 md:py-4 border-b border-neutral-900/60 bg-[#0d0e12]/60 shrink-0 backdrop-blur-md">
          <DialogTitle className="flex items-center gap-2 md:gap-3 text-base md:text-lg text-neutral-100">
            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800/80">
              <FileCode className="h-4.5 w-4.5 text-neutral-200" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              <span className="font-bold tracking-tight">Configuration</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px] md:text-xs font-mono bg-neutral-900 border border-neutral-800 text-neutral-400">
                  server.properties
                </Badge>
                {dirty && (
                  <Badge variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/5 text-[10px] md:text-xs font-medium animate-pulse">
                    Modified
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>

          <div className="flex items-center gap-1.5 md:gap-3 pr-8 md:pr-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenRawFile}
              className="text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900/60 p-2 md:px-3 md:py-1.5 h-auto rounded-lg transition-colors"
            >
              <FileCode className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline text-xs font-medium">Open Raw</span>
            </Button>
            
            <div className="w-[1px] h-5 bg-neutral-800 hidden md:block" />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={dirty ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className={`h-8.5 rounded-lg px-3 md:px-4 text-xs font-semibold tracking-wide transition-all duration-200 ${
                      dirty
                        ? 'bg-neutral-950/80 text-emerald-400 border border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-950/30 hover:shadow-[0_0_12px_rgba(16,185,129,0.15)] active:scale-95'
                        : 'bg-transparent border-neutral-800 text-neutral-500 hover:bg-neutral-900/40'
                    }`}
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 md:mr-1.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5 md:mr-1.5" />
                    )}
                    <span className="hidden md:inline">Save Changes</span>
                    <span className="md:hidden">Save</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-900 border-neutral-800 text-neutral-300 text-xs">
                  Restart required to apply changes
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
              <span className="text-neutral-400">Reading server.properties...</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            {/* Sidebar (PC) */}
            <div className="hidden md:flex flex-col w-60 border-r border-neutral-900/60 bg-[#0a0b0d]/50 shrink-0 p-5 space-y-2 overflow-y-auto">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeTab === cat.id;
                const count = Object.keys(FIELD_DEFS).filter((k) => FIELD_DEFS[k].cat === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-neutral-900 text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)] border border-neutral-800/80'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/20 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-400'}`} />
                      <span>{cat.label}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isActive ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-950/40 text-neutral-600 group-hover:text-neutral-500'}`}>
                      {count}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="activeCategoryIndicator"
                        className="absolute left-0 top-2.5 bottom-2.5 w-0.75 rounded-r bg-white"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Category Selector (Mobile) */}
            <div className="flex md:hidden shrink-0 border-b border-neutral-900/60 bg-[#0a0b0d]/50 p-3">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-full bg-[#111216]/50 border-neutral-850 text-neutral-300">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-[#111216] border-neutral-850 text-neutral-300">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <SelectItem key={cat.id} value={cat.id} className="focus:bg-neutral-800 focus:text-white cursor-pointer">
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-neutral-400" />
                          <span className="text-xs font-semibold">{cat.label}</span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 bg-[#060709]/10 relative">
              <ScrollArea className="h-full">
                <div className="p-5 md:p-8 space-y-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5"
                    >
                      {Object.keys(FIELD_DEFS)
                        .filter((k) => FIELD_DEFS[k].cat === activeTab)
                        .map((key) => (
                          <div key={key} className="col-span-1">
                            <Field def={FIELD_DEFS[key]} value={data[key]} onChange={(v) => handleChange(key, v)} />
                          </div>
                        ))}
                    </motion.div>
                  </AnimatePresence>

                  {/* Extra keys warning */}
                  {activeTab === 'advanced' && hasUnknownKeys && (
                    <Card className="border-amber-500/20 bg-amber-500/5 mt-4 rounded-xl shadow-none">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="flex items-center gap-2 text-amber-400 text-sm font-bold">
                          <AlertTriangle className="h-4 w-4" />
                          Unknown Properties
                        </CardTitle>
                        <CardDescription className="text-amber-500/70 text-xs font-normal">
                          These properties exist in your file but aren&apos;t managed by this panel.
                          Use the raw editor to modify them.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex flex-wrap gap-1.5">
                          {Object.keys(data)
                            .filter((k) => !FIELD_DEFS[k])
                            .map((k) => (
                              <Badge key={k} variant="outline" className="text-amber-400 border-amber-500/20 bg-amber-500/5 text-[10px] font-mono rounded">
                                {k}
                              </Badge>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Restart notice */}
                  {activeTab === 'advanced' && (
                    <Card className="border-neutral-800 bg-neutral-900/10 mt-4 rounded-xl shadow-none">
                      <CardHeader className="p-4">
                        <CardTitle className="flex items-center gap-2 text-neutral-300 text-xs font-bold">
                          <AlertTriangle className="h-4 w-4 text-neutral-400" />
                          Restart Required
                        </CardTitle>
                        <CardDescription className="text-neutral-500 text-[11px] font-normal mt-1 leading-normal">
                          Most changes require a full server restart.
                          Some Paper settings can be reloaded with /reload.
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
