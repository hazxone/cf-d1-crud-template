import type { Route } from "./+types/todo";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

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
      case "personal": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "work": return "bg-green-100 text-green-800 hover:bg-green-100";
      case "shopping": return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "other": return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default: return "bg-gray-100 text-gray-800 hover:bg-gray-100";
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
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center p-8">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center p-8">
          <div className="text-sm text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Todo List</h1>
          {currentUser && (
            <p className="text-sm text-muted-foreground">
              Managing tasks for {currentUser.first_name}
            </p>
          )}
        </div>
        {currentUser && todos.length > 0 && (
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-sm font-medium">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem('currentUser');
                window.location.href = '/login';
              }}
            >
              Logout
            </Button>
          </div>
        )}
      </div>

      {/* Add Todo Form */}
      {currentUser && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Task</CardTitle>
            <CardDescription>
              Enter your task details and select a category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="todo-text">Task Description</Label>
                <Input
                  id="todo-text"
                  type="text"
                  placeholder="What do you need to do?"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="mt-1"
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
                      className="capitalize"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={addTodo}
                disabled={inputText.trim() === ""}
                className="w-full"
              >
                Add Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todo List */}
      <Card>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTodo(todo.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
  );
}