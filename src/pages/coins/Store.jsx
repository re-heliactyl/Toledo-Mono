import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Plus,
  RefreshCw,
  Coins,
  X,
  Check,
  Zap,
  Rocket,
  Clock,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useSettings } from '../../hooks/useSettings';

export default function StorePage() {
  const queryClient = useQueryClient();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('resources');
  const [loading, setLoading] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [dialogAnimation, setDialogAnimation] = useState('');

  // For boost purchases
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedBoostType, setSelectedBoostType] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');

  // Get store configuration
  const { data: storeConfig, isLoading: loadingConfig, error: configError } = useQuery({
    queryKey: ['storeConfig'],
    queryFn: async () => {
      const response = await axios.get('/api/store/config');
      return response.data;
    },
    retry: false
  });

  // Get available boost types
  const { data: boostTypes, isLoading: loadingBoosts } = useQuery({
    queryKey: ['boostTypes'],
    queryFn: async () => {
      const response = await axios.get('/api/boosts/types');
      return response.data;
    },
    retry: false,
    enabled: activeTab === 'boosts'
  });

  // Get user servers
  const { data: servers, isLoading: loadingServers } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await axios.get('/api/v5/servers');
      return response.data;
    },
    retry: false,
    enabled: activeTab === 'boosts'
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

  // Set default values when data is loaded
  useEffect(() => {
    if (boostTypes && Object.keys(boostTypes).length > 0 && !selectedBoostType) {
      setSelectedBoostType(Object.keys(boostTypes)[0]);
    }

    if (Array.isArray(servers) && servers.length > 0 && !selectedServer) {
      setSelectedServer(servers[0]?.attributes?.id || '');
    }

    if (boostTypes && selectedBoostType && !selectedDuration) {
      // Set default duration to 1h
      setSelectedDuration('1h');
    }
  }, [boostTypes, servers, selectedBoostType, selectedServer]);

  // Configure initial scheduled time (1 hour from now) when scheduled mode is enabled
  useEffect(() => {
    if (isScheduled) {
      const oneHourFromNow = new Date();
      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

      // Format to YYYY-MM-DDThh:mm
      const year = oneHourFromNow.getFullYear();
      const month = String(oneHourFromNow.getMonth() + 1).padStart(2, '0');
      const day = String(oneHourFromNow.getDate()).padStart(2, '0');
      const hours = String(oneHourFromNow.getHours()).padStart(2, '0');
      const minutes = String(oneHourFromNow.getMinutes()).padStart(2, '0');

      setScheduledTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [isScheduled]);

  const resourceLabels = {
    ram: 'MB RAM',
    disk: 'MB Storage',
    cpu: '% CPU',
    servers: 'Server Slots'
  };

  // Resource purchase handler
  const buyResource = async (type, amount) => {
    try {
      setLoading(prev => ({ ...prev, [type]: true }));
      setError('');
      setSuccess('');

      await axios.post('/api/store/buy', {
        resourceType: type,
        amount: parseInt(amount)
      });

      setSuccess(`Successfully purchased ${amount} units of ${type}!`);
      await queryClient.invalidateQueries(['storeConfig']);
      setConfirmDialog(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to make purchase');
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  // Boost purchase handler
  const purchaseBoost = async () => {
    if (!selectedServer || !selectedBoostType || !selectedDuration) {
      setError('Please select a server, boost type, and duration');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, 'boost': true }));
      setError('');
      setSuccess('');

      if (isScheduled) {
        if (!scheduledTime) {
          setError('Please select a scheduled time');
          setLoading(prev => ({ ...prev, 'boost': false }));
          return;
        }

        const scheduledTimeMs = new Date(scheduledTime).getTime();

        if (isNaN(scheduledTimeMs) || scheduledTimeMs <= Date.now()) {
          setError('Scheduled time must be in the future');
          setLoading(prev => ({ ...prev, 'boost': false }));
          return;
        }

        await axios.post('/api/boosts/schedule', {
          serverId: selectedServer,
          boostType: selectedBoostType,
          duration: selectedDuration,
          scheduledTime: scheduledTimeMs
        });

        setSuccess(`Successfully scheduled a ${boostTypes[selectedBoostType].name} boost for your server!`);
      } else {
        await axios.post('/api/boosts/apply', {
          serverId: selectedServer,
          boostType: selectedBoostType,
          duration: selectedDuration
        });

        setSuccess(`Successfully applied a ${boostTypes[selectedBoostType].name} boost to your server!`);
      }

      await queryClient.invalidateQueries(['storeConfig']);
      setConfirmDialog(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to purchase boost');
    } finally {
      setLoading(prev => ({ ...prev, 'boost': false }));
    }
  };

  // Open confirmation dialog for resource purchase
  const handleResourcePurchaseClick = (type, amount, resourceAmount, totalPrice, title, unit) => {
    setConfirmDialog({
      type: 'resource',
      resourceType: type,
      amount,
      resourceAmount,
      totalPrice,
      title,
      unit
    });
  };

  // Open confirmation dialog for boost purchase
  const handleBoostPurchaseClick = () => {
    if (!selectedServer || !selectedBoostType || !selectedDuration) {
      setError('Please select a server, boost type, and duration');
      return;
    }

    const selectedServerObj = Array.isArray(servers) ? servers.find(s => s.attributes.id === selectedServer) : null;
    const boostTypeObj = boostTypes?.[selectedBoostType];
    const price = boostTypeObj?.prices?.[selectedDuration] || 0;

    if (isScheduled && (!scheduledTime || new Date(scheduledTime).getTime() <= Date.now())) {
      setError('Scheduled time must be in the future');
      return;
    }

    setConfirmDialog({
      type: 'boost',
      server: selectedServerObj?.attributes?.name || 'Unknown server',
      serverId: selectedServer,
      boostType: selectedBoostType,
      boostName: boostTypeObj.name,
      duration: selectedDuration,
      price,
      isScheduled,
      scheduledTime: isScheduled ? new Date(scheduledTime).toLocaleString() : null,
      resourceMultipliers: boostTypeObj.resourceMultiplier
    });
  };

  // Resource card component
  const ResourceCard = ({ title, icon: Icon, type, description, pricePerUnit }) => {
    const [amount, setAmount] = useState(1);
    const totalPrice = amount * pricePerUnit;
    const canAfford = storeConfig?.canAfford?.[type] && (storeConfig?.userBalance || 0) >= totalPrice;
    const resourceAmount = amount * (storeConfig?.multipliers?.[type] || 0);
    const maxAmount = storeConfig?.limits?.[type] || 10;

    return (
      <div className="border border-[#2e3337] rounded-lg bg-transparent">
        <div className="p-4 pb-3 border-b border-[#2e3337]">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#202229] border border-white/5">
              <Icon className="w-4 h-4 text-[#95a1ad]" />
            </div>
            <h3 className="font-normal text-sm">{title}</h3>
          </div>
        </div>
        <div className="p-4 pb-3 space-y-4">
          <p className="text-sm text-[#95a1ad]">{description}</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Math.min(maxAmount, parseInt(e.target.value) || 1)))}
              className="flex-1 px-2 py-1 bg-[#394047] focus:bg-[#394047]/50 border border-white/5 focus:border-white/5 focus:ring-1 focus:ring-white/20 rounded-md text-sm focus:outline-none transition-colors"
            />
            <span className="text-sm text-[#95a1ad]">units</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#95a1ad]">Amount:</span>
              <span className="text-white">{resourceAmount} {resourceLabels[type]}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#95a1ad]">Price:</span>
              <span className="text-white">{totalPrice} coins</span>
            </div>
          </div>
        </div>
        <div className="p-4 pt-2">
          <button
            className={`w-full py-2 flex items-center justify-center rounded-md font-medium text-sm transition active:scale-95 ${!canAfford || loading[type]
                ? 'bg-white/20 text-white/60 cursor-not-allowed'
                : 'bg-white text-black hover:bg-white/90'
              }`}
            onClick={() => handleResourcePurchaseClick(type, amount, resourceAmount, totalPrice, title, resourceLabels[type])}
            disabled={!canAfford || loading[type]}
          >
            {loading[type] ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              canAfford ? (
                <Plus className="w-4 h-4 mr-2" />
              ) : null
            )}
            {canAfford ? 'Purchase' : 'Insufficient balance'}
          </button>
        </div>
      </div>
    );
  };

  // Boost type card with icon mapping
  const BoostCard = ({ boostType, isSelected, onClick }) => {
    const getIcon = (iconName) => {
      switch (iconName) {
        case 'zap': return <Zap className="w-4 h-4 text-yellow-400" />;
        case 'cpu': return <Cpu className="w-4 h-4 text-blue-400" />;
        case 'memory-stick': return <MemoryStick className="w-4 h-4 text-purple-400" />;
        case 'hard-drive': return <HardDrive className="w-4 h-4 text-green-400" />;
        case 'rocket': return <Rocket className="w-4 h-4 text-red-400" />;
        default: return <Zap className="w-4 h-4 text-[#95a1ad]" />;
      }
    };

    return (
      <div
        className={`border rounded-lg p-4 cursor-pointer transition-all ${isSelected
            ? 'border-white/30 bg-white/5'
            : 'border-[#2e3337] hover:bg-[#202229]/50'
          }`}
        onClick={onClick}
      >
        <h1 className="font-medium text-white text-sm">{boostType.name}</h1>
        <p className="text-xs text-[#95a1ad] min-h-[40px]">{boostType.description}</p>
        <div className="mt-3 grid grid-cols-3 gap-1 text-xs">
          <div className="flex flex-col items-center p-1 rounded bg-[#202229]/70">
            <span className="text-[#95a1ad]">RAM</span>
            <span className="text-white">{boostType.resourceMultiplier.ram}x</span>
          </div>
          <div className="flex flex-col items-center p-1 rounded bg-[#202229]/70">
            <span className="text-[#95a1ad]">CPU</span>
            <span className="text-white">{boostType.resourceMultiplier.cpu}x</span>
          </div>
          <div className="flex flex-col items-center p-1 rounded bg-[#202229]/70">
            <span className="text-[#95a1ad]">Disk</span>
            <span className="text-white">{boostType.resourceMultiplier.disk}x</span>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  const isActuallyLoading = loadingConfig || (activeTab === 'boosts' && (loadingBoosts || loadingServers));
  const hasError = configError || storeConfig?.error || (activeTab === 'boosts' && (boostTypes?.error || servers?.error)) || (!loadingConfig && !storeConfig?.prices);

  if (isActuallyLoading && !hasError) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-[#95a1ad]" />
        </div>
      </div>
    );
  }

  if (hasError && !storeConfig?.prices) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-500/20 bg-red-500/10 text-red-500 p-4 flex items-start">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium">Error loading store</h3>
            <p className="text-sm mt-1">
              {configError?.response?.data?.message ||
                configError?.response?.data?.error ||
                configError?.message ||
                storeConfig?.error ||
                storeConfig?.message ||
                "Failed to load store configuration. Please try again later."}
            </p>
            <button
              onClick={() => queryClient.invalidateQueries(['storeConfig'])}
              className="mt-3 px-3 py-1 bg-red-500 text-white rounded text-xs font-medium hover:bg-red-600 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-screen-2xl mx-auto">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Store</h1>
          <p className="text-[#95a1ad]">Purchase resources and boosts for your servers</p>
        </div>
        <div className="hidden flex items-center gap-4">
          <div className="py-2 px-4 border border-[#2e3337] rounded-md flex items-center">
            <Coins className="w-4 h-4 mr-2 text-[#95a1ad]" />
            <span>{storeConfig?.userBalance || 0} coins</span>
          </div>
        </div>
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
            onClick={() => setActiveTab('resources')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${activeTab === 'resources'
                ? 'border-white text-white'
                : 'border-transparent text-[#95a1ad] hover:text-white hover:border-white/20'
              }`}
          >
            <Server className="w-4 h-4" />
            Resources
          </button>
          {settings?.features?.boosts !== false && (
            <button
              onClick={() => setActiveTab('boosts')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition whitespace-nowrap ${activeTab === 'boosts'
                  ? 'border-white text-white'
                  : 'border-transparent text-[#95a1ad] hover:text-white hover:border-white/20'
                }`}
            >
              <Rocket className="w-4 h-4" />
              Boosts
            </button>
          )}
        </div>
      </div>

      {/* Resources Tab Content */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResourceCard
              title="Memory"
              icon={MemoryStick}
              type="ram"
              description="Purchase additional RAM for your servers"
              pricePerUnit={storeConfig?.prices?.resources?.ram || 0}
            />
            <ResourceCard
              title="Storage"
              icon={HardDrive}
              type="disk"
              description="Purchase additional storage space"
              pricePerUnit={storeConfig?.prices?.resources?.disk || 0}
            />
            <ResourceCard
              title="CPU"
              icon={Cpu}
              type="cpu"
              description="Purchase additional CPU power"
              pricePerUnit={storeConfig?.prices?.resources?.cpu || 0}
            />
            <ResourceCard
              title="Server Slots"
              icon={Server}
              type="servers"
              description="Purchase additional server slots"
              pricePerUnit={storeConfig?.prices?.resources?.servers || 0}
            />
          </div>

          <div className="border border-[#2e3337] rounded-lg bg-transparent">
            <div className="p-4 pb-3 border-b border-[#2e3337]">
              <h3 className="font-normal text-lg">More information</h3>
            </div>
            <div className="p-4 space-y-2">
              <p className="text-sm text-[#95a1ad]">
                Purchase additional resources for your servers using coins. Maximum limits per resource type:
                {storeConfig?.limits && Object.entries(storeConfig.limits).map(([type, limit]) => (
                  <span key={type} className="ml-1">
                    {type}: {limit},
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Boosts Tab Content */}
      {settings?.features?.boosts !== false && activeTab === 'boosts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Boost selection section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-[#2e3337] rounded-lg bg-transparent">
                <div className="p-4 pb-3 border-b border-[#2e3337]">
                  <h3 className="font-normal text-lg">Choose Boost Type</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {boostTypes && typeof boostTypes === 'object' && Object.entries(boostTypes).map(([id, boostType]) => (
                      <BoostCard
                        key={id}
                        boostType={boostType}
                        isSelected={selectedBoostType === id}
                        onClick={() => setSelectedBoostType(id)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="border border-[#2e3337] rounded-lg bg-transparent">
                <div className="p-4 pb-3 border-b border-[#2e3337]">
                  <h3 className="font-normal text-lg">Server & Duration</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm text-[#95a1ad] block">Select Server</label>
                    <div className="relative">
                      <select
                        value={selectedServer}
                        onChange={(e) => setSelectedServer(e.target.value)}
                        className="w-full appearance-none bg-[#394047] focus:bg-[#394047]/50 border border-white/5 focus:border-white/5 focus:ring-1 focus:ring-white/20 rounded-md p-2 text-sm focus:outline-none transition-colors pr-10"
                      >
                        {Array.isArray(servers) && servers.map(server => (
                          <option key={server.attributes.id} value={server.attributes.id}>
                            {server.attributes.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-[#95a1ad]" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-[#95a1ad] block">Duration</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 sm:grid-cols-5 gap-2">
                      {selectedBoostType && boostTypes?.[selectedBoostType]?.prices && Object.keys(boostTypes[selectedBoostType].prices).map(duration => (
                        <button
                          key={duration}
                          className={`py-2 rounded-md font-medium text-sm transition active:scale-95 ${selectedDuration === duration
                              ? 'bg-white text-black'
                              : 'border border-[#2e3337] text-[#95a1ad] hover:text-white hover:bg-white/5'
                            }`}
                          onClick={() => setSelectedDuration(duration)}
                        >
                          {duration}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="schedule-boost"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="rounded-sm bg-[#394047] border-white/5 focus:ring-white/20 focus:ring-offset-0 text-white"
                    />
                    <label htmlFor="schedule-boost" className="text-sm">Schedule for later</label>
                  </div>

                  {isScheduled && (
                    <div className="space-y-2">
                      <label className="text-sm text-[#95a1ad] block">Scheduled Time</label>
                      <input
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full bg-[#394047] focus:bg-[#394047]/50 border border-white/5 focus:border-white/5 focus:ring-1 focus:ring-white/20 rounded-md p-2 text-sm focus:outline-none transition-colors"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Boost summary and purchase section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="border border-[#2e3337] rounded-lg bg-transparent">
                <div className="p-4 pb-3 border-b border-[#2e3337]">
                  <h3 className="font-normal text-lg">Boost Summary</h3>
                </div>
                <div className="p-4 space-y-4">
                  {selectedBoostType && boostTypes ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{boostTypes[selectedBoostType].name}</p>
                          <p className="text-xs text-[#95a1ad]">{boostTypes[selectedBoostType].description}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#95a1ad]">Server:</span>
                          <span>
                            {Array.isArray(servers) && selectedServer
                              ? servers.find(s => s.attributes.id === selectedServer)?.attributes?.name || 'Unknown'
                              : 'Select a server'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#95a1ad]">Duration:</span>
                          <span>{selectedDuration || 'Select duration'}</span>
                        </div>
                        {isScheduled && (
                          <div className="flex justify-between text-sm">
                            <span className="text-[#95a1ad]">Scheduled for:</span>
                            <span>
                              {scheduledTime
                                ? new Date(scheduledTime).toLocaleString()
                                : 'Select time'}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-[#95a1ad]">Price:</span>
                          <span>
                            {selectedBoostType && selectedDuration
                              ? `${boostTypes?.[selectedBoostType]?.prices?.[selectedDuration] || 0} coins`
                              : '0 coins'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#2e3337]">
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Resource Multipliers:</p>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col items-center p-2 rounded bg-[#202229]">
                              <MemoryStick className="w-4 h-4 text-[#95a1ad] mb-1" />
                              <span className="text-xs text-[#95a1ad]">RAM</span>
                              <span className="text-sm font-medium">{boostTypes[selectedBoostType].resourceMultiplier.ram}x</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded bg-[#202229]">
                              <Cpu className="w-4 h-4 text-[#95a1ad] mb-1" />
                              <span className="text-xs text-[#95a1ad]">CPU</span>
                              <span className="text-sm font-medium">{boostTypes[selectedBoostType].resourceMultiplier.cpu}x</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded bg-[#202229]">
                              <HardDrive className="w-4 h-4 text-[#95a1ad] mb-1" />
                              <span className="text-xs text-[#95a1ad]">Disk</span>
                              <span className="text-sm font-medium">{boostTypes[selectedBoostType].resourceMultiplier.disk}x</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-[#95a1ad] text-center py-4">Select a boost type to see details</p>
                  )}
                </div>
                <div className="p-4 pt-2">
                  <button
                    className={`w-full py-2 flex items-center justify-center rounded-md font-medium text-sm transition active:scale-95 ${!selectedServer || !selectedBoostType || !selectedDuration ||
                        (isScheduled && (!scheduledTime || new Date(scheduledTime).getTime() <= Date.now())) ||
                        loading.boost ||
                        (selectedBoostType && selectedDuration && boostTypes &&
                          (storeConfig?.userBalance || 0) < boostTypes[selectedBoostType].prices[selectedDuration])
                        ? 'bg-white/20 text-white/60 cursor-not-allowed'
                        : 'bg-white text-black hover:bg-white/90'
                      }`}
                    onClick={handleBoostPurchaseClick}
                    disabled={!selectedServer || !selectedBoostType || !selectedDuration ||
                      (isScheduled && (!scheduledTime || new Date(scheduledTime).getTime() <= Date.now())) ||
                      loading.boost ||
                      (selectedBoostType && selectedDuration && boostTypes &&
                        (storeConfig?.userBalance || 0) < boostTypes[selectedBoostType].prices[selectedDuration])}
                  >
                    {loading.boost ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : isScheduled ? (
                      <Calendar className="w-4 h-4 mr-2" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    {!(boostTypes?.[selectedBoostType]?.prices?.[selectedDuration]) ? 'Select options' :
                      (storeConfig?.userBalance || 0) < boostTypes[selectedBoostType].prices[selectedDuration] ? 'Insufficient balance' :
                        isScheduled ? 'Schedule Boost' : 'Apply Boost Now'}
                  </button>
                </div>
              </div>

              <div className="border border-[#2e3337] rounded-lg bg-transparent">
                <div className="p-4 pb-3 border-b border-[#2e3337]">
                  <h3 className="font-normal text-lg">How boosts work</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-[#95a1ad] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[#95a1ad]">Server boosts temporarily multiply your server's resources for the selected duration.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-[#95a1ad] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[#95a1ad]">Boosts are active immediately or at your scheduled time and automatically expire after the duration.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <X className="w-4 h-4 text-[#95a1ad] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[#95a1ad]">You can cancel active boosts for a partial refund proportional to remaining time.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#95a1ad] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[#95a1ad]">Only one boost type can be active per server at a time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {isDialogVisible && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className={`fixed inset-0 transition-opacity duration-300 ${dialogAnimation ? 'opacity-100' : 'opacity-0'
              }`}
            onClick={() => setConfirmDialog(null)}
          ></div>
          <div
            className={`relative bg-[#202229] border border-white/5 rounded-lg w-full max-w-xs md:max-w-md p-6 transition-all duration-300 ${dialogAnimation}`}
          >
            <div className="mb-4">
              <h2 className="text-lg font-medium">
                {confirmDialog?.type === 'resource' ? 'Confirm Purchase' : 'Confirm Boost'}
              </h2>
              <p className="text-[#95a1ad] mt-1">
                {confirmDialog?.type === 'resource'
                  ? 'Are you sure you want to purchase:'
                  : confirmDialog?.isScheduled
                    ? 'Are you sure you want to schedule this boost?'
                    : 'Are you sure you want to apply this boost?'}
              </p>
            </div>

            <div className="space-y-4 py-4">
              {confirmDialog?.type === 'resource' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Resource:</span>
                    <span>{confirmDialog?.title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Amount:</span>
                    <span>{confirmDialog?.resourceAmount} {confirmDialog?.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Cost:</span>
                    <span>{confirmDialog?.totalPrice} coins</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Balance after purchase:</span>
                    <span>{(storeConfig?.userBalance || 0) - (confirmDialog?.totalPrice || 0)} coins</span>
                  </div>
                </div>
              )}

              {confirmDialog?.type === 'boost' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Boost Type:</span>
                    <span>{confirmDialog?.boostName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Server:</span>
                    <span>{confirmDialog?.server}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Duration:</span>
                    <span>{confirmDialog?.duration}</span>
                  </div>
                  {confirmDialog?.isScheduled && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#95a1ad]">Scheduled Time:</span>
                      <span>{confirmDialog?.scheduledTime}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Cost:</span>
                    <span>{confirmDialog?.price} coins</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#95a1ad]">Balance after purchase:</span>
                    <span>{(storeConfig?.userBalance || 0) - (confirmDialog?.price || 0)} coins</span>
                  </div>

                  <div className="pt-3 border-t border-[#2e3337] mt-2">
                    <p className="text-sm font-medium mb-2">Resource Multipliers:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center p-2 rounded bg-[#1a1c1e] text-center">
                        <span className="text-xs text-[#95a1ad]">RAM</span>
                        <span className="text-sm">{confirmDialog?.resourceMultipliers?.ram}x</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded bg-[#1a1c1e] text-center">
                        <span className="text-xs text-[#95a1ad]">CPU</span>
                        <span className="text-sm">{confirmDialog?.resourceMultipliers?.cpu}x</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded bg-[#1a1c1e] text-center">
                        <span className="text-xs text-[#95a1ad]">Disk</span>
                        <span className="text-sm">{confirmDialog?.resourceMultipliers?.disk}x</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-md border border-white/5 text-[#95a1ad] hover:text-white hover:bg-white/5 font-medium text-sm transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDialog?.type === 'resource'
                  ? buyResource(confirmDialog.resourceType, confirmDialog.amount)
                  : purchaseBoost()
                }
                className="px-4 py-2 bg-white text-black hover:bg-white/90 rounded-md font-medium text-sm transition active:scale-95 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirm {confirmDialog?.type === 'resource' ? 'Purchase' : 'Boost'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
