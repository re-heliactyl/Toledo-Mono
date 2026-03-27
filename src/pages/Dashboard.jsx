import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ServerIcon, CpuChipIcon,
  ChartPieIcon, ArchiveBoxIcon,
  CommandLineIcon, PencilIcon,
  TrashIcon, UsersIcon, CheckIcon, EllipsisVerticalIcon,
  BoltIcon, GlobeAltIcon, CircleStackIcon
} from '@heroicons/react/24/outline';
import { ChartPie, Users, Server, CircuitBoard, MapPin } from 'lucide-react';
import { FAQSection } from '../components/FAQSection';
import { Card, CardContent } from '@/components/ui/card';
import { useSettings } from '@/hooks/useSettings';

const ResourceCard = React.memo(function ResourceCard({ icon: Icon, title, used, total, unit, isBoosted }) {
  const { percentage, colorClass, formattedUsed, formattedTotal } = useMemo(() => {
    const pct = total ? (used / total) * 100 : 0;
    const color = pct > 100 && !isBoosted ? 'bg-red-500' :
                  pct > 90 && !isBoosted ? 'bg-red-500' :
                  pct > 70 ? 'bg-amber-500' : 'bg-neutral-300';
    
    // Format values to avoid long decimals (e.g. 22.99609375GB)
    // Using Math.floor to keep digits without rounding up as requested
    const formatValue = (val) => {
      if (typeof val !== 'number') return val;
      return Math.floor(val * 100) / 100;
    };

    return { 
      percentage: pct, 
      colorClass: color,
      formattedUsed: formatValue(used),
      formattedTotal: formatValue(total)
    };
  }, [used, total, isBoosted]);

  return (
    <div className={`border ${isBoosted ? 'border-amber-500/30 bg-amber-500/5' : 'border-[#2e3337]/50 bg-transparent'} shadow-xs rounded-lg p-4 relative overflow-hidden`}>
      <div className="flex items-center justify-between pb-2 mt-1 relative z-0">
        <div className="flex items-center gap-2">
          <h3 className={`text-sm font-medium flex items-center gap-2 ${isBoosted ? 'text-amber-500' : ''}`}>
            {title}
            {isBoosted && <BoltIcon className="w-3.5 h-3.5 animate-pulse" />}
          </h3>
        </div>
        <span className="text-xs text-[#95a1ad]">
          {formattedUsed}{unit} / {formattedTotal}{unit}
        </span>
      </div>
      <div>
        <div className="h-1 bg-[#202229] rounded-full overflow-hidden">
          <div
            className={`h-full ${isBoosted ? 'bg-gradient-to-r from-amber-600 to-amber-400' : colorClass} rounded-full`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-[#95a1ad]">
            {percentage.toFixed(1)}% utilized
          </p>
          {isBoosted && (
            <span className="text-[0.60rem] text-amber-500/80 font-medium uppercase tracking-wider mr-1">
              ACTIVE BOOST
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

function LoadingSkeleton() {
  return (
    <div className="space-y-8 p-6 max-w-screen-2xl mx-auto">
      <div>
        <div className="h-8 w-32 bg-[#202229] rounded-md animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={`dashboard-skeleton-${i + 1}`} className="border border-[#2e3337] rounded-lg p-4">
            <div className="flex items-center pb-2">
              <div className="w-8 h-8 rounded-lg bg-[#202229] animate-pulse mr-2"></div>
              <div className="h-6 w-32 bg-[#202229] rounded animate-pulse"></div>
            </div>
            <div className="h-1 w-full bg-[#202229] rounded-full animate-pulse"></div>
            <div className="h-4 w-20 mt-2 bg-[#202229] rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { settings } = useSettings();

  const { data: resources, isLoading: loadingResources } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v5/resources');
      return data;
    },
    staleTime: 30000,
  });

  const { data: activeBoosts } = useQuery({
    queryKey: ['active-boosts'],
    queryFn: async () => {
      try {
        const { data } = await axios.get('/api/boosts/active');
        return data;
      } catch (error) {
        if (error.response?.status === 403 && error.response?.data?.error === 'Server boosts are currently disabled') {
          return null;
        }
        throw error;
      }
    },
    // Don't block loading
    enabled: settings?.features?.boosts !== false,
    retry: false,
    staleTime: 30000,
  });

  const { data: platformStats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const { data } = await axios.get('/api/stats');
      return data;
    },
    retry: false,
    staleTime: 30000,
  });

  // Calculate boosted resources
  const boostedResources = {
    ram: false,
    cpu: false,
    disk: false
  };

  if (activeBoosts) {
    Object.values(activeBoosts).forEach(serverBoosts => {
      Object.values(serverBoosts).forEach(boost => {
        if (boost.boostType === 'memory' || boost.boostType === 'performance' || boost.boostType === 'extreme') {
          boostedResources.ram = true;
        }
        if (boost.boostType === 'cpu' || boost.boostType === 'performance' || boost.boostType === 'extreme') {
          boostedResources.cpu = true;
        }
        if (boost.boostType === 'storage' || boost.boostType === 'performance' || boost.boostType === 'extreme') {
          boostedResources.disk = true;
        }
      });
    });
  }

  if (loadingResources) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-8 p-6 max-w-screen-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ResourceCard
          icon={ChartPieIcon}
          title="Memory"
          used={resources?.current?.ram / 1024 || 0}
          total={resources?.limits?.ram / 1024 || 0}
          unit="GB"
          isBoosted={boostedResources.ram}
        />
        <ResourceCard
          icon={CpuChipIcon}
          title="CPU"
          used={resources?.current?.cpu || 0}
          total={resources?.limits?.cpu || 0}
          unit="%"
          isBoosted={boostedResources.cpu}
        />
        <ResourceCard
          icon={ArchiveBoxIcon}
          title="Storage"
          used={resources?.current?.disk / 1024 || 0}
          total={resources?.limits?.disk / 1024 || 0}
          unit="GB"
          isBoosted={boostedResources.disk}
        />
        <ResourceCard
          icon={ServerIcon}
          title="Servers"
          used={resources?.current?.servers || 0}
          total={resources?.limits?.servers || 0}
          unit=""
        />
      </div>

      {/* FAQ Section */}
      <FAQSection />

      {/* Platform Statistics */}
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">Platform Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border border-[#2e3337]/50 bg-transparent rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#202229] rounded-lg">
                <Users className="w-5 h-5 text-[#95a1ad]" />
              </div>
              <div>
                <p className="text-xs text-[#95a1ad]">Total Users</p>
                <p className="text-xl font-semibold text-white">
                  {platformStats?.totalUsers?.toLocaleString() || '-'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="border border-[#2e3337]/50 bg-transparent rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#202229] rounded-lg">
                <Server className="w-5 h-5 text-[#95a1ad]" />
              </div>
              <div>
                <p className="text-xs text-[#95a1ad]">Active Servers</p>
                <p className="text-xl font-semibold text-white">
                  {platformStats?.totalServers?.toLocaleString() || '-'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="border border-[#2e3337]/50 bg-transparent rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#202229] rounded-lg">
                <CircuitBoard className="w-5 h-5 text-[#95a1ad]" />
              </div>
              <div>
                <p className="text-xs text-[#95a1ad]">Nodes</p>
                <p className="text-xl font-semibold text-white">
                  {platformStats?.totalNodes?.toLocaleString() || '-'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="border border-[#2e3337]/50 bg-transparent rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#202229] rounded-lg">
                <MapPin className="w-5 h-5 text-[#95a1ad]" />
              </div>
              <div>
                <p className="text-xs text-[#95a1ad]">Locations</p>
                <p className="text-xl font-semibold text-white">
                  {platformStats?.totalLocations?.toLocaleString() || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
