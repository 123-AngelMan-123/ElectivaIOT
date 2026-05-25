import React from 'react'

export default function StatusIndicator({ status = 'offline', tooltip = '' }) {
  const statusConfig = {
    online: { color: '#10b981', label: 'En línea', icon: '●' },
    offline: { color: '#6b7280', label: 'Sin conexión', icon: '●' },
    error: { color: '#ef4444', label: 'Error', icon: '●' },
    warning: { color: '#f59e0b', label: 'Advertencia', icon: '●' }
  }

  const config = statusConfig[status] || statusConfig.offline

  return (
    <div className="status-indicator" title={tooltip || config.label}>
      <span className="status-dot" style={{ color: config.color }}>
        {config.icon}
      </span>
      <span className="status-label">{config.label}</span>
    </div>
  )
}
