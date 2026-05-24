import React, { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import Chart from '../components/Chart'
import AnimatedNumber from '../components/AnimatedNumber'
import { getDatos } from '../services/api'

// Usar la misma variable de entorno que en el servicio API (8080 por defecto)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function makeSpec(values, color){
  return {
    data: { values },
    mark: { type: 'area', point: false, opacity: 0.9, color },
    encoding: {
      x: { field: 'fecha', type: 'temporal', title: null },
      y: { field: 'valor', type: 'quantitative', title: null }
    , tooltip: [
        { field: 'fecha', type: 'temporal', title: 'Fecha' },
        { field: 'valor', type: 'quantitative', title: 'Valor' }
      ]
    },
    config: { view: { stroke: 'transparent' } }
  }
}

export default function Realtime({ onOpenHistorico }) {
  const [devices, setDevices] = useState({})
  const socketRef = useRef(null)

  useEffect(() => {
    // Inicializar con datos recientes para poblar el estado
    (async () => {
      try {
        const resp = await getDatos({ limite: 500 })
        const list = resp.datos || []
        const map = {}
        for (let d of list.reverse()) {
          const u = d.dispositivo_uuid || 'unknown'
          if (!map[u]) map[u] = { latest: null, history: [] }
          map[u].history.push(d)
          map[u].latest = d
        }
        setDevices(map)
      } catch (e) {
        console.error('Error cargando datos iniciales', e)
      }
    })()

    // Conectar al socket para datos en tiempo real (mismo host que la API)
    socketRef.current = io(API_URL)
    const socket = socketRef.current

    socket.on('connect', () => console.log('WS conectado', socket.id))
    socket.on('nuevoDato', (dato) => {
      setDevices(prev => {
        const map = { ...prev }
        const u = dato.dispositivo_uuid || 'unknown'
        if (!map[u]) map[u] = { latest: null, history: [] }
        // push to history (keep up to 100)
        const h = (map[u].history || []).slice()
        h.push(dato)
        if (h.length > 100) h.splice(0, h.length - 100)
        map[u] = { latest: dato, history: h }
        return map
      })
    })

    return () => {
      if (socket) socket.disconnect()
    }
  }, [])

  return (
    <div>
      <h1>Tiempo Real</h1>
      <p>Lecturas recibidas en vivo. Conectar al backend en <code>{API_URL}</code>.</p>

      <div className="devices-grid">
        {Object.keys(devices).length === 0 && <div>No hay datos aún.</div>}

        {Object.entries(devices).map(([uuid, info]) => (
          <div className="device-card" key={uuid}>
            <h3 className="device-title">{uuid}</h3>

            <div className="values-grid">
              {(() => {
                const colors = ['#0ea5e9', '#0ea5a4', '#f59e0b', '#ef4444']
                return [1,2,3,4].map(i => {
                  const key = `valor${i}`
                  const latest = info.latest ? info.latest[key] : null
                  const values = (info.history || []).map(h => ({ fecha: h.fecha_insercion, valor: h[key] != null ? Number(h[key]) : null }))
                  return (
                    <div className="value-card" key={key} onClick={() => onOpenHistorico && onOpenHistorico(uuid, i)} role="button" tabIndex={0}>
                      <div className="value-head">
                        <div className="value-label">Valor {i}</div>
                        <div className="value-number" style={{color: colors[i-1]}}>
                          <AnimatedNumber value={latest} duration={550} />
                        </div>
                      </div>
                      <div className="value-chart">
                        <Chart spec={makeSpec(values, colors[i-1])} height={140} />
                      </div>
                    </div>
                  )
                })
              })()}
            </div>

            <div className="ts">{info.latest?.fecha_insercion ? new Date(info.latest.fecha_insercion).toLocaleString() : ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
