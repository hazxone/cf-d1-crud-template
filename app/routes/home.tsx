import type { Route } from "./+types/home";
import { useState } from "react";
import { UsersList } from "@/components/users-list";
import { UserForm } from "@/components/user-form";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Users - React Router App" },
    { name: "description", content: "View all users in the system" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return {
    message: (context as any).cloudflare?.env?.VALUE_FROM_CLOUDFLARE || "Welcome to Users Page!"
  };
}

export default function UsersPage({ loaderData }: Route.ComponentProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUserCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        {/* Header with Navigation */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all users in the system. This data is fetched from Cloudflare D1 database.
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/todo"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
            >
              📝 Todo List
            </a>
            <a
              href="/test-page"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4"
            >
              🧪 Test Page
            </a>
          </div>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Server message: {loaderData.message}
          </p>
        </div>

        {/* Add User Form */}
        <UserForm onUserCreated={handleUserCreated} />

        {/* Users List */}
        <UsersList key={refreshKey} />
      </div>
    </div>
  );
}