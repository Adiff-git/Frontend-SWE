import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthProvider from './features/customer/auth/AuthProvider';
import App from './App.jsx';
import { captureGoogleCallback } from './features/customer/auth/googleFlow';
import './index.css';

const queryClient = new QueryClient();
const googleCallback = captureGoogleCallback();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
        <App googleCallback={googleCallback} />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
