import type { Route } from "./+types/todo";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Todo List
        </h1>
        <p className="text-lg text-gray-600">
          Manage tasks with database storage
        </p>
      </div>

      {/* User Info */}
      {currentUser && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Welcome back!</CardTitle>
                <CardDescription>
                  Managing todos for {currentUser.first_name} {currentUser.last_name}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.removeItem('currentUser');
                  window.location.href = '/login';
                }}
              >
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

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
      <div className="space-y-4">
        {todos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">
                No tasks yet. Add your first task above!
              </p>
            </CardContent>
          </Card>
        ) : (
          todos.map((todo) => (
            <Card key={todo.id} className={todo.completed ? "opacity-75" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />

                    <div className="flex-1">
                      <p className={`text-lg ${todo.completed ? "line-through text-gray-500" : "text-gray-900"}`}>
                        {todo.text}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getTypeColor(todo.type)}>
                          {todo.type}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Added {formatDate(todo.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTodo(todo.id)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      {currentUser && todos.length > 0 && (
        <Card className="mt-8">
          <CardContent className="p-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total: {todos.length}</span>
              <span>Completed: {todos.filter(t => t.completed).length}</span>
              <span>Pending: {todos.filter(t => !t.completed).length}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="mt-8">
        <div className="flex justify-center gap-4">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </a>
          <a
            href="/test-page"
            className="text-purple-600 hover:text-purple-800 font-medium"
          >
              🧪 Test Page
            </a>
        </div>
      </div>
    </div>
  );
}