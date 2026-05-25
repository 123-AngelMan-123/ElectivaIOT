import React from 'react'
import { VegaLite } from 'react-vega'

export default function Chart({ spec, height = 200, compact = false }){
  // Ensure responsive autosize and container width
  // Merge spec with defaults and force transparent background so dark mode shows through
  const safeSpec = {
    ...spec,
    width: 'container',
    height: compact ? 120 : height,
    background: 'transparent',
    config: {
      ...(spec && spec.config ? spec.config : {}),
      view: {
        ...((spec && spec.config && spec.config.view) || {}),
        stroke: 'transparent',
        background: 'transparent'
      },
      // default axis/legend colors will be adjusted below depending on theme
      axis: {
        ...(spec && spec.config && spec.config.axis ? spec.config.axis : {})
      },
      legend: {
        ...(spec && spec.config && spec.config.legend ? spec.config.legend : {})
      }
    },
    autosize: { type: 'fit', contains: 'padding' }
  }

  // key to force re-render when data length or height changes
  const dataLen = (spec && spec.data && spec.data.values && spec.data.values.length) || 0
  const key = `${dataLen}-${height}-${compact}`
  // Decide axis/label colors based on current theme
  const theme = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null
  const isDark = theme === 'dark'
  const axisColor = isDark ? '#cbd5e1' : '#475569'
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(2,6,23,0.06)'

  // apply dynamic overrides to safeSpec
  safeSpec.config.axis = { ...(safeSpec.config.axis || {}), labelColor: axisColor, titleColor: axisColor, domainColor: axisColor, tickColor: axisColor, gridColor }
  safeSpec.config.legend = { ...(safeSpec.config.legend || {}), labelColor: axisColor, titleColor: axisColor }

  // use 100% width so `width: 'container'` resolves correctly
  return (
    <div className="vega-chart" style={{height: compact ? 120 : height, width: '100%', background: 'transparent'}}>
      <VegaLite key={key} spec={safeSpec} />
    </div>
  )
}
