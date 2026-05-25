import React from 'react'

export default function ValueAlert({ value, min = null, max = null, label = 'Valor' }) {
  if (value === null || value === undefined) {
    return null
  }

  const numValue = Number(value)
  let status = 'normal'
  let message = ''

  if (max !== null && numValue > max) {
    status = 'warning'
    message = `Excede máximo (${max})`
  } else if (min !== null && numValue < min) {
    status = 'warning'
    message = `Bajo mínimo (${min})`
  }

  if (status === 'normal') {
    return null
  }

  const statusColors = {
    warning: '#f59e0b',
    error: '#ef4444'
  }

  return (
    <div className="value-alert" style={{ borderLeftColor: statusColors[status] }}>
      <span className="alert-icon">⚠️</span>
      <span className="alert-message">{message}</span>
    </div>
  )
}
