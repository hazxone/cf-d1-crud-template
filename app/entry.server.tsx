export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  cloudflareContext: any,
) {
  // Return a simple HTML shell for client-side rendering
  // This avoids hydration mismatch issues while we're in development
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
    <div id="root"></div>
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
