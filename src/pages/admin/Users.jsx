import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Users,
  UserPlus,
  Settings,
  MoreVertical,
  Trash,
  Edit,
  AlertCircle,
  Terminal,
  HardDrive,
  Cpu,
  MemoryStick,
  Server,
  RefreshCw,
  Save,
  Ban,
  UserCog,
  Shield,
  Info,
  X
} from 'lucide-react';
import axios from 'axios';
import { useToast } from "@/hooks/use-toast";
import { Pagination } from '@/components/Pagination';
import { showApiErrorToast } from '@/lib/api';


// Resource Info Component
function ResourceInfo({ label, icon: Icon, used, total, unit }) {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  const color = percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-1 w-48">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-neutral-400">
          <Icon className="w-4 h-4" />
          {label}
        </div>
        <span>
          {(total || 0).toLocaleString()}{unit}
        </span>
      </div>
    </div>
  );
}

// User Form Component
function UserForm({ user, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    coins: 0,
    ram: 0,
    disk: 0,
    cpu: 0,
    servers: 0,
    admin: false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.attributes.email || '',
        username: user.attributes.username || '',
        first_name: user.attributes.first_name || '',
        last_name: user.attributes.last_name || '',
        password: '',
        coins: user.coins || 0,
        ram: user.resources?.ram || 0,
        disk: user.resources?.disk || 0,
        cpu: user.resources?.cpu || 0,
        servers: user.resources?.servers || 0,
        admin: user.attributes.root_admin || false
      });
    }
  }, [user]);

  return (
    <div className="grid gap-6 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="user-form-email" className="text-sm font-medium">Email</label>
          <Input
            id="user-form-email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="user-form-username" className="text-sm font-medium">Username</label>
          <Input
            id="user-form-username"
            value={formData.username}
            onChange={e => setFormData({ ...formData, username: e.target.value })}
            placeholder="username"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="user-form-first-name" className="text-sm font-medium">First Name</label>
          <Input
            id="user-form-first-name"
            value={formData.first_name}
            onChange={e => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="John"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="user-form-last-name" className="text-sm font-medium">Last Name</label>
          <Input
            id="user-form-last-name"
            value={formData.last_name}
            onChange={e => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="user-form-password" className="text-sm font-medium">
          {user ? 'New Password (leave empty to keep unchanged)' : 'Password'}
        </label>
        <Input
          id="user-form-password"
          type="password"
          value={formData.password}
          onChange={e => setFormData({ ...formData, password: e.target.value })}
          placeholder="••••••••"
        />
      </div>

<Tabs defaultValue="resources">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0">
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="user-form-coins" className="text-sm font-medium">Coins</label>
              <Input
                id="user-form-coins"
                type="number"
                value={formData.coins}
                onChange={e => setFormData({ ...formData, coins: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="user-form-servers" className="text-sm font-medium">Server Limit</label>
              <Input
                id="user-form-servers"
                type="number"
                value={formData.servers}
                onChange={e => setFormData({ ...formData, servers: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="user-form-ram" className="text-sm font-medium">RAM (MB)</label>
              <Input
                id="user-form-ram"
                type="number"
                value={formData.ram}
                onChange={e => setFormData({ ...formData, ram: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="user-form-disk" className="text-sm font-medium">Disk (MB)</label>
              <Input
                id="user-form-disk"
                type="number"
                value={formData.disk}
                onChange={e => setFormData({ ...formData, disk: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="user-form-cpu" className="text-sm font-medium">CPU (%)</label>
              <Input
                id="user-form-cpu"
                type="number"
                value={formData.cpu}
                onChange={e => setFormData({ ...formData, cpu: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="permissions">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="admin"
                checked={formData.admin}
                onChange={e => setFormData({ ...formData, admin: e.target.checked })}
                className="rounded border-neutral-300"
              />
              <label htmlFor="admin" className="text-sm font-medium">
                Administrator Access
              </label>
            </div>
            {formData.admin && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This user will have full administrative access to the panel.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => onSubmit(null)}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(formData)} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving Changes...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Main Component
export default function UsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [perPage, setPerPage] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banReason, setBanReason] = useState('');

  // Fetch basic user list only (no coins/resources - those are fetched per-page)
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data: usersData } = await axios.get('/api/users');
      return usersData.data;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter(user =>
      user.attributes.username.toLowerCase().includes(search.toLowerCase()) ||
      user.attributes.email.toLowerCase().includes(search.toLowerCase()) ||
      user.attributes.first_name.toLowerCase().includes(search.toLowerCase()) ||
      user.attributes.last_name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => {
      // Sort by admin status first, then by username
      if (a.attributes.root_admin !== b.attributes.root_admin) {
        return b.attributes.root_admin ? 1 : -1;
      }
      return a.attributes.username.localeCompare(b.attributes.username);
    });
  }, [users, search]);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * parseInt(perPage),
    currentPage * parseInt(perPage)
  );

  const totalPages = Math.ceil(filteredUsers.length / parseInt(perPage));

  const currentPageUserIds = useMemo(() =>
    paginatedUsers.map(u => u.attributes.id),
    [paginatedUsers]
  );

  const { data: userDetails, isLoading: loadingDetails } = useQuery({
    queryKey: ['userDetails', currentPageUserIds],
    queryFn: async () => {
      if (currentPageUserIds.length === 0) return {};

      const idsParam = currentPageUserIds.join(',');
      const [coinsRes, resourcesRes, banRes] = await Promise.all([
        axios.get(`/api/users/bulk/coins?ids=${idsParam}`),
        axios.get(`/api/users/bulk/resources?ids=${idsParam}`),
        axios.get(`/api/users/bulk/ban-status?ids=${idsParam}`)
      ]);

      const details = {};
      currentPageUserIds.forEach(userId => {
        details[userId] = {
          coins: coinsRes.data[userId] || 0,
          resources: resourcesRes.data[userId] || { ram: 0, disk: 0, cpu: 0, servers: 0 },
          ban: banRes.data[userId] || { isBanned: false, reason: null, bannedAt: null, bannedByUsername: null }
        };
      });
      return details;
    },
    enabled: currentPageUserIds.length > 0,
    staleTime: 30000
  });

  const usersWithDetails = useMemo(() => {
    return paginatedUsers.map(user => ({
      ...user,
      coins: userDetails?.[user.attributes.id]?.coins ?? null,
      resources: userDetails?.[user.attributes.id]?.resources ?? null,
      ban: userDetails?.[user.attributes.id]?.ban ?? { isBanned: false, reason: null, bannedAt: null, bannedByUsername: null }
    }));
  }, [paginatedUsers, userDetails]);

  const invalidateUserQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['userDetails'] });
  };

  const handleEditClick = async (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);

    if (user.coins == null || user.resources == null) {
      try {
        const [coinsRes, resourcesRes] = await Promise.all([
          axios.get(`/api/users/${user.attributes.id}/coins`),
          axios.get(`/api/users/${user.attributes.id}/resources`)
        ]);
        setSelectedUser({
          ...user,
          coins: coinsRes.data.coins || 0,
          resources: resourcesRes.data || { ram: 0, disk: 0, cpu: 0, servers: 0 }
        });
      } catch (error) {
        console.error('Error fetching user details:', error);
        setSelectedUser({
          ...user,
          coins: 0,
          resources: { ram: 0, disk: 0, cpu: 0, servers: 0 }
        });
      }
    }
  };

  const handleCreateUser = async (formData) => {
    if (!formData) {
      setIsCreateModalOpen(false);
      return;
    }

    try {
      setIsSubmitting(true);

      const { data: userData } = await axios.post('/api/users', {
        email: formData.email,
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        password: formData.password,
        root_admin: formData.admin
      });

      // Wait for user creation to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update resources and coins
      await Promise.all([
        axios.patch(`/api/users/${userData.data.attributes.id}/resources`, {
          ram: formData.ram,
          disk: formData.disk,
          cpu: formData.cpu,
          servers: formData.servers
        }),
        axios.patch(`/api/users/${userData.data.attributes.id}/coins`, {
          coins: formData.coins
        })
      ]);

      setIsCreateModalOpen(false);
      invalidateUserQueries();

      // Show success message
      toast({
        title: "Success",
        description: "User created successfully",
      });

    } catch (err) {
      showApiErrorToast(toast, err, 'Failed to create user');

    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (formData) => {
    if (!formData) {
      setIsEditModalOpen(false);
      setSelectedUser(null);
      return;
    }

    try {
      setIsSubmitting(true);

      const updateData = {
        email: formData.email,
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        root_admin: formData.admin
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      // Update user info
      await axios.patch(`/api/users/${selectedUser.attributes.id}`, updateData);

      // Update resources and coins
      await Promise.all([
        axios.patch(`/api/users/${selectedUser.attributes.id}/resources`, {
          ram: formData.ram,
          disk: formData.disk,
          cpu: formData.cpu,
          servers: formData.servers
        }),
        axios.patch(`/api/users/${selectedUser.attributes.id}/coins`, {
          coins: formData.coins
        })
      ]);

      setIsEditModalOpen(false);
      setSelectedUser(null);
      invalidateUserQueries();

      // Show success message
      toast({
        title: "Success",
        description: "User updated successfully",
      });

    } catch (err) {
      showApiErrorToast(toast, err, 'Failed to update user');

    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await axios.delete(`/api/users/${selectedUser.attributes.id}`);
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      invalidateUserQueries();
      toast({
        title: "Success",
        description: "User deleted successfully",
      });

    } catch (err) {
      showApiErrorToast(toast, err, 'Failed to delete user');

    }
  };

  const handleBanClick = (user) => {
    setSelectedUser(user);
    setBanReason(user.ban?.reason || '');
    setIsBanDialogOpen(true);
  };

  const handleBanUser = async () => {
    if (!selectedUser) {
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(`/api/users/${selectedUser.attributes.id}/ban`, {
        reason: banReason,
      });

      setIsBanDialogOpen(false);
      setSelectedUser(null);
      setBanReason('');
      invalidateUserQueries();
      toast({
        title: 'Success',
        description: 'User banned successfully',
      });
    } catch (err) {
      showApiErrorToast(toast, err, 'Failed to ban user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnbanUser = async (user) => {
    try {
      setIsSubmitting(true);
      await axios.delete(`/api/users/${user.attributes.id}/ban`);
      invalidateUserQueries();
      toast({
        title: 'Success',
        description: 'User unbanned successfully',
      });
    } catch (err) {
      showApiErrorToast(toast, err, 'Failed to unban user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-neutral-500">Manage user accounts and permissions</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          New User
        </Button>
      </div>


      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <div className="flex gap-4">
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              <Select value={perPage} onValueChange={setPerPage}>
                <SelectTrigger className="w-36">
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
          <div className="min-w-[800px]">
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Purchased Resources</TableHead>
                  <TableHead>Coins</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={`user-skeleton-${i + 1}`}>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-64" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  usersWithDetails.map(user => (
                    <TableRow key={user.attributes.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.attributes.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {user.attributes.username}
                              {user.attributes.root_admin && (
                                <HoverCard>
                                  <HoverCardTrigger>
                                    <Badge variant="default" className="bg-red-500">
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
                            <div className="text-sm text-neutral-500">
                              {user.attributes.first_name} {user.attributes.last_name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{user.attributes.email}</div>
                      </TableCell>
                      <TableCell>
                        {user.resources == null ? (
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-4 w-36" />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <ResourceInfo
                              label="Memory"
                              icon={MemoryStick}
                              used={user.resources?.ram || 0}
                              total={user.resources?.ram || 0}
                              unit="MB"
                            />
                            <ResourceInfo
                              label="Storage"
                              icon={HardDrive}
                              used={user.resources?.disk || 0}
                              total={user.resources?.disk || 0}
                              unit="MB"
                            />
                            <ResourceInfo
                              label="CPU"
                              icon={Cpu}
                              used={user.resources?.cpu || 0}
                              total={user.resources?.cpu || 0}
                              unit="%"
                            />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm text-neutral-500">
                            {user.coins == null ? (
                              <Skeleton className="h-4 w-20" />
                            ) : (
                              `${(user.coins || 0).toFixed(2)} coins`
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Badge variant={user.ban?.isBanned ? "destructive" : user.attributes.root_admin ? "destructive" : "success"}>
                            {user.ban?.isBanned ? "Banned" : user.attributes.root_admin ? "Administrator" : "User"}
                          </Badge>
                          {user.ban?.isBanned && (
                            <div className="max-w-[220px] text-xs text-neutral-500">
                              By {user.ban?.bannedByUsername || 'Unknown staff'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>
                                User Actions
                              </DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              {user.ban?.isBanned ? (
                                <DropdownMenuItem onClick={() => handleUnbanUser(user)}>
                                  <Shield className="w-4 h-4 mr-2 text-emerald-500" />
                                  Unban User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleBanClick(user)}>
                                  <Ban className="w-4 h-4 mr-2 text-amber-500" />
                                  Ban User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user);
                                setIsDeleteDialogOpen(true);
                              }}>
                                <Trash className="w-4 h-4 mr-2 text-red-500" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table></div>
          </div>

          <Pagination
            page={currentPage}
            totalPages={totalPages}
            perPage={parseInt(perPage, 10)}
            total={filteredUsers.length}
            hasNextPage={currentPage < totalPages}
            hasPrevPage={currentPage > 1}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account with specified permissions and resources.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            onSubmit={handleCreateUser}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User - {selectedUser?.attributes?.username}</DialogTitle>
            <DialogDescription>
              Modify user account settings, permissions, and resources.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            user={selectedUser}
            onSubmit={handleEditUser}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User - {selectedUser?.attributes?.username}</DialogTitle>
            <DialogDescription>
              This blocks every protected request and redirects the user to the dedicated ban page.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="ban-reason" className="text-sm font-medium">Ban reason</label>
              <Textarea
                id="ban-reason"
                value={banReason}
                onChange={(event) => setBanReason(event.target.value)}
                placeholder="Explain why this account is banned"
                rows={6}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBanDialogOpen(false);
                  setSelectedUser(null);
                  setBanReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBanUser}
                disabled={isSubmitting || banReason.trim().length < 3}
              >
                <Ban className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Applying ban...' : 'Confirm Ban'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.attributes?.username}? This action cannot be undone,
              and all associated servers will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-500 hover:bg-red-600">
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
