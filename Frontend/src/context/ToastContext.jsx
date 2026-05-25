import React, { createContext, useContext, useState, useCallback } from 'react'
import Toasts from '../components/Toasts'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const addToast = useCallback((message, type = 'info', ttl = 4000) => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts(t => [...t, { id, message, type }])
    if (ttl > 0) setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ttl)
  }, [])

  const removeToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <Toasts toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast(){
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
