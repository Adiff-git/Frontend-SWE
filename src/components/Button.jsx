import './Button.css'

function Button({ children, loading = false, disabled = false, className = '', type = 'button', emphasis = 'solid', intent = 'brand', size = 'default', ...props }) {
  return (
    <button {...props} type={type} className={`button button--${emphasis} button--${intent} button--${size} ${className}`} disabled={disabled || loading} aria-busy={loading}>
      {loading && <span className="button__spinner" aria-hidden="true" />}
      {children}
    </button>
  )
}

export default Button
