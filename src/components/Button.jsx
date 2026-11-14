import './Button.css'

function Button({ children, loading = false, disabled = false, className = '', type = 'button', ...props }) {
  return (
    <button {...props} type={type} className={`button ${className}`} disabled={disabled || loading} aria-busy={loading}>
      {loading && <span className="button__spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}

export default Button
