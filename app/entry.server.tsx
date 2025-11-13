import { renderToString } from 'react-dom/server'
import { RouterProvider } from '@tanstack/react-router'
import { isbot } from 'isbot'
import { createRouter } from './router'
import { createMemoryHistory } from '@tanstack/react-router'

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  cloudflareContext: any,
) {
  // Create a memory history for SSR
  const url = new URL(request.url)
  const memoryHistory = createMemoryHistory({
    initialEntries: [url.pathname + url.search],
  })

  // Create a new router instance for each request
  const router = createRouter()

  // Update the router with memory history and context
  router.update({
    history: memoryHistory,
    context: {
      cloudflare: cloudflareContext,
    },
  })

  // Wait for the router to load
  await router.load()

  // Render the app to string
  const html = renderToString(<RouterProvider router={router} />)

  // Inject the HTML into the shell with proper styling
  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" />
    <title>Cloudflare D1 CRUD Template</title>
  </head>
  <body>
    <div id="root">${html}</div>
    <script type="module" src="/app/entry.client.tsx"></script>
  </body>
</html>
  `.trim()

  responseHeaders.set('Content-Type', 'text/html')
  return new Response(fullHtml, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}
