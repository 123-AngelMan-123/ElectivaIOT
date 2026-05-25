import React, { useState, useEffect, useRef } from 'react'
import { chatQuery } from '../services/api'

const initialAssistantMessage = 'Hola, soy el asistente de Electiva IoT. Pregúntame sobre los datos guardados en la base y te respondo con la información disponible.'

export default function ChatBot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: initialAssistantMessage }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    const userMessage = { role: 'user', text: trimmed }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await chatQuery(trimmed)
      const assistantText = response?.answer || 'No pude generar una respuesta en este momento.'
      setMessages(prev => [...prev, { role: 'assistant', text: assistantText }])
    } catch (error) {
      console.error('Chat error', error)
      setMessages(prev => [...prev, { role: 'assistant', text: 'Ocurrió un error al consultar la base de datos. Intenta de nuevo.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (ev) => {
    if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="chat-page">
      <div className="page-header">
        <div>
          <h1>Chat Bot</h1>
          <p>Haz preguntas sobre los datos guardados en la base de datos del sistema.</p>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div key={index} className={`chat-message ${message.role}`}>
              <div className="chat-bubble">
                <span>{message.text}</span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-row">
          <textarea
            className="chat-input"
            value={input}
            placeholder="Escribe tu pregunta aquí..."
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
          />
          <button className="btn-primary chat-send" onClick={handleSend} disabled={loading}>
            {loading ? 'Pensando...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  )
}
