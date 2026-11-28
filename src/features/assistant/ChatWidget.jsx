import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/Button'
import { getMockAssistantResponse } from './mockAssistant'
import './ChatWidget.css'

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [failedTurn, setFailedTurn] = useState(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const panelId = useId()
  const headingId = useId()
  const inputId = useId()
  const hintId = useId()
  const launcherRef = useRef(null)
  const dialogRef = useRef(null)
  const headingRef = useRef(null)
  const hasOpenedRef = useRef(false)
  const messagesRef = useRef(null)
  const inputRef = useRef(null)
  const pinnedRef = useRef(true)
  const pendingRef = useRef(false)
  const requestRef = useRef(null)
  const nextIdRef = useRef(0)

  function scrollToLatest() {
    const container = messagesRef.current
    if (container) container.scrollTop = container.scrollHeight
    pinnedRef.current = true
    setIsNearBottom(true)
  }

  function handleScroll() {
    const container = messagesRef.current
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 48
    pinnedRef.current = nearBottom
    setIsNearBottom(nearBottom)
  }

  async function requestResponse(turn, attempt = 0) {
    pendingRef.current = true
    setIsLoading(true)
    setFailedTurn(null)
    const controller = new AbortController()
    requestRef.current = controller

    try {
      const content = await getMockAssistantResponse(turn.content, { signal: controller.signal, attempt })
      const response = { id: ++nextIdRef.current, role: 'assistant', content }
      setMessages((previous) => [...previous, response])
    } catch (error) {
      if (error.name !== 'AbortError') setFailedTurn({ ...turn, attempt })
    } finally {
      if (!controller.signal.aborted) {
        pendingRef.current = false
        setIsLoading(false)
        requestRef.current = null
      }
    }
  }

  function submitMessage(event) {
    event.preventDefault()
    const content = draft.trim()
    if (!content || pendingRef.current) return

    const turn = { id: ++nextIdRef.current, role: 'user', content }
    pinnedRef.current = true
    setIsNearBottom(true)
    setMessages((previous) => [...previous, turn])
    setDraft('')
    inputRef.current?.focus({ preventScroll: true })
    void requestResponse(turn)
  }

  function retryResponse() {
    if (!failedTurn || pendingRef.current) return
    scrollToLatest()
    void requestResponse(failedTurn, failedTurn.attempt + 1)
  }

  function handleComposerKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229 &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      event.preventDefault()
      if (!event.repeat) submitMessage(event)
    }
  }

  useEffect(() => () => requestRef.current?.abort(), [])

  useEffect(() => {
    if (isOpen && pinnedRef.current) {
      const container = messagesRef.current
      container.scrollTop = container.scrollHeight
    }
  }, [isOpen, messages, isLoading, failedTurn])

  function closeWidget() {
    pinnedRef.current = true
    setIsNearBottom(true)
    setIsOpen(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeWidget()
    }

    if (event.key === 'Tab' && window.matchMedia('(max-width: 767px)').matches) {
      const controls = dialogRef.current.querySelectorAll('button:not(:disabled), a[href], textarea:not(:disabled), [tabindex="0"]')
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && (event.target === first || event.target === headingRef.current)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && event.target === last) {
        event.preventDefault()
        first.focus()
      }
    }
  }

  useEffect(() => {
    if (!isOpen) {
      if (hasOpenedRef.current) launcherRef.current?.focus({ preventScroll: true })
      return
    }
    hasOpenedRef.current = true

    const dialog = dialogRef.current
    const mobile = window.matchMedia('(max-width: 767px)')
    let restoreScrolling = () => {}

    function updateDialog() {
      const focusedElement = dialog.contains(document.activeElement)
        ? document.activeElement
        : headingRef.current

      // Changing between modal and non-modal requires closing the native dialog.
      dialog.close()
      restoreScrolling()

      if (mobile.matches) {
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        restoreScrolling = () => {
          document.body.style.overflow = previousOverflow
        }
        dialog.setAttribute('aria-modal', 'true')
        dialog.showModal()
      } else {
        restoreScrolling = () => {}
        dialog.removeAttribute('aria-modal')
        dialog.show()
      }

      focusedElement?.focus({ preventScroll: true })
      if (pinnedRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }

    updateDialog()
    mobile.addEventListener('change', updateDialog)

    return () => {
      mobile.removeEventListener('change', updateDialog)
      restoreScrolling()
      dialog.close()
    }
  }, [isOpen])

  return (
    <div className="chat-widget" lang="en">
      <button
        ref={launcherRef}
        type="button"
        className="chat-widget__launcher"
        hidden={isOpen}
        aria-label="Open shopping assistant"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-haspopup="dialog"
        title="Open shopping assistant"
        onClick={() => setIsOpen(true)}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 11.5a8 8 0 0 1-8 8H4l-2 2v-10a9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M7 10h8M7 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        id={panelId}
        className="chat-widget__panel"
        aria-labelledby={headingId}
        onCancel={(event) => {
          event.preventDefault()
          closeWidget()
        }}
        onKeyDown={handleKeyDown}
      >
        <header className="chat-widget__header">
          <div className="chat-widget__identity">
            <h2 ref={headingRef} id={headingId} tabIndex={-1} className="chat-widget__title">
              Chạm Tech Assistant
            </h2>
            <p className="chat-widget__subtitle">Shopping assistant · Mock demo</p>
          </div>
          <button type="button" className="chat-widget__close" aria-label="Close shopping assistant" onClick={closeWidget}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <section ref={messagesRef} className="chat-widget__messages" aria-label="Conversation" tabIndex={0} onScroll={handleScroll}>
          {messages.length === 0 && (
            <div className="chat-widget__welcome">
              <div className="chat-widget__message">
                <p className="chat-widget__sender">Assistant · Demo</p>
                <p>Hi! Welcome to Chạm Tech. What are you shopping for today?</p>
              </div>
              <p className="chat-widget__hint">Try this interface with local sample replies. No AI service is connected.</p>
            </div>
          )}
          <div role="log" aria-label="Messages" aria-live={isOpen ? 'polite' : 'off'} aria-relevant="additions" className="chat-widget__history">
            {messages.map((message) => (
              <div key={message.id} className={`chat-widget__message chat-widget__message--${message.role}`}>
                <p className="chat-widget__sender">{message.role === 'user' ? 'You' : 'Assistant · Demo'}</p>
                <p className="chat-widget__content">{message.content}</p>
              </div>
            ))}
          </div>
          <p role="status" className="chat-widget__status">{isLoading ? 'Preparing a mock response…' : ''}</p>
          {failedTurn && (
            <div className="chat-widget__error">
              <p role="alert">We couldn’t generate the mock response. Please try again.</p>
              <Button onClick={retryResponse}>Try again</Button>
            </div>
          )}
          <Link className="chat-widget__browse" to="/products">Browse products →</Link>
        </section>

        <footer className="chat-widget__footer">
          {!isNearBottom && <button type="button" className="chat-widget__latest" onClick={scrollToLatest}>Latest messages ↓</button>}
          <form onSubmit={submitMessage}>
            <label className="chat-widget__label" htmlFor={inputId}>Message the assistant</label>
            <div className="chat-widget__composer">
              <textarea
                ref={inputRef}
                id={inputId}
                className="chat-widget__input"
                rows={2}
                maxLength={2000}
                placeholder="Ask about a product…"
                aria-describedby={hintId}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
              />
              <Button type="submit" className="chat-widget__send" loading={isLoading} disabled={!draft.trim()} aria-label="Send message">
                <span aria-hidden="true">↑</span>
              </Button>
            </div>
            <p id={hintId} className="chat-widget__composer-hint">Demo only · 2,000 character limit. Shift+Enter for a new line; on touch devices, use Send.</p>
            {draft.length >= 1800 && <p className="chat-widget__composer-hint">{2000 - draft.length} characters remaining</p>}
          </form>
        </footer>
      </dialog>
    </div>
  )
}

export default ChatWidget
