import { render, screen } from '@testing-library/react';
import { Spinner } from '../../../lib/pages/spinner';

describe('Spinner tests', () => {
  it('renders the spinner', () => {
    render(<Spinner />);

    expect(screen.getByText('Spinner')).toBeInTheDocument();
  });
});
