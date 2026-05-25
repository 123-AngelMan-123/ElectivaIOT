import React from 'react'

export default function Statistics({ data = [] }) {
  if (!data || data.length === 0) {
    return <div className="stats-empty">Sin datos</div>
  }

  const values = data
    .map(item => item.valor)
    .filter(v => v !== null && v !== undefined)
    .map(Number)

  if (values.length === 0) {
    return <div className="stats-empty">Sin datos</div>
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
  const latest = values[values.length - 1]

  return (
    <div className="statistics">
      <div className="stat-item">
        <span className="stat-label">Mín</span>
        <span className="stat-value" style={{ color: '#ef4444' }}>{min.toFixed(2)}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Máx</span>
        <span className="stat-value" style={{ color: '#10b981' }}>{max.toFixed(2)}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Promedio</span>
        <span className="stat-value" style={{ color: '#0ea5e9' }}>{avg}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Actual</span>
        <span className="stat-value">{latest.toFixed(2)}</span>
      </div>
    </div>
  )
}
