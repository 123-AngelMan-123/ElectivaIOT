import React, { useState, useEffect, useCallback } from 'react'
import { useTheme } from './context/ThemeContext'
import Realtime from './pages/Realtime'
import Historico from './pages/Historico'

export default function App() {
  const { isDark, toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  
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
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>Electiva IoT</h2>
          <div className="sidebar-actions">
            <button
              className="icon-button collapse-toggle"
              onClick={() => setCollapsed(s => !s)}
              title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {collapsed ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
            <button 
              className="icon-button theme-toggle" 
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {isDark ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <nav>
          <button onClick={() => pushState('realtime')} className={page==='realtime'? 'active':''}>
            <span className="nav-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12h3l2-5 4 10 2-6 4 5h2" />
                <path d="M3 19h18" />
                <path d="M6 16v3" />
              </svg>
            </span>
            <span className="nav-label">Tiempo Real</span>
          </button>
          <button onClick={() => pushState('historico')} className={page==='historico'? 'active':''}>
            <span className="nav-icon" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19h16" />
                <path d="M4 5v14" />
                <path d="M8 15l3-4 4 5 5-8" />
                <path d="M20 11v8" />
              </svg>
            </span>
            <span className="nav-label">Histórico</span>
          </button>
        </nav>
      </aside>

      <main className="main-area">
        {page === 'realtime' && <Realtime onOpenHistorico={openHistorico} />}
        {page === 'historico' && <Historico selectedDevice={selectedDevice} selectedValor={selectedValor} />}
      </main>
    </div>
  )
}

