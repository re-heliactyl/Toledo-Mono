import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  UsersIcon,
  UserMinusIcon,
  TerminalIcon,
  RefreshCw,
  ChevronDown,
  MoreVertical,
  Info,
  Crown,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import {
  getPlayerHeadUrl,
  executeServerCommand
} from '../../services/minecraftService';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const MinecraftPlayerList = ({ serverIdentifier }) => {
  const [serverStatus, setServerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [commandInput, setCommandInput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [serverAddress, setServerAddress] = useState('');
  const [confirming, setConfirming] = useState(null);
  const commandInputRef = useRef(null);
  const { toast } = useToast();

  // Fetch server status including player list
  const refreshStatus = async () => {
    try {
      setIsRefreshing(true);

      // Use the proxy endpoint to avoid CORS issues
      const { data: status } = await axios.get(`/api/v5/server/${serverIdentifier}/minecraft-status`);

      if (status && status.online) {
        setServerStatus(status);
        setServerAddress(status.hostname || status.ip || 'Unknown');
        setError(null);
      } else {
        setServerStatus({ online: false });
        setServerAddress('Server offline');
      }
    } catch (err) {
      // Silently fail - don't spam console with errors
      setServerStatus({ online: false });
      setServerAddress('Connection failed');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshStatus();

    // Set up an interval to refresh the status every 30 seconds
    const intervalId = setInterval(refreshStatus, 30000);

    return () => clearInterval(intervalId);
  }, [serverIdentifier]);

  // Focus command input when selecting a player
  useEffect(() => {
    if (selectedPlayer && commandInputRef.current) {
      commandInputRef.current.focus();
    }
  }, [selectedPlayer]);

  // Execute command on a player
  const executeCommand = async (command) => {
    if (!command.trim()) return;

    setIsExecuting(true);
    try {
      const response = await executeServerCommand(serverIdentifier, command);
      setCommandInput('');
      toast({
        title: "Command executed",
        description: `Command "${command}" was sent to the server`,
        variant: "default"
      });
      // Refresh the player list after command execution
      setTimeout(refreshStatus, 1000);
      return true;
    } catch (err) {
      console.error('Failed to execute command:', err);
      toast({
        title: "Command failed",
        description: err.message || "Failed to execute command",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsExecuting(false);
    }
  };

  // Predefined commands
  const kickPlayer = async (playerName, reason = "Kicked by admin") => {
    const success = await executeCommand(`kick ${playerName} ${reason}`);
    if (success) setSelectedPlayer(null);
  };

  const opPlayer = (playerName) => {
    executeCommand(`op ${playerName}`);
  };

  const deopPlayer = (playerName) => {
    executeCommand(`deop ${playerName}`);
  };

  const banPlayer = (playerName) => {
    setConfirming({
      action: 'ban',
      player: playerName,
      title: `Ban ${playerName}`,
      description: `Are you sure you want to ban ${playerName} from the server?`,
      confirmText: 'Ban Player'
    });
  };

  const handleConfirm = () => {
    if (!confirming) return;

    if (confirming.action === 'ban') {
      executeCommand(`ban ${confirming.player} Banned by admin`);
    } else if (confirming.action === 'kick') {
      kickPlayer(confirming.player);
    }

    setConfirming(null);
    setSelectedPlayer(null);
  };

  if (loading && !serverStatus) {
    return (
      <div></div>
    );
  }

  if (error || !serverStatus?.online) {
    return (
      <div></div>
    );
  }

  const { players } = serverStatus;
  const playerCount = players?.online || 0;
  const playerList = players?.list || [];

  return (
    <div className="mb-2">
      {/* Player stats card */}
      <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <div className="border border-white/5 p-4 rounded-lg cursor-pointer hover:bg-white/8 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#191b20]">
                  <UsersIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-neutral-400 mb-0.5">Players Online</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-medium">{playerCount}</span>
                    <span className="text-xs text-neutral-500">/ {players?.max || 0}</span>
                    {playerCount > 0 && <ChevronDown className="w-4 h-4 ml-auto text-neutral-500" />}
                  </div>
                </div>
              </div>
            </div>
          </PopoverTrigger>

          {/* Player list popup */}
          {playerCount > 0 && (
            <PopoverContent
              className="w-[90vw] md:w-80 p-0 bg-[#202229] rounded-lg shadow-xl animate-in fade-in-0 zoom-in-95"
              align="start"
              side="bottom"
            >
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-medium text-sm">Players Online ({playerCount})</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-full"
                  onClick={refreshStatus}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {playerList.map((player) => (
                  <div
                    key={player.uuid}
                    className={`flex items-center p-3 hover:bg-white/5 cursor-pointer transition-colors ${selectedPlayer?.uuid === player.uuid ? 'bg-white/5' : ''}`}
                    onClick={() => setSelectedPlayer(prev => prev?.uuid === player.uuid ? null : player)}
                  >
                    <div className="w-8 h-8 rounded-md overflow-hidden mr-3 border border-white/10 bg-white/5">
                      <img
                        src={getPlayerHeadUrl(player.uuid)}
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="flex-1 text-sm truncate">{player.name}</span>

                    {selectedPlayer?.uuid === player.uuid && (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirming({
                              action: 'kick',
                              player: player.name,
                              title: `Kick ${player.name}`,
                              description: `Are you sure you want to kick ${player.name} from the server?`,
                              confirmText: 'Kick Player'
                            });
                          }}
                          title="Kick player"
                        >
                          <UserMinusIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            opPlayer(player.name);
                          }}
                          title="Op player"
                        >
                          <Crown className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            banPlayer(player.name);
                          }}
                          title="Ban player"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Command input for selected player */}
              {selectedPlayer && (
                <div className="p-3 border-t border-white/10">
                  <div className="mb-2 flex items-center gap-1.5">
                    <TerminalIcon className="w-4 h-4 text-neutral-400" />
                    <p className="text-xs text-neutral-400">Run command on {selectedPlayer.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={commandInputRef}
                      type="text"
                      value={commandInput}
                      onChange={(e) => setCommandInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          executeCommand(commandInput);
                        }
                      }}
                      placeholder="Enter command..."
                      className="w-full bg-white/5 border border-white/10 focus:border-white/20 focus:ring-1 focus:ring-white/20 rounded-md px-2 py-1 text-sm focus:outline-none transition-colors"
                    />
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => executeCommand(commandInput)}
                      disabled={isExecuting || !commandInput.trim()}
                      className="shrink-0"
                    >
                      {isExecuting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        "Run"
                      )}
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-white/5"
                      onClick={() => executeCommand(`tp ${selectedPlayer.name} spawn`)}
                    >
                      Teleport to spawn
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-white/5"
                      onClick={() => executeCommand(`gamemode creative ${selectedPlayer.name}`)}
                    >
                      Creative mode
                    </Badge>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-white/5"
                      onClick={() => executeCommand(`gamemode survival ${selectedPlayer.name}`)}
                    >
                      Survival mode
                    </Badge>
                  </div>
                </div>
              )}

              <div className="p-3 border-t border-white/10 text-xs text-neutral-400 flex items-start gap-1.5">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs">Server: {serverAddress}</p>
                  {serverStatus.version && <p className="text-xs">Version: {serverStatus.version}</p>}
                </div>
              </div>
            </PopoverContent>
          )}
        </Popover>

        {/* Additional server stats cards - these match your UI style from the overview page */}
        <div className="border border-white/5 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#191b20]">
              <Info className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Server Version</p>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-medium truncate max-w-[100px]">
                  {serverStatus?.version?.split(" ")[0] || "Unknown"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border border-white/5 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#191b20]">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-neutral-400 mb-0.5">Game Mode</p>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-medium">
                  {serverStatus?.gamemode || "Survival"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirming} onOpenChange={() => setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirming?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirming?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-red-500 hover:bg-red-600">
              {confirming?.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MinecraftPlayerList;