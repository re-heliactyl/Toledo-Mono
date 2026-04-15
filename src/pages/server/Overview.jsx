import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from "axios";
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  Copy,
  Cpu,
  HardDrive,
  InfoIcon,
  Loader2,
  MemoryStick,
  Network,
  Power,
  RefreshCw,
  RotateCw,
  Server,
  Square,
  Terminal,
  Upload
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Area, AreaChart,
  Line,
  LineChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis, YAxis
} from 'recharts';
import ConnectionOverlay from '../../components/ConnectionOverlay';

const RETRY_COUNT = 5;
const RETRY_DELAY = 5000;
const MAX_HISTORY_POINTS = 50;
const CHART_COLORS = {
  cpu: '#3B82F6',
  memory: '#3B82F6',
  disk: '#A855F7',
  network: '#F59E0B'
};

const ResourceChart = ({ data, dataKey, color, label, unit = "", domain }) => (
  <div className="h-36">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: '#6B7280' }}
          stroke="#374151"
          interval="preserveStart"
        />
        <YAxis
          domain={domain || [0, 'auto']}
          tick={{ fontSize: 10, fill: '#6B7280' }}
          stroke="#374151"
          width={40}
        />
        <RechartsTooltip
          content={({ active, payload }) => {
            if (active && payload?.[0]) {
              return (
                <div className="bg-[#202229] border border-neutral-800 p-2 rounded-lg shadow-lg">
                  <p className="text-sm text-neutral-300">
                    {`${label}: ${payload[0].value.toFixed(1)}${unit}`}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {payload[0].payload.time}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          fill={`url(#gradient-${dataKey})`}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const formatNetworkSpeed = (kbps) => {
  if (kbps >= 1099511627776) {
    return `${(kbps / 1099511627776).toFixed(2)} PB/s`;
  } else if (kbps >= 1073741824) {
    return `${(kbps / 1073741824).toFixed(2)} TB/s`;
  } else if (kbps >= 1048576) {
    return `${(kbps / 1048576).toFixed(2)} GB/s`;
  } else if (kbps >= 1024) {
    return `${(kbps / 1024).toFixed(2)} MB/s`;
  }
  return `${kbps.toFixed(2)} KB/s`;
};

const stripAnsiRegex = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

const formatCompactDuration = (ms) => {
  if (ms === null || ms === undefined) {
    return 'N/A';
  }

  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

const NetworkChart = ({ data }) => (
  <div className="h-36">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: '#6B7280' }}
          stroke="#374151"
          interval="preserveStart"
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#6B7280' }}
          stroke="#374151"
          width={40}
          tickFormatter={(value) => {
            if (value >= 1099511627776) return `${(value / 1099511627776).toFixed(1)}P`;
            if (value >= 1073741824) return `${(value / 1073741824).toFixed(1)}T`;
            if (value >= 1048576) return `${(value / 1048576).toFixed(1)}G`;
            if (value >= 1024) return `${(value / 1024).toFixed(1)}M`;
            return `${value.toFixed(0)}K`;
          }}
        />
        <RechartsTooltip
          content={({ active, payload }) => {
            if (active && payload?.length) {
              return (
                <div className="bg-[#202229] border border-neutral-800 p-2 rounded-lg shadow-lg">
                  <p className="text-sm text-neutral-300">
                    {`↑ Upload: ${formatNetworkSpeed(payload[0].value)}`}
                  </p>
                  <p className="text-sm text-neutral-300">
                    {`↓ Download: ${formatNetworkSpeed(payload[1].value)}`}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {payload[0].payload.time}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Line
          type="monotone"
          dataKey="up"
          stroke={CHART_COLORS.network}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="down"
          stroke="#60A5FA"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const ResourceStat = ({ icon: Icon, title, value, secondaryValue, chartData, dataKey, color, unit, domain, Chart = ResourceChart }) => (
  <Card className="overflow-hidden">
    <CardHeader className="p-4 pb-0">
      <div className="flex items-center gap-3">
        <div className="bg-white/5 p-2.5 rounded-lg">
          <Icon className="w-5 h-5 text-neutral-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-400">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-lg font-semibold text-white truncate">{value}</p>
            {secondaryValue && (
              <p className="text-sm text-neutral-500 truncate">{secondaryValue}</p>
            )}
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-4 pt-2">
      {chartData?.length > 0 && (
        <Chart
          data={chartData}
          dataKey={dataKey}
          color={color}
          label={title}
          unit={unit}
          domain={domain}
        />
      )}
    </CardContent>
  </Card>
);

const formatConsoleOutput = (line) => {
  return String(line || '')
    .replace(/\[m/g, '')
    .replace(/You need to agree to the EULA in order to run the server/gi, 'You need to agree to the EULA to run the server. Please check the dialog above.')
    .replace(/container@pterodactyl~/g, 'container')
    .replace(/\[Pterodactyl Daemon\]:/g, 'kryptond')
    .replace(/Checking server disk space usage, this could take a few seconds\.\.\./g, 'Checking things, hold on...')
    .replace(/Updating process configuration files\.\.\./g, 'This might take a while. One moment.')
    .replace(/Ensuring file permissions are set correctly, this could take a few seconds\.\.\./g, "All checks completed. We're good to go.")
    .replace(/Pulling Docker container image, this could take a few minutes to complete\.\.\./g, 'Updating Cargo on-the-fly...')
    .replace(/Finished pulling Docker container image/g, 'All done!')
    .replace(stripAnsiRegex, '')
    .replace(/\[0;39m/g, '')
    .trimEnd();
};

const getConsoleLineClassName = (line) => {
  const normalized = String(line || '').toLowerCase();

  if (normalized.includes('error')) {
    return 'text-red-300';
  }

  if (normalized.includes('warn')) {
    return 'text-yellow-300';
  }

  if (normalized.includes('info')) {
    return 'text-blue-300';
  }

  if (normalized.includes('debug')) {
    return 'text-neutral-400';
  }

  return 'text-neutral-200';
};

export default function ConsolePage() {
  const isFirstStateUpdate = useRef(true);
  const { id } = useParams();
  const queryClient = useQueryClient();
  const socketRef = useRef(null);
  const { toast } = useToast();
  const [serverState, setServerState] = useState("offline");
  const [isInstalling, setIsInstalling] = useState(false);
  const [consoleLines, setConsoleLines] = useState([]);
  const consoleLineId = useRef(0);
  const [command, setCommand] = useState("");
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showEulaDialog, setShowEulaDialog] = useState(false);
  const [installationProgress, setInstallationProgress] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [resourceHistory, setResourceHistory] = useState({
    cpu: [],
    memory: [],
    disk: [],
    network: []
  });
  const [stats, setStats] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: { up: 0, down: 0 },
    uptime: "0h 00m 0s"
  });
  const [isConnecting, setIsConnecting] = useState(true);

  const scrollAreaRef = useRef(null);
  const mounted = useRef(true);
  const retryCountRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const intentionalCloseRef = useRef(false);
  const connectionInFlightRef = useRef(false);
  const isSuspendedRef = useRef(false);

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await axios.get('/api/remote/user');
      return data;
    }
  });

  const { data: server, error: serverError } = useQuery({
    queryKey: ['server', id],
    queryFn: async () => {
      const { data } = await axios.get(`/api/server/${id}`);
      return data.attributes;
    }
  });

  const { data: renewalStatus, error: renewalError, isLoading: isRenewalLoading } = useQuery({
    queryKey: ['server', id, 'renewal'],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`/api/server/${id}/renewal/status`);
        return data;
      } catch (error) {
        if (error?.response?.status === 404) {
          return null;
        }

        throw error;
      }
    },
    refetchInterval: 30000,
    retry: 1,
    enabled: Boolean(id)
  });

  const renewServer = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post(`/api/server/${id}/renewal/renew`);
      return data;
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries(['server', id, 'renewal']);
      toast({
        title: 'Renewal complete',
        description: data?.restarted
          ? 'Server renewed and restarted.'
          : 'Server renewed successfully.'
      });
    },
    onError: (error) => {
      toast({
        title: 'Renewal failed',
        description: error?.response?.data?.error || 'Unable to renew this server right now.',
        variant: 'destructive'
      });
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    isSuspendedRef.current = server?.is_suspended || false;
    if (server?.is_suspended) {
      intentionalCloseRef.current = true;
      setIsConnecting(false);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    }
  }, [server?.is_suspended]);

  const renewalNextAt = renewalStatus?.nextRenewalAt ? new Date(renewalStatus.nextRenewalAt).getTime() : null;
  const renewalDeleteAt = renewalStatus?.autoDeleteAt ? new Date(renewalStatus.autoDeleteAt).getTime() : null;
  const renewalMsRemaining = renewalNextAt === null ? null : renewalNextAt - now;
  const autoDeleteMsRemaining = renewalDeleteAt === null ? null : renewalDeleteAt - now;
  const renewalWindowMs = (renewalStatus?.config?.renewalWindowHours || 0) * 60 * 60 * 1000;
  const renewalExpired = renewalMsRemaining !== null && renewalMsRemaining <= 0;
  const renewalCanRenew = Boolean(
    renewalStatus?.config?.enabled &&
    renewalMsRemaining !== null &&
    renewalMsRemaining <= renewalWindowMs
  );
  const renewalStatusBadge = !renewalStatus?.config?.enabled
    ? { label: 'Disabled', className: 'bg-neutral-700/40 text-neutral-200 border-neutral-600/60' }
    : renewalExpired
      ? { label: 'Expired', className: 'bg-red-500/15 text-red-200 border-red-500/30' }
      : renewalCanRenew
        ? { label: 'Renew now', className: 'bg-amber-500/15 text-amber-200 border-amber-500/30' }
        : { label: 'Active', className: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30' };
  const showRenewalCard = isRenewalLoading || Boolean(renewalStatus) || Boolean(renewalError);

  const writeFile = async (path, content) => {
    try {
      const response = await fetch(`/api/server/${id}/files/write?file=${encodeURIComponent(path)}`, {
        method: 'POST',
        body: content
      });

      if (!response.ok) throw new Error(`Failed to write file: ${response.statusText}`);
      return true;
    } catch (error) {
      toast({ title: "Error", description: `Failed to write to ${path}: ${error.message}`, variant: "destructive" });
      return false;
    }
  };

  const handleAcceptEula = async () => {
    if (await writeFile('eula.txt', 'eula=true')) {
      toast({ title: "Success", description: "EULA accepted successfully" });
      setShowEulaDialog(false);
      await sendPowerAction('restart');
    }
  };

  const refreshToken = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/server/${id}/websocket`);
      socketRef.current?.send(JSON.stringify({
        event: "auth",
        args: [data.data.token]
      }));
    } catch (error) {
      toast({ title: "Connection Error", description: "Failed to refresh connection token", variant: "destructive" });
    }
  }, [id, toast]);

  const handleWebSocketMessage = useCallback((event) => {
    if (!mounted.current) return;

    try {
      const message = JSON.parse(event.data);

      switch (message.event) {
        case 'auth success':
          socketRef.current?.send(JSON.stringify({ event: 'send logs', args: [null] }));
          socketRef.current?.send(JSON.stringify({ event: 'send stats', args: [null] }));
          break;

        case 'console output':
          setConsoleLines(prev => [
            ...prev.slice(-1000),
            {
              id: consoleLineId.current++,
              content: message.args[0]
            }
          ]);
          if (message.args[0].toLowerCase().includes('agree to the eula')) {
            setShowEulaDialog(true);
          }
          break;

        case 'stats': {
          const statsData = JSON.parse(message.args[0]);
          if (!statsData || !mounted.current) return;

          setStats(prev => ({
            ...prev,
            cpu: (statsData.cpu_absolute || 0).toFixed(1),
            memory: (statsData.memory_bytes / 1024 / 1024 || 0).toFixed(0),
            disk: (statsData.disk_bytes / 1024 / 1024 || 0).toFixed(0),
            network: {
              up: (statsData.network?.tx_bytes / 1024 || 0).toFixed(2),
              down: (statsData.network?.rx_bytes / 1024 || 0).toFixed(2)
            },
            uptime: statsData.uptime || "0h 00m 0s"
          }));
          break;
        }

        case 'status': {
          const newState = message.args[0];
          setServerState(newState);
          setIsInstalling(message.args[1]?.is_installing || false);
          break;
        }

        case 'install started':
          setInstallationProgress({ status: 'started', message: 'Installation started...' });
          toast({ title: "Info", description: "Server installation started" });
          break;

        case 'install output':
          setInstallationProgress(prev => ({
            ...prev,
            message: message.args[0]
          }));
          break;

        case 'install completed':
          setInstallationProgress({ status: 'completed', message: 'Installation completed successfully' });
          toast({ title: "Success", description: "Server installation completed successfully" });
          setIsInstalling(false);
          break;

        case 'token expired':
          toast({ title: "Session Expired", description: "Your session has expired. Reconnecting...", variant: "warning" });
          break;

        case 'token expiring':
          refreshToken();
          break;

        case 'daemon error':
          toast({ title: "Daemon Error", description: message.args[0], variant: "destructive" });
          break;

        case 'jwt error':
          toast({ title: "Authentication Error", description: message.args[0], variant: "destructive" });
          break;
      }
    } catch (error) {
      // Silently ignore WebSocket errors to avoid console spam
    }
  }, [refreshToken, toast]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Update resource history when stats change
  useEffect(() => {
    if (!mounted.current) return;

    const timestamp = new Date().toLocaleTimeString();
    setResourceHistory(prev => ({
      cpu: [...prev.cpu.slice(-MAX_HISTORY_POINTS), { time: timestamp, value: parseFloat(stats.cpu) }],
      memory: [...prev.memory.slice(-MAX_HISTORY_POINTS), { time: timestamp, value: parseFloat(stats.memory) }],
      disk: [...prev.disk.slice(-MAX_HISTORY_POINTS), { time: timestamp, value: parseFloat(stats.disk) }],
      network: [...prev.network.slice(-MAX_HISTORY_POINTS), {
        time: timestamp,
        up: parseFloat(stats.network.up) || 0,
        down: parseFloat(stats.network.down) || 0
      }]
    }));
  }, [stats]);

  useEffect(() => {
    mounted.current = true;
    intentionalCloseRef.current = false;
    setIsConnecting(true);

    const clearReconnectTimeout = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (
        !mounted.current ||
        intentionalCloseRef.current ||
        reconnectTimeoutRef.current ||
        retryCountRef.current >= RETRY_COUNT ||
        isSuspendedRef.current
      ) {
        return;
      }

      retryCountRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;

        if (!mounted.current || intentionalCloseRef.current) {
          return;
        }

        connectWebSocket();
      }, RETRY_DELAY);
    };

    const connectWebSocket = async () => {
      const existingSocket = socketRef.current;

      if (
        !mounted.current ||
        intentionalCloseRef.current ||
        connectionInFlightRef.current ||
        isSuspendedRef.current ||
        (existingSocket && (
          existingSocket.readyState === WebSocket.OPEN ||
          existingSocket.readyState === WebSocket.CONNECTING
        ))
      ) {
        return;
      }

      try {
        if (!mounted.current) return;

        connectionInFlightRef.current = true;

        // Show connecting state while fetching websocket URL
        setIsConnecting(true);

        const { data } = await axios.get(`/api/server/${id}/websocket`);

        if (!mounted.current || intentionalCloseRef.current) {
          connectionInFlightRef.current = false;
          return;
        }

        const ws = new WebSocket(data.data.socket);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!mounted.current || intentionalCloseRef.current || socketRef.current !== ws) {
            ws.close();
            return;
          }

          clearReconnectTimeout();
          retryCountRef.current = 0;
          connectionInFlightRef.current = false;
          setIsConnecting(false);

          ws.send(JSON.stringify({
            event: "auth",
            args: [data.data.token]
          }));
        };

        ws.onmessage = (event) => {
          if (socketRef.current !== ws) {
            return;
          }

          handleWebSocketMessage(event);
        };

        ws.onclose = () => {
          if (socketRef.current !== ws) {
            return;
          }

          socketRef.current = null;
          connectionInFlightRef.current = false;

          if (!mounted.current || intentionalCloseRef.current) {
            return;
          }

          setIsConnecting(true);
          scheduleReconnect();
        };

        ws.onerror = () => {
          if (socketRef.current !== ws) {
            return;
          }

          setIsConnecting(true);
        };
      } catch (error) {
        connectionInFlightRef.current = false;
        toast({ title: "Connection Error", description: "Failed to connect to server", variant: "destructive" });
        // Keep connecting state for a bit to show the error
        setTimeout(() => {
          if (mounted.current) setIsConnecting(false);
        }, 2000);

        scheduleReconnect();
      }
    };

    connectWebSocket();

    return () => {
      mounted.current = false;
      intentionalCloseRef.current = true;
      connectionInFlightRef.current = false;

      clearReconnectTimeout();

      if (socketRef.current) {
        const socket = socketRef.current;
        socketRef.current = null;
        socket.close();
      }
    };
  }, [id, handleWebSocketMessage, toast]);

  // Auto-scroll effect
  useEffect(() => {
    if (!consoleLines.length) {
      return;
    }

    if (autoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'instant'
          });
        }, 0);
      }
    }
  }, [consoleLines.length, autoScroll]);

  const handleScroll = useCallback((event) => {
    const container = event.currentTarget;
    const isAtBottom = Math.abs(
      (container.scrollHeight - container.clientHeight) - container.scrollTop
    ) < 50;
    setAutoScroll(isAtBottom);
  }, []);

  const sendPowerAction = async (action) => {
    try {
      await axios.post(`/api/server/${id}/power`, { signal: action });
    } catch (error) {
      toast({
        title: 'Action failed',
        description: error?.response?.data?.error || 'Failed to update server power state.',
        variant: 'destructive'
      });
    }
  };

  const sendCommand = async (e) => {
    e?.preventDefault();
    if (!command.trim()) return;

    try {
      await axios.post(`/api/server/${id}/command`, { command });
      setCommandHistory(prev => [command, ...prev.slice(0, 99)]);
      setCommand("");
      setHistoryIndex(-1);
    } catch (error) {
      toast({
        title: 'Command failed',
        description: error?.response?.data?.error || 'Failed to send command to the server.',
        variant: 'destructive'
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistoryIndex(prev => {
        if (prev < commandHistory.length - 1) {
          const newIndex = prev + 1;
          setCommand(commandHistory[newIndex]);
          return newIndex;
        }
        return prev;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistoryIndex(prev => {
        if (prev > -1) {
          const newIndex = prev - 1;
          setCommand(newIndex === -1 ? '' : commandHistory[newIndex]);
          return newIndex;
        }
        return prev;
      });
    }
  };

  const formatUptime = (uptime) => {
    if (typeof uptime === 'string' && (uptime.includes('h') || uptime.includes('m'))) {
      return uptime;
    }

    let seconds = 0;

    if (typeof uptime === 'string') {
      const parsed = parseInt(uptime, 10);
      if (!isNaN(parsed)) {
        seconds = parsed;
      }
    } else if (typeof uptime === 'number') {
      seconds = uptime;
    }

    if (seconds > 1000) {
      seconds = Math.round(seconds / 1000);
    } else if (seconds > 100) {
      seconds = Math.round(seconds / 10);
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  if (!server) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <RefreshCw className="w-6 h-6 text-neutral-400 animate-spin" />
        <p className="text-white/50 uppercase tracking-widest text-xs mt-2">
          Connecting to server...
        </p>
        <p className="text-white text-md mt-8 font-medium">Is this taking a while?</p>
        <p className="text-white/70 text-xs">We may be experiencing high demand, which can cause high API latency and connection issues.</p>
      </div>
    );
  }

  if (serverError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-400">
        Failed to load server data
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Server Header with updated status badge */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">{server?.name}</h1>
          <Badge
            variant={
              serverState === 'running'
                ? 'success'
                : serverState === 'starting'
                  ? 'warning'
                  : 'secondary'
            }
            className="rounded-md font-normal flex items-center gap-1.5 px-2.5 py-0.5"
          >
            <div
              className={`h-1.5 w-1.5 rounded-full ${serverState === 'running'
                ? 'bg-emerald-500/80'
                : serverState === 'starting'
                  ? 'bg-amber-500/80'
                  : 'bg-neutral-400/80'
                }`}
            />
            {serverState.charAt(0).toUpperCase() + serverState.slice(1)}
          </Badge>
        </div>

        <TooltipProvider>
          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => sendPowerAction('start')}
                  disabled={['starting', 'running'].includes(serverState) || isInstalling}
                >
                  <Power className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start Server</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => sendPowerAction('restart')}
                  disabled={!['running'].includes(serverState) || isInstalling}
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Restart Server</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const action = ['starting', 'stopping'].includes(serverState) ? 'kill' : 'stop';
                    sendPowerAction(action);
                  }}
                  disabled={['offline'].includes(serverState) || isInstalling}
                >
                  <Square className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {['starting', 'stopping'].includes(serverState) ? 'Kill Server' : 'Stop Server'}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
      {isConnecting && <ConnectionOverlay />}

      {server?.is_suspended && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-200">This server is suspended</p>
              <p className="text-xs text-red-200/60 mt-0.5">
                Your server has been suspended and is currently inaccessible. If you believe this is an error, please contact support.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-6 p-4 rounded-lg border border-white/5">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-neutral-400" />
          <div>
            <p className="text-xs text-neutral-500">Node</p>
            <p className="text-sm text-white font-medium">{server?.node}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-neutral-400" />
          <div>
            <p className="text-xs text-neutral-500">IP Address</p>
            <p className="text-sm text-white font-medium">
              {server?.relationships?.allocations?.data?.[0]?.attributes?.ip_alias}:
              {server?.relationships?.allocations?.data?.[0]?.attributes?.port}
            </p>
          </div>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-2 cursor-pointer group">
              <Upload className="w-4 h-4 text-neutral-400" />
              <div className="flex items-center gap-1">
                <div>
                  <p className="text-xs text-neutral-500">SFTP</p>
                  <p className="text-sm text-white font-medium truncate max-w-[150px]">
                    {userData?.user?.Username}.{server?.identifier}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[90vw] md:w-72 p-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">SFTP Details</h4>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-xs text-neutral-500">Host</p>
                  <p className="text-xs text-black">{server?.sftp_details?.ip}</p>
                </div>

                <div className="flex justify-between">
                  <p className="text-xs text-neutral-500">Port</p>
                  <p className="text-xs text-black">{server?.sftp_details?.port}</p>
                </div>

                <div className="flex justify-between">
                  <p className="text-xs text-neutral-500">Username</p>
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-black">{userData?.user?.Username}.{server?.identifier}</p>
                    <TooltipProvider>
                      <Tooltip open={copySuccess}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 hover:bg-neutral-800/50"
                            onClick={() => copyToClipboard(`${userData?.user?.Username}.${server?.identifier}`)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{copySuccess ? 'Copied!' : 'Copy to clipboard'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>

              <div className="p-2 rounded bg-blue-100 border border-blue-200/20">
                <div className="flex gap-2">
                  <InfoIcon className="h-4 w-4 text-blue-800 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    Use your SFTP password from the Account Settings page when connecting.
                  </p>
                </div>
              </div>

              {(() => {
                const sftpIp = server?.sftp_details?.ip;
                const sftpPort = server?.sftp_details?.port;
                const sftpUsername = userData?.user?.Username && server?.identifier 
                  ? `${userData.user.Username}.${server.identifier}` 
                  : null;
                const canConnect = sftpIp && sftpPort && sftpUsername;

                const handleOpenSftp = () => {
                  if (!canConnect) return;
                  const url = `sftp://${encodeURIComponent(sftpUsername)}@${sftpIp}:${sftpPort}`;
                  window.location.href = url;
                };

                return (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full mt-2"
                    disabled={!canConnect}
                    onClick={handleOpenSftp}
                  >
                    Open in SFTP Client
                  </Button>
                );
              })()}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2 ml-auto">
          <Clock className="w-4 h-4 text-neutral-400" />
          <div>
            <p className="text-xs text-neutral-500">Uptime</p>
            <p className="text-sm text-white font-medium">{formatUptime(stats.uptime) || "Offline"}</p>
          </div>
        </div>
      </div>

      <div>
        <Card>
          <CardContent className="p-0">
            <ScrollArea
              ref={scrollAreaRef}
              className="h-[440px] font-mono text-sm bg-transparent"
              onScroll={handleScroll}
            >
              {consoleLines.length > 0 ? (
                <div className="p-4">
                  {consoleLines.map((line) => (
                    <div
                      key={line.id}
                      className={`py-0.5 font-mono whitespace-pre-wrap break-words ${getConsoleLineClassName(line.content)}`}
                    >
                      {formatConsoleOutput(line.content)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center text-center p-6">
                    <div className="bg-white/5 p-4 rounded-full mb-4 mt-8">
                      <Terminal className="h-8 w-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Hm... there's nothing here</h3>
                    <p className="text-neutral-400 max-w-md">
                      {serverState === 'offline'
                        ? 'Start your server to see console output here'
                        : 'Waiting for console output...'}
                    </p>
                    {serverState === 'offline' && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => sendPowerAction('start')}
                        disabled={isInstalling}
                      >
                        <Power className="w-4 h-4 mr-2" />
                        Start server
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </ScrollArea>
            <div className="p-4 border-t border-white/10">
              <form onSubmit={sendCommand} className="flex gap-2">
                <Input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isInstalling ? "Console commands are disabled during installation..." : "Type a command..."}
                  className="flex-1 bg-transparent border-white/10"
                  disabled={isInstalling || serverState === 'offline'}
                />
                <Button
                  type="submit"
                  disabled={isInstalling || !command.trim() || serverState === 'offline'}
                >
                  Send
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      {showRenewalCard ? <Card className="overflow-hidden border-neutral-800 bg-gradient-to-br from-[#111111] via-[#111111] to-[#171717]">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-neutral-400" />
                <CardTitle>Server renewal</CardTitle>
              </div>
              <CardDescription>
                Track the next renewal and avoid automatic deletion after expiry.
              </CardDescription>
            </div>
            <Badge variant="outline" className={renewalStatusBadge.className}>
              {renewalStatusBadge.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isRenewalLoading ? (
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-300">
              <RefreshCw className="h-4 w-4 animate-spin text-neutral-400" />
              Loading renewal status...
            </div>
          ) : renewalError ? (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Unable to load renewal status.</p>
                <p className="mt-1 text-red-100/80">
                  {renewalError?.response?.data?.error || 'Renewal status is temporarily unavailable.'}
                </p>
              </div>
            </div>
          ) : renewalStatus ? (
            <>
              <div className="flex flex-col gap-3 rounded-lg border border-white/8 bg-black/20 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white">
                    {renewalStatus.nextRenewalAt
                      ? `Next renewal: ${new Date(renewalStatus.nextRenewalAt).toLocaleString()}`
                      : 'Next renewal: not scheduled'}
                  </p>
                  <p className="text-sm text-neutral-400">
                    {renewalExpired
                      ? `Expired for ${formatCompactDuration(Math.abs(renewalMsRemaining || 0))}`
                      : `Time left: ${formatCompactDuration(renewalMsRemaining)}`} · Auto delete {renewalStatus.config.autoDeleteEnabled
                      ? `after ${renewalStatus.config.autoDeleteAfterDays} days`
                      : 'disabled'} · Renew count {renewalStatus.renewalCount || 0}
                  </p>
                </div>

                <Button
                  onClick={() => renewServer.mutate()}
                  disabled={!renewalCanRenew || renewServer.isPending}
                  className="min-w-[180px]"
                >
                  {renewServer.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Renewing...
                    </>
                  ) : (
                    <>
                      <RotateCw className="h-4 w-4" />
                      Renew server
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ResourceStat
          icon={Cpu}
          title="CPU Usage"
          value={`${stats?.cpu || 0} %`}
          secondaryValue={`${server?.limits?.cpu || 0} % Limit`}
          chartData={resourceHistory.cpu}
          dataKey="value"
          color={CHART_COLORS.cpu}
          unit="%"
          domain={[0, 100]}
        />
        <ResourceStat
          icon={MemoryStick}
          title="Memory Usage"
          value={`${stats.memory || 0} MB`}
          secondaryValue={`${server?.limits.memory || 0} MB Limit`}
          chartData={resourceHistory.memory}
          dataKey="value"
          color={CHART_COLORS.memory}
          unit=" MB"
          domain={[0, server?.limits.memory]}
        />
        <ResourceStat
          icon={HardDrive}
          title="Storage Usage"
          value={`${stats.disk || 0} MB`}
          secondaryValue={`${server?.limits.disk === 0 ? '∞' : server?.limits.disk + ' MB' || 0} Limit`}
          chartData={resourceHistory.disk}
          dataKey="value"
          color={CHART_COLORS.disk}
          unit=" MB"
          domain={server?.limits.disk ? [0, server.limits.disk] : undefined}
        />
        <ResourceStat
          icon={Network}
          title="Network Traffic"
          value={`↑${formatNetworkSpeed(parseFloat(stats.network.up) || 0)}`}
          secondaryValue={`↓${formatNetworkSpeed(parseFloat(stats.network.down) || 0)}`}
          chartData={resourceHistory.network}
          dataKey="up"
          color={CHART_COLORS.network}
          Chart={NetworkChart}
        />
      </div>

      <Dialog open={showEulaDialog} onOpenChange={setShowEulaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Minecraft EULA Required</DialogTitle>
            <DialogDescription className="space-y-4">
              <p>
                You need to agree to the Minecraft End User License Agreement (EULA) to run the server.
              </p>
              <p>
                By clicking Accept, you agree to the{' '}
                <a
                  href="https://www.minecraft.net/en-us/eula"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:underline"
                >
                  Minecraft EULA
                </a>
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEulaDialog(false)}>
              Decline
            </Button>
            <Button onClick={handleAcceptEula}>
              Accept EULA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isInstalling && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-[400px]">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <div className="text-center">
                  <h3 className="font-medium mb-1">Installation in Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {installationProgress?.message || 'Please wait while the server is being installed...'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
