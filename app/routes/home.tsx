import type { Route } from "./+types/home";
import { LoginForm } from "~/components/login-form";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Login - React Router App" },
    { name: "description", content: "Sign in to your account" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return {
    message: (context as any).cloudflare?.env?.VALUE_FROM_CLOUDFLARE || "Welcome to the Login Page!"
  };
}

export default function Login({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <LoginForm />
    </div>
  );
}