import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from "react";
import { LoginForm } from "@/components/login-form";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute('/login')({
  // Loader function with typed context
  loader: ({ context }) => {
    return {
      message: context.cloudflare?.env?.VALUE_FROM_CLOUDFLARE || "Welcome to Login Page!"
    }
  },
  // Component with access to loader data
  component: LoginPage,
  // Meta information for the page
  meta: () => [
    {
      title: "Login - React Router App",
    },
    {
      name: "description",
      content: "Sign in to access your account",
    },
  ],
})

function LoginPage() {
  const { message } = Route.useLoaderData()
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()

  // Check if user is already logged in
  useEffect(() => {
    if (session?.user) {
      // User is already logged in, redirect to home page
      navigate({ to: '/' });
    }
  }, [session, navigate]);

  // If user is already logged in, show a loading state or redirect message
  if (isPending) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <p className="text-lg text-gray-600">Checking session...</p>
        </div>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="container mx-auto py-8 px-4 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-green-600 mb-4">Already Logged In!</h1>
            <p className="text-lg text-gray-600 mb-4">
              Welcome back, {session.user.name || session.user.email}!
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Redirecting you to the home page...
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={() => navigate({ to: '/' })}
              className="w-full"
            >
              Go to Home
            </Button>
            <Button
              onClick={() => signOut()}
              variant="destructive"
              className="w-full"
            >
              Logout
            </Button>
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
            Sign in to access your account
          </p>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg mb-8">
          <p className="text-sm text-muted-foreground">
            Server message: {message}
          </p>
        </div>

        <LoginForm />

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Demo credentials available in the database. Try any existing user email with their password.
          </p>
        </div>
      </div>
    </div>
  );
}
