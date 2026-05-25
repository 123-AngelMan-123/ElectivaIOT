import React from 'react'

export default function Toasts({ toasts = [], onRemove = () => {} }){
  return (
    <div className="toast-root" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} role="status">
          <div className="toast-message">{t.message}</div>
          <button className="toast-close" onClick={() => onRemove(t.id)} aria-label="Cerrar">✕</button>
        </div>
      ))}
    </div>
  )
}
