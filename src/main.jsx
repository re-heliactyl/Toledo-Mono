{/**

Heliactyl Next - codename "Toledo"
© 2024-2026 Matt James and contributors

*/}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import App from './App'
import { Toaster } from './components/ui/toaster'
import { SettingsProvider } from './hooks/useSettings'
import { isUserBannedError, redirectToBannedPage } from './lib/api'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isUserBannedError(error)) {
      redirectToBannedPage()
    }

    return Promise.reject(error)
  }
)

ReactDOM.createRoot(document.getElementById('heliactyl')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter 
        basename="/"
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <SettingsProvider>
          <App />
          <Toaster />
        </SettingsProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
