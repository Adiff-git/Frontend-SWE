import { createContext, useContext } from 'react';

export const LiveAdminContext = createContext(null);

export const useLiveAdmin = () => useContext(LiveAdminContext);
