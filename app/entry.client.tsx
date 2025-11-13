import { hydrateRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { createRouter } from './router'

// Create the router instance
const router = createRouter()

// Hydrate the app
const rootElement = document.getElementById('root')!
hydrateRoot(rootElement, <RouterProvider router={router} />)
