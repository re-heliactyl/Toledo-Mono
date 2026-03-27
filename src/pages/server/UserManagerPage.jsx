import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, RefreshCw } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";

const UsersPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');

  const syncSubuserServers = async () => {
    try {
      await axios.post('/api/subuser-servers-sync');
    } catch (err) {
      console.error('Failed to sync subuser servers:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/server/${id}/users`);
      setUsers(response.data.data);
      await syncSubuserServers();
    } catch (err) {
      setError('Failed to fetch users. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const response = await axios.post(`/api/server/${id}/users`, { email: newUserEmail });
      setUsers([...users, response.data]);
      setIsAddModalOpen(false);
      setNewUserEmail('');
      await syncSubuserServers();
      toast({
        title: "Success",
        description: "User has been added to the server.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add user. Please try again later.",
        variant: "destructive",
      });
      console.error(err);
    }
  };
  const handleDeleteUser = async (userUuid) => {
    try {
      await axios.delete(`/api/server/${id}/users/${userUuid}`);
      setUsers(users.filter(user => user.attributes.uuid !== userUuid));
      await syncSubuserServers();
      toast({
        title: "Success",
        description: "User has been removed from the server.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to remove user. Please try again later.",
        variant: "destructive",
      });
      console.error(err);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, [id]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card className="border-neutral-800/50">
        <CardHeader>
          <CardTitle className="text-base">Sub-users</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <RefreshCw className="w-6 h-6 text-neutral-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center min-h-[200px] text-red-400">
              {error}
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.attributes.username}>
                      <TableCell>{user.attributes.username}</TableCell>
                      <TableCell>{user.attributes.email}</TableCell>
                      <TableCell>
                        <ConfirmDialog
                          title="Delete User"
                          description="Are you sure you want to delete this user? This will remove their access to this server."
                          confirmText="Delete"
                          variant="destructive"
                          onConfirm={() => handleDeleteUser(user.attributes.uuid)}
                          trigger={
                            <Button
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Add a new user to the server by entering their SFTP account's email address. The format should be something like <code>discord_00000000000000@gmail.com</code>. They can find this information from the Account Settings page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Panel Email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAddUser}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;