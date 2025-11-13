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

  // Inject the HTML into the shell
  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <div id="root">${html}</div>
  </body>
</html>
  `.trim()

  responseHeaders.set('Content-Type', 'text/html')
  return new Response(fullHtml, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}
