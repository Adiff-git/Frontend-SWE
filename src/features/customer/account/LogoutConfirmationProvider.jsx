import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import { LogoutConfirmationContext } from './LogoutConfirmationContext';
import LogoutConfirmDialog from './LogoutConfirmDialog';

export default function LogoutConfirmationProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const requestLogout = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    if (!isPending) {
      setIsOpen(false);
    }
  }, [isPending]);

  const confirmLogout = useCallback(async () => {
    setIsPending(true);
    try {
      await logout();
      setIsOpen(false);
      navigate('/login', { state: { loggedOut: true }, replace: true });
    } finally {
      setIsPending(false);
    }
  }, [logout, navigate]);

  return (
    <LogoutConfirmationContext.Provider value={{ requestLogout }}>
      {children}
      <LogoutConfirmDialog
        open={isOpen}
        onClose={closeDialog}
        onConfirm={confirmLogout}
        pending={isPending}
      />
    </LogoutConfirmationContext.Provider>
  );
}

