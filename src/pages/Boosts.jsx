import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Zap,
  Clock,
  RefreshCw,
  AlertCircle,
  Check,
  X,
  Server,
  MemoryStick,
  HardDrive,
  Cpu,
  Calendar,
  BarChart4,
  ArrowRight,
  Shield,
  ChevronDown,
  Rocket
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

export default function ServerBoostsPage() {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('active');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [dialogAnimation, setDialogAnimation] = useState('');

  // Get boost types
  const { data: boostTypes, isLoading: loadingBoostTypes } = useQuery({
    queryKey: ['boost-types'],
    queryFn: async () => {
      const response = await axios.get('/api/boosts/types');
      return response.data;
    }
  });

  // Get active boosts
  const { data: activeBoosts, isLoading: loadingActiveBoosts } = useQuery({
    queryKey: ['active-boosts'],
    queryFn: async () => {
      const response = await axios.get('/api/boosts/active');
      return response.data;
    },
    refetchInterval: activeTab === 'active' ? 30000 : false, // Refetch every 30 seconds when viewing active boosts
  });

  // Get scheduled boosts
  const { data: scheduledBoosts, isLoading: loadingScheduledBoosts } = useQuery({
    queryKey: ['scheduled-boosts'],
    queryFn: async () => {
      const response = await axios.get('/api/boosts/scheduled');
      return response.data;
    },
    enabled: activeTab === 'scheduled',
  });

  // Get boost history
  const { data: boostHistory, isLoading: loadingBoostHistory } = useQuery({
    queryKey: ['boost-history'],
    queryFn: async () => {
      const response = await axios.get('/api/boosts/history');
      return response.data;
    },
    enabled: activeTab === 'history',
  });

  // Handle dialog animations
  useEffect(() => {
    if (confirmDialog) {
      setIsDialogVisible(true);
      setTimeout(() => setDialogAnimation('opacity-100 scale-100'), 10);
    } else {
      setDialogAnimation('opacity-0 scale-95');
      setTimeout(() => setIsDialogVisible(false), 300);
    }
  }, [confirmDialog]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Feature disabled check
  if (settings?.features?.boosts === false) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Rocket className="w-12 h-12 text-[#95a1ad] mx-auto" />
          <h2 className="text-xl font-medium text-white">Server Boosts Unavailable</h2>
          <p className="text-[#95a1ad] text-sm max-w-md">
            Server boosts are currently disabled by the administrator. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  // Cancel boost
  const handleCancelBoost = async () => {
    if (!confirmDialog || !confirmDialog.boost) return;

    try {
      setIsCancelling(true);
      setError('');

      const response = await axios.post('/api/boosts/cancel', {
        serverId: confirmDialog.boost.serverId,
        boostId: confirmDialog.boost.id
      });

      setSuccess(`Successfully cancelled boost with a refund of ${response.data.refundAmount} coins`);

      // Refresh boosts data
      queryClient.invalidateQueries(['active-boosts']);
      queryClient.invalidateQueries(['boost-history']);

      // Close dialog
      setConfirmDialog(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel boost');
    } finally {
      setIsCancelling(false);
    }
  };

  // Cancel scheduled boost
  const handleCancelScheduledBoost = async () => {
    if (!confirmDialog || !confirmDialog.scheduledBoost) return;

    try {
      setIsCancelling(true);
      setError('');

      const response = await axios.post('/api/boosts/cancel-scheduled', {
        scheduledBoostId: confirmDialog.scheduledBoost.id
      });

      setSuccess(`Successfully cancelled scheduled boost with a refund of ${response.data.refundAmount} coins`);

      // Refresh boosts data
      queryClient.invalidateQueries(['scheduled-boosts']);
      queryClient.invalidateQueries(['boost-history']);

      // Close dialog
      setConfirmDialog(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel scheduled boost');
    } finally {
      setIsCancelling(false);
    }
  };

  // Extend boost
  const handleExtendBoost = async () => {
    if (!confirmDialog || !confirmDialog.boost || !confirmDialog.additionalDuration) return;

    try {
      setIsExtending(true);
      setError('');

      const response = await axios.post('/api/boosts/extend', {
        serverId: confirmDialog.boost.serverId,
        boostId: confirmDialog.boost.id,
        additionalDuration: confirmDialog.additionalDuration
      });

      setSuccess(`Successfully extended boost duration by ${confirmDialog.additionalDuration}`);

      // Refresh boosts data
      queryClient.invalidateQueries(['active-boosts']);

      // Close dialog
      setConfirmDialog(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to extend boost');
    } finally {
      setIsExtending(false);
    }
  };

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Format remaining time
  const formatTimeRemaining = (endTime) => {
    if (!endTime) return 'Unknown';

    const now = Date.now();
    const remaining = endTime - now;

    if (remaining <= 0) return 'Expired';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ${hours % 24} hr${hours % 24 !== 1 ? 's' : ''}`;
    }

    return `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
  };

  // Format time until scheduled boost
  const formatTimeUntilScheduled = (scheduledTime) => {
    if (!scheduledTime) return 'Unknown';

    const now = Date.now();
    const timeUntil = scheduledTime - now;

    if (timeUntil <= 0) return 'Starting soon';

    const hours = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ${hours % 24} hr${hours % 24 !== 1 ? 's' : ''}`;
    }

    return `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
  };

  // Get boost icon
  const getBoostIcon = (boostId) => {
    const boostType = boostTypes?.[boostId];

    switch (boostType?.icon) {
      case 'zap':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'cpu':
        return <Cpu className="w-4 h-4 text-blue-400" />;
      case 'memory-stick':
        return <MemoryStick className="w-4 h-4 text-purple-400" />;
      case 'hard-drive':
        return <HardDrive className="w-4 h-4 text-green-400" />;
      case 'rocket':
        return <Rocket className="w-4 h-4 text-red-400" />;
      default:
        return <Zap className="w-4 h-4 text-[#95a1ad]" />;
    }
  };

  // Loading state for the entire page
  if (loadingBoostTypes && !boostTypes) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#95a1ad]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-screen-2xl mx-auto">
      {/* Header section */}
      <div className="flex items-center justify-between flex-col gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Boosts</h1>
          <p className="text-[#95a1ad]">Manage temporary resource boosts for your servers</p>
        </div>
        <a
          href="/coins/store"
          className="px-4 py-2 bg-white text-black hover:bg-white/90 rounded-md font-medium text-sm transition active:scale-95 flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Buy Boosts
        </a>
      </div>

      {/* Alert messages */}
      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 text-red-500 p-3 flex items-start">
          <AlertCircle className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-md border border-green-500/20 bg-green-500/10 text-green-500 p-3 flex items-start">
          <Check className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {/* Tab navigation */}
      <div className="border-b border-[#2e3337] overflow-x-auto">
        <div className="flex space-x-2 w-max pb-px">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${activeTab === 'active'
                ? 'border-white text-white'
                : 'border-transparent text-[#95a1ad] hover:text-white hover:border-white/20'
              }`}
          >
            <Zap className="w-4 h-4" />
            Active Boosts
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${activeTab === 'scheduled'
                ? 'border-white text-white'
                : 'border-transparent text-[#95a1ad] hover:text-white hover:border-white/20'
              }`}
          >
            <Calendar className="w-4 h-4" />
            Scheduled Boosts
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${activeTab === 'history'
                ? 'border-white text-white'
                : 'border-transparent text-[#95a1ad] hover:text-white hover:border-white/20'
              }`}
          >
            <BarChart4 className="w-4 h-4" />
            Boost History
          </button>
        </div>
      </div>

      {/* Active Boosts Tab Content */}
      {activeTab === 'active' && (
        <div className="border border-[#2e3337] rounded-lg bg-transparent">
          <div className="p-4 pb-3 border-b border-[#2e3337]">
            <h3 className="font-normal text-lg">Active Boosts</h3>
          </div>
          <div className="p-4">
            {loadingActiveBoosts ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-[#95a1ad]" />
              </div>
            ) : activeBoosts && Object.keys(activeBoosts).length > 0 ? (
              <div className="space-y-4">
                {/* Group boosts by server */}
                {activeBoosts && typeof activeBoosts === 'object' && Object.entries(activeBoosts).map(([serverId, serverBoosts]) => (
                  <div key={serverId} className="border border-[#2e3337] rounded-lg">
                    <div className="p-4 pb-3 border-b border-[#2e3337] flex items-center gap-2">
                      <Server className="w-4 h-4 text-[#95a1ad]" />
                      <h4 className="font-medium">{Object.values(serverBoosts)[0]?.serverName || 'Unknown Server'}</h4>
                    </div>
                    <div className="p-4 space-y-4">
                      {Object.values(serverBoosts).map((boost) => {
                        const boostType = boostTypes?.[boost.boostType];
                        const timeRemaining = formatTimeRemaining(boost.expiresAt);
                        const percentRemaining = Math.max(
                          0,
                          Math.min(
                            100,
                            ((boost.expiresAt - Date.now()) / (boost.durationMs)) * 100
                          )
                        );

                        return (
                          <div key={boost.id} className="bg-[#202229] border border-[#2e3337] rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <div>
                                  <h5 className="font-medium">{boostType?.name || 'Unknown Boost'}</h5>
                                  <p className="text-xs text-[#95a1ad]">Applied {formatDate(boost.appliedAt)}</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  className="px-2 py-1 text-xs border border-blue-500/20 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition"
                                  onClick={() => setConfirmDialog({
                                    type: 'extend',
                                    boost,
                                    additionalDuration: '1h'
                                  })}
                                >
                                  Extend
                                </button>
                                <button
                                  className="px-2 py-1 text-xs border border-red-500/20 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition"
                                  onClick={() => setConfirmDialog({
                                    type: 'cancel',
                                    boost
                                  })}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div className="p-2 rounded bg-[#1a1c1e] flex flex-col items-center">
                                <span className="text-xs text-[#95a1ad]">RAM Boost</span>
                                <span className="text-sm">x{boost.appliedChange.memory > 0 ? (boost.boostedResources.memory / boost.initialResources.memory).toFixed(1) : '1.0'}</span>
                              </div>
                              <div className="p-2 rounded bg-[#1a1c1e] flex flex-col items-center">
                                <span className="text-xs text-[#95a1ad]">CPU Boost</span>
                                <span className="text-sm">x{boost.appliedChange.cpu > 0 ? (boost.boostedResources.cpu / boost.initialResources.cpu).toFixed(1) : '1.0'}</span>
                              </div>
                              <div className="p-2 rounded bg-[#1a1c1e] flex flex-col items-center">
                                <span className="text-xs text-[#95a1ad]">Disk Boost</span>
                                <span className="text-sm">x{boost.appliedChange.disk > 0 ? (boost.boostedResources.disk / boost.initialResources.disk).toFixed(1) : '1.0'}</span>
                              </div>
                            </div>

                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-[#95a1ad]">Time Remaining:</span>
                              <span>{timeRemaining}</span>
                            </div>
                            <div className="h-2 bg-[#1a1c1e] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-white rounded-full"
                                style={{ width: `${percentRemaining}%` }}
                              ></div>
                            </div>
                            <div className="mt-2 text-xs text-[#95a1ad] flex justify-between">
                              <span>Expires: {formatDate(boost.expiresAt)}</span>
                              <span>Duration: {boost.duration}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Zap className="w-8 h-8 text-[#95a1ad] mx-auto mb-2" />
                <p className="text-[#95a1ad]">No active boosts</p>
                <p className="text-sm text-[#95a1ad] mt-1">
                  Purchase boosts from the store to upgrade your server's resources temporarily
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scheduled Boosts Tab Content */}
      {activeTab === 'scheduled' && (
        <div className="border border-[#2e3337] rounded-lg bg-transparent">
          <div className="p-4 pb-3 border-b border-[#2e3337]">
            <h3 className="font-normal text-lg">Scheduled Boosts</h3>
          </div>
          <div className="p-4">
            {loadingScheduledBoosts ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-[#95a1ad]" />
              </div>
            ) : scheduledBoosts && scheduledBoosts.length > 0 ? (
              <div className="space-y-4">
                {scheduledBoosts.map((boost) => {
                  const boostType = boostTypes?.[boost.boostType];
                  const timeUntil = formatTimeUntilScheduled(boost.scheduledTime);

                  return (
                    <div key={boost.id} className="bg-[#202229] border border-[#2e3337] rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1a1c1e] border border-white/5">
                            {getBoostIcon(boost.boostType)}
                          </div>
                          <div>
                            <h5 className="font-medium">{boostType?.name || 'Unknown Boost'}</h5>
                            <p className="text-xs text-[#95a1ad]">Scheduled on {formatDate(boost.createdAt)}</p>
                          </div>
                        </div>
                        <button
                          className="px-2 py-1 text-xs border border-red-500/20 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition"
                          onClick={() => setConfirmDialog({
                            type: 'cancel-scheduled',
                            scheduledBoost: boost
                          })}
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#95a1ad]">Server:</span>
                          <span>{boost.serverName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#95a1ad]">Boost:</span>
                          <span>{boostType?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#95a1ad]">Duration:</span>
                          <span>{boost.duration}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#95a1ad]">Price Paid:</span>
                          <span>{boost.price} coins</span>
                        </div>
                      </div>

                      <div className="bg-[#1a1c1e] p-3 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-400" />
                          <span className="text-sm">Starts in {timeUntil}</span>
                        </div>
                        <span className="text-xs text-[#95a1ad]">{formatDate(boost.scheduledTime)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-8 h-8 text-[#95a1ad] mx-auto mb-2" />
                <p className="text-[#95a1ad]">No scheduled boosts</p>
                <p className="text-sm text-[#95a1ad] mt-1">
                  Schedule boosts in advance to prepare for high-traffic events
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab Content */}
      {activeTab === 'history' && (
        <div className="border border-[#2e3337] rounded-lg bg-transparent">
          <div className="p-4 pb-3 border-b border-[#2e3337]">
            <h3 className="font-normal text-lg">Boost History</h3>
          </div>
          <div className="p-4">
            {loadingBoostHistory ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-[#95a1ad]" />
              </div>
            ) : boostHistory && boostHistory.length > 0 ? (
              <div className="space-y-3">
                {boostHistory.map((entry) => {
                  // Determine icon and style based on activity type
                  let icon = <Zap className="w-5 h-5 text-[#95a1ad]" />;
                  let title = "Boost Activity";
                  let colorClass = "text-[#95a1ad]";

                  if (entry.type === 'applied') {
                    icon = <Check className="w-5 h-5 text-green-500" />;
                    title = "Boost Applied";
                    colorClass = "text-green-500";
                  } else if (entry.type === 'expired') {
                    icon = <Clock className="w-5 h-5 text-amber-500" />;
                    title = "Boost Expired";
                    colorClass = "text-amber-500";
                  } else if (entry.type === 'cancelled') {
                    icon = <X className="w-5 h-5 text-red-500" />;
                    title = "Boost Cancelled";
                    colorClass = "text-red-500";
                  } else if (entry.type === 'extended') {
                    icon = <ArrowRight className="w-5 h-5 text-blue-500" />;
                    title = "Boost Extended";
                    colorClass = "text-blue-500";
                  } else if (entry.type === 'scheduled') {
                    icon = <Calendar className="w-5 h-5 text-purple-500" />;
                    title = "Boost Scheduled";
                    colorClass = "text-purple-500";
                  } else if (entry.type === 'scheduled_applied') {
                    icon = <Check className="w-5 h-5 text-green-500" />;
                    title = "Scheduled Boost Applied";
                    colorClass = "text-green-500";
                  } else if (entry.type === 'scheduled_cancelled') {
                    icon = <X className="w-5 h-5 text-red-500" />;
                    title = "Scheduled Boost Cancelled";
                    colorClass = "text-red-500";
                  } else if (entry.type === 'scheduled_failed') {
                    icon = <AlertCircle className="w-5 h-5 text-red-500" />;
                    title = "Scheduled Boost Failed";
                    colorClass = "text-red-500";
                  }

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 bg-[#202229] border border-[#2e3337] rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1a1c1e] border border-white/5">
                          {icon}
                        </div>
                        <div>
                          <p className={`font-medium ${colorClass}`}>{title}</p>
                          <p className="text-xs text-[#95a1ad]">{formatDate(entry.timestamp)}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2">
                          {getBoostIcon(entry.details?.boostType)}
                          <span className="text-sm">
                            {boostTypes?.[entry.details?.boostType]?.name || 'Unknown Boost'}
                          </span>
                        </div>
                        {entry.details?.duration && (
                          <span className="text-xs text-[#95a1ad]">
                            Duration: {entry.details?.duration}
                          </span>
                        )}
                        {entry.details?.refundAmount > 0 && (
                          <span className="text-xs text-green-500">
                            Refund: {entry.details?.refundAmount} coins
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart4 className="w-8 h-8 text-[#95a1ad] mx-auto mb-2" />
                <p className="text-[#95a1ad]">No boost history yet</p>
                <p className="text-sm text-[#95a1ad] mt-1">
                  Use boosts to enhance your server performance for a limited time
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extension Dialog */}
      {isDialogVisible && confirmDialog?.type === 'extend' && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className={`fixed inset-0 transition-opacity duration-300 ${dialogAnimation ? 'opacity-100' : 'opacity-0'
              }`}
            onClick={() => setConfirmDialog(null)}
          ></div>
          <div
            className={`relative bg-[#202229] border border-white/5 rounded-lg w-full max-w-md p-6 transition-all duration-300 ${dialogAnimation}`}
          >
            <div className="mb-4">
              <h2 className="text-lg font-medium">Extend Boost Duration</h2>
              <p className="text-[#95a1ad] mt-1">
                Choose additional time to add to your boost
              </p>
            </div>

            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <p className="font-medium">{boostTypes?.[confirmDialog.boost.boostType]?.name || 'Unknown Boost'}</p>
                  <p className="text-xs text-[#95a1ad]">Server: {confirmDialog.boost.serverName}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#95a1ad] block">Select extension duration:</label>
                <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-5 gap-2">
                  {boostTypes && confirmDialog.boost && boostTypes[confirmDialog.boost.boostType]?.prices && Object.keys(boostTypes[confirmDialog.boost.boostType].prices).map(duration => (
                    <button
                      key={duration}
                      className={`py-2 rounded-md font-medium text-sm transition active:scale-95 ${confirmDialog.additionalDuration === duration
                          ? 'bg-white text-black'
                          : 'border border-[#2e3337] text-[#95a1ad] hover:text-white hover:bg-white/5'
                        }`}
                      onClick={() => setConfirmDialog({
                        ...confirmDialog,
                        additionalDuration: duration
                      })}
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#1a1c1e] p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#95a1ad]">Current expiry:</span>
                  <span>{formatDate(confirmDialog.boost.expiresAt)}</span>
                </div>
                {confirmDialog.additionalDuration && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">New expiry:</span>
                    <span>{formatDate(confirmDialog.boost.expiresAt + (parseInt(confirmDialog.additionalDuration) * 60 * 60 * 1000))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#95a1ad]">Price:</span>
                  <span>{boostTypes?.[confirmDialog.boost.boostType]?.prices?.[confirmDialog.additionalDuration] || '?'} coins</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-md border border-white/5 text-[#95a1ad] hover:text-white hover:bg-white/5 font-medium text-sm transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendBoost}
                disabled={isExtending || !confirmDialog.additionalDuration}
                className="px-4 py-2 bg-white text-black rounded-md font-medium text-sm transition active:scale-95 flex items-center justify-center gap-2"
              >
                {isExtending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Extend Boost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Boost Dialog */}
      {isDialogVisible && confirmDialog?.type === 'cancel' && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className={`fixed inset-0 transition-opacity duration-300 ${dialogAnimation ? 'opacity-100' : 'opacity-0'
              }`}
            onClick={() => setConfirmDialog(null)}
          ></div>
          <div
            className={`relative bg-[#202229] border border-white/5 rounded-lg w-full max-w-md p-6 transition-all duration-300 ${dialogAnimation}`}
          >
            <div className="mb-4">
              <h2 className="text-lg font-medium">Cancel Active Boost</h2>
              <p className="text-[#95a1ad] mt-1">
                Are you sure you want to cancel this boost? You'll receive a partial refund based on remaining time.
              </p>
            </div>

            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 mb-2">
                <div>
                  <p className="font-medium">{boostTypes?.[confirmDialog.boost.boostType]?.name || 'Unknown Boost'}</p>
                  <p className="text-xs text-[#95a1ad]">Server: {confirmDialog.boost.serverName}</p>
                </div>
              </div>

              <div className="bg-[#1a1c1e] p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#95a1ad]">Applied at:</span>
                  <span>{formatDate(confirmDialog.boost.appliedAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#95a1ad]">Expires at:</span>
                  <span>{formatDate(confirmDialog.boost.expiresAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#95a1ad]">Time remaining:</span>
                  <span>{formatTimeRemaining(confirmDialog.boost.expiresAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#95a1ad]">Original price:</span>
                  <span>{confirmDialog.boost.price} coins</span>
                </div>
              </div>

              <div className="rounded-md border border-amber-500/20 bg-amber-500/10 text-amber-500 p-3">
                <p className="text-sm">
                  <AlertCircle className="w-4 h-4 inline-block mr-1" />
                  You'll receive approximately 50% of the remaining value as a refund.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-md border border-white/5 text-[#95a1ad] hover:text-white hover:bg-white/5 font-medium text-sm transition active:scale-95"
              >
                Keep Boost
              </button>
              <button
                onClick={handleCancelBoost}
                disabled={isCancelling}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium text-sm transition active:scale-95 flex items-center justify-center gap-2"
              >
                {isCancelling ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Cancel Boost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Scheduled Boost Dialog */}
      {isDialogVisible && confirmDialog?.type === 'cancel-scheduled' && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className={`fixed inset-0 transition-opacity duration-300 ${dialogAnimation ? 'opacity-100' : 'opacity-0'
              }`}
            onClick={() => setConfirmDialog(null)}
          ></div>
          <div
            className={`relative bg-[#202229] border border-white/5 rounded-lg w-full max-w-md p-6 transition-all duration-300 ${dialogAnimation}`}
          >
            <div className="mb-4">
              <h2 className="text-lg font-medium">Cancel Scheduled Boost</h2>
              <p className="text-[#95a1ad] mt-1">
                Are you sure you want to cancel this scheduled boost? You'll receive a full refund.
              </p>
            </div>

            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 mb-2">
                <div>
                  <p className="font-medium">{boostTypes?.[confirmDialog.scheduledBoost.boostType]?.name || 'Unknown Boost'}</p>
                  <p className="text-xs text-[#95a1ad]">Server: {confirmDialog.scheduledBoost.serverName}</p>
                </div>
              </div>

              <div className="bg-[#1a1c1e] p-3 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#95a1ad]">Scheduled for:</span>
                  <span>{formatDate(confirmDialog.scheduledBoost.scheduledTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#95a1ad]">Duration:</span>
                  <span>{confirmDialog.scheduledBoost.duration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#95a1ad]">Price:</span>
                  <span>{confirmDialog.scheduledBoost.price} coins</span>
                </div>
              </div>

              <div className="rounded-md border border-green-500/20 bg-green-500/10 text-green-500 p-3">
                <p className="text-sm">
                  <Check className="w-4 h-4 inline-block mr-1" />
                  You'll receive a full refund of {confirmDialog.scheduledBoost.price} coins.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-md border border-white/5 text-[#95a1ad] hover:text-white hover:bg-white/5 font-medium text-sm transition active:scale-95"
              >
                Keep Scheduled
              </button>
              <button
                onClick={handleCancelScheduledBoost}
                disabled={isCancelling}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium text-sm transition active:scale-95 flex items-center justify-center gap-2"
              >
                {isCancelling ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Cancel Scheduled Boost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
