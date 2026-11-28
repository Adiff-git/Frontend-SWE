import { useId } from 'react'
import './FormField.css'

function FormField({ label, error, hint, trailing, id: providedId, ...props }) {
  const generatedId = useId()
  const id = providedId || generatedId
  const description = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ')

  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>{label}</label>
      <div className={`form-field__control${error ? ' form-field__control--invalid' : ''}`}>
        <input {...props} id={id} className="form-field__input" aria-invalid={Boolean(error)} aria-describedby={description || undefined} />
        {trailing}
      </div>
      {hint && <p className="form-field__hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="form-field__error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}

export default FormField
