import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/Pagination';
import {
  MessageSquare,
  Plus,
  RefreshCw,
  Eye,
  Send,
  X,
  AlertCircle,
  Bell
} from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const PriorityBadge = ({ priority }) => {
  const variants = {
    low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    urgent: "bg-red-500/10 text-red-400 border-red-500/20"
  };

  return (
    <Badge variant="outline" className={variants[priority]}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  );
};

const StatusBadge = ({ status }) => (
  <Badge 
    variant={status === 'open' ? 'default' : 'secondary'}
    className={status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-500/20 text-gray-300 border-gray-500/30'}
  >
    {status === 'open' ? 'Open' : 'Closed'}
  </Badge>
);

const CreateTicketDialog = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical',
    priority: 'medium',
    description: ''
  });
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post('/api/tickets', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-tickets']);
      queryClient.invalidateQueries(['ticket-counts']);
      setFormData({ subject: '', category: 'technical', priority: 'medium', description: '' });
      setError('');
      onClose();
      toast({
        title: "Success",
        description: "Your support ticket has been created.",
      });
    },
    onError: (err) => {
      const details = err.response?.data?.details;
      let message = err.response?.data?.error || 'Failed to create ticket';
      if (details && Array.isArray(details)) {
        message = `${message}: ${details.map(d => d.message || d).join(', ')}`;
      }
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.subject.trim().length < 3) {
      setError('Subject must be at least 3 characters');
      return;
    }
    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-[#1a1d21] border-[#2e3337]/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Support Ticket</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#95a1ad]">Subject</label>
            <Input
              value={formData.subject}
              onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief description of your issue"
              className="bg-[#202229] border-[#2e3337]/50 text-white placeholder:text-[#95a1ad]/50"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#95a1ad]">Category</label>
              <Select 
                value={formData.category}
                onValueChange={value => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="bg-[#202229] border-[#2e3337]/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d21] border-[#2e3337]/50">
                  <SelectItem value="technical" className="text-white hover:bg-[#2e3337]/50 focus:bg-[#2e3337]/50 focus:text-white">Technical Support</SelectItem>
                  <SelectItem value="billing" className="text-white hover:bg-[#2e3337]/50 focus:bg-[#2e3337]/50 focus:text-white">Billing</SelectItem>
                  <SelectItem value="general" className="text-white hover:bg-[#2e3337]/50 focus:bg-[#2e3337]/50 focus:text-white">General Inquiry</SelectItem>
                  <SelectItem value="abuse" className="text-white hover:bg-[#2e3337]/50 focus:bg-[#2e3337]/50 focus:text-white">Abuse Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#95a1ad]">Priority</label>
              <Select 
                value={formData.priority}
                onValueChange={value => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger className="bg-[#202229] border-[#2e3337]/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d21] border-[#2e3337]/50">
                  <SelectItem value="low" className="text-white hover:bg-[#2e3337]/50 focus:bg-[#2e3337]/50 focus:text-white">Low</SelectItem>
                  <SelectItem value="medium" className="text-white hover:bg-[#2e3337]/50 focus:bg-[#2e3337]/50 focus:text-white">Medium</SelectItem>
                  <SelectItem value="high" className="text-white hover:bg-[#2e3337]/50 focus:bg-[#2e3337]/50 focus:text-white">High</SelectItem>
                  <SelectItem value="urgent" className="text-white hover:bg-[#2e3337]/50 focus:bg-[#2e3337]/50 focus:text-white">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#95a1ad]">Description</label>
            <Textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your issue in detail..."
              rows={5}
              className="bg-[#202229] border-[#2e3337]/50 text-white placeholder:text-[#95a1ad]/50 resize-none"
              required
            />
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-[#2e3337]/50 text-[#95a1ad] hover:bg-[#2e3337] hover:text-white hover:border-[#3e4347] transition-colors"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {createMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Create Ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ViewTicketDialog = ({ isOpen, onClose, ticketId }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [replyContent, setReplyContent] = useState('');
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: ticket, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      const response = await axios.get(`/api/tickets/${ticketId}`);
      return response.data;
    },
    enabled: !!ticketId,
    refetchInterval: 5000, // Auto-refresh every 5 seconds when viewing a ticket
    refetchIntervalInBackground: true
  });

  // Detect new messages from staff
  useEffect(() => {
    if (ticket?.messages) {
      const currentCount = ticket.messages.length;
      const lastMessage = ticket.messages[currentCount - 1];
      
      if (currentCount > lastMessageCount && lastMessageCount > 0) {
        // New message arrived
        if (lastMessage?.isStaff && !lastMessage?.isSystem) {
          setHasNewMessages(true);
          // Auto-scroll to bottom
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          // Reset notification after 3 seconds
          setTimeout(() => setHasNewMessages(false), 3000);
        }
      }
      
      setLastMessageCount(currentCount);
    }
  }, [ticket?.messages, lastMessageCount]);

  const replyMutation = useMutation({
    mutationFn: async (content) => {
      const response = await axios.post(`/api/tickets/${ticketId}/messages`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', ticketId]);
      queryClient.invalidateQueries(['user-tickets']);
      setReplyContent('');
      toast({
        title: "Success",
        description: "Your reply has been sent.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to send reply.",
        variant: "destructive",
      });
    }
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.patch(`/api/tickets/${ticketId}/status`, { status: 'closed' });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ticket', ticketId]);
      queryClient.invalidateQueries(['user-tickets']);
      queryClient.invalidateQueries(['ticket-counts']);
      toast({
        title: "Success",
        description: "Ticket has been closed.",
      });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to close ticket.",
        variant: "destructive",
      });
    }
  });

  const handleSubmitReply = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    replyMutation.mutate(replyContent);
  };

  if (isLoading || !ticket) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl bg-[#1a1d21] border-[#2e3337]/50">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-[#95a1ad]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-[#1a1d21] border-[#2e3337]/50 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-xl font-semibold">{ticket.subject}</DialogTitle>
              <p className="text-sm text-[#95a1ad] mt-1">Ticket #{ticket.id.slice(0, 8)}</p>
            </div>
            <div className="flex gap-2">
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {/* New message notification */}
          {hasNewMessages && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 flex items-center gap-2 animate-pulse">
              <Bell className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">New reply from support team!</span>
            </div>
          )}

          <div className="bg-[#202229] rounded-lg p-3 text-sm text-[#95a1ad]">
            <span className="text-white font-medium">Category:</span> {ticket.category}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {ticket.messages?.map((msg, idx) => (
              <div
                key={idx}
                className={`rounded-lg p-4 ${
                  msg.isSystem
                    ? 'bg-gray-500/10 border border-gray-500/20'
                    : msg.userId === ticket.userId
                    ? 'bg-[#202229] border border-[#2e3337]/50 mr-4'
                    : msg.isStaff 
                    ? 'bg-blue-500/10 border border-blue-500/20 ml-4' 
                    : 'bg-[#202229] border border-[#2e3337]/50 mr-4'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <Badge 
                    variant="outline" 
                    className={msg.isSystem
                      ? 'bg-gray-500/20 text-gray-300 border-gray-500/30 font-medium'
                      : msg.userId === ticket.userId
                      ? 'bg-[#3e4347] text-white border-[#4e5457] font-medium'
                      : msg.isStaff
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 font-medium' 
                      : 'bg-[#3e4347] text-white border-[#4e5457] font-medium'
                    }
                  >
                    {msg.isSystem ? 'System' : msg.userId === ticket.userId ? 'You' : msg.isStaff ? 'Support Team' : 'User'}
                  </Badge>
                  <span className="text-xs text-[#95a1ad]">
                    {new Date(msg.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {ticket.status === 'open' && (
          <form onSubmit={handleSubmitReply} className="space-y-4 border-t border-[#2e3337]/50 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#95a1ad]">Add Reply</label>
              <Textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="bg-[#202229] border-[#2e3337]/50 text-white placeholder:text-[#95a1ad]/50 resize-none"
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <ConfirmDialog
                title="Close Ticket"
                description="Are you sure you want to close this ticket? You will not be able to send further replies."
                confirmText="Close Ticket"
                variant="destructive"
                onConfirm={() => closeMutation.mutate()}
                trigger={
                  <Button
                    variant="outline"
                    type="button"
                    disabled={closeMutation.isPending}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/50 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Close Ticket
                  </Button>
                }
              />
              <Button 
                type="submit" 
                disabled={replyMutation.isPending || !replyContent.trim()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {replyMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Reply
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default function Support() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('updated');
  const perPage = 10;

  const { data: counts } = useQuery({
    queryKey: ['ticket-counts'],
    queryFn: async () => {
      const response = await axios.get('/api/tickets/count');
      return response.data;
    },
    refetchInterval: 10000 // Refresh counts every 10 seconds
  });

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['user-tickets', currentPage],
    queryFn: async () => {
      const response = await axios.get(`/api/tickets?page=${currentPage}&per_page=${perPage}`);
      return response.data;
    },
    refetchInterval: 10000 // Refresh ticket list every 10 seconds
  });

  const tickets = ticketsData?.data || [];
  const pagination = ticketsData?.pagination || { page: 1, totalPages: 1, total: 0 };

  // Sort tickets
  const sortedTickets = [...tickets].sort((a, b) => {
    switch (sortBy) {
      case 'updated':
        return new Date(b.updated) - new Date(a.updated);
      case 'created':
        return new Date(b.created) - new Date(a.created);
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      default:
        return new Date(b.updated) - new Date(a.updated);
    }
  });

  const activeTickets = sortedTickets.filter(t => t.status === 'open');
  const closedTickets = sortedTickets.filter(t => t.status === 'closed');

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Support Center</h1>
          <p className="text-[#95a1ad] mt-1">Get help from our support team</p>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px] bg-[#1a1d21] border-[#2e3337]/50 text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1d21] border-[#2e3337]/50">
              <SelectItem value="updated" className="text-white hover:bg-[#2e3337]/50 focus:bg-[#2e3337]/50 focus:text-white">Last Updated</SelectItem>
              <SelectItem value="created" className="text-white hover:bg-[#2e3337]/50 focus:bg-[#2e3337]/50 focus:text-white">Date Created</SelectItem>
              <SelectItem value="priority" className="text-white hover:bg-[#2e3337]/50 focus:bg-[#2e3337]/50 focus:text-white">Priority</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#1a1d21] border-[#2e3337]/50">
          <CardContent className="pt-6">
            <div className="text-sm text-[#95a1ad]">Total Tickets</div>
            <div className="text-3xl font-light text-white mt-2">
              {counts?.total || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1d21] border-[#2e3337]/50">
          <CardContent className="pt-6">
            <div className="text-sm text-[#95a1ad]">Open Tickets</div>
            <div className="text-3xl font-light text-emerald-400 mt-2">
              {counts?.open || activeTickets.length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a1d21] border-[#2e3337]/50">
          <CardContent className="pt-6">
            <div className="text-sm text-[#95a1ad]">Closed Tickets</div>
            <div className="text-3xl font-light text-gray-400 mt-2">
              {counts?.closed || closedTickets.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Tickets */}
      <Card className="bg-[#1a1d21] border-[#2e3337]/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Your Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-[#95a1ad]" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-[#95a1ad]" />
              <h3 className="mt-4 text-sm font-medium text-white">No tickets yet</h3>
              <p className="mt-2 text-sm text-[#95a1ad]">Create a new ticket to get support.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2e3337]/50">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#95a1ad]">Subject</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#95a1ad]">Category</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#95a1ad]">Priority</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[#95a1ad]">Last Update</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-[#95a1ad]">Status</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-[#95a1ad]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(ticket => (
                      <tr key={ticket.id} className="border-b border-[#2e3337]/30 hover:bg-[#202229]/50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-white">{ticket.subject}</div>
                          <div className="text-xs text-[#95a1ad]">#{ticket.id.slice(0, 8)}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-[#202229] text-[#95a1ad] border-[#2e3337]/50">
                            {ticket.category}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <PriorityBadge priority={ticket.priority} />
                        </td>
                        <td className="py-3 px-4 text-sm text-[#95a1ad]">
                          {new Date(ticket.updated).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={ticket.status} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className="text-[#95a1ad] hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
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
            </>
          )}
        </CardContent>
      </Card>

      <CreateTicketDialog 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <ViewTicketDialog
        isOpen={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        ticketId={selectedTicketId}
      />
    </div>
  );
}
