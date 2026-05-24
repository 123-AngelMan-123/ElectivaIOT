import React, { useEffect, useState } from 'react'
import Chart from '../components/Chart'
import { getDatos, getDispositivos } from '../services/api'

export default function Historico({ selectedDevice: initialDevice = '', selectedValor = null }){
  const [devices, setDevices] = useState([])
  const [selected, setSelected] = useState(initialDevice)
  const [datos, setDatos] = useState([])
  const [histLoading, setHistLoading] = useState(false)
  // safe setter wrapper and diagnostics
  const setLoadingSafe = (v) => {
    try {
      if (typeof setHistLoading === 'function') setHistLoading(v)
      else console.warn('setHistLoading is not a function (safe wrapper)', typeof setHistLoading)
    } catch (err) {
      console.error('Error calling setHistLoading in safe wrapper', err)
    }
  }

  useEffect(() => {
    console.log('Historico mounted', { initialDevice, selectedValor })
    console.log('typeof setHistLoading', typeof setHistLoading)
  }, [])
  const [range, setRange] = useState('7d') // options: 1h,6h,24h,7d,all
  const [visible, setVisible] = useState({ valor1:true, valor2:true, valor3:true, valor4:true })
  const [chartHeight, setChartHeight] = useState(820)
  const [showCount, setShowCount] = useState(2000) // how many latest points to display from fetched datos (0 = all)
  const [fetchLimit, setFetchLimit] = useState(20000) // how many points to request from API

  useEffect(() => {
    (async () => {
      try {
        const resp = await getDispositivos({ limite: 200 })
        setDevices(resp.dispositivos || [])
        if (!initialDevice && (resp.dispositivos || []).length > 0) setSelected(resp.dispositivos[0].uuid)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [])

  useEffect(() => {
    if (!selected) return
    console.log('before setLoadingSafe(true) typeof:', typeof setLoadingSafe, 'value:', setLoadingSafe)
    if (typeof setLoadingSafe === 'function') {
      setLoadingSafe(true)
    } else {
      console.error('setLoadingSafe is not callable', typeof setLoadingSafe, setLoadingSafe)
    }
    (async () => {
      try {
        // request configurable number of points
        const r = await getDatos({ limite: fetchLimit, uuid: selected })
        const list = (r.datos || []).slice().reverse()
        setDatos(list)
      } catch (e) {
        console.error(e)
      } finally {
        console.log('before setLoadingSafe(false) typeof:', typeof setLoadingSafe, 'value:', setLoadingSafe)
        if (typeof setLoadingSafe === 'function') {
          setLoadingSafe(false)
        } else {
          console.error('setLoadingSafe is not callable in finally', typeof setLoadingSafe, setLoadingSafe)
        }
      }
    })()
  }, [selected, fetchLimit])

  // Build multi-line spec showing valor1..valor4, and highlight selectedValor if provided
  // filter datos by selected range
  const cutoff = (() => {
    if (!range || range === 'all') return null
    const now = Date.now()
    switch(range){
      case '1h': return new Date(now - 1000*60*60)
      case '6h': return new Date(now - 1000*60*60*6)
      case '24h': return new Date(now - 1000*60*60*24)
      case '7d': return new Date(now - 1000*60*60*24*7)
      default: return null
    }
  })()

  const valuesAll = datos.map(d => ({ fecha: d.fecha_insercion, valor1: Number(d.valor1), valor2: Number(d.valor2), valor3: Number(d.valor3), valor4: Number(d.valor4) }))
  const valuesFilteredByRange = cutoff ? valuesAll.filter(v => new Date(v.fecha) >= cutoff) : valuesAll
  // only show the latest `showCount` points to keep charts readable (0 = all)
  const values = (showCount && showCount > 0 && valuesFilteredByRange.length > showCount) ? valuesFilteredByRange.slice(-showCount) : valuesFilteredByRange

  const spec = {
    data: { values },
    layer: [
      visible.valor1 ? { mark: { type: 'line', color: '#0ea5e9' }, encoding: { x: { field: 'fecha', type: 'temporal' }, y: { field: 'valor1', type: 'quantitative' } } } : null,
      visible.valor2 ? { mark: { type: 'line', color: '#0ea5a4' }, encoding: { x: { field: 'fecha', type: 'temporal' }, y: { field: 'valor2', type: 'quantitative' } } } : null,
      visible.valor3 ? { mark: { type: 'line', color: '#f59e0b' }, encoding: { x: { field: 'fecha', type: 'temporal' }, y: { field: 'valor3', type: 'quantitative' } } } : null,
      visible.valor4 ? { mark: { type: 'line', color: '#ef4444' }, encoding: { x: { field: 'fecha', type: 'temporal' }, y: { field: 'valor4', type: 'quantitative' } } } : null
    ].filter(Boolean),
    encoding: {
      x: { field: 'fecha', type: 'temporal', title: 'Fecha' }
    },
    // enable pan/zoom via scale binding
    selection: { zoom: { type: 'interval', bind: 'scales', encodings: ['x'] } }
  }

  // If a specific valor is selected, create a single series spec instead (larger)
  const singleSpec = selectedValor ? {
    data: { values: values.map(v => ({ fecha: v.fecha, valor: v[`valor${selectedValor}`] })) },
    mark: { type: 'line', point: true, color: ['#0ea5e9','#0ea5a4','#f59e0b','#ef4444'][selectedValor-1] },
    encoding: {
      x: { field: 'fecha', type: 'temporal', title: 'Fecha' },
      y: { field: 'valor', type: 'quantitative', title: `Valor ${selectedValor}` }
    },
    selection: { zoom: { type: 'interval', bind: 'scales', encodings: ['x'] } }
  } : null

  const downloadCSV = () => {
    const rows = (singleSpec ? values.map(v => ({ fecha: v.fecha, valor: v.valor })) : values.map(v => ({ fecha: v.fecha, valor1: v.valor1, valor2: v.valor2, valor3: v.valor3, valor4: v.valor4 })))
    const keys = Object.keys(rows[0] || {})
    const csv = [keys.join(',')].concat(rows.map(r => keys.map(k => r[k]).join(','))).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historico_${selected}_${selectedValor || 'all'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <h1>Históricos</h1>
      <div className="controls">
        <label>Dispositivo:</label>
        <select value={selected} onChange={e => setSelected(e.target.value)}>
          {devices.map(d => <option key={d.uuid} value={d.uuid}>{d.nombre || d.uuid}</option>)}
        </select>
        <div style={{marginLeft:12}}>
          <label>Rango:</label>
          {['1h','6h','24h','7d','all'].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{marginLeft:6, padding:'6px 8px', borderRadius:6, background: range===r ? '#0ea5e9' : 'transparent', color: range===r ? '#fff' : '#0f1724', border:'1px solid rgba(15,23,42,0.06)'}}>{r}</button>
          ))}
        </div>
        <div style={{marginLeft:12}}>
          <button onClick={downloadCSV} style={{padding:'6px 8px', borderRadius:6, background:'#0ea5a4', color:'#fff', border:'none'}}>Descargar CSV</button>
        </div>
      </div>

      <div style={{margin:'8px 0 12px', display:'flex', gap:12, alignItems:'center'}}>
        <label className="muted">Series:</label>
        {['valor1','valor2','valor3','valor4'].map((k, idx) => (
          <label key={k} style={{display:'inline-flex',alignItems:'center',gap:6}}>
            <input type="checkbox" checked={visible[k]} onChange={e => setVisible(prev => ({...prev,[k]:e.target.checked}))} />
            <span style={{color:['#0ea5e9','#0ea5a4','#f59e0b','#ef4444'][idx]}}>{k}</span>
          </label>
        ))}
      </div>

      {histLoading && <div>Cargando...</div>}
      {!histLoading && datos.length === 0 && <div>No hay datos históricos para este dispositivo.</div>}

      {datos.length > 0 && (
        <>
          <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:12}}>
            <label style={{display:'inline-flex', alignItems:'center', gap:6}}>
              <span className="muted">Alto:</span>
              <input type="range" min={200} max={1400} value={chartHeight} onChange={e => setChartHeight(Number(e.target.value))} />
              <strong>{chartHeight}px</strong>
            </label>

            <label style={{display:'inline-flex', alignItems:'center', gap:6}}>
              <span className="muted">Mostrar:</span>
              <select value={showCount} onChange={e => setShowCount(Number(e.target.value))}>
                {[100,250,500,1000,2000,5000,10000].map(n => <option key={n} value={n}>{n} puntos</option>)}
                <option value={0}>Todos</option>
              </select>
            </label>

            <label style={{display:'inline-flex', alignItems:'center', gap:6}}>
              <span className="muted">Pedir:</span>
              <select value={fetchLimit} onChange={e => setFetchLimit(Number(e.target.value))}>
                {[500,1000,5000,10000,20000].map(n => <option key={n} value={n}>{n} pedir</option>)}
              </select>
              <button onClick={() => { if (selected) { setDatos([]); setSelected(selected) } }} style={{marginLeft:8}}>Refrescar</button>
            </label>
          </div>

          {singleSpec ? (
            <Chart spec={singleSpec} height={chartHeight} />
          ) : (
            <Chart spec={spec} height={chartHeight} />
          )}
        </>
      )}
    </div>
  )
}
