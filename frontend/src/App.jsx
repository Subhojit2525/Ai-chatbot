import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('Connecting')
  const [errorMessage, setErrorMessage] = useState('')
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000')
    socketRef.current = socket

    socket.on('connect', () => {
      setConnectionStatus('Connected')
      setErrorMessage('')
    })
    socket.on('disconnect', () => setConnectionStatus('Disconnected'))
    socket.on('connect_error', () => {
      setConnectionStatus('Disconnected')
      setErrorMessage('Could not connect to the chat server. Check that it is running.')
    })
    socket.on('ai-message-response', (text) => {
      if (typeof text !== 'string' || !text.trim()) {
        setErrorMessage('The assistant returned an empty response. Please try again.')
        return
      }

      setConversation((messages) => [
        ...messages,
        { id: crypto.randomUUID(), text, sender: 'assistant' },
      ])
    })
    socket.on('ai-message-error', () => {
      setErrorMessage('The assistant could not respond. Please try again.')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  function sendMessage(event) {
    event.preventDefault()
    const text = message.trim()

    if (!text) return
    if (!socketRef.current?.connected) {
      setErrorMessage('You are not connected to the chat server.')
      return
    }

    setConversation((messages) => [
      ...messages,
      { id: crypto.randomUUID(), text, sender: 'user' },
    ])
    setMessage('')
    setErrorMessage('')
    socketRef.current.emit('ai-message', text)
  }

  return (
    <main className="chat-app">
      <header className="chat-header">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M5 5.75A2.75 2.75 0 0 1 7.75 3h8.5A2.75 2.75 0 0 1 19 5.75v7.5A2.75 2.75 0 0 1 16.25 16H11l-4.5 4v-4.25A2.75 2.75 0 0 1 5 13.25v-7.5Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M9 8h6M9 11.5h4"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="header-copy">
          <h1>Conversation</h1>
          <p>Your personal chat space</p>
        </div>
        <div className={`connection-status connection-status--${connectionStatus.toLowerCase()}`}>
          <span className="status-dot" />
          {connectionStatus}
        </div>
      </header>

      <section className="chat-content" aria-label="Chat conversation">
        {conversation.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none">
                <path
                  d="M10 11.5A5.5 5.5 0 0 1 15.5 6h17a5.5 5.5 0 0 1 5.5 5.5v15a5.5 5.5 0 0 1-5.5 5.5H22l-9 8v-8.76a5.5 5.5 0 0 1-3-4.74v-15Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M18 17h12M18 23h8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2>A fresh conversation</h2>
            <p>Send a message to get things started.</p>
          </div>
        ) : (
          <ol className="message-list" aria-live="polite">
            {conversation.map((item) => (
              <li className={`message-row message-row--${item.sender}`} key={item.id}>
                <div className="message-avatar" aria-hidden="true">
                  {item.sender === 'assistant' ? 'AI' : 'Y'}
                </div>
                <div className="message-body">
                  <span className="message-author">
                    {item.sender === 'assistant' ? 'Assistant' : 'You'}
                  </span>
                  <p className="message-bubble">{item.text}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <footer className="composer-area">
        {errorMessage && (
          <p className="chat-error" role="alert">
            {errorMessage}
          </p>
        )}
        <form className="message-composer" onSubmit={sendMessage}>
          <label className="visually-hidden" htmlFor="message-input">
            Write a message
          </label>
          <input
            id="message-input"
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write your message..."
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!message.trim() || connectionStatus !== 'Connected'}
            aria-label="Send message"
          >
            <span>Send</span>
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3.5 10h12m-5-5 5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
        <p className="composer-hint">Press Enter to send</p>
      </footer>
    </main>
  )
}

export default App
