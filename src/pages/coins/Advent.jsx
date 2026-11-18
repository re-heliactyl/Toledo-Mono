import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, Box, Coins, Cpu, Gift, Lock, Package, RefreshCw, X } from 'lucide-react';

const STATUS_KEY = ['advent-status'];
const TOTAL_DAYS = 24;

const REWARD_ICONS = { coins: Coins, resource: Cpu, bundle: Package, empty: Box };

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const h = String(Math.floor((total % 86400) / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return days > 0 ? `${days}d ${h}:${m}:${s}` : `${h}:${m}:${s}`;
}

// Ticks every second against the server clock (offset measured on each status fetch).
function useServerNow(serverTime, fetchedAt) {
  const offset = serverTime ? new Date(serverTime).getTime() - fetchedAt : 0;
  const [now, setNow] = useState(() => Date.now() + offset);
  useEffect(() => {
    setNow(Date.now() + offset);
    const id = setInterval(() => setNow(Date.now() + offset), 1000);
    return () => clearInterval(id);
  }, [offset]);
  return now;
}

// Wrapping paper palettes, picked per day in a fixed shuffled order.
const PAPERS = [
  { paper: '#a3222b', shade: '#7c1820', ribbon: '#e5b65a', tag: '#f6efe0' }, // red / gold
  { paper: '#1e5a3c', shade: '#14412b', ribbon: '#d23a3a', tag: '#f6efe0' }, // pine / red
  { paper: '#efe6d2', shade: '#d9ccb0', ribbon: '#b3262e', tag: '#ffffff' }, // cream / red
  { paper: '#c7963f', shade: '#a27628', ribbon: '#1e5a3c', tag: '#fff8e8' }, // gold / pine
  { paper: '#2a3d6b', shade: '#1d2c50', ribbon: '#e5b65a', tag: '#f6efe0' }, // night blue / gold
];
const paperFor = (day) => PAPERS[(day * 7 + 3) % PAPERS.length];

// A wrapped present: ribbon cross, bow on top, numbered gift tag.
function Present({ day, palette, dimmed, children }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden rounded-xl ${dimmed ? 'grayscale opacity-30' : ''}`}
      style={{ background: `linear-gradient(160deg, ${palette.paper} 0%, ${palette.paper} 55%, ${palette.shade} 100%)` }}
    >
      {/* subtle paper pattern */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #fff 1px, transparent 1.5px), radial-gradient(circle at 75% 75%, #fff 1px, transparent 1.5px)', backgroundSize: '14px 14px' }}
      />
      {/* ribbon */}
      <div className="absolute inset-y-0 left-1/2 w-[14%] -translate-x-1/2" style={{ background: palette.ribbon }} />
      <div className="absolute inset-x-0 top-[38%] h-[14%]" style={{ background: palette.ribbon }} />
      {/* bow */}
      <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-[60%]">
        <div className="relative h-5 w-9">
          <span className="absolute left-0 top-0 h-4 w-4 rotate-[-30deg] rounded-[45%_45%_20%_45%] border-2" style={{ borderColor: palette.ribbon }} />
          <span className="absolute right-0 top-0 h-4 w-4 rotate-[30deg] rounded-[45%_45%_45%_20%] border-2" style={{ borderColor: palette.ribbon }} />
          <span className="absolute left-1/2 top-[30%] h-2.5 w-2.5 -translate-x-1/2 rounded-full" style={{ background: palette.ribbon }} />
        </div>
      </div>
      {/* gift tag with the day */}
      <div
        className="absolute bottom-[10%] left-1/2 -translate-x-1/2 min-w-[2.1rem] rounded-md px-1.5 py-0.5 text-center text-sm font-bold tabular-nums text-[#3a1d14] shadow-sm"
        style={{ background: palette.tag }}
      >
        {day}
      </div>
      {children}
    </div>
  );
}

function DayTile({ day, onOpen, opening }) {
  const { state, reward } = day;
  const palette = paperFor(day.day);

  if (state === 'today') {
    return (
      <button
        type="button"
        onClick={() => onOpen(day.day)}
        disabled={opening}
        aria-label={`Open day ${day.day}`}
        className="advent-today group relative aspect-square rounded-xl ring-2 ring-[#e5b65a] ring-offset-2 ring-offset-[#0f1a14] transition-transform duration-200 hover:-translate-y-1 active:scale-95 focus-visible:outline-none focus-visible:ring-white disabled:cursor-wait"
      >
        <Present day={day.day} palette={palette}>
          <span className="absolute left-1/2 top-[6%] -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0f1a14]/80 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-widest text-[#f3d58c]">
            {opening ? 'Opening…' : 'Open me'}
          </span>
          {opening && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/30">
              <RefreshCw className="h-6 w-6 animate-spin text-white" />
            </span>
          )}
        </Present>
      </button>
    );
  }

  if (state === 'opened') {
    const Icon = REWARD_ICONS[reward.kind] || Gift;
    const empty = reward.kind === 'empty';
    return (
      <div className="relative aspect-square overflow-hidden rounded-xl border border-[#e5b65a]/25 bg-[#0f1a14] flex flex-col items-center justify-center gap-1.5 px-2 text-center">
        {/* open box rim in the day's paper color */}
        <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: palette.paper }} />
        <span className="absolute top-2.5 left-2 text-[0.65rem] font-semibold text-[#e5b65a]/70">{day.day}</span>
        <Icon className={`h-5 w-5 ${empty ? 'text-white/25' : 'text-[#f3d58c]'}`} />
        <span className={`text-[0.7rem] leading-tight ${empty ? 'text-white/30' : 'text-white/90'}`}>
          {empty ? 'Empty' : reward.label}
        </span>
      </div>
    );
  }

  const missed = state === 'missed';
  return (
    <div
      className="relative aspect-square rounded-xl"
      title={missed ? 'Missed' : `Unlocks ${formatDate(day.unlocksAt)}`}
    >
      <Present day={day.day} palette={palette} dimmed={missed}>
        {!missed && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-black/25 p-1">
            <Lock className="h-2.5 w-2.5 text-white/70" />
          </span>
        )}
      </Present>
      {missed && (
        <span className="absolute inset-x-0 top-[12%] text-center text-[0.6rem] font-semibold uppercase tracking-widest text-white/40">
          Missed
        </span>
      )}
    </div>
  );
}

// String of lights hung across the top of the calendar.
const LIGHT_COLORS = ['#e5484d', '#f3d58c', '#46a758', '#5b8def', '#f3d58c'];
function Garland() {
  const bulbs = 18;
  return (
    <svg className="pointer-events-none absolute inset-x-0 top-0 h-8 w-full" viewBox="0 0 360 32" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 4 Q 20 18 40 6 T 80 6 T 120 6 T 160 6 T 200 6 T 240 6 T 280 6 T 320 6 T 360 6" fill="none" stroke="#2c4a36" strokeWidth="1.5" />
      {Array.from({ length: bulbs }, (_, i) => {
        const x = 10 + i * (340 / (bulbs - 1));
        const y = 10 + Math.abs(Math.sin((x / 40) * Math.PI)) * 4;
        return (
          <ellipse
            key={i}
            className="advent-bulb"
            style={{ animationDelay: `${(i % 5) * 0.4}s` }}
            cx={x}
            cy={y + 4}
            rx="2.6"
            ry="3.6"
            fill={LIGHT_COLORS[i % LIGHT_COLORS.length]}
          />
        );
      })}
    </svg>
  );
}

const ADVENT_STYLES = `
@keyframes advent-twinkle { 0%, 100% { opacity: 1 } 50% { opacity: .35 } }
@keyframes advent-wiggle { 0%, 88%, 100% { transform: rotate(0) } 91% { transform: rotate(-4deg) } 94% { transform: rotate(4deg) } 97% { transform: rotate(-2deg) } }
.advent-bulb { animation: advent-twinkle 2s ease-in-out infinite; }
.advent-today > div { animation: advent-wiggle 4s ease-in-out infinite; transform-origin: 50% 90%; }
@media (prefers-reduced-motion: reduce) { .advent-bulb, .advent-today > div { animation: none; } }
`;

function RewardDialog({ result, onClose }) {
  useEffect(() => {
    if (!result) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [result, onClose]);

  if (!result) return null;
  const { reward, day } = result;
  const Icon = REWARD_ICONS[reward.kind] || Gift;
  const empty = reward.kind === 'empty';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="advent-reward-title"
        className="relative w-full max-w-sm overflow-hidden rounded-xl border border-[#e5b65a]/30 bg-[#0f1a14] p-6 pt-8 text-center animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label="Close" className="absolute top-3 right-3 p-1 rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="absolute inset-x-0 top-0 flex h-1.5">
          <span className="flex-1 bg-[#a3222b]" /><span className="flex-1 bg-[#e5b65a]" /><span className="flex-1 bg-[#1e5a3c]" />
        </div>
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-[#14231b] border border-[#e5b65a]/40 flex items-center justify-center">
          <Icon className={`w-8 h-8 ${empty ? 'text-white/30' : 'text-[#f3d58c]'}`} />
        </div>
        <p className="text-xs uppercase tracking-widest text-[#e5b65a]/80">Day {day} · Merry Christmas</p>
        <h3 id="advent-reward-title" className="mt-1 text-xl font-semibold text-white">
          {empty ? 'No luck today' : reward.label}
        </h3>
        <p className="mt-2 text-sm text-[#95a1ad]">
          {empty
            ? 'This box was empty. Come back tomorrow for another try.'
            : reward.expiresAt
              ? `Active until ${formatDate(reward.expiresAt)}.`
              : 'Added to your account.'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-[#a3222b] text-white text-sm font-medium py-2.5 hover:bg-[#b52a33] active:scale-[0.98] transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function AdventPage() {
  const queryClient = useQueryClient();
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const { data, isLoading, isError, dataUpdatedAt, refetch } = useQuery({
    queryKey: STATUS_KEY,
    queryFn: () => axios.get('/api/advent/status').then((r) => r.data),
    staleTime: 30_000,
  });

  const now = useServerNow(data?.serverTime, dataUpdatedAt);

  // Refresh as soon as the next box unlocks.
  const nextUnlock = data?.nextUnlockAt ? new Date(data.nextUnlockAt).getTime() : null;
  useEffect(() => {
    if (nextUnlock && now >= nextUnlock) refetch();
  }, [now, nextUnlock, refetch]);

  const openBox = useMutation({
    mutationFn: (day) => axios.post('/api/advent/open', { day }).then((r) => r.data),
    onMutate: () => setError(''),
    onSuccess: (res) => {
      setResult(res);
      queryClient.invalidateQueries({ queryKey: STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: ['state'] });
    },
    onError: (err) => {
      setError(err.response?.data?.error || 'Could not open this box. Please try again.');
      queryClient.invalidateQueries({ queryKey: STATUS_KEY });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 max-w-screen-2xl mx-auto" aria-busy="true">
        <div className="h-14 w-72 rounded-lg bg-[#202229]/60" />
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
          {Array.from({ length: TOTAL_DAYS }, (_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-[#14231b]" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 max-w-screen-2xl mx-auto">
        <div className="rounded-md border border-[#2e3337] bg-[#202229] p-6 text-center">
          <Gift className="w-8 h-8 mx-auto text-[#95a1ad]" />
          <p className="mt-3 text-white font-medium">The advent calendar isn't available right now</p>
        </div>
      </div>
    );
  }

  const openedCount = data.days.filter((d) => d.state === 'opened').length;
  const countdown = data.nextUnlockAt ? formatCountdown(new Date(data.nextUnlockAt).getTime() - now) : null;

  return (
    <div className="space-y-6 p-6 max-w-screen-2xl mx-auto">
      <style>{ADVENT_STYLES}</style>

      <div className="relative overflow-hidden rounded-2xl border border-[#2c4a36] bg-[radial-gradient(120%_80%_at_50%_0%,#163024_0%,#0f1a14_55%,#0b110e_100%)] px-4 pb-5 pt-10 sm:px-6">
        <Garland />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#e5b65a]/80">Season's greetings</p>
            <h1 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">Advent Calendar</h1>
            <p className="mt-1 text-sm text-[#b9c7bd]">
              One present a day from {formatDate(data.opensAt)}. Each one can only be unwrapped on its own day.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-lg border border-[#e5b65a]/25 bg-black/30 px-4 py-2.5 text-sm">
            {data.phase === 'upcoming' && (
              <>
                <span className="text-[#b9c7bd]">Opens in</span>
                <span className="font-mono font-medium text-[#f3d58c] tabular-nums">{countdown}</span>
              </>
            )}
            {data.phase === 'active' && (
              <>
                <span className="text-[#b9c7bd]">Day {data.currentDay} of {data.totalDays}</span>
                {countdown && (
                  <>
                    <span className="h-4 w-px bg-white/10" />
                    <span className="text-[#b9c7bd]">Next present in</span>
                    <span className="font-mono font-medium text-[#f3d58c] tabular-nums">{countdown}</span>
                  </>
                )}
              </>
            )}
            {data.phase === 'ended' && <span className="text-[#b9c7bd]">That's a wrap. See you next Christmas!</span>}
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-md border border-red-500/20 bg-red-500/10 text-red-400 p-3 flex items-start">
            <AlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
          {data.days.map((day) => (
            <DayTile key={day.day} day={day} onOpen={(d) => openBox.mutate(d)} opening={openBox.isPending} />
          ))}
        </div>

        <div className="mt-5 border-t border-[#2c4a36] pt-4 text-sm text-[#b9c7bd]">
          {openedCount} of {data.totalDays} presents unwrapped
        </div>
      </div>

      <RewardDialog result={result} onClose={() => setResult(null)} />
    </div>
  );
}
