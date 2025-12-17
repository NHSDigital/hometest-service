import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import RadiosConfirm from '../../../lib/components/radios-confirm';
import { usePageTitleContext } from '../../../lib/contexts/PageTitleContext';

describe('RadiosConfirm tests', () => {
  const handleNext = jest.fn();
  const errorMessage = 'Error Displayed';
  const title = 'Title Of Basic Confirmation Page';
  const idOfRadioParent = 'confirm-radio';
  const textOnTrueRadioButton = 'True Button';
  const textOnFalseRadioButton = 'False Button';
  let setIsPageInErrorMock: jest.Mock;

  beforeEach(() => {
    handleNext.mockReset();
    setIsPageInErrorMock = jest.fn();
    (usePageTitleContext as jest.Mock).mockReturnValue({
      isPageInError: false,
      setIsPageInError: setIsPageInErrorMock
    });
  });

  it('renders a basic page with true or false radio buttons', () => {
    render(
      <RadiosConfirm
        errorMessage={errorMessage}
        titleOfRadio={title}
        initialValue={null}
        idOfRadioParent={idOfRadioParent}
        booleanTexts={{
          isTrue: textOnTrueRadioButton,
          isFalse: textOnFalseRadioButton
        }}
        onContinue={handleNext}
      />
    );

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(textOnTrueRadioButton)).toBeInTheDocument();
    expect(screen.getByText(textOnFalseRadioButton)).toBeInTheDocument();
  });

  it('clicking true passes true to the handleNext method', async () => {
    render(
      <RadiosConfirm
        errorMessage={errorMessage}
        titleOfRadio={title}
        initialValue={null}
        idOfRadioParent={idOfRadioParent}
        booleanTexts={{
          isTrue: textOnTrueRadioButton,
          isFalse: textOnFalseRadioButton
        }}
        onContinue={handleNext}
      />
    );

    const trueRadioButton = screen.getByText(textOnTrueRadioButton);
    await userEvent.click(trueRadioButton);

    const element = screen.getByText('Continue');
    await userEvent.click(element);
    expect(handleNext).toHaveBeenCalledWith(true);
    expect(screen.queryByText(`There is a problem`)).not.toBeInTheDocument();
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
  });

  it('clicking false passes false to the handleNext method', async () => {
    render(
      <RadiosConfirm
        errorMessage={errorMessage}
        titleOfRadio={title}
        initialValue={null}
        idOfRadioParent={idOfRadioParent}
        booleanTexts={{
          isTrue: textOnTrueRadioButton,
          isFalse: textOnFalseRadioButton
        }}
        onContinue={handleNext}
      />
    );

    const trueRadioButton = screen.getByText(textOnFalseRadioButton);
    await userEvent.click(trueRadioButton);

    const element = screen.getByText('Continue');
    await userEvent.click(element);
    expect(handleNext).toHaveBeenCalledWith(false);
    expect(screen.queryByText(`There is a problem`)).not.toBeInTheDocument();
    expect(setIsPageInErrorMock).not.toHaveBeenCalled();
  });

  it('clicking continue without selecting a radio button causes error to appear', async () => {
    render(
      <RadiosConfirm
        errorMessage={errorMessage}
        titleOfRadio={title}
        initialValue={null}
        idOfRadioParent={idOfRadioParent}
        booleanTexts={{
          isTrue: textOnTrueRadioButton,
          isFalse: textOnFalseRadioButton
        }}
        onContinue={handleNext}
      />
    );

    const element = screen.getByText('Continue');
    await userEvent.click(element);
    expect(handleNext).toHaveBeenCalledTimes(0);
    expect(screen.getByText(`There is a problem`)).toBeInTheDocument();
    expect(setIsPageInErrorMock).toHaveBeenCalledWith(true);
  });
});
