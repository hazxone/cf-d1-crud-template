import { createFileRoute, Link } from '@tanstack/react-router'
import { ProductsTable } from '@/components/products-table'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth-client'

export const Route = createFileRoute('/')({
  // Loader function with typed context
  loader: ({ context }) => {
    return {
      message: context.cloudflare?.env?.VALUE_FROM_CLOUDFLARE || 'Cloudflare Workers + D1 Template',
    }
  },
  // Component with access to loader data
  component: HomePage,
  // Meta information for the page
  meta: () => [
    {
      title: 'Product Management - Cloudflare D1 CRUD Template',
    },
    {
      name: 'description',
      content: 'Full-stack CRUD template with TanStack Router, Hono, and Cloudflare D1',
    },
  ],
})

function HomePage() {
  const { message } = Route.useLoaderData()
  const { data: session, isPending } = useSession()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Product Management</h1>
            <p className="text-muted-foreground mt-2">
              A full-stack CRUD template built with TanStack Router, Hono, and Cloudflare D1 database
            </p>
            {isPending && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-md">
                <p className="text-sm text-gray-600 dark:text-gray-400">Loading session...</p>
              </div>
            )}
            {session?.user && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Logged in as: <span className="font-semibold">{session.user.name || session.user.email}</span>
                </p>
                {session.user.email && (
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    {session.user.email}
                  </p>
                )}
              </div>
            )}
          </div>
          <Button asChild>
            <Link to="/login">
              Login
            </Link>
          </Button>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-6 rounded-lg border">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-2">Tech Stack</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Frontend</div>
                  <div className="text-muted-foreground">TanStack Router</div>
                </div>
                <div>
                  <div className="font-medium">Backend</div>
                  <div className="text-muted-foreground">Hono on Workers</div>
                </div>
                <div>
                  <div className="font-medium">Database</div>
                  <div className="text-muted-foreground">Cloudflare D1</div>
                </div>
                <div>
                  <div className="font-medium">UI</div>
                  <div className="text-muted-foreground">shadcn/ui</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products CRUD Table */}
        <ProductsTable />

        {/* Footer Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Server message: {message}</p>
          <p className="mt-2">
            This template includes complete CRUD operations with a clean, modern UI
          </p>
        </div>
      </div>
    </div>
  )
}
