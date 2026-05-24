import React, { useState, useEffect, useCallback } from 'react'
import Realtime from './pages/Realtime'
import Historico from './pages/Historico'

export default function App() {
  // page state will be mirrored to history.state so back/forward works
  const [page, setPage] = useState(() => (history.state && history.state.page) || 'realtime')
  const [selectedDevice, setSelectedDevice] = useState(() => (history.state && history.state.selectedDevice) || '')
  const [selectedValor, setSelectedValor] = useState(() => (history.state && history.state.selectedValor) || null)

  const pushState = useCallback((newPage, device, valor) => {
    const state = { page: newPage, selectedDevice: device || '', selectedValor: valor || null }
    // push new state so browser back/forward works
    window.history.pushState(state, '', '')
    setPage(state.page)
    setSelectedDevice(state.selectedDevice)
    setSelectedValor(state.selectedValor)
  }, [])

  // Helper to open historico from realtime cards
  const openHistorico = (deviceUuid, valorIndex) => {
    pushState('historico', deviceUuid, valorIndex)
  }

  useEffect(() => {
    const onPop = (ev) => {
      const st = ev.state || { page: 'realtime', selectedDevice: '', selectedValor: null }
      setPage(st.page || 'realtime')
      setSelectedDevice(st.selectedDevice || '')
      setSelectedValor(st.selectedValor || null)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return (
    <div className="app-root">
      <aside className="sidebar">
        <h2>Electiva</h2>
        <nav>
          <button onClick={() => pushState('realtime')} className={page==='realtime'? 'active':''}>Tiempo Real</button>
          <button onClick={() => pushState('historico')} className={page==='historico'? 'active':''}>Históricos</button>
        </nav>
      </aside>

      <main className="main-area">
        {page === 'realtime' && <Realtime onOpenHistorico={openHistorico} />}
        {page === 'historico' && <Historico selectedDevice={selectedDevice} selectedValor={selectedValor} />}
      </main>
    </div>
  )
}
