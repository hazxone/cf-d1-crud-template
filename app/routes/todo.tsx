import type { Route } from "./+types/todo";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, MoreHorizontal, ArrowUpDown, Edit, ChevronDown, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
} from "@/components/ui/alert-dialog";

// Types
type TodoType = "personal" | "work" | "shopping" | "health" | "finance" | "learning" | "home" | "other";

interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
}

interface Todo {
  id: number;
  user_id: number;
  text: string;
  type: TodoType;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// Column definitions for the data table
export const todoColumns: ColumnDef<Todo>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.original.completed}
        onCheckedChange={(value) => {
          // Toggle completion status
          if (typeof row.original.id === 'number') {
            // This will be handled by the parent component
            const event = new CustomEvent('toggleTodo', { detail: row.original.id });
            window.dispatchEvent(event);
          }
        }}
        aria-label="Toggle task completion"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: "completed",
    header: "Status",
    cell: ({ row }) => null, // Hidden column, just for sorting
    enableHiding: true,
  },
  {
    accessorKey: "text",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Task
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const todo = row.original;
      return (
        <div className="font-medium max-w-md">
          <span className={`${todo.completed ? "line-through text-gray-500" : ""} break-words`}>
            {todo.text}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const todo = row.original;
      const getTypeColor = (type: TodoType) => {
        switch (type) {
          case "personal": return "bg-amber-200 text-amber-900 hover:bg-amber-300";
          case "work": return "bg-orange-200 text-orange-900 hover:bg-orange-300";
          case "shopping": return "bg-yellow-200 text-yellow-900 hover:bg-yellow-300";
          case "health": return "bg-green-200 text-green-900 hover:bg-green-300";
          case "finance": return "bg-blue-200 text-blue-900 hover:bg-blue-300";
          case "learning": return "bg-purple-200 text-purple-900 hover:bg-purple-300";
          case "home": return "bg-pink-200 text-pink-900 hover:bg-pink-300";
          case "other": return "bg-stone-200 text-stone-800 hover:bg-stone-300";
          default: return "bg-stone-200 text-stone-800 hover:bg-stone-300";
        }
      };
      return <Badge className={getTypeColor(todo.type)}>{todo.type}</Badge>;
    },
    size: 100,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date(dateString));
      };
      return formatDate(row.getValue("created_at"));
    },
    size: 150,
  },
  {
    id: "actions",
    enableHiding: false,
    size: 50,
    cell: ({ row }) => {
      const todo = row.original;

      return (
        <div className="flex items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  const event = new CustomEvent('editTodo', { detail: todo });
                  window.dispatchEvent(event);
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  const event = new CustomEvent('deleteTodo', { detail: todo });
                  window.dispatchEvent(event);
                }}
                className="text-red-600"
              >
                Delete task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
];

// Page metadata
export function meta({}: Route.MetaArgs) {
  return [
    { title: "Todo List - React Router Demo" },
    { name: "description", content: "A simple todo list application with local state management" },
  ];
}

// Main page component
export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [inputText, setInputText] = useState("");
  const [selectedType, setSelectedType] = useState<TodoType>("personal");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todoToDelete, setTodoToDelete] = useState<Todo | null>(null);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  // Data table state
  const [sorting, setSorting] = useState<SortingState>([{ id: "completed", desc: false }]); // Show pending first
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ completed: false }); // Hide completed column
  const [rowSelection, setRowSelection] = useState({});

  // Filter states
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");
  const [typeFilter, setTypeFilter] = useState<TodoType | "all">("all");

  // Filtered todos based on status and type filters
  const filteredTodos = todos.filter(todo => {
    const statusMatch = statusFilter === "all" ? true :
      statusFilter === "completed" ? todo.completed :
      !todo.completed;
    const typeMatch = typeFilter === "all" ? true : todo.type === typeFilter;
    return statusMatch && typeMatch;
  });

  // Load current user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
    } else {
      setError("No user logged in. Please log in first.");
    }
    setLoading(false);
  }, []);

  // Load todos when current user changes
  useEffect(() => {
    if (currentUser) {
      fetchTodos();
    }
  }, [currentUser]);

  // Create the table instance
  const table = useReactTable({
    data: filteredTodos,
    columns: todoColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    autoResetPageIndex: false, // Prevent pagination reset when data changes
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Event listeners for data table actions
  useEffect(() => {
    const handleToggleTodo = (event: CustomEvent) => {
      const todoId = event.detail;
      toggleTodo(todoId);
    };

    const handleEditTodo = (event: CustomEvent) => {
      const todo = event.detail as Todo;
      setEditingTodo(todo);
      setInputText(todo.text);
      setSelectedType(todo.type);
      // Focus on input
      document.getElementById('todo-text')?.focus();
    };

    const handleDeleteTodo = (event: CustomEvent) => {
      const todo = event.detail as Todo;
      setTodoToDelete(todo);
    };

    window.addEventListener('toggleTodo', handleToggleTodo as EventListener);
    window.addEventListener('editTodo', handleEditTodo as EventListener);
    window.addEventListener('deleteTodo', handleDeleteTodo as EventListener);

    return () => {
      window.removeEventListener('toggleTodo', handleToggleTodo as EventListener);
      window.removeEventListener('editTodo', handleEditTodo as EventListener);
      window.removeEventListener('deleteTodo', handleDeleteTodo as EventListener);
    };
  }, [todos]);

  const fetchTodos = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/todos/${currentUser.id}`);
      const data = await response.json() as { success: boolean; data: Todo[]; error?: string };

      if (data.success) {
        setTodos(data.data);
      } else {
        setError(data.error || "Failed to fetch todos");
      }
    } catch (err) {
      setError("Network error occurred");
    }
  };

  const addTodo = async () => {
    if (inputText.trim() === "" || !currentUser) return;

    try {
      let response;
      let data;

      if (editingTodo) {
        // Update existing todo
        response = await fetch(`/api/todos/${editingTodo.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: inputText.trim(),
            type: selectedType,
          }),
        });

        data = await response.json() as { success: boolean; data: Todo; error?: string };

        if (data.success) {
          await fetchTodos(); // Refresh the list
          setInputText("");
          setEditingTodo(null); // Clear edit state
          toast.success("Task updated successfully");
        } else {
          setError(data.error || "Failed to update todo");
          toast.error(data.error || "Failed to update todo");
        }
      } else {
        // Create new todo
        response = await fetch("/api/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser.id,
            text: inputText.trim(),
            type: selectedType,
          }),
        });

        data = await response.json() as { success: boolean; data: Todo; error?: string };

        if (data.success) {
          await fetchTodos(); // Refresh the list
          setInputText("");
          toast.success("Task added successfully");
        } else {
          setError(data.error || "Failed to add todo");
          toast.error(data.error || "Failed to add todo");
        }
      }
    } catch (err) {
      setError("Network error occurred");
      toast.error("Network error occurred");
    }
  };

  const cancelEdit = () => {
    setEditingTodo(null);
    setInputText("");
    setSelectedType("personal");
  };

  const toggleTodo = async (id: number) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: !todo.completed }),
      });

      const data = await response.json() as { success: boolean; data: Todo; error?: string };

      if (data.success) {
        await fetchTodos(); // Refresh the list
        toast.success(`Task marked as ${!todo.completed ? "completed" : "pending"}`);
      } else {
        setError(data.error || "Failed to update todo");
        toast.error(data.error || "Failed to update todo");
      }
    } catch (err) {
      setError("Network error occurred");
      toast.error("Network error occurred");
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });

      const data = await response.json() as { success: boolean; message: string; error?: string };

      if (data.success) {
        await fetchTodos(); // Refresh the list
        setTodoToDelete(null); // Clear the todo to delete
        toast.success("Task deleted successfully");
      } else {
        setError(data.error || "Failed to delete todo");
        toast.error(data.error || "Failed to delete todo");
      }
    } catch (err) {
      setError("Network error occurred");
      toast.error("Network error occurred");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  // Bulk actions
  const bulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows.map(row => row.original.id);

    if (selectedIds.length === 0) {
      toast.error("No tasks selected");
      return;
    }

    try {
      await Promise.all(selectedIds.map(id =>
        fetch(`/api/todos/${id}`, { method: "DELETE" })
      ));

      await fetchTodos();
      setRowSelection({});
      toast.success(`Deleted ${selectedIds.length} task(s)`);
    } catch (err) {
      toast.error("Failed to delete tasks");
    }
  };

  const bulkToggleComplete = async (completed: boolean) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows.map(row => row.original.id);

    if (selectedIds.length === 0) {
      toast.error("No tasks selected");
      return;
    }

    try {
      await Promise.all(selectedIds.map(id =>
        fetch(`/api/todos/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed })
        })
      ));

      await fetchTodos();
      setRowSelection({});
      toast.success(`Marked ${selectedIds.length} task(s) as ${completed ? "completed" : "pending"}`);
    } catch (err) {
      toast.error("Failed to update tasks");
    }
  };

  // Calculate progress
  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getTypeColor = (type: TodoType) => {
    switch (type) {
      case "personal": return "bg-amber-200 text-amber-900 hover:bg-amber-300";
      case "work": return "bg-orange-200 text-orange-900 hover:bg-orange-300";
      case "shopping": return "bg-yellow-200 text-yellow-900 hover:bg-yellow-300";
      case "health": return "bg-green-200 text-green-900 hover:bg-green-300";
      case "finance": return "bg-blue-200 text-blue-900 hover:bg-blue-300";
      case "learning": return "bg-purple-200 text-purple-900 hover:bg-purple-300";
      case "home": return "bg-pink-200 text-pink-900 hover:bg-pink-300";
      case "other": return "bg-stone-200 text-stone-800 hover:bg-stone-300";
      default: return "bg-stone-200 text-stone-800 hover:bg-stone-300";
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50/50">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-amber-50/50">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-sm text-red-600">Error: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50/50">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Todo List</h1>
          {currentUser && (
            <p className="text-sm text-muted-foreground">
              Managing tasks for {currentUser.first_name}
            </p>
          )}
          {currentUser && todos.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap justify-start items-center gap-x-4 gap-y-1 text-sm font-medium">
                <span title="Total tasks">
                  Total: <span className="font-semibold">{todos.length}</span>
                </span>
                <span className="text-green-600" title="Completed tasks">
                  Completed: <span className="font-semibold">{completedCount}</span>
                </span>
                <span className="text-yellow-600" title="Pending tasks">
                  Pending: <span className="font-semibold">{totalCount - completedCount}</span>
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Progress</span>
                  <span>{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
          )}
        </div>

        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://avatar.vercel.sh/${currentUser.username}.png`} alt={currentUser.username} />
                  <AvatarFallback>{currentUser.first_name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem onClick={() => {
                localStorage.removeItem('currentUser');
                window.location.href = '/login';
              }}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Add/Edit Todo Form */}
      {currentUser && (
        <Card className="mb-8 bg-amber-50/70 border-amber-200/50 shadow-sm">
          <CardHeader>
            <CardTitle>{editingTodo ? "Edit Task" : "Add New Task"}</CardTitle>
            <CardDescription>
              {editingTodo
                ? "Update the task details below."
                : "Create a new task to add to your list."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Input
                  id="todo-text"
                  type="text"
                  placeholder="What do you need to do?"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="bg-white"
                />
              </div>

              <div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(["personal", "work", "shopping", "health", "finance", "learning", "home", "other"] as TodoType[]).map((type) => (
                    <Button
                      key={type}
                      variant={selectedType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedType(type)}
                      className={`capitalize ${selectedType === type ? "bg-amber-600 hover:bg-amber-700" : "border-amber-300 text-amber-800 hover:bg-amber-100"}`}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={addTodo}
                  disabled={inputText.trim() === ""}
                  className={`flex-1 ${editingTodo ? "bg-blue-600 hover:bg-blue-700" : "bg-amber-600 hover:bg-amber-700"}`}
                >
                  {editingTodo ? "Update Task" : "Add Task"}
                </Button>

                {editingTodo && (
                  <Button
                    onClick={cancelEdit}
                    variant="outline"
                    className="px-4"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todo List */}
      <Card className="bg-amber-50/70 border-amber-200/50 shadow-sm">
        <CardHeader>
          <CardTitle>Your Tasks</CardTitle>
          <CardDescription>Manage your tasks with advanced filtering and sorting.</CardDescription>
        </CardHeader>
        <CardContent>
          {todos.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="mb-4">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-sm text-gray-500 mb-4">Get started by creating your first task above!</p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md mx-auto">
                <h4 className="text-sm font-semibold text-amber-900 mb-2">Quick Tips:</h4>
                <ul className="text-xs text-amber-800 text-left space-y-1">
                  <li>• Use different task types to organize your work</li>
                  <li>• Press Enter to quickly add tasks</li>
                  <li>• Press Escape to cancel editing</li>
                  <li>• Use filters to focus on specific tasks</li>
                  <li>• Select multiple tasks for bulk actions</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="w-full">
              {/* Quick Filters and Bulk Actions */}
              <div className="space-y-4 mb-4">
                {/* Status Filters */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                    className={statusFilter === "all" ? "bg-amber-600 hover:bg-amber-700" : "border-amber-300 hover:bg-amber-100"}
                  >
                    All ({todos.length})
                  </Button>
                  <Button
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("pending")}
                    className={statusFilter === "pending" ? "bg-yellow-600 hover:bg-yellow-700" : "border-yellow-300 hover:bg-yellow-100"}
                  >
                    Pending ({todos.filter(t => !t.completed).length})
                  </Button>
                  <Button
                    variant={statusFilter === "completed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("completed")}
                    className={statusFilter === "completed" ? "bg-green-600 hover:bg-green-700" : "border-green-300 hover:bg-green-100"}
                  >
                    Completed ({todos.filter(t => t.completed).length})
                  </Button>
                </div>

                {/* Type Filter and Bulk Actions */}
                <div className="flex flex-wrap gap-2 items-center">
                  <Select value={typeFilter} onValueChange={(value: string) => setTypeFilter(value as TodoType | "all")}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>

                  {table.getFilteredSelectedRowModel().rows.length > 0 && (
                    <>
                      <div className="text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} selected
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => bulkToggleComplete(true)}
                        className="border-green-300 hover:bg-green-50"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark Complete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => bulkToggleComplete(false)}
                        className="border-yellow-300 hover:bg-yellow-50"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Mark Pending
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={bulkDelete}
                        className="border-red-300 hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Search and Column Controls */}
              <div className="flex items-center py-4">
                <Input
                  placeholder="Filter tasks..."
                  value={(table.getColumn("text")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn("text")?.setFilterValue(event.target.value)
                  }
                  className="max-w-sm"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto">
                      Columns <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {table
                      .getAllColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={column.id}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                              column.toggleVisibility(!!value)
                            }
                          >
                            {column.id}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop Data Table View */}
              <div className="hidden md:block">
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => {
                            return (
                              <TableHead key={header.id}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </TableHead>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            className={row.original.completed ? "opacity-75" : ""}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={todoColumns.length}
                            className="h-24 text-center"
                          >
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => {
                    const todo = row.original;
                    return (
                      <div key={todo.id} className={`p-4 rounded-lg border border-amber-300/70 bg-gradient-to-br from-amber-50/50 to-amber-100/50 shadow-sm ${todo.completed ? "opacity-75" : ""}`}>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={() => toggleTodo(todo.id)}
                            aria-label="Toggle task completion"
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${todo.completed ? "line-through text-gray-500" : ""} break-words`}>
                              {todo.text}
                            </p>
                            <div className="mt-2 space-y-1">
                              <Badge className={getTypeColor(todo.type)}>{todo.type}</Badge>
                              <div>
                                <span className="text-xs text-gray-500">
                                  {formatDate(todo.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    const event = new CustomEvent('editTodo', { detail: todo });
                                    window.dispatchEvent(event);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit task
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setTodoToDelete(todo)}
                                  className="text-red-600"
                                >
                                  Delete task
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tasks match your filters.</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-end space-x-2 py-4">
                <div className="text-muted-foreground flex-1 text-sm">
                  {table.getFilteredSelectedRowModel().rows.length} of{" "}
                  {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>



      {/* Navigation */}
      <div className="mt-8 text-center">
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <a href="/">← Back to Home</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/test-page">🧪 Test Page</a>
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {todoToDelete && (
        <AlertDialog open={!!todoToDelete} onOpenChange={(open) => !open && setTodoToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the task:
                <span className="font-semibold block mt-2">"{todoToDelete.text}"</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => todoToDelete && deleteTodo(todoToDelete.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Task
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      </div>
    </div>
  );
}