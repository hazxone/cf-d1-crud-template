import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  email_verified: boolean;
  is_active: boolean;
  role: string;
  created_at: string;
  last_login_at: string | null;
}

export function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/users");
        const data = await response.json() as { success: boolean; data: User[]; error?: string };

        if (data.success) {
          setUsers(data.data);
        } else {
          setError(data.error || "Failed to fetch users");
        }
      } catch (err) {
        setError("Network error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      const data = await response.json() as { success: boolean; message?: string; error?: string };

      if (data.success) {
        // Remove the user from the local state
        setUsers(users.filter(user => user.id !== userId));
        setUserToDelete(null);
      } else {
        setError(data.error || "Failed to delete user");
      }
    } catch (err) {
      setError("Network error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">No users found</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
        <Badge variant="secondary">{users.length} users</Badge>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email Verified</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} alt={user.username} />
                      <AvatarFallback>
                        {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{user.username}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{user.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? "default" : "destructive"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.email_verified ? "default" : "outline"}>
                    {user.email_verified ? "Verified" : "Not Verified"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => setUserToDelete(user)}
                      >
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the user{" "}
                          <span className="font-semibold">{user.first_name} {user.last_name}</span>
                          {" "}and all their associated todos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete User
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}