import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
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
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
        />
      </head>
      <body>
        <Outlet />
        <Toaster />
        <TanStackRouterDevtools position="bottom-right" />
      </body>
    </html>
  )
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Error</title>
      </head>
      <body>
        <main className="pt-16 p-4 container mx-auto">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-red-600 mb-4">{error.message}</p>
          {import.meta.env.DEV && error.stack && (
            <pre className="w-full p-4 overflow-x-auto bg-gray-100 rounded">
              <code>{error.stack}</code>
            </pre>
          )}
        </main>
      </body>
    </html>
  )
}
