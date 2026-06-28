import {
  ArrowPathIcon,
  CheckIcon,
  CpuChipIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { HardDrive, MemoryStick } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

function clampResourceValue(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function ServerPackagePage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [ram, setRam] = useState(0);
  const [disk, setDisk] = useState(0);
  const [cpu, setCpu] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  // Get server details
  const { data: server, isLoading: serverLoading } = useQuery({
    queryKey: ['server', id],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`/api/v5/server/${id}`);
        return data?.attributes;
      } catch (error) {
        console.error('Failed to fetch server:', error);
        throw error;
      }
    }
  });

  // Get user resources
  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v5/resources');
      return data;
    }
  });

  // Set initial values from server limits
  useEffect(() => {
    if (server?.limits) {
      setRam(server.limits.memory);
      setDisk(server.limits.disk);
      setCpu(server.limits.cpu);
    }
  }, [server]);

  // Minimum resource values
  const minRAM = 128;
  const minDisk = 1024;
  const minCPU = 5;

  // Maximum resource values (current + remaining)
  const maxRAM = (server?.limits?.memory || 0) + (resources?.remaining?.ram || 0);
  const maxDisk = (server?.limits?.disk || 0) + (resources?.remaining?.disk || 0);
  const maxCPU = (server?.limits?.cpu || 0) + (resources?.remaining?.cpu || 0);
  const canIncreaseRAM = (resources?.remaining?.ram || 0) > 0;
  const canIncreaseDisk = (resources?.remaining?.disk || 0) > 0;
  const canIncreaseCPU = (resources?.remaining?.cpu || 0) > 0;

  const effectiveMinRAM = server?.limits?.memory === 0 ? 0 : minRAM;
  const effectiveMinDisk = server?.limits?.disk === 0 ? 0 : minDisk;
  const effectiveMinCPU = server?.limits?.cpu === 0 ? 0 : minCPU;

  const serverIdentifier = server?.identifier || id;

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);

      if (
        ram === undefined || ram === null || ram === '' ||
        disk === undefined || disk === null || disk === '' ||
        cpu === undefined || cpu === null || cpu === ''
      ) {
        throw new Error('All resource values are required');
      }

      // Use identifier instead of id
      await axios.patch(`/api/v5/servers/${serverIdentifier}`, {
        ram: parseInt(ram),
        disk: parseInt(disk),
        cpu: parseInt(cpu)
      });

      toast({
        title: "Success",
        description: "Server resources updated successfully.",
      });

      // Reload page
      window.location.reload();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.response?.data?.error || err.message,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Check if resources have changed
  const hasChanges =
    ram !== server?.limits?.memory ||
    disk !== server?.limits?.disk ||
    cpu !== server?.limits?.cpu;

  // Loading state
  if (serverLoading || resourcesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ArrowPathIcon className="w-6 h-6 text-[#95a1ad] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-screen-xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Package</h1>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setRam(server?.limits?.memory || 0);
              setDisk(server?.limits?.disk || 0);
              setCpu(server?.limits?.cpu || 0);
            }}
            disabled={!hasChanges || isUpdating}
            variant="outline"
            className="text-[#95a1ad] hover:text-white hover:bg-white/5 border-white/5"
          >
            Reset
          </Button>
          <ConfirmDialog
            title="Save Changes"
            description="Are you sure you want to update the server's resources? This might require a server restart to take effect."
            onConfirm={handleUpdate}
            trigger={
              <Button
                disabled={!hasChanges || isUpdating}
                className="flex items-center gap-2"
              >
                {isUpdating ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />}
                Save Changes
              </Button>
            }
          />
        </div>
      </div>

      <div className="rounded-lg border border-white/5 text-white p-6 flex items-start">
        <InformationCircleIcon className="w-5 h-5 mt-0.5 mr-2 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-sm text-white">
            Adjust your server resources below. You might need to restart your server for changes to take effect.
          </p>
          <p className="text-sm text-white/70">
            {resources?.remaining?.ram === 0 && resources?.remaining?.disk === 0 && resources?.remaining?.cpu === 0 ? (
              <span>You have no remaining package resources to add. You can still reduce this server&apos;s current allocation if needed.</span>
            ) : (
              <span>You have {(resources?.remaining?.ram || 0).toLocaleString()}MB RAM, {(resources?.remaining?.disk || 0).toLocaleString()}MB storage, and {resources?.remaining?.cpu || 0}% CPU remaining across your package. The badges below show this server&apos;s current allocation.</span>
            )}
          </p>
        </div>
      </div>

      <div className="space-y-10">
        {/* Memory Slider */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#202229] border border-white/5">
              <MemoryStick className="w-5 h-5 text-[#95a1ad]" />
            </div>
            <div>
              <h3 className="text-base font-medium">Memory (RAM)</h3>
              <p className="text-sm text-[#95a1ad]">Allocate memory for your server to use</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#95a1ad]">Min: {effectiveMinRAM}MB</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{ram === 0 ? 'Unlimited' : `${ram}MB`}</span>
                  <span className="text-xs px-3 py-1 rounded-full ml-2 border-white/5 border text-white/70">
                    Current allocation: {server?.limits?.memory === 0 ? 'Unlimited' : `${server?.limits?.memory || 0}MB`}
                </span>
              </div>
            </div>
            <Slider
              value={[ram]}
              aria-label="Memory (RAM) limit"
              min={effectiveMinRAM}
              max={Math.max(maxRAM, server?.limits?.memory || 0, effectiveMinRAM)}
              step={128}
              onValueChange={values => setRam(clampResourceValue(values[0], effectiveMinRAM, Math.max(maxRAM, server?.limits?.memory || 0, effectiveMinRAM)))}
              className="py-2"
            />
            {!canIncreaseRAM && (
              <p className="text-xs text-[#95a1ad]">Maximum package allocation reached for RAM — you can still reduce it, but not increase it further.</p>
            )}
          </div>
        </div>

        {/* Disk Slider */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#202229] border border-white/5">
              <HardDrive className="w-5 h-5 text-[#95a1ad]" />
            </div>
            <div>
              <h3 className="text-base font-medium">Disk Space</h3>
              <p className="text-sm text-[#95a1ad]">Storage space for your server files</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#95a1ad]">Min: {effectiveMinDisk >= 1024 ? `${(effectiveMinDisk / 1024).toFixed(1)} GB` : `${effectiveMinDisk} MB`}</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{disk === 0 ? 'Unlimited' : (disk >= 1024 ? `${(disk / 1024).toFixed(1)} GB` : `${disk} MB`)}</span>
                  <span className="text-xs px-3 py-1 rounded-full ml-2 border-white/5 border text-white/70">
                    Current allocation: {server?.limits?.disk === 0 ? 'Unlimited' : ((server?.limits?.disk || 0) >= 1024 ? `${((server?.limits?.disk || 0) / 1024).toFixed(1)} GB` : `${server?.limits?.disk || 0} MB`)}
                </span>
              </div>
            </div>
            <Slider
              value={[disk]}
              aria-label="Disk Space limit"
              min={effectiveMinDisk}
              max={Math.max(maxDisk, server?.limits?.disk || 0, effectiveMinDisk)}
              step={1024}
              onValueChange={values => setDisk(clampResourceValue(values[0], effectiveMinDisk, Math.max(maxDisk, server?.limits?.disk || 0, effectiveMinDisk)))}
              className="py-2"
            />
            {!canIncreaseDisk && (
              <p className="text-xs text-[#95a1ad]">Maximum package allocation reached for storage — you can still reduce it, but not increase it further.</p>
            )}
          </div>
        </div>

        {/* CPU Slider */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#202229] border border-white/5">
              <CpuChipIcon className="w-5 h-5 text-[#95a1ad]" />
            </div>
            <div>
              <h3 className="text-base font-medium">CPU Limit</h3>
              <p className="text-sm text-[#95a1ad]">Processing power available to your server</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#95a1ad]">Min: {effectiveMinCPU}%</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{cpu === 0 ? 'Unlimited' : `${cpu}%`}</span>
                  <span className="text-xs px-3 py-1 rounded-full ml-2 border-white/5 border text-white/70">
                    Current allocation: {server?.limits?.cpu === 0 ? 'Unlimited' : `${server?.limits?.cpu || 0}%`}
                </span>
              </div>
            </div>
            <Slider
              value={[cpu]}
              aria-label="CPU limit"
              min={effectiveMinCPU}
              max={Math.max(maxCPU, server?.limits?.cpu || 0, effectiveMinCPU)}
              step={5}
              onValueChange={values => setCpu(clampResourceValue(values[0], effectiveMinCPU, Math.max(maxCPU, server?.limits?.cpu || 0, effectiveMinCPU)))}
              className="py-2"
            />
            {!canIncreaseCPU && (
              <p className="text-xs text-[#95a1ad]">Maximum package allocation reached for CPU — you can still reduce it, but not increase it further.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
