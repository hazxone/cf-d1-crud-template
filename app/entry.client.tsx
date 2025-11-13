import '@vitejs/plugin-react/preamble'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { createRouter } from './router'

// Create the router instance
const router = createRouter()

// Render the app (client-side only for now)
const rootElement = document.getElementById('root')!
createRoot(rootElement).render(<RouterProvider router={router} />)
