import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import './styles.css'

const container = document.getElementById('root')
const root = createRoot(container)
root.render(
  <ThemeProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </ThemeProvider>
)
