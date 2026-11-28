import { useState } from 'react'
import FormField from '../../../components/FormField'
import eye from '../../../assets/auth/eye.svg'

function PasswordField(props) {
  const [visible, setVisible] = useState(false)
  return (
    <FormField {...props} type={visible ? 'text' : 'password'} trailing={
      <button type="button" className="auth-form__password-toggle" onClick={() => setVisible(!visible)} disabled={props.disabled}
        aria-label={`${visible ? 'Ẩn' : 'Hiện'} ${props.label.toLowerCase()}`} aria-pressed={visible}>
        <img src={eye} alt="" width="18" height="18" />
      </button>
    } />
  )
}

export default PasswordField
