import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormButton, {
  type SubmitValidationResult
} from '../../../lib/components/FormButton';

describe('FormButton Component', () => {
  test('renders children correctly', () => {
    render(<FormButton onButtonClick={jest.fn()}>Continue</FormButton>);
    expect(
      screen.getByRole('button', { name: 'Continue' })
    ).toBeInTheDocument();
  });

  test('calls onButtonClick on click', async () => {
    const mockOnButtonClick = jest
      .fn()
      .mockResolvedValue({ isSubmitValid: true });
    render(<FormButton onButtonClick={mockOnButtonClick}>Continue</FormButton>);

    const button = screen.getByRole('button', { name: 'Continue' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnButtonClick).toHaveBeenCalledTimes(1);
    });
  });

  test('disables the button while processing and re-enables it after', async () => {
    const mockOnButtonClick = jest
      .fn()
      .mockImplementation(
        async () =>
          new Promise<SubmitValidationResult>((resolve) =>
            setTimeout(() => resolve({ isSubmitValid: true }), 100)
          )
      );

    render(<FormButton onButtonClick={mockOnButtonClick}>Continue</FormButton>);

    const button = screen.getByRole('button', { name: 'Continue' });
    expect(button).toBeEnabled();

    fireEvent.click(button);
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(button).toBeEnabled();
    });
  });

  test('focuses error summary when isSubmitValid is false', async () => {
    const mockOnButtonClick = jest
      .fn()
      .mockResolvedValue({ isSubmitValid: false });

    render(
      <>
        <div className="nhsuk-error-summary" tabIndex={-1}>
          Error Summary
        </div>
        <FormButton onButtonClick={mockOnButtonClick}>Continue</FormButton>
      </>
    );

    const button = screen.getByRole('button', { name: 'Continue' });
    fireEvent.click(button);

    await waitFor(() => {
      const errorSummary = screen.getByText('Error Summary');
      expect(errorSummary).toHaveFocus();
    });
  });

  test('does not call onButtonClick when button is disabled', async () => {
    const mockOnButtonClick = jest
      .fn()
      .mockResolvedValue({ isSubmitValid: true });

    render(<FormButton onButtonClick={mockOnButtonClick}>Continue</FormButton>);

    const button = screen.getByRole('button', { name: 'Continue' });

    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockOnButtonClick).toHaveBeenCalledTimes(1);
    });
  });
});
