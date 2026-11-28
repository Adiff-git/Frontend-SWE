import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './ChatWidget.css'

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const panelId = useId()
  const headingId = useId()
  const launcherRef = useRef(null)
  const dialogRef = useRef(null)
  const headingRef = useRef(null)
  const hasOpenedRef = useRef(false)

  function closeWidget() {
    setIsOpen(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      closeWidget()
    }

    if (event.key === 'Tab' && window.matchMedia('(max-width: 767px)').matches) {
      const controls = dialogRef.current.querySelectorAll('button, a[href], [tabindex="0"]')
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
    <div className="chat-widget">
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
            <p className="chat-widget__subtitle">AI shopping assistant</p>
          </div>
          <button type="button" className="chat-widget__close" aria-label="Close shopping assistant" onClick={closeWidget}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <section className="chat-widget__messages" aria-label="Conversation preview" tabIndex={0}>
          <div className="chat-widget__message">
            <p className="chat-widget__sender">Assistant</p>
            <p>Hi! Welcome to Chạm Tech. What are you shopping for today?</p>
          </div>
          <p className="chat-widget__hint">Explore laptops, headphones, and more while we get your shopping assistant ready.</p>
          <Link className="chat-widget__browse" to="/products">Browse products →</Link>
        </section>

        <footer className="chat-widget__footer">
          <p>Preview only · Messaging is coming soon.</p>
        </footer>
      </dialog>
    </div>
  )
}

export default ChatWidget
