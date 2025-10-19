import type { Route } from "./+types/todo";
import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Label } from "~/components/ui/label";

// Types
type TodoType = "personal" | "work" | "shopping" | "other";

interface Todo {
  id: string;
  text: string;
  type: TodoType;
  completed: boolean;
  createdAt: Date;
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
  const [inputText, setInputText] = useState("");
  const [selectedType, setSelectedType] = useState<TodoType>("personal");

  // Load todos from localStorage on mount
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos");
    if (savedTodos) {
      const parsedTodos = JSON.parse(savedTodos).map((todo: any) => ({
        ...todo,
        createdAt: new Date(todo.createdAt)
      }));
      setTodos(parsedTodos);
    }
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (inputText.trim() === "") return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      text: inputText.trim(),
      type: selectedType,
      completed: false,
      createdAt: new Date()
    };

    setTodos([newTodo, ...todos]);
    setInputText("");
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Todo List
        </h1>
        <p className="text-lg text-gray-600">
          Manage your tasks with local storage
        </p>
      </div>

      {/* Add Todo Form */}
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
                onKeyPress={handleKeyPress}
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
                          Added {formatDate(todo.createdAt)}
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
      {todos.length > 0 && (
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