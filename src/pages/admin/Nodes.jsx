import { useMemo, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { showApiErrorToast } from '@/lib/api';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Globe,
  HardDrive,
  MapPin,
  MemoryStick,
  RefreshCw,
  Search,
  Server,
  X
} from 'lucide-react';

export default function AdminNodes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingDisableLocation, setPendingDisableLocation] = useState(null);
  const [pendingDisableNode, setPendingDisableNode] = useState(null);
  const [expandedLocations, setExpandedLocations] = useState({});
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isNodeDetailsOpen, setIsNodeDetailsOpen] = useState(false);

  const formatResourceValue = (value) => {
    const numericValue = Number(value || 0);

    if (numericValue >= 1024) {
      return `${(numericValue / 1024).toFixed(numericValue % 1024 === 0 ? 0 : 1)} GB`;
    }

    return `${numericValue} MB`;
  };

  const getUsageStats = (total, allocated) => {
    const safeTotal = Number(total || 0);
    const safeAllocated = Number(allocated || 0);
    const free = Math.max(safeTotal - safeAllocated, 0);
    const percentage = safeTotal > 0 ? Math.min((safeAllocated / safeTotal) * 100, 100) : 0;

    return {
      total: safeTotal,
      allocated: safeAllocated,
      free,
      percentage,
    };
  };

  // Fetch locations and nodes data
  const { data: locationsNodesData, isLoading, error } = useQuery({
    queryKey: ['admin-locations-nodes'],
    queryFn: async () => {
      const { data } = await axios.get('/api/admin/locations-nodes');
      return data;
    }
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      setIsSyncing(true);
      const { data } = await axios.post('/api/admin/locations-nodes/sync');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['admin-locations-nodes']);
      toast({
        title: 'Sync Complete',
        description: `Synced ${data.locationCount} locations and ${data.nodeCount} nodes from Pterodactyl.`,
      });
      setIsSyncing(false);
    },
    onError: (error) => {
      showApiErrorToast(toast, error, 'Failed to sync from Pterodactyl', 'Sync Failed');
      setIsSyncing(false);
    }
  });

  // Toggle location mutation
  const toggleLocationMutation = useMutation({
    mutationFn: async (locationId) => {
      const { data } = await axios.patch(`/api/admin/locations/${locationId}/toggle`);
      return { locationId, enabled: data.enabled };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-locations-nodes']);
    },
    onError: (error) => {
      showApiErrorToast(toast, error, 'Failed to toggle location', 'Toggle Failed');
    }
  });

  // Toggle node mutation
  const toggleNodeMutation = useMutation({
    mutationFn: async (nodeId) => {
      const { data } = await axios.patch(`/api/admin/nodes/${nodeId}/toggle`);
      return { nodeId, enabled: data.enabled };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-locations-nodes']);
    },
    onError: (error) => {
      showApiErrorToast(toast, error, 'Failed to toggle node', 'Toggle Failed');
    }
  });

  // Toggle location mutation for edit dialog
  const updateLocationMutation = useMutation({
    mutationFn: async ({ locationId, updates }) => {
      const { data } = await axios.patch(`/api/admin/locations/${locationId}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-locations-nodes']);
      setIsEditDialogOpen(false);
      toast({
        title: 'Location Updated',
        description: 'Location configuration saved successfully.',
      });
    },
    onError: (error) => {
      showApiErrorToast(toast, error, 'Failed to update location', 'Update Failed');
    }
  });

  // Filter locations based on search
  const filteredLocations = useMemo(() => {
    if (!locationsNodesData?.locations) return [];

    return locationsNodesData.locations.filter(location => {
      const matchesSearch = searchQuery === '' ||
        location.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.nodes?.some(node =>
          node.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.fqdn?.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesSearch;
    });
  }, [locationsNodesData?.locations, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    if (!locationsNodesData?.locations) return { locations: 0, nodes: 0, enabledLocations: 0, enabledNodes: 0 };

    const locations = locationsNodesData.locations;
    let totalNodes = 0;
    let enabledNodes = 0;
    let enabledLocations = 0;

    locations.forEach(loc => {
      totalNodes += loc.nodes?.length || 0;
      if (loc.enabled) enabledLocations++;
      loc.nodes?.forEach(node => {
        if (node.enabled) enabledNodes++;
      });
    });

    return {
      locations: locations.length,
      nodes: totalNodes,
      enabledLocations,
      enabledNodes
    };
  }, [locationsNodesData?.locations]);

  // Toggle location expansion
  const toggleLocationExpanded = (locationId) => {
    setExpandedLocations(prev => ({
      ...prev,
      [locationId]: !prev[locationId]
    }));
  };

  const selectedNodeMemory = getUsageStats(
    selectedNode?.memory,
    selectedNode?.allocated_resources?.memory
  );

  const selectedNodeDisk = getUsageStats(
    selectedNode?.disk,
    selectedNode?.allocated_resources?.disk
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <div className="p-6">
          <div className="h-8 w-48 bg-neutral-800 rounded animate-pulse mb-6" />
          <div className="grid gap-6">
            <div className="grid grid-cols-4 gap-4">
              {['locations', 'nodes', 'enabled', 'disabled'].map((key) => (
                <div key={key} className="h-24 bg-neutral-800 rounded animate-pulse" />
              ))}
            </div>
            <div className="h-96 bg-neutral-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <div className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load locations and nodes: {error.message}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Locations & Nodes</h1>
            <p className="text-neutral-400 text-sm mt-1">
              Manage deployment locations and their associated nodes
              {locationsNodesData?.lastSync && (
                <span className="text-neutral-500 ml-2">
                  · Last synced {new Date(locationsNodesData.lastSync).toLocaleString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ConfirmDialog
              title="Sync from Pterodactyl?"
              description="This will fetch all locations and nodes from your Pterodactyl panel. New items will be added and existing ones will be updated."
              confirmText="Sync Now"
              onConfirm={() => syncMutation.mutate()}
              trigger={
                <Button disabled={isSyncing}>
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync from Panel
                    </>
                  )}
                </Button>
              }
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#202229] rounded-lg">
                  <MapPin className="w-6 h-6 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-400">Locations</p>
                  <p className="text-2xl font-bold text-white">{stats.locations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#202229] rounded-lg">
                  <Server className="w-6 h-6 text-neutral-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-400">Nodes</p>
                  <p className="text-2xl font-bold text-white">{stats.nodes}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-400">Enabled</p>
                  <p className="text-2xl font-bold text-white">{stats.enabledLocations}L / {stats.enabledNodes}N</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <X className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-400">Disabled</p>
                  <p className="text-2xl font-bold text-white">{stats.locations - stats.enabledLocations}L / {stats.nodes - stats.enabledNodes}N</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  placeholder="Search locations or nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-sm text-neutral-500">
                {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Locations & Nodes List */}
        <Card>
          <CardHeader>
            <CardTitle>Locations & Nodes</CardTitle>
            <CardDescription>
              Toggle locations or nodes to control what users can select during server creation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLocations.length === 0 ? (
              <div className="text-center text-neutral-500 py-12">
                {locationsNodesData?.locations?.length === 0 ? (
                  <div className="space-y-4">
                    <Globe className="w-16 h-16 mx-auto text-neutral-600" />
                    <p className="text-lg font-medium">No locations synced yet</p>
                    <p className="text-sm">Sync from Pterodactyl to see your locations and nodes here.</p>
                    <ConfirmDialog
                      title="Sync from Pterodactyl?"
                      description="This will fetch all locations and nodes from your Pterodactyl panel."
                      confirmText="Sync Now"
                      onConfirm={() => syncMutation.mutate()}
                      trigger={
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Sync from Panel
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Search className="w-12 h-12 mx-auto text-neutral-600" />
                    <p>No locations match your search</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    className={`border border-neutral-800 rounded-lg overflow-hidden ${
                      !location.enabled ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Location Header */}
                    <div
                      className={`flex items-center justify-between p-4 bg-[#111111] ${
                        expandedLocations[location.id] ? 'border-b border-neutral-800' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleLocationExpanded(location.id)}
                          className="p-1 hover:bg-white/5 rounded transition-colors"
                        >
                          {expandedLocations[location.id] ? (
                            <ChevronDown className="w-4 h-4 text-neutral-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-neutral-400" />
                          )}
                        </button>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            location.enabled ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <p className="font-medium text-white">
                              {location.name}
                              {!location.enabled && (
                                <Badge variant="outline" className="ml-2 border-red-500/50 text-red-400">
                                  Disabled
                                </Badge>
                              )}
                            </p>
                            {location.description && (
                              <p className="text-sm text-neutral-500">{location.description}</p>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          <Server className="w-3 h-3 mr-1" />
                          {location.nodes?.length || 0} node{location.nodes?.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLocation(location);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        {location.enabled ? (
                          <Switch
                            checked={location.enabled}
                            onClick={(e) => {
                              e.preventDefault();
                              setPendingDisableLocation({ id: location.id, name: location.name });
                            }}
                            disabled={toggleLocationMutation.isLoading}
                          />
                        ) : (
                          <Switch
                            checked={location.enabled}
                            onCheckedChange={() => toggleLocationMutation.mutate(location.id)}
                            disabled={toggleLocationMutation.isLoading}
                          />
                        )}
                      </div>
                    </div>

                    {/* Nodes List */}
                    {expandedLocations[location.id] && location.nodes?.length > 0 && (
                      <div className="bg-[#0a0a0a]">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-neutral-800 hover:bg-transparent">
                              <TableHead className="text-neutral-500 text-center">Status</TableHead>
                              <TableHead className="text-neutral-500">Node</TableHead>
                              <TableHead className="text-neutral-500">FQDN</TableHead>
                              <TableHead className="text-neutral-500">Resources</TableHead>
                              <TableHead className="text-neutral-500 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {location.nodes.map((node) => (
                              <TableRow key={node.id} className="border-neutral-800/50 hover:bg-white/5">
                                <TableCell className="align-middle">
                                  <div className={`w-2 h-2 rounded-full mx-auto ${
                                    node.enabled ? 'bg-green-500' : 'bg-red-500'
                                  }`} />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className={node.enabled ? 'text-white' : 'text-neutral-500'}>
                                      {node.name}
                                    </span>
                                    {!node.enabled && (
                                      <Badge variant="outline" className="border-red-500/50 text-red-400 text-xs">
                                        Disabled
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-neutral-400 text-sm">{node.fqdn}</span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-4 text-xs text-neutral-400">
                                    <span className="flex items-center gap-1">
                                      <MemoryStick className="w-3 h-3" />
                                      {Math.round((node.memory || 0) / 1024)} GB
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <HardDrive className="w-3 h-3" />
                                      {Math.round((node.disk || 0) / 1024)} GB
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedNode(node);
                                        setIsNodeDetailsOpen(true);
                                      }}
                                    >
                                      Details
                                    </Button>
                                    {node.enabled ? (
                                      <Switch
                                        checked={node.enabled}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setPendingDisableNode({ id: node.id, name: node.name });
                                        }}
                                        disabled={toggleNodeMutation.isLoading}
                                      />
                                    ) : (
                                      <Switch
                                        checked={node.enabled}
                                        onCheckedChange={() => toggleNodeMutation.mutate(node.id)}
                                        disabled={toggleNodeMutation.isLoading}
                                      />
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Empty nodes state */}
                    {expandedLocations[location.id] && (!location.nodes || location.nodes.length === 0) && (
                      <div className="p-8 text-center text-neutral-500 bg-[#0a0a0a]">
                        <Server className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
                        <p>No nodes in this location</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Location Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-[#0a0a0a] border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Location</DialogTitle>
            <DialogDescription>
              Configure this location's settings
            </DialogDescription>
          </DialogHeader>

          {selectedLocation && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  value={selectedLocation.name || ''}
                  onChange={(e) => setSelectedLocation({
                    ...selectedLocation,
                    name: e.target.value
                  })}
                  placeholder="Location name"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={selectedLocation.description || ''}
                  onChange={(e) => setSelectedLocation({
                    ...selectedLocation,
                    description: e.target.value
                  })}
                  placeholder="Short description"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enabled</Label>
                  <p className="text-xs text-neutral-500">
                    Allow users to select this location during server creation
                  </p>
                </div>
                <Switch
                  checked={selectedLocation.enabled}
                  onCheckedChange={(checked) => setSelectedLocation({
                    ...selectedLocation,
                    enabled: checked
                  })}
                />
              </div>

              <Alert className="bg-neutral-900 border-neutral-800 flex items-center gap-3">
                <AlertCircle className="h-4 w-4 invert shrink-0" />
                <AlertDescription className="text-xs text-neutral-300">
                  Changes will be synced with Pterodactyl on next sync.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                updateLocationMutation.mutate({
                  locationId: selectedLocation.id,
                  updates: {
                    name: selectedLocation.name,
                    description: selectedLocation.description,
                    enabled: selectedLocation.enabled
                  }
                });
              }}
              disabled={updateLocationMutation.isLoading}
            >
              {updateLocationMutation.isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Node Details Dialog */}
      <Dialog open={isNodeDetailsOpen} onOpenChange={setIsNodeDetailsOpen}>
        <DialogContent className="w-[min(98vw,1280px)] max-w-[1280px] bg-[#0a0a0a] border-neutral-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle className="text-white flex items-center gap-2">
              <Server className="w-5 h-5" />
              {selectedNode?.name}
            </DialogTitle>
            <DialogDescription>
              Node details and resource allocation
            </DialogDescription>
          </DialogHeader>

          {selectedNode && (
            <div className="space-y-5">
              {/* Header row - visible title for non-screen-reader users */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Server className="w-5 h-5 text-neutral-400 shrink-0" />
                  <h2 className="text-lg font-semibold text-white truncate">{selectedNode.name}</h2>
                </div>
                <Badge
                  variant="outline"
                        className="shrink-0 border-neutral-700 text-neutral-200"
                >
                  {selectedNode.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>

              {/* Top section: Overview + Availability */}
              <div className="grid gap-4">
                <Card className="bg-[#111111] border-neutral-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Overview</CardTitle>
                    <CardDescription className="text-xs">
                      Quick state and identification for this node.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="rounded-xl border border-neutral-800 bg-[#0d0d0d] p-3 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{selectedNode.fqdn}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-neutral-800 bg-[#0d0d0d] p-3 min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500">Location</p>
                        <p className="mt-1 text-sm font-medium text-white truncate" title={selectedNode.locationName || 'Unknown'}>
                          {selectedNode.locationName || 'Unknown'}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">#{selectedNode.locationId}</p>
                      </div>
                      <div className="rounded-xl border border-neutral-800 bg-[#0d0d0d] p-3 min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-neutral-500">Pterodactyl</p>
                        <p className="mt-1 text-sm font-medium text-white">Node #{selectedNode.pterodactylNodeId}</p>
                        <p className="mt-0.5 text-xs text-neutral-500 truncate" title={selectedNode.lastSyncedAt ? new Date(selectedNode.lastSyncedAt).toLocaleString() : 'Unknown'}>
                          {selectedNode.lastSyncedAt ? new Date(selectedNode.lastSyncedAt).toLocaleString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#111111] border-neutral-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Availability</CardTitle>
                    <CardDescription className="text-xs">
                      Current free capacity exposed by this node.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-neutral-800 bg-[#0d0d0d] p-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-blue-500/10 p-1.5">
                          <MemoryStick className="h-3.5 w-3.5 text-neutral-300" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-neutral-500">Free Memory</p>
                          <p className="text-lg font-semibold text-white">{formatResourceValue(selectedNodeMemory.free)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-neutral-800 bg-[#0d0d0d] p-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-emerald-500/10 p-1.5">
                          <HardDrive className="h-3.5 w-3.5 text-neutral-300" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-neutral-500">Free Disk</p>
                          <p className="text-lg font-semibold text-white">{formatResourceValue(selectedNodeDisk.free)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Resource Usage */}
              <Card className="bg-[#111111] border-neutral-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Resource Usage</CardTitle>
                  <CardDescription className="text-xs">
                    Allocated versus total capacity reported by Pterodactyl.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {/* Memory */}
                  <div className="rounded-xl border border-neutral-800 bg-[#0d0d0d] p-3 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="rounded-lg bg-blue-500/10 p-1.5 shrink-0">
                          <MemoryStick className="h-3.5 w-3.5 text-neutral-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">Memory</p>
                          <p className="text-xs text-neutral-500">{selectedNodeMemory.percentage.toFixed(1)}% allocated</p>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-400 shrink-0">{formatResourceValue(selectedNodeMemory.total)}</p>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-neutral-400 transition-all"
                        style={{ width: `${selectedNodeMemory.percentage}%` }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-neutral-500">Allocated</p>
                        <p className="mt-0.5 font-medium text-white truncate">{formatResourceValue(selectedNodeMemory.allocated)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Free</p>
                        <p className="mt-0.5 font-medium text-white truncate">{formatResourceValue(selectedNodeMemory.free)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Total</p>
                        <p className="mt-0.5 font-medium text-white truncate">{formatResourceValue(selectedNodeMemory.total)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Disk */}
                  <div className="rounded-xl border border-neutral-800 bg-[#0d0d0d] p-3 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="rounded-lg bg-emerald-500/10 p-1.5 shrink-0">
                          <HardDrive className="h-3.5 w-3.5 text-neutral-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white">Disk</p>
                          <p className="text-xs text-neutral-500">{selectedNodeDisk.percentage.toFixed(1)}% allocated</p>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-400 shrink-0">{formatResourceValue(selectedNodeDisk.total)}</p>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
                      <div
                        className="h-full rounded-full bg-neutral-400 transition-all"
                        style={{ width: `${selectedNodeDisk.percentage}%` }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-neutral-500">Allocated</p>
                        <p className="mt-0.5 font-medium text-white truncate">{formatResourceValue(selectedNodeDisk.allocated)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Free</p>
                        <p className="mt-0.5 font-medium text-white truncate">{formatResourceValue(selectedNodeDisk.free)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Total</p>
                        <p className="mt-0.5 font-medium text-white truncate">{formatResourceValue(selectedNodeDisk.total)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Raw Metadata */}
              <Card className="bg-[#111111] border-neutral-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Raw Node Metadata</CardTitle>
                  <CardDescription className="text-xs">
                    Useful values for debugging and capacity checks.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-neutral-800 bg-[#0d0d0d] p-3 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-neutral-500">Node ID</p>
                      <p className="mt-1 text-sm font-semibold text-white truncate">{selectedNode.id}</p>
                    </div>
                    <div className="rounded-xl border border-neutral-800 bg-[#0d0d0d] p-3 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-neutral-500">Location ID</p>
                      <p className="mt-1 text-sm font-semibold text-white truncate">{selectedNode.locationId}</p>
                    </div>
                    <div className="rounded-xl border border-neutral-800 bg-[#0d0d0d] p-3 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-neutral-500">Allocated Memory</p>
                      <p className="mt-1 text-sm font-semibold text-white truncate">{selectedNode.allocated_resources?.memory || 0} MB</p>
                    </div>
                    <div className="rounded-xl border border-neutral-800 bg-[#0d0d0d] p-3 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-neutral-500">Allocated Disk</p>
                      <p className="mt-1 text-sm font-semibold text-white truncate">{selectedNode.allocated_resources?.disk || 0} MB</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="bg-[#0a0a0a] border-t border-neutral-800 pt-4 pb-1 mt-2">
            <Button variant="outline" onClick={() => setIsNodeDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Location Confirmation */}
      <Dialog open={!!pendingDisableLocation} onOpenChange={(open) => !open && setPendingDisableLocation(null)}>
        <DialogContent className="bg-[#0a0a0a] border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-white">Disable Location?</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable {pendingDisableLocation?.name}? Users will no longer be able to create servers with nodes in this location.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDisableLocation(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDisableLocation?.id) {
                  toggleLocationMutation.mutate(pendingDisableLocation.id);
                }
                setPendingDisableLocation(null);
              }}
              disabled={toggleLocationMutation.isLoading}
            >
              {toggleLocationMutation.isLoading ? 'Disabling...' : 'Disable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Node Confirmation */}
      <Dialog open={!!pendingDisableNode} onOpenChange={(open) => !open && setPendingDisableNode(null)}>
        <DialogContent className="bg-[#0a0a0a] border-neutral-800">
          <DialogHeader>
            <DialogTitle className="text-white">Disable Node?</DialogTitle>
            <DialogDescription>
              Are you sure you want to disable {pendingDisableNode?.name}? Users will no longer be able to create servers on this node.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDisableNode(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDisableNode?.id) {
                  toggleNodeMutation.mutate(pendingDisableNode.id);
                }
                setPendingDisableNode(null);
              }}
              disabled={toggleNodeMutation.isLoading}
            >
              {toggleNodeMutation.isLoading ? 'Disabling...' : 'Disable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
