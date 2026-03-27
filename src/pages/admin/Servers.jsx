import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/Pagination';
import { useSettings } from '@/hooks/useSettings';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ArrowUpDown, ExternalLink, Loader2, Server, ShieldCheck, Box, Shield } from 'lucide-react';
import axios from 'axios';

function getServerStatus(server) {
  if (server.attributes.suspended) {
    return {
      label: 'Suspended',
      variant: 'destructive',
      sortValue: '0-suspended'
    };
  }

  if (server.attributes.runtimeStatus === 'starting') {
    return {
      label: 'Starting',
      variant: 'secondary',
      sortValue: '1-starting'
    };
  }

  if (server.attributes.runtimeStatus === 'stopping') {
    return {
      label: 'Stopping',
      variant: 'secondary',
      sortValue: '3-stopping'
    };
  }

  if (server.attributes.isOnline) {
    return {
      label: 'Online',
      variant: 'success',
      sortValue: '2-online'
    };
  }

  if (server.attributes.runtimeStatus === 'unknown') {
    return {
      label: 'Unknown',
      variant: 'secondary',
      sortValue: '5-unknown'
    };
  }

  return {
    label: 'Offline',
    variant: 'secondary',
    sortValue: '4-offline'
  };
}

export default function AdminServersPage() {
  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const { settings: publicSettings } = useSettings();

  // Fetch servers list via admin endpoint
  const { data: serversData, isLoading } = useQuery({
    queryKey: ['admin_servers'],
    queryFn: async () => {
      // The backend returns an object that typically contains { data: [servers] }
      // This is because it directly proxies the Pterodactyl application API
      const { data } = await axios.get('/api/servers');
      return data.data || [];
    },
    refetchInterval: 60000
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedServers = useMemo(() => {
    if (!serversData) return [];

    let filtered = serversData;
    if (search.trim()) {
      const rawTerms = search.toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
      
      filtered = serversData.filter(server => {
        const pteroId = String(server.attributes.id || '');
        const uuid = (server.attributes.uuid || '').toLowerCase();
        const identifier = (server.attributes.identifier || '').toLowerCase();
        const name = (server.attributes.name || '').toLowerCase();
        const ownerName = (server.attributes.relationships?.user?.attributes?.username || '').toLowerCase();
        const ownerEmail = (server.attributes.relationships?.user?.attributes?.email || '').toLowerCase();
        const nodeName = (server.attributes.relationships?.node?.attributes?.name || '').toLowerCase();

        // For each term in the comma-separated list, it must match AT LEAST ONE of the fields
        return rawTerms.every(term => 
          pteroId === term ||
          uuid.includes(term) ||
          identifier.includes(term) ||
          name.includes(term) ||
          ownerName.includes(term) ||
          ownerEmail.includes(term) ||
          nodeName.includes(term)
        );
      });
    }

    return filtered.sort((a, b) => {
      let aValue = '';
      let bValue = '';

      switch (sortField) {
        case 'id':
          return sortDirection === 'asc'
            ? a.attributes.id - b.attributes.id
            : b.attributes.id - a.attributes.id;
        case 'name':
          aValue = (a.attributes.name || '').toLowerCase();
          bValue = (b.attributes.name || '').toLowerCase();
          break;
        case 'user':
          aValue = (a.attributes.relationships?.user?.attributes?.username || '').toLowerCase();
          bValue = (b.attributes.relationships?.user?.attributes?.username || '').toLowerCase();
          break;
        case 'node':
          aValue = (a.attributes.relationships?.node?.attributes?.name || '').toLowerCase();
          bValue = (b.attributes.relationships?.node?.attributes?.name || '').toLowerCase();
          break;
        case 'status':
          aValue = getServerStatus(a).sortValue;
          bValue = getServerStatus(b).sortValue;
          break;
        default:
          break;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [serversData, search, sortField, sortDirection]);

  const paginatedServers = filteredAndSortedServers.slice(
    (currentPage - 1) * parseInt(perPage),
    currentPage * parseInt(perPage)
  );

  const totalPages = Math.ceil(filteredAndSortedServers.length / parseInt(perPage));
  const skeletonRows = Array.from({ length: parseInt(perPage) || 5 }, (_, index) => index + 1);

  const handleRowClick = (server) => {
    const panelDomain = publicSettings?.pterodactyl;
    const serverIdentifier = server.attributes?.identifier;

    if (!panelDomain || !serverIdentifier) {
      return;
    }

    window.open(`${panelDomain}/server/${serverIdentifier}`, '_blank', 'noopener,noreferrer');
  };

  const handlePanelIconClick = (event, server) => {
    event.stopPropagation();
    handleRowClick(server);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Servers</h1>
          <p className="text-sm text-neutral-500">Manage all servers across the panel</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Servers List</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Input
                placeholder="Search by ID, UUID, Name, Owner, Email, Node..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-80"
              />
              <Select value={perPage} onValueChange={(val) => { setPerPage(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="25">25 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-amber-300" />
              <p>
                The first load can take a little while. Please wait while we fetch the servers and their status.
              </p>
            </div>
          )}
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 cursor-pointer" onClick={() => handleSort('id')}>
                    <div className="flex items-center">
                      ID <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      Server Details <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('user')}>
                    <div className="flex items-center">
                      Owner <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('node')}>
                    <div className="flex items-center">
                      Node <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      Status <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  skeletonRows.map((rowNumber) => (
                    <TableRow key={`skeleton-${rowNumber}`}>
                      <TableCell><Skeleton className="h-6 w-8" /></TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-48 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : paginatedServers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                      No servers found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedServers.map(server => {
                    const status = getServerStatus(server);

                    return (
                      <TableRow
                        key={server.attributes.id}
                        className="cursor-pointer transition-colors hover:bg-white/5"
                        onClick={() => handleRowClick(server)}
                      >
                        <TableCell className="font-medium text-neutral-400">
                          #{server.attributes.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-col">
                              <span className="font-semibold text-white">{server.attributes.name}</span>
                              <span className="text-xs text-neutral-500 font-mono mt-1">
                                {server.attributes.uuid}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(event) => handlePanelIconClick(event, server)}
                              className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/10 text-neutral-400 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
                              aria-label={`Open ${server.attributes.name} in Pterodactyl`}
                              title="Open in Pterodactyl"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {server.attributes.relationships?.user?.attributes?.username || 'Unknown'}
                            </span>
                            {server.attributes.relationships?.user?.attributes?.root_admin && (
                              <HoverCard>
                                <HoverCardTrigger>
                                  <Badge variant="default" className="bg-red-500 scale-90">
                                    Admin
                                  </Badge>
                                </HoverCardTrigger>
                                <HoverCardContent>
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-red-500" />
                                    <span className="text-sm">Administrator account with full access</span>
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-neutral-300">
                            <Server className="w-4 h-4 text-neutral-500" />
                            {server.attributes.relationships?.node?.attributes?.name || 'Unknown Node'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            perPage={parseInt(perPage, 10)}
            total={filteredAndSortedServers.length}
            hasNextPage={currentPage < totalPages}
            hasPrevPage={currentPage > 1}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
