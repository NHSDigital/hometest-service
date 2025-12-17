import { render, screen } from '@testing-library/react';
import AboutThisSoftwarePage from '../../routes/AboutThisSoftwarePage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';

describe('AboutThisSoftware tests', () => {
  test('renders the correct content', () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={new QueryClient()}>
          <AboutThisSoftwarePage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    // assert
    expect(screen.getByText('Software information')).toBeInTheDocument();
  });
});
