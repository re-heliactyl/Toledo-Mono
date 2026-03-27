import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ServerIcon, PlusIcon,
  ArrowPathIcon, ExclamationCircleIcon,
  UsersIcon, MagnifyingGlassIcon,
  ChevronLeftIcon, ChevronRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from "@/components/ui/badge";
import { formatBytes } from '@/lib/format';

function CreateServerModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [egg, setEgg] = useState('');
  const [location, setLocation] = useState('');
  const [selectedNode, setSelectedNode] = useState('');
  const [ram, setRam] = useState('');
  const [disk, setDisk] = useState('');
  const [cpu, setCpu] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  const [showEggDropdown, setShowEggDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const eggDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setAnimationClass('opacity-100'), 10);
    } else {
      setAnimationClass('opacity-0');
      setTimeout(() => {
        setIsVisible(false);
        setStep(1); // Reset step when closing
      }, 300);
    }
  }, [isOpen]);

  const { data: eggs } = useQuery({
    queryKey: ['eggs'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v5/eggs');
      return data;
    }
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v5/locations');
      return data;
    }
  });

  const { data: nodes } = useQuery({
    queryKey: ['nodes'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v5/nodes');
      return data;
    },
    enabled: isOpen
  });

  const selectedEgg = Array.isArray(eggs) ? eggs.find(e => e.id === egg) : null;
  const selectedLocation = Array.isArray(locations) ? locations.find(l => l.id === location) : null;
  const filteredNodes = Array.isArray(nodes)
    ? nodes.filter((n) => n.locationId?.toString() === selectedLocation?.id?.toString())
    : [];

  // Handle clicks outside dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (eggDropdownRef.current && !eggDropdownRef.current.contains(event.target)) {
        setShowEggDropdown(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) return setError('Server name is required');
      if (!egg) return setError('Software selection is required');
    }
    if (step === 2) {
      if (!location) return setError('Location is required');
    }
    if (step === 3) {
      if (!ram || !disk || !cpu) return setError('Resource values are required');
      if (selectedEgg) {
        if (parseInt(ram) < selectedEgg.minimum.ram) return setError(`Minimum RAM required is ${selectedEgg.minimum.ram}MB`);
        if (parseInt(disk) < selectedEgg.minimum.disk) return setError(`Minimum Disk required is ${selectedEgg.minimum.disk}MB`);
        if (parseInt(cpu) < selectedEgg.minimum.cpu) return setError(`Minimum CPU required is ${selectedEgg.minimum.cpu}%`);
      }
    }
    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleCreate = async () => {
    try {
      setError('');
      setIsCreating(true);

      await axios.post('/api/v5/servers', {
        name: name.trim(),
        egg,
        location,
        ram: parseInt(ram),
        disk: parseInt(disk),
        cpu: parseInt(cpu)
      });

      onClose();
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen && !isVisible) return null;

  const steps = [
    { id: 1, name: 'Name & Software' },
    { id: 2, name: 'Location' },
    { id: 3, name: 'Resources' },
    { id: 4, name: 'Review' }
  ];

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ${animationClass}`}>
      <div className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl p-8 bg-transparent text-white">
        
        {/* Progress Bar Header */}
        <div className="mb-10 relative">
          <div className="h-[2px] w-full bg-[#333] flex mb-4">
            {steps.map((s) => (
              <div 
                key={s.id} 
                className={`h-full transition-all duration-500 ${step >= s.id ? 'bg-[#00A3FF]' : 'bg-transparent'}`}
                style={{ width: '25%' }}
              />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {steps.map((s) => (
              <div key={s.id} className="space-y-1 text-left">
                <p className={`text-xs font-bold ${step >= s.id ? 'text-[#00A3FF]' : 'text-neutral-500'}`}>
                  Step {s.id}
                </p>
                <p className={`text-sm font-semibold ${step >= s.id ? 'text-white' : 'text-neutral-300'}`}>
                  {s.name}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[250px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-sm text-neutral-400 block font-medium">Server Name</label>
                  <input
                    placeholder="My Server"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-[#333] focus:border-white focus:ring-1 focus:ring-white rounded-lg p-3 text-sm transition-all outline-none text-white placeholder:text-neutral-500"
                  />
                  <p className="text-[11px] text-neutral-500">Choose a descriptive name for your server</p>
                </div>

                <div className="space-y-2" ref={eggDropdownRef}>
                  <label className="text-sm text-neutral-400 block font-medium">Software</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEggDropdown(!showEggDropdown)}
                      className="w-full bg-[#1c1c1c] border border-[#333] hover:border-neutral-500 rounded-lg p-3 text-left flex justify-between items-center transition-all text-sm"
                    >
                      <span className={egg ? "text-white" : "text-neutral-500"}>
                        {selectedEgg ? selectedEgg.name : "Select a software type"}
                      </span>
                      <ChevronRightIcon className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${showEggDropdown ? 'rotate-90' : ''}`} />
                    </button>
                    {showEggDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-[#1c1c1c] border border-[#333] rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                        <div className="p-2 border-b border-[#333]">
                          <p className="text-xs text-neutral-400 px-2">Select a software type</p>
                        </div>
                        {Array.isArray(eggs) && eggs.map(e => (
                          <button
                            key={e.id}
                            onClick={() => { setEgg(e.id); setShowEggDropdown(false); }}
                            className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex justify-between items-center group"
                          >
                            <span className="text-sm text-neutral-200 group-hover:text-white">{e.name}</span>
                            {egg === e.id && <CheckIcon className="w-4 h-4 text-neutral-400" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500">Select the software type you want to run on your server</p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-2" ref={locationDropdownRef}>
                  <label className="text-sm text-neutral-400 block font-medium">Location</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                      className="w-full bg-[#1c1c1c] border border-[#333] hover:border-neutral-500 rounded-lg p-3 text-left flex justify-between items-center transition-all text-sm"
                    >
                      <span className={location ? "text-white" : "text-neutral-500"}>
                        {selectedLocation ? selectedLocation.name : "Select a location"}
                      </span>
                      <ChevronRightIcon className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${showLocationDropdown ? 'rotate-90' : ''}`} />
                    </button>
                    {showLocationDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-[#1c1c1c] border border-[#333] rounded-lg shadow-xl overflow-hidden">
                        <div className="p-2 border-b border-[#333]">
                          <p className="text-xs text-neutral-400 px-2">Select a location</p>
                        </div>
                        {Array.isArray(locations) && locations.map(l => (
                          <button
                            key={l.id}
                            onClick={() => { setLocation(l.id); setShowLocationDropdown(false); }}
                            className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex justify-between items-center ${location === l.id ? 'bg-white/5' : ''}`}
                          >
                            <span className="text-sm text-neutral-200">{l.name}</span>
                            {location === l.id && <CheckIcon className="w-4 h-4 text-neutral-400" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500">Choose the geographic location for your server</p>
                </div>

                {location && (
                  <div className="space-y-3 pt-2">
                    <p className="text-sm font-medium text-white">Nodes available in this location</p>
                    <div className="flex gap-3 flex-wrap">
                      {filteredNodes.length > 0 ? filteredNodes.map(node => {
                        // Calculate mock or real load based on memory usage
                        const memMax = node.memory || 1024;
                        const memUsed = node.allocated_resources?.memory || 0;
                        const loadPercent = (memUsed / memMax) * 100;
                        
                        let dotColor = 'bg-emerald-500';
                        let loadText = 'Low load';
                        if (loadPercent >= 85) { 
                          dotColor = 'bg-red-500'; 
                          loadText = 'High load'; 
                        } else if (loadPercent >= 60) { 
                          dotColor = 'bg-[#f59e0b]'; 
                          loadText = 'Medium load'; 
                        }

                        return (
                          <div 
                            key={node.id} 
                            onClick={() => setSelectedNode(node.id)}
                            className={`bg-[#242424] border rounded-lg p-3 min-w-[80px] flex flex-col items-center justify-center relative cursor-pointer transition-all group ${selectedNode === node.id ? 'border-[#00A3FF] ring-1 ring-[#00A3FF]' : 'border-[#333] hover:border-neutral-500'}`}
                          >
                            <p className="text-xs text-neutral-400 pointer-events-none">{node.name.split(' ')[0]}</p>
                            <p className="text-sm font-bold text-white pointer-events-none">{node.name.split(' ')[1] || node.id}</p>
                            
                            {/* The status dot (using provided code) */}
                            <div 
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${dotColor} transition-colors rounded-tl rounded-br-lg`}
                              style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0, 0, 0, 0.1) 1px, rgba(0, 0, 0, 0.1) 2px), repeating-linear-gradient(-45deg, transparent, transparent 1px, rgba(255, 255, 255, 0.1) 1px, rgba(255, 255, 255, 0.1) 2px)'
                              }}
                            ></div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:block w-56 bg-[#f4f4f5] text-black p-4 rounded-xl shadow-2xl text-xs z-50 text-left cursor-default pointer-events-none">
                              <p className="font-bold text-sm text-black">{node.name}</p>
                              {node.fqdn && <p className="text-neutral-500 mb-2 truncate">{node.fqdn}</p>}
                              
                              <div className="border-t border-neutral-300 my-2"></div>
                              
                              <p className="text-neutral-500 mb-0.5">Memory</p>
                              <p className="font-bold text-black">
                                {memUsed ? formatBytes(memUsed * 1024 * 1024) : '0 B'} / {node.memory ? formatBytes(node.memory * 1024 * 1024) : 'Unknown'}
                              </p>
                              <p className="text-neutral-500 text-[10px] mt-0.5">{loadPercent.toFixed(1)}% used</p>
                              
                              <div className="border-t border-neutral-300 my-2"></div>
                              
                              <p className="text-neutral-500 mb-0.5">Disk</p>
                              <p className="font-bold text-black">
                                {node.allocated_resources?.disk ? formatBytes(node.allocated_resources.disk * 1024 * 1024) : '0 B'} / {node.disk ? formatBytes(node.disk * 1024 * 1024) : 'Unknown'}
                              </p>

                              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#f4f4f5] rotate-45"></div>
                              
                              {/* Status Badge */}
                              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded shadow-md text-[10px] font-bold whitespace-nowrap text-black border border-neutral-200">
                                {loadText}
                              </div>
                            </div>
                          </div>
                        );
                      }) : (
                        <p className="text-sm text-neutral-500 italic">No nodes found.</p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-neutral-400 block font-medium">Memory (MiB)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={ram}
                      onChange={e => setRam(e.target.value)}
                      className="w-full bg-[#1c1c1c] border border-[#333] focus:border-white focus:ring-1 focus:ring-white rounded-lg p-3 text-sm transition-all outline-none text-white font-medium"
                    />
                    <p className="text-[11px] text-neutral-500">RAM allocation</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-neutral-400 block font-medium">Disk (MiB)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={disk}
                      onChange={e => setDisk(e.target.value)}
                      className="w-full bg-[#1c1c1c] border border-[#333] focus:border-white focus:ring-1 focus:ring-white rounded-lg p-3 text-sm transition-all outline-none text-white font-medium"
                    />
                    <p className="text-[11px] text-neutral-500">Storage/disk space</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-neutral-400 block font-medium">CPU (%)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={cpu}
                      onChange={e => setCpu(e.target.value)}
                      className="w-full bg-[#1c1c1c] border border-[#333] focus:border-white focus:ring-1 focus:ring-white rounded-lg p-3 text-sm transition-all outline-none text-white font-medium"
                    />
                    <p className="text-[11px] text-neutral-500">CPU percentage (100% = 1 core)</p>
                  </div>
                </div>

                {selectedEgg && (
                  <div className="bg-[#1c1c1c] border border-[#333] rounded-lg p-4 flex flex-col gap-1">
                    <p className="text-xs text-neutral-400">
                      Minimum requirements: {selectedEgg.minimum.ram}MB RAM, {selectedEgg.minimum.disk}MB Disk, {selectedEgg.minimum.cpu}% CPU.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-[#141414] rounded-xl p-6 space-y-6 border border-[#222]">
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <p className="text-sm text-neutral-400 font-medium mb-1">Server Name</p>
                      <p className="text-base font-bold text-white">{name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400 font-medium mb-1">Software</p>
                      <p className="text-base font-bold text-white">{selectedEgg?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400 font-medium mb-1">Location</p>
                      <p className="text-base font-bold text-white">{selectedLocation?.name}</p>
                    </div>
                    <div className="grid grid-cols-3 pt-4 border-t border-[#333]">
                      <div>
                        <p className="text-sm text-neutral-400 font-medium mb-1">Memory</p>
                        <p className="text-base font-bold text-white">{ram} MiB</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-400 font-medium mb-1">Disk</p>
                        <p className="text-base font-bold text-white">{disk} MiB</p>
                      </div>
                      <div>
                        <p className="text-sm text-neutral-400 font-medium mb-1">CPU</p>
                        <p className="text-base font-bold text-white">{cpu}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-center pt-6">
          {step === 1 ? (
            <button
              onClick={onClose}
              className="flex items-center text-neutral-400 hover:text-white transition-colors text-sm font-medium"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Cancel
            </button>
          ) : (
            <button
              onClick={handleBack}
              className="flex items-center text-neutral-400 hover:text-white transition-colors text-sm font-medium"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Back
            </button>
          )}

          <div className="flex items-center gap-4">
            {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
            
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="bg-white text-black hover:bg-neutral-200 rounded-full px-6 py-2 font-semibold text-sm flex items-center transition-all"
              >
                Next
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="bg-white text-black hover:bg-neutral-200 rounded-full px-6 py-2 font-bold text-sm flex items-center transition-all ring-2 ring-white ring-offset-2 ring-offset-black disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Create Server'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ServerCard({ server, wsStatus, stats }) {
  const navigate = useNavigate();

  const statusColors = {
    running: 'bg-emerald-500',
    starting: 'bg-amber-500',
    stopping: 'bg-amber-500',
    offline: 'bg-neutral-500'
  };

  const {
    limits = {}
  } = server?.attributes || {};

  let globalIdentifier;
  let globalName;

  if (server?.attributes) {
    globalIdentifier = server.attributes.identifier;
  } else {
    globalIdentifier = server.id;
  }

  if (server?.attributes) {
    globalName = server.attributes.name;
  } else {
    globalName = server.name;
  }

  const status = wsStatus?.[globalIdentifier] || 'offline';
  const serverStats = stats?.[globalIdentifier] || { cpu: 0, memory: 0, disk: 0 };

  const handleCardClick = () => {
    navigate(`/server/${globalIdentifier}/overview`);
  };

  return (
    <div
      className="border border-[#2e3337]/50 hover:scale-[1.01] hover:border-[#2e3337] rounded-lg bg-transparent transition duration-200 hover:border-white/10 cursor-pointer relative group"
      onClick={handleCardClick}
    >
      <div className="p-4 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#202229] border border-white/5 group-hover:border-white/10 transition-colors">
            <ServerIcon className="w-5 h-5 text-[#95a1ad]" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{globalName || 'Unnamed Server'}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`h-1.5 w-1.5 rounded-full ${statusColors[status]}`}></div>
              <p className="text-xs text-[#95a1ad]">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 pt-2 pb-3 space-y-4">
        <div>
          <div className="flex justify-between text-xs text-[#95a1ad] mb-1.5">
            <span>Memory</span>
            <span>{serverStats.memory?.toFixed(0) || 0} / {limits.memory || 0} MB</span>
          </div>
          <div className="h-1 bg-[#202229] rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-300 rounded-full"
              style={{ width: `${limits.memory ? Math.min((serverStats.memory / limits.memory) * 100, 100) : 0}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-[#95a1ad] mb-1.5">
            <span>CPU</span>
            <span>{serverStats.cpu?.toFixed(1) || 0} / {limits.cpu || 0}%</span>
          </div>
          <div className="h-1 bg-[#202229] rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-300 rounded-full"
              style={{ width: `${limits.cpu ? Math.min((serverStats.cpu / limits.cpu) * 100, 100) : 0}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-[#95a1ad] mb-1.5">
            <span>Disk</span>
            <span>{formatBytes(serverStats.disk || 0)} / {formatBytes((limits.disk || 0) * 1024 * 1024)}</span>
          </div>
          <div className="h-1 bg-[#202229] rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-300 rounded-full"
              style={{ width: `${limits.disk ? Math.min((serverStats.disk / (limits.disk * 1024 * 1024)) * 100, 100) : 0}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 p-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-[#202229] rounded-md animate-pulse"></div>
        <div className="h-9 w-32 bg-[#202229] rounded-md animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-[220px] border border-[#2e3337] rounded-lg bg-[#202229]/20 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

export default function ServersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [serverStatus, setServerStatus] = useState({});
  const [serverStats, setServerStats] = useState({});
  const socketsRef = useRef({});

  const { data: servers, isLoading: loadingServers } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v5/servers');
      return data;
    }
  });

  const { data: subuserServers, isLoading: loadingSubuserServers } = useQuery({
    queryKey: ['subuser-servers'],
    queryFn: async () => {
      const { data } = await axios.get('/api/subuser-servers');
      return data;
    }
  });

  useEffect(() => {
    if (!servers && !subuserServers) return;

    // Connect WebSockets for owned servers
    if (Array.isArray(servers)) {
      servers.forEach(server => {
        if (!socketsRef.current[server.attributes.identifier]) {
          connectWebSocket(server);
        }
      });
    }

    // Connect WebSockets for subuser servers
    if (Array.isArray(subuserServers)) {
      subuserServers.forEach(server => {
        if (!socketsRef.current[server.id]) {
          connectWebSocket(server);
        }
      });
    }

    return () => {
      Object.values(socketsRef.current).forEach(ws => ws.close());
      socketsRef.current = {};
    };
  }, [servers, subuserServers]);

  const connectWebSocket = async (server) => {
    try {
      const serverId = server?.attributes?.identifier || server.id;
      const { data: wsData } = await axios.get(`/api/server/${serverId}/websocket`);
      const ws = new WebSocket(wsData.data.socket);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          event: "auth",
          args: [wsData.data.token]
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message, serverId);
      };

      ws.onclose = () => {
        delete socketsRef.current[serverId];
        // Reconnect after 5 seconds if page is still open
        // Note: Simple reconnect, ideally check if component mounted
      };

      socketsRef.current[serverId] = ws;
    } catch (error) {
      console.error(`WebSocket connection error for ${server?.attributes?.identifier || server.id}:`, error);
    }
  };

  const handleWebSocketMessage = (message, serverId) => {
    switch (message.event) {
      case 'auth success':
        socketsRef.current[serverId].send(JSON.stringify({
          event: 'send stats',
          args: [null]
        }));
        break;

      case 'stats':
        const statsData = JSON.parse(message.args[0]);
        if (!statsData) return;

        setServerStats(prev => ({
          ...prev,
          [serverId]: {
            cpu: statsData.cpu_absolute || 0,
            memory: statsData.memory_bytes / 1024 / 1024 || 0,
            disk: statsData.disk_bytes || 0
          }
        }));
        break;

      case 'status':
        setServerStatus(prev => ({
          ...prev,
          [serverId]: message.args[0]
        }));
        break;
    }
  };

  // Filter servers
  const filteredOwnedServers = Array.isArray(servers)
    ? servers.filter(s => s.attributes.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const filteredSubuserServers = Array.isArray(subuserServers)
    ? subuserServers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  if (loadingServers || loadingSubuserServers) {
    return <LoadingSkeleton />;
  }

  const hasSubuserServers = filteredSubuserServers.length > 0;
  const hasOwnedServers = filteredOwnedServers.length > 0;

  return (
    <div className="space-y-8 p-6 max-w-screen-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Servers</h1>
          <p className="text-[#95a1ad]">Manage your instances and access subuser servers</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#95a1ad]" />
            <input
              type="text"
              placeholder="Search servers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#1a1c1e] border border-[#2e3337] rounded-md text-sm focus:outline-none focus:border-white/10 w-full sm:w-64"
            />
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-white text-black hover:bg-white/90 rounded-md font-medium text-sm transition active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            <PlusIcon className="w-4 h-4" />
            New Server
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Owned Servers Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2 text-[#95a1ad] uppercase text-xs tracking-wider">
            <ServerIcon className="w-4 h-4" />
            Your Servers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOwnedServers.map(server => (
              <ServerCard
                key={server.attributes.id}
                server={server}
                wsStatus={serverStatus}
                stats={serverStats}
              />
            ))}

            {filteredOwnedServers.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border border-[#2e3337] border-dashed rounded-lg bg-[#202229]/20">
                <ServerIcon className="w-8 h-8 text-[#2e3337] mb-2" />
                <p className="text-sm text-[#95a1ad]">
                  {searchTerm ? 'No servers match your search.' : 'You don\'t have any servers yet.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Subuser Servers Section */}
        {hasSubuserServers && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium flex items-center gap-2 text-[#95a1ad] uppercase text-xs tracking-wider">
              <UsersIcon className="w-4 h-4" />
              Shared With You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubuserServers.map(server => (
                <ServerCard
                  key={server.id}
                  server={server}
                  wsStatus={serverStatus}
                  stats={serverStats}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateServerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
