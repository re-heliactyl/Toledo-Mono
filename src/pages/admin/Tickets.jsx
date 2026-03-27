import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Pagination } from '@/components/Pagination';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSettings } from '@/hooks/useSettings';
import {
  MessageSquare,
  RefreshCw,
  Save,
  X,
  RotateCcw,
  Download,
  ArrowUpIcon,
  ArrowDownIcon,
  Mail,
  User,
  Calendar,
  ExternalLink,
  Server,
  Shield,
  Coins,
  HardDrive,
  MemoryStick,
  Cpu,
  Clock
} from 'lucide-react';

const StatsCard = ({ title, value, className }) => (
  <Card>
    <CardContent className="p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className={`mt-2 text-3xl font-semibold ${className}`}>{value}</p>
    </CardContent>
  </Card>
);

const PriorityBadge = ({ priority }) => {
  const variants = {
    low: "bg-blue-500 text-white border-blue-400",
    medium: "bg-yellow-500 text-black border-yellow-400",
    high: "bg-orange-500 text-white border-orange-400",
    urgent: "bg-red-500 text-white border-red-400"
  };

  return (
    <Badge variant="outline" className={variants[priority]}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

const StatusBadge = ({ status }) => (
  <Badge 
    variant={status === 'open' ? 'success' : 'secondary'}
    className={status === 'open' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-gray-500 text-white border-gray-400'}
  >
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </Badge>
);

function TicketWorkspace({ ticket, onClose, onStatusChange, onPriorityUpdate, replyMutation, replyContent, setReplyContent }) {
  const { settings: publicSettings } = useSettings();
  const { toast } = useToast();
  const messagesEndRef = useRef(null);
  const [localPriority, setLocalPriority] = useState(ticket?.priority || 'medium');

  useEffect(() => {
    if (ticket) {
      setLocalPriority(ticket.priority);
    }
  }, [ticket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleSubmitReply = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    replyMutation.mutate(replyContent);
  };

  const handlePriorityChange = (newPriority) => {
    setLocalPriority(newPriority);
    onPriorityUpdate(ticket.id, newPriority);
  };

  if (!ticket) return null;

  const customer = ticket.customer || ticket.user || {};
  const ownedServers = ticket.ownedServers || [];
  const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ');

  const resourceRows = [
    { label: 'RAM', icon: MemoryStick, packageValue: customer.packageRAM, extraValue: customer.extraRAM, totalValue: customer.totalRAM, unit: 'MB' },
    { label: 'Disk', icon: HardDrive, packageValue: customer.packageDisk, extraValue: customer.extraDisk, totalValue: customer.totalDisk, unit: 'MB' },
    { label: 'CPU', icon: Cpu, packageValue: customer.packageCpu, extraValue: customer.extraCpu, totalValue: customer.totalCpu, unit: '%' },
    { label: 'Servers', icon: Server, packageValue: customer.packageServers, extraValue: customer.extraServers, totalValue: customer.totalServers, unit: '' }
  ];

  const formatResourceValue = (value, unit) => `${value || 0}${unit}`;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Left Column: Customer Info */}
      <div className="w-full lg:w-72 flex-shrink-0">
        <Card className="h-full bg-[#1a1d21] border-[#2e3337]/50">
          <CardHeader className="pb-3 border-b border-[#2e3337]/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-base">Customer</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
                <X className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-16 w-16 mb-3">
                <AvatarFallback className="bg-[#2e3337] text-white text-lg">
                  {(customer.username || customer.name || 'U').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-white text-lg">
                {customer.username || customer.name || 'Unknown User'}
              </h3>
              {customerName && (
                <p className="text-sm text-gray-400 mt-1">{customerName}</p>
              )}
              <p className="text-sm text-gray-400">#{ticket.id?.slice(0, 8) || 'N/A'}</p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300 truncate">{customer.email || 'No email'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300">
                  Created {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              {customer.pterodactylId && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-300">Panel ID {customer.pterodactylId}</span>
                </div>
              )}
              {customer.rootAdmin !== undefined && (
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <Badge variant={customer.rootAdmin ? 'destructive' : 'secondary'} className="text-xs">
                    {customer.rootAdmin ? 'Admin' : 'User'}
                  </Badge>
                </div>
              )}
              {customer.coins !== undefined && (
                <div className="flex items-center gap-3 text-sm">
                  <Coins className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-300">{customer.coins?.toLocaleString() || 0} coins</span>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-3 border-t border-[#2e3337]/50">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Package</label>
                <p className="mt-2 text-sm text-white">{customer.packageName || 'No package'}</p>
              </div>

              <div className="space-y-2">
                {resourceRows.map(({ label, icon: Icon, packageValue, extraValue, totalValue, unit }) => (
                  <div key={label} className="rounded-lg border border-[#2e3337]/50 bg-[#202229] p-3">
                    <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
                      <div className="flex items-center gap-2 text-white">
                        <Icon className="h-3.5 w-3.5 text-gray-500" />
                        <span>{label}</span>
                      </div>
                      <span>Total {formatResourceValue(totalValue, unit)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Base {formatResourceValue(packageValue, unit)}</span>
                      <span>Extra {formatResourceValue(extraValue, unit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-[#2e3337]/50">
              <label className="text-xs font-medium text-gray-500 uppercase">Ticket Details</label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-[#202229] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Category</p>
                  <p className="mt-1 text-white">{ticket.category}</p>
                </div>
                <div className="rounded-lg bg-[#202229] p-3">
                  <p className="text-[11px] uppercase tracking-wide text-gray-500">Messages</p>
                  <p className="mt-1 text-white">{ticket.messages?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-[#2e3337]/50">
              <label className="text-xs font-medium text-gray-500 uppercase">Priority</label>
              <Select value={localPriority} onValueChange={handlePriorityChange}>
                <SelectTrigger className="bg-[#202229] border-[#2e3337]/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d21] border-[#2e3337]/50">
                  <SelectItem value="low" className="text-white hover:bg-[#2e3337]/50">Low</SelectItem>
                  <SelectItem value="medium" className="text-white hover:bg-[#2e3337]/50">Medium</SelectItem>
                  <SelectItem value="high" className="text-white hover:bg-[#2e3337]/50">High</SelectItem>
                  <SelectItem value="urgent" className="text-white hover:bg-[#2e3337]/50">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 pt-3 border-t border-[#2e3337]/50">
              <label className="text-xs font-medium text-gray-500 uppercase">Status</label>
              <div className="flex gap-2">
                <StatusBadge status={ticket.status} />
                {ticket.status === 'open' ? (
                  <ConfirmDialog
                    title="Close Ticket"
                    description="Are you sure you want to close this ticket?"
                    onConfirm={() => onStatusChange(ticket.id, 'closed')}
                    variant="destructive"
                    trigger={
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                      >
                        <X className="h-3 w-3 mr-1" /> Close
                      </Button>
                    }
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(ticket.id, 'open')}
                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" /> Reopen
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Column: Conversation */}
      <div className="flex-1 min-w-0">
        <Card className="h-full bg-[#1a1d21] border-[#2e3337]/50 flex flex-col">
          <CardHeader className="pb-3 border-b border-[#2e3337]/50 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-white text-base">{ticket.subject}</CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Last updated: {new Date(ticket.updated).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>
          </CardHeader>

          {ticket.description && (
            <div className="border-b border-[#2e3337]/50 px-4 py-3">
              <div className="rounded-lg border border-[#2e3337]/50 bg-[#202229] p-4">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">Initial Request</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-200">{ticket.description}</p>
              </div>
            </div>
          )}
           
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {ticket.messages?.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-4 ${
                    msg.isStaff 
                      ? 'bg-blue-600/20 border border-blue-500/30 ml-8' 
                      : msg.isSystem
                      ? 'bg-gray-600/20 border border-gray-500/30'
                      : 'bg-[#25282e] border border-[#3e4347] mr-8'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge 
                      variant="outline"
                      className={msg.isStaff 
                        ? 'bg-blue-500 text-white border-blue-400 font-medium' 
                        : msg.isSystem
                        ? 'bg-gray-500 text-white border-gray-400 font-medium'
                        : 'bg-[#4e5457] text-white border-[#5e6467] font-medium'
                      }
                    >
                      {msg.isStaff ? 'Staff' : msg.isSystem ? 'System' : 'User'}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {ticket.status === 'open' && (
            <div className="p-4 border-t border-[#2e3337]/50 flex-shrink-0">
              <form onSubmit={handleSubmitReply} className="space-y-3">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your reply..."
                  className="min-h-[80px] bg-[#202229] border-[#2e3337]/50 text-white placeholder:text-gray-500 resize-none"
                />
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={replyMutation.isPending || !replyContent.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    {replyMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Send Reply
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card>
      </div>

      {/* Right Column: Owned Servers */}
      <div className="w-full lg:w-72 flex-shrink-0">
        <Card className="h-full bg-[#1a1d21] border-[#2e3337]/50">
          <CardHeader className="pb-3 border-b border-[#2e3337]/50">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Server className="h-4 w-4" />
              Owned Servers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {ownedServers && ownedServers.length > 0 ? (
              <div className="space-y-3">
                {ownedServers.map((server) => (
                  <div
                    key={server.id || server.attributes?.id}
                    className="p-3 rounded-lg bg-[#202229] border border-[#2e3337]/50 hover:border-[#3e4347] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">
                          {server.name || server.attributes?.name || 'Unnamed Server'}
                        </h4>
                        <p className="text-xs text-gray-500 font-mono">
                          #{server.id || server.attributes?.id}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const panelDomain = publicSettings?.pterodactyl;
                          const serverIdentifier = server.identifier || server.attributes?.identifier;
                          if (panelDomain && serverIdentifier) {
                            window.open(`${panelDomain}/server/${serverIdentifier}`, '_blank', 'noopener,noreferrer');
                            return;
                          }

                          toast({
                            title: 'Panel link unavailable',
                            description: 'The panel URL or server identifier is missing.',
                            variant: 'destructive',
                          });
                        }}
                        className="h-7 w-7 p-0 flex-shrink-0"
                        title="Open in Panel"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Badge 
                        variant={server.suspended ? 'destructive' : 'secondary'}
                        className="text-[10px]"
                      >
                        {server.suspended ? 'Suspended' : server.status || 'Unknown'}
                      </Badge>
                      <span className="truncate">
                        {server.node || server.attributes?.relationships?.node?.attributes?.name || 'Unknown Node'}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-gray-500">
                      <div className="rounded bg-[#17191d] px-2 py-1.5">
                        <span className="block text-[10px] uppercase tracking-wide">RAM</span>
                        <span className="text-gray-300">{server.limits?.memory || 0}MB</span>
                      </div>
                      <div className="rounded bg-[#17191d] px-2 py-1.5">
                        <span className="block text-[10px] uppercase tracking-wide">Disk</span>
                        <span className="text-gray-300">{server.limits?.disk || 0}MB</span>
                      </div>
                      <div className="rounded bg-[#17191d] px-2 py-1.5">
                        <span className="block text-[10px] uppercase tracking-wide">CPU</span>
                        <span className="text-gray-300">{server.limits?.cpu || 0}%</span>
                      </div>
                    </div>
                    {server.uuid && (
                      <p className="mt-2 truncate font-mono text-[10px] text-gray-500">{server.uuid}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Server className="h-8 w-8 mx-auto text-gray-600 mb-2" />
                <p className="text-sm text-gray-500">No servers owned</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminSupportDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    priority: 'all',
    category: 'all',
    status: 'all',
    sortBy: 'updated',
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const perPage = 10;

  const { data: stats } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: async () => {
      const response = await fetch('/api/tickets/stats');
      return response.json();
    }
  });

  const { data: ticketsData, refetch: refetchTickets } = useQuery({
    queryKey: ['tickets', currentPage, perPage, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString()
      });
      
      if (filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('query', filters.search);
      
      const response = await fetch(`/api/tickets/all?${params}`);
      return response.json();
    }
  });

  const tickets = ticketsData?.data || [];
  const pagination = ticketsData?.pagination || { page: 1, totalPages: 1, total: 0, hasNextPage: false, hasPrevPage: false };

  const sortedTickets = Array.isArray(tickets) ? [...tickets].sort((a, b) => {
    let comparison = 0;
    
    switch (filters.sortBy) {
      case 'updated':
        comparison = new Date(b.updated) - new Date(a.updated);
        break;
      case 'created':
        comparison = new Date(b.created) - new Date(a.created);
        break;
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
        break;
      case 'subject':
        comparison = a.subject.localeCompare(b.subject);
        break;
      default:
        comparison = new Date(b.updated) - new Date(a.updated);
    }
    
    return filters.sortOrder === 'asc' ? -comparison : comparison;
  }) : [];

  const filteredTickets = sortedTickets;

  const { data: selectedTicket, isLoading: loadingSelectedTicket } = useQuery({
    queryKey: ['ticket', selectedTicketId],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${selectedTicketId}`);
      if (!response.ok) throw new Error('Failed to fetch ticket');
      return response.json();
    },
    enabled: !!selectedTicketId
  });

  const statusMutation = useMutation({
    mutationFn: async ({ ticketId, status }) => {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
      toast({
        title: "Success",
        description: `Ticket ${status === 'closed' ? 'closed' : 'reopened'} successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    }
  });

  const priorityMutation = useMutation({
    mutationFn: async ({ ticketId, priority }) => {
      const response = await fetch(`/api/tickets/${ticketId}/priority`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority })
      });
      if (!response.ok) throw new Error('Failed to update priority');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket'] });
      toast({
        title: "Success",
        description: "Priority updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update priority",
        variant: "destructive",
      });
    }
  });

  const replyMutation = useMutation({
    mutationFn: async (content) => {
      const response = await fetch(`/api/tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error('Failed to send reply');
      return response.json();
    },
    onSuccess: () => {
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['ticket', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive",
      });
    }
  });

  const handleStatusChange = (ticketId, status) => {
    statusMutation.mutate({ ticketId, status });
  };

  const handlePriorityUpdate = (ticketId, priority) => {
    priorityMutation.mutate({ ticketId, priority });
  };

  const handleCloseWorkspace = () => {
    setSelectedTicketId(null);
    setReplyContent('');
  };

  const exportTickets = async () => {
    try {
      const response = await fetch('/api/tickets/export');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting tickets:', error);
    }
  };

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-white">Support Tickets</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={filters.priority}
            onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.category}
            onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="abuse">Abuse</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Search tickets..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full md:w-[200px]"
          />

          <Button onClick={exportTickets}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-400">Sort by:</span>
        
        <Select
          value={filters.sortBy}
          onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Last Updated</SelectItem>
            <SelectItem value="created">Date Created</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="subject">Subject</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setFilters(prev => ({ 
            ...prev, 
            sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
          }))}
          className="flex items-center gap-2"
        >
          {filters.sortOrder === 'asc' ? (
            <><ArrowUpIcon className="w-4 h-4" /> Ascending</>
          ) : (
            <><ArrowDownIcon className="w-4 h-4" /> Descending</>
          )}
        </Button>
      </div>

      {/* Workspace View (when ticket selected) */}
      {selectedTicketId && (
        <div className="mb-6">
          {loadingSelectedTicket ? (
            <Card className="bg-[#1a1d21] border-[#2e3337]/50">
              <CardContent className="p-12 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              </CardContent>
            </Card>
          ) : (
            <TicketWorkspace
              ticket={selectedTicket}
              onClose={handleCloseWorkspace}
              onStatusChange={handleStatusChange}
              onPriorityUpdate={handlePriorityUpdate}
              replyMutation={replyMutation}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
            />
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-4">
        <StatsCard
          title="Total Tickets"
          value={stats?.total || '-'}
        />
        <StatsCard
          title="Open Tickets"
          value={stats?.open || '-'}
          className="text-emerald-400"
        />
        <StatsCard
          title="Avg. Response Time"
          value={stats?.averageResponseTime ? `${Math.round(stats.averageResponseTime / 60000)}m` : '-'}
          className="text-amber-400"
        />
        <StatsCard
          title="Last 7 Days"
          value={stats?.ticketsLastWeek || '-'}
          className="text-blue-400"
        />
      </div>

      {/* Ticket List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2e3337]">
                <th className="text-left p-4 text-gray-300">Ticket</th>
                <th className="text-left p-4 text-gray-300">User</th>
                <th className="text-left p-4 text-gray-300">Category</th>
                <th className="text-left p-4 text-gray-300">Priority</th>
                <th className="text-left p-4 text-gray-300">Status</th>
                <th className="text-center p-4 text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map(ticket => (
                <tr 
                  key={ticket.id} 
                  className={`border-b border-[#2e3337] cursor-pointer transition-colors ${
                    selectedTicketId === ticket.id 
                      ? 'bg-blue-500/10' 
                      : 'hover:bg-[#202229]/50'
                  }`}
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-white">{ticket.subject}</div>
                      <div className="text-sm text-gray-400">#{ticket.id.slice(0, 8)}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-200">{ticket.user.username}</div>
                    <div className="text-xs text-gray-400">{ticket.user.email}</div>
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className="bg-[#202229] text-[#95a1ad] border-[#2e3337]/50">
                      {ticket.category}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="p-4">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTicketId(ticket.id)}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      {ticket.status === 'open' ? (
                        <ConfirmDialog
                          title="Close Ticket"
                          description="Are you sure you want to close this ticket?"
                          onConfirm={() => handleStatusChange(ticket.id, 'closed')}
                          variant="destructive"
                          trigger={
                            <Button variant="ghost" size="sm">
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          }
                        />
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(ticket.id, 'open')}
                        >
                          <RotateCcw className="w-4 h-4 text-emerald-500" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          perPage={perPage}
          total={pagination.total}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          onPageChange={setCurrentPage}
        />
      </Card>
    </div>
  );
}
