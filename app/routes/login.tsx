import type { Route } from "./+types/login";
import { useState } from "react";
import { useNavigate } from "react-router";
import { LoginForm } from "~/components/login-form";

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

  const handleLoginSuccess = (loggedInUser: any) => {
    setUser(loggedInUser);
    // Store user data in localStorage for persistence
    localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
    // Redirect to todo page with user ID
    navigate(`/todo?userId=${loggedInUser.id}`);
  };

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