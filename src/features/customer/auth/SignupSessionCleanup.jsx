import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { signupSessionStore } from './signupSessionStore';

// Mount above the route layouts so leaving AuthLayout is observed as well.
export default function SignupSessionCleanup() {
  const { pathname } = useLocation();
  const previous = useRef({ pathname, sessionId: signupSessionStore.get()?.id });

  useLayoutEffect(() => {
    const from = previous.current;
    if (from.pathname === '/signup/verify' && pathname !== from.pathname) {
      if (from.sessionId !== undefined) signupSessionStore.clear(from.sessionId);
    }
    previous.current = { pathname, sessionId: signupSessionStore.get()?.id };
  }, [pathname]);

  return null;
}
