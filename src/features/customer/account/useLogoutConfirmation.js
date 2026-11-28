import { useContext } from 'react';
import { LogoutConfirmationContext } from './LogoutConfirmationContext';

export default function useLogoutConfirmation() {
  const context = useContext(LogoutConfirmationContext);
  if (!context) {
    throw new Error('useLogoutConfirmation must be used within LogoutConfirmationProvider');
  }
  return context;
}

