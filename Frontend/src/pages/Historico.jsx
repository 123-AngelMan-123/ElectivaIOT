import React, { useEffect, useState } from 'react'
import Chart from '../components/Chart'
import { getDatos, getDispositivos } from '../services/api'

const seriesLabels = [
  'Valor 1 (Puerto 10V)',
  'Valor 2 (Puerto 5V)',
  'Valor 3 (Puerto 3.3V)',
  'Valor 4 (Puerto X)'
]

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
  const [reload, setReload] = useState(0)
  const [dbTotal, setDbTotal] = useState(0)

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
    if (initialDevice) setSelected(initialDevice)
  }, [initialDevice])

  useEffect(() => {
    if (!selectedValor) return
    setVisible({
      valor1: selectedValor === 1,
      valor2: selectedValor === 2,
      valor3: selectedValor === 3,
      valor4: selectedValor === 4
    })
  }, [selectedValor])

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
        setDbTotal(r.total || 0)
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
  }, [selected, fetchLimit, reload])

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
  const valuesChrono = valuesAll.slice().sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
  const valuesFilteredByRange = cutoff ? valuesChrono.filter(v => new Date(v.fecha) >= cutoff) : valuesChrono
  const values = (showCount && showCount > 0 && valuesFilteredByRange.length > showCount) ? valuesFilteredByRange.slice(-showCount) : valuesFilteredByRange
  // only show the latest `showCount` points to keep charts readable (0 = all)
  const totalCount = dbTotal
  const sortedDates = valuesChrono.map(v => new Date(v.fecha)).filter(Boolean)
  const earliestDate = sortedDates.length ? sortedDates[0] : null
  const latestDate = sortedDates.length ? sortedDates[sortedDates.length - 1] : null

  const spec = {
    data: { values },
    layer: [
      visible.valor1 ? { mark: { type: 'line', color: '#0ea5e9' }, encoding: { x: { field: 'fecha', type: 'temporal' }, y: { field: 'valor1', type: 'quantitative', axis: { format: '.1f' }, format: '.1f' }, tooltip: [{ field: 'valor1', type: 'quantitative', title: seriesLabels[0], format: '.1f' }] } } : null,
      visible.valor2 ? { mark: { type: 'line', color: '#0ea5a4' }, encoding: { x: { field: 'fecha', type: 'temporal' }, y: { field: 'valor2', type: 'quantitative', axis: { format: '.1f' }, format: '.1f' }, tooltip: [{ field: 'valor2', type: 'quantitative', title: seriesLabels[1], format: '.1f' }] } } : null,
      visible.valor3 ? { mark: { type: 'line', color: '#f59e0b' }, encoding: { x: { field: 'fecha', type: 'temporal' }, y: { field: 'valor3', type: 'quantitative', axis: { format: '.1f' }, format: '.1f' }, tooltip: [{ field: 'valor3', type: 'quantitative', title: seriesLabels[2], format: '.1f' }] } } : null,
      visible.valor4 ? { mark: { type: 'line', color: '#ef4444' }, encoding: { x: { field: 'fecha', type: 'temporal' }, y: { field: 'valor4', type: 'quantitative', axis: { format: '.1f' }, format: '.1f' }, tooltip: [{ field: 'valor4', type: 'quantitative', title: seriesLabels[3], format: '.1f' }] } } : null
    ].filter(Boolean),
    encoding: {
      x: { field: 'fecha', type: 'temporal', title: 'Fecha' }
    },
    // enable pan/zoom via scale binding
    selection: { zoom: { type: 'interval', bind: 'scales', encodings: ['x'] } }
  }

  const downloadCSV = () => {
    const activeSeries = ['valor1','valor2','valor3','valor4'].filter(k => visible[k])
    const rows = values.map(v => {
      const row = { fecha: v.fecha }
      activeSeries.forEach(k => { row[k] = v[k] })
      return row
    })
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
      <div className="page-header">
        <div>
          <h1>Datos Históricos</h1>
          <p>Visualiza y analiza datos históricos de tus dispositivos</p>
        </div>
      </div>

      <div className="historico-meta">
        <div className="meta-card">
          <span className="meta-label">Registros en DB</span>
          <span className="meta-value">{totalCount}</span>
        </div>
        <div className="meta-card">
          <span className="meta-label">Período guardado</span>
          <span className="meta-value">
            {earliestDate && latestDate
              ? `${earliestDate.toLocaleString('es-ES')} — ${latestDate.toLocaleString('es-ES')}`
              : 'Sin datos disponibles'}
          </span>
        </div>
        <div className="meta-card">
          <span className="meta-label">Consultados</span>
          <span className="meta-value">{datos.length}</span>
        </div>
      </div>

      <div className="historico-controls">
        <div className="control-group">
          <label className="control-label">Dispositivo:</label>
          <select value={selected} onChange={e => setSelected(e.target.value)} className="select-input">
            {devices.map(d => <option key={d.uuid} value={d.uuid}>{d.nombre || d.uuid}</option>)}
          </select>
        </div>

        <div className="control-group">
          <label className="control-label">Rango de tiempo:</label>
          <div className="button-group">
            {['1h','6h','24h','7d','all'].map(r => (
              <button 
                key={r} 
                onClick={() => setRange(r)} 
                className={`range-btn ${range === r ? 'active' : ''}`}
              >
                {r === 'all' ? 'Todo' : r}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <button onClick={downloadCSV} className="btn-primary">📥 Descargar CSV</button>
        </div>
      </div>

      <div className="series-controls">
        <label className="control-label">Series a mostrar:</label>
        <div className="series-checkboxes">
          {['valor1','valor2','valor3','valor4'].map((k, idx) => (
            <label key={k} className="checkbox-wrapper">
              <input 
                type="checkbox" 
                checked={visible[k]} 
                onChange={e => setVisible(prev => ({...prev,[k]:e.target.checked}))} 
              />
                  <span style={{color:['#0ea5e9','#0ea5a4','#f59e0b','#ef4444'][idx]}}>
                    {seriesLabels[idx]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="chart-settings">
        <label className="control-label">
          <span>Altura del gráfico:</span>
          <div className="range-input-wrapper">
            <input 
              type="range" 
              min={200} 
              max={1400} 
              value={chartHeight} 
              onChange={e => setChartHeight(Number(e.target.value))} 
              className="range-slider"
            />
            <span className="range-value">{chartHeight}px</span>
          </div>
        </label>

        <label className="control-label">
          <span>Mostrar puntos:</span>
          <select value={showCount} onChange={e => setShowCount(Number(e.target.value))} className="select-input">
            {[100,250,500,1000,2000,5000,10000].map(n => <option key={n} value={n}>{n} puntos</option>)}
            <option value={0}>Todos</option>
          </select>
        </label>

        <label className="control-label">
          <span>Límite de consulta:</span>
          <select value={fetchLimit} onChange={e => setFetchLimit(Number(e.target.value))} className="select-input">
            {[500,1000,5000,10000,20000].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <button onClick={() => { if (selected) { setDatos([]); setReload(r => r + 1) } }} className="btn-secondary">Actualizar</button>
        </label>
      </div>

      {histLoading && <div className="loading-state">Cargando datos...</div>}
      {!histLoading && datos.length === 0 && <div className="empty-state">No hay datos históricos para este dispositivo</div>}

      {datos.length > 0 && (
        <>
          <Chart spec={spec} height={chartHeight} />
        </>
      )}
    </div>
  )
}
