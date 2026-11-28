import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../src/features/customer/auth/authContext';
import { authenticatedAuthValue } from './authFixtures.js';

export function renderWithProviders(ui, options = {}) {
  const {
    authValue = authenticatedAuthValue,
    initialEntries = ['/cart'],
  } = options;
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

export * from '@testing-library/react';
