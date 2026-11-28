let activeSession = null;
let currentSessionId = 0;

export const signupSessionStore = {
  set(session) {
    currentSessionId += 1;
    activeSession = {
      id: currentSessionId,
      pendingRegistration: session.pendingRegistration,
      email: session.email,
      password: session.password,
      displayName: session.displayName || '',
      destination: session.destination || '/',
      createdAt: Date.now(),
    };
    return currentSessionId;
  },
  get() {
    return activeSession;
  },
  updatePending(targetId, pendingRegistration) {
    if (typeof targetId !== 'number' || !pendingRegistration) return false;
    if (!activeSession || activeSession.id !== targetId) return false;
    activeSession.pendingRegistration = pendingRegistration;
    return true;
  },
  clear(targetId) {
    if (targetId && activeSession && activeSession.id !== targetId) {
      return;
    }
    if (activeSession) {
      activeSession.password = null;
      activeSession.pendingRegistration = null;
    }
    activeSession = null;
  },
  hasSession() {
    return Boolean(activeSession && activeSession.pendingRegistration && activeSession.password);
  },
};