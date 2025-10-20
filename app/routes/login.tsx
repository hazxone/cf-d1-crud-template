import type { Route } from "./+types/login";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { LoginForm } from "@/components/login-form";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - React Router App" },
    { name: "description", content: "Sign in to access your todo list" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return {
    message: (context as any).cloudflare?.env?.VALUE_FROM_CLOUDFLARE || "Welcome to Login Page!"
  };
}

export default function LoginPage({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  // Check if user is already logged in on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // User is already logged in, redirect to todo page
        navigate('/todo');
      } catch (error) {
        // Invalid data in localStorage, clear it
        localStorage.removeItem('currentUser');
      }
    }
  }, [navigate]);

  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    // Store user data in localStorage for persistence
    localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
    // Redirect to todo page
    navigate('/todo');
  };

  // If user is already logged in, show a loading state or redirect message
  if (user) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-green-600 mb-4">Already Logged In!</h1>
            <p className="text-lg text-gray-600 mb-4">
              Welcome back, {user.first_name || user.username}!
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting you to your todo list...
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate('/todo')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Todo List
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('currentUser');
                setUser(null);
              }}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome Back</h1>
          <p className="text-lg text-gray-600">
            Sign in to access your personal todo list
          </p>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg mb-8">
          <p className="text-sm text-muted-foreground">
            Server message: {loaderData.message}
          </p>
        </div>

        <LoginForm onLoginSuccess={handleLoginSuccess} />

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Demo credentials available in the database. Try any existing user email with their password.
          </p>
        </div>
      </div>
    </div>
  );
}