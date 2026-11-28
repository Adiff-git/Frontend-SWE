// Local UI fixtures only: no AI service, catalogue lookup, or network requests.
// Send /demo-error to fail the first attempt; retrying that turn succeeds.
export function getMockAssistantResponse(message, { signal, attempt = 0 } = {}) {
  return new Promise((resolve, reject) => {
    function abort() {
      clearTimeout(timer)
      reject(new DOMException('Mock response cancelled', 'AbortError'))
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort)

      if (message.trim() === '/demo-error' && attempt === 0) {
        reject(new Error('Simulated mock response failure'))
        return
      }

      const query = message.toLowerCase()
      let text = 'Tell me your budget, preferred category, and how you plan to use the product. You can browse the product catalogue to check current details.'
      if (/laptop|máy tính/.test(query)) {
        text = 'For a laptop, consider your budget, portability, memory, and battery needs.\nAre you mainly studying, working, or gaming? Browse products to compare the actual specifications and prices.'
      } else if (/headphone|tai nghe/.test(query)) {
        text = 'For headphones, consider comfort, wired or wireless connectivity, and whether you need noise cancellation.\nWhat is your budget, and where will you use them most?'
      } else if (message.trim() === '/demo-error') {
        text = 'The simulated retry succeeded. Your earlier message was kept without adding a duplicate.'
      }

      resolve(`Mock response — demo only.\n${text}`)
    }, 900)

    if (signal?.aborted) abort()
    else signal?.addEventListener('abort', abort, { once: true })
  })
}
