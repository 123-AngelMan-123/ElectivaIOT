import React, { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import Chart from '../components/Chart'
import AnimatedNumber from '../components/AnimatedNumber'
import StatusIndicator from '../components/StatusIndicator'
import Statistics from '../components/Statistics'
import ValueAlert from '../components/ValueAlert'
import { getDatos } from '../services/api'
import { useToast } from '../context/ToastContext'

const valueLabels = [
  'Valor 1 (Puerto 10V)',
  'Valor 2 (Puerto 5V)',
  'Valor 3 (Puerto 3.3V)',
  'Valor 4 (Puerto X)'
]

// Usar la misma variable de entorno que en el servicio API (8080 por defecto)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

function makeSpec(values, color){
  return {
    data: { values },
    mark: { type: 'area', point: false, opacity: 0.9, color },
    encoding: {
      x: { field: 'fecha', type: 'temporal', title: null },
      y: { field: 'valor', type: 'quantitative', title: null, axis: { format: '.1f' }, format: '.1f' },
      tooltip: [
        { field: 'fecha', type: 'temporal', title: 'Fecha' },
        { field: 'valor', type: 'quantitative', title: 'Valor', format: '.1f' }
      ]
    },
    config: { view: { stroke: 'transparent' } }
  }
}

export default function Realtime({ onOpenHistorico }) {
  const [devices, setDevices] = useState({})
  const [modalUuid, setModalUuid] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('offline')
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()
  const socketRef = useRef(null)
  const lastUpdateRef = useRef({})

  useEffect(() => {
    // Inicializar con datos recientes para poblar el estado
    (async () => {
      try {
        setLoading(true)
        const resp = await getDatos({ limite: 500 })
        const list = resp.datos || []
        const map = {}
        for (let d of list.reverse()) {
          const u = d.dispositivo_uuid || 'unknown'
          if (!map[u]) map[u] = { latest: null, history: [], status: 'online', lastSeen: new Date() }
          map[u].history.push(d)
          map[u].latest = d
          map[u].lastSeen = new Date(d.fecha_insercion)
        }
        setDevices(map)
        setLoading(false)
        // show a one-time info toast
        try { addToast && addToast('Datos iniciales cargados', 'info', 2500) } catch(e){}
      } catch (e) {
        console.error('Error cargando datos iniciales', e)
        setLoading(false)
      }
    })()

    // Conectar al socket para datos en tiempo real (mismo host que la API)
    socketRef.current = io(API_URL, { reconnection: true, reconnectionDelay: 1000, reconnectionDelayMax: 5000, reconnectionAttempts: Infinity })
    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('Conectado al servidor')
      setConnectionStatus('online')
      try { addToast && addToast('Conexión establecida', 'success', 2000) } catch(e){}
    })

    socket.on('disconnect', () => {
      console.log('Desconectado del servidor')
      setConnectionStatus('offline')
      try { addToast && addToast('Conexión perdida', 'error', 4000) } catch(e){}
    })

    socket.on('nuevoDato', (dato) => {
      const deviceId = dato.dispositivo_uuid || 'unknown'
      lastUpdateRef.current[deviceId] = Date.now()
      
      setDevices(prev => {
        const map = { ...prev }
        const u = dato.dispositivo_uuid || 'unknown'
        if (!map[u]) map[u] = { latest: null, history: [], status: 'online', lastSeen: new Date() }
        // push to history (keep up to 100)
        const h = (map[u].history || []).slice()
        h.push(dato)
        if (h.length > 100) h.splice(0, h.length - 100)
        map[u] = { latest: dato, history: h, status: 'online', lastSeen: new Date(dato.fecha_insercion) }
        return map
      })
    })

    return () => {
      if (socket) socket.disconnect()
    }
  }, [])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Monitoreo en Tiempo Real</h1>
          <p>Visualiza las lecturas actuales de tus dispositivos IoT</p>
        </div>
        <div className="connection-status">
          <StatusIndicator status={connectionStatus} tooltip={connectionStatus === 'online' ? 'Conexión activa' : 'Conexión perdida'} />
        </div>
      </div>

      <div className="devices-grid">
        {loading && <div className="loading-state">Cargando dispositivos...</div>}
        {!loading && Object.keys(devices).length === 0 && <div className="empty-state">No hay dispositivos disponibles</div>}

        {Object.entries(devices).map(([uuid, info]) => (
          <div className="device-card" key={uuid}>
            <div className="device-card-header">
              <button className="uuid-button" onClick={() => setModalUuid(uuid)}>
                UUID
              </button>
              <StatusIndicator status={info.status || 'offline'} />
            </div>

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
                        <div className="value-label">{valueLabels[i-1]}</div>
                        <div className="value-number" style={{color: colors[i-1]}}>
                          <AnimatedNumber value={latest} duration={550} />
                        </div>
                      </div>
                      <div className="value-chart">
                        <Chart spec={makeSpec(values, colors[i-1])} height={140} compact={true} />
                      </div>
                      <ValueAlert value={latest} label={`Valor ${i}`} />
                      <Statistics data={values} />
                    </div>
                  )
                })
              })()}
            </div>

            <div className="device-footer">
              <span className="ts">Última actualización: {info.latest?.fecha_insercion ? new Date(info.latest.fecha_insercion).toLocaleString('es-ES') : 'N/A'}</span>
            </div>
          </div>
        ))}
      </div>
      {modalUuid && (
        <div className="uuid-modal-overlay" onClick={() => setModalUuid(null)}>
          <div className="uuid-modal" onClick={e => e.stopPropagation()}>
            <button className="uuid-modal-close" onClick={() => setModalUuid(null)} aria-label="Cerrar ventana">×</button>
            <h2>UUID del dispositivo</h2>
            <p>{modalUuid}</p>
          </div>
        </div>
      )}
    </div>
  )
}
