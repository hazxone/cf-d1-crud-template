import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from 'sonner'
import '../app.css'

// Define the context type that will be available to all routes
interface RouterContext {
  cloudflare?: {
    env?: {
      VALUE_FROM_CLOUDFLARE?: string
      DB?: any
      [key: string]: any
    }
    ctx?: any
  }
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  errorComponent: ErrorComponent,
})

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  )
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Error</h1>
      <p className="text-red-600 mb-4">{error.message}</p>
      {import.meta.env.DEV && error.stack && (
        <pre className="w-full p-4 overflow-x-auto bg-gray-100 rounded">
          <code>{error.stack}</code>
        </pre>
      )}
    </main>
  )
}
