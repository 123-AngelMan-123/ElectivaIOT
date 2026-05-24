import React from 'react'
import { VegaLite } from 'react-vega'

export default function Chart({ spec, height = 200 }){
  // Ensure responsive autosize and container width
  const safeSpec = {
    ...spec,
    // allow Vega to fit the container width
    width: 'container',
    height,
    autosize: { type: 'fit', contains: 'padding' }
  }

  // key to force re-render when data length or height changes
  const dataLen = (spec && spec.data && spec.data.values && spec.data.values.length) || 0
  const key = `${dataLen}-${height}`

  // use 100% width so `width: 'container'` resolves correctly
  return (
    <div className="vega-chart" style={{height, width: '100%'}}>
      <VegaLite key={key} spec={safeSpec} />
    </div>
  )
}
