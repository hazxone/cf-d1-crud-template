import type { Route } from "./+types/home";
import { UsersList } from "~/components/users-list";

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
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all users in the system. This data is fetched from Cloudflare D1 database.
          </p>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Server message: {loaderData.message}
          </p>
        </div>

        <UsersList />
      </div>
    </div>
  );
}