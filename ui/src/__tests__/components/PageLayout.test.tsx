import { render, screen } from '@testing-library/react';
import { PageLayout } from '@/components/PageLayout';
import '@testing-library/jest-dom';

describe('PageLayout', () => {
  it('renders without crashing', () => {
    render(
      <PageLayout>
        <div>Test content</div>
      </PageLayout>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    const testText = 'Hello, World!';
    render(
      <PageLayout>
        <p>{testText}</p>
      </PageLayout>
    );
    expect(screen.getByText(testText)).toBeInTheDocument();
  });

  it('renders multiple children', () => {
    render(
      <PageLayout>
        <h1>Heading</h1>
        <p>Paragraph</p>
        <button>Button</button>
      </PageLayout>
    );
    expect(screen.getByText('Heading')).toBeInTheDocument();
    expect(screen.getByText('Paragraph')).toBeInTheDocument();
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  it('has main element with correct role and id', () => {
    render(
      <PageLayout>
        <div>Content</div>
      </PageLayout>
    );
    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveAttribute('id', 'maincontent');
  });

  it('applies nhsuk-width-container class to container', () => {
    const { container } = render(
      <PageLayout>
        <div>Content</div>
      </PageLayout>
    );
    const widthContainer = container.querySelector('.nhsuk-width-container');
    expect(widthContainer).toBeInTheDocument();
  });

  it('applies nhsuk-main-wrapper class to main element', () => {
    const { container } = render(
      <PageLayout>
        <div>Content</div>
      </PageLayout>
    );
    const mainWrapper = container.querySelector('.nhsuk-main-wrapper');
    expect(mainWrapper).toBeInTheDocument();
  });

  it('applies nhsuk-grid-row class to grid row', () => {
    const { container } = render(
      <PageLayout>
        <div>Content</div>
      </PageLayout>
    );
    const gridRow = container.querySelector('.nhsuk-grid-row');
    expect(gridRow).toBeInTheDocument();
  });

  it('applies nhsuk-grid-column-two-thirds class to grid column', () => {
    const { container } = render(
      <PageLayout>
        <div>Content</div>
      </PageLayout>
    );
    const gridColumn = container.querySelector('.nhsuk-grid-column-two-thirds');
    expect(gridColumn).toBeInTheDocument();
  });

  it('nests elements in correct DOM hierarchy', () => {
    render(
      <PageLayout>
        <span data-testid="child">Child content</span>
      </PageLayout>
    );
    const child = screen.getByTestId('child');
    const parent = child.parentElement;
    expect(parent).toHaveClass('nhsuk-grid-column-two-thirds');
    expect(parent?.parentElement).toHaveClass('nhsuk-grid-row');
  });

  it('renders with empty children', () => {
    const { container } = render(<PageLayout>{null}</PageLayout>);
    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
  });
});
