import type { Route } from "./+types/todo";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
type TodoType = "personal" | "work" | "shopping" | "other";

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
      const response = await fetch("/api/todos", {
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

      const data = await response.json() as { success: boolean; data: Todo; error?: string };

      if (data.success) {
        await fetchTodos(); // Refresh the list
        setInputText("");
      } else {
        setError(data.error || "Failed to add todo");
      }
    } catch (err) {
      setError("Network error occurred");
    }
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
      } else {
        setError(data.error || "Failed to update todo");
      }
    } catch (err) {
      setError("Network error occurred");
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
      } else {
        setError(data.error || "Failed to delete todo");
      }
    } catch (err) {
      setError("Network error occurred");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const getTypeColor = (type: TodoType) => {
    switch (type) {
      case "personal": return "bg-amber-200 text-amber-900 hover:bg-amber-300";
      case "work": return "bg-orange-200 text-orange-900 hover:bg-orange-300";
      case "shopping": return "bg-yellow-200 text-yellow-900 hover:bg-yellow-300";
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
            <div className="mt-4 flex flex-wrap justify-start items-center gap-x-4 gap-y-1 text-sm font-medium">
              <span title="Total tasks">
                Total: <span className="font-semibold">{todos.length}</span>
              </span>
              <span className="text-green-600" title="Completed tasks">
                Completed: <span className="font-semibold">{todos.filter(t => t.completed).length}</span>
              </span>
              <span className="text-yellow-600" title="Pending tasks">
                Pending: <span className="font-semibold">{todos.filter(t => !t.completed).length}</span>
              </span>
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

      {/* Add Todo Form */}
      {currentUser && (
        <Card className="mb-8 bg-amber-50/70 border-amber-200/50 shadow-sm">
          <CardHeader>
            <CardTitle>Add New Task</CardTitle>
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
                <Label>Task Type</Label>
                <div className="flex gap-2 mt-2">
                  {(["personal", "work", "shopping", "other"] as TodoType[]).map((type) => (
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

              <Button
                onClick={addTodo}
                disabled={inputText.trim() === ""}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                Add Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todo List */}
      <Card className="bg-amber-50/70 border-amber-200/50 shadow-sm">
        <CardHeader>
          <CardTitle>Your Tasks</CardTitle>
          <CardDescription>Here is the list of your tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          {todos.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tasks yet. Add your first task above!</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Status</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead className="w-[180px]">Created At</TableHead>
                      <TableHead className="w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todos.map((todo) => (
                      <TableRow key={todo.id} className={todo.completed ? "opacity-75" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={() => toggleTodo(todo.id)}
                            aria-label="Toggle task completion"
                          />
                        </TableCell>
                        <TableCell>
                          <span className={todo.completed ? "line-through text-gray-500" : ""}>{todo.text}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(todo.type)}>{todo.type}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(todo.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTodoToDelete(todo)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the task:
                                  <span className="font-semibold block mt-2">"{todo.text}"</span>
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {todos.map((todo) => (
                  <div key={todo.id} className={`p-4 rounded-lg border border-amber-300/70 bg-amber-50/30 shadow-sm ${todo.completed ? "opacity-75" : ""}`}>
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setTodoToDelete(todo)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 h-8 w-8 p-0"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the task:
                                <span className="font-semibold block mt-2">"{todo.text}"</span>
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
      </div>
    </div>
  );
}