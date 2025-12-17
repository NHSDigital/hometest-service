import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { type ResultCardConfig } from '../../../../routes/results/ResultCardConfigs';
import ResultCard from '../../../../routes/results/main-results-page/ResultCard';
import { type RiskLevelColor } from '../../../../lib/models/RiskLevelColor';

describe('ResultCard Component', () => {
  const mockCardConfig: ResultCardConfig = {
    id: 'some-id',
    title: 'Test Title',
    path: '/test-path',
    resultText: 'Result: ',
    resultDetailsText: 'Details: ',
    mapResult: jest.fn((result) => `Mapped ${result}`),
    mapResultDetail: jest.fn((detail) => `Mapped Detail ${detail}`),
    getTrafficLight: jest.fn(
      (value) => (value ? 'traffic-light-class' : '') as RiskLevelColor
    )
  };

  it('renders the card with the correct title and link', () => {
    render(
      <BrowserRouter>
        <ResultCard cardConfig={mockCardConfig} result="test" />
      </BrowserRouter>
    );

    const linkElement = screen.getByRole('link', { name: /Test Title/i });
    expect(linkElement).toHaveAttribute('href', '/test-path');
  });

  it('displays the result with details correctly', () => {
    render(
      <BrowserRouter>
        <ResultCard
          cardConfig={mockCardConfig}
          result="test-result"
          resultDetail="test-detail"
        />
      </BrowserRouter>
    );

    expect(screen.getByText(/Result:/)).toBeInTheDocument();
    expect(screen.getByText(/Mapped test-result/)).toBeInTheDocument();
    expect(screen.getByText(/Details:/)).toBeInTheDocument();
    expect(screen.getByText(/mapped detail test-detail/)).toBeInTheDocument();
  });

  it('applies the correct traffic light class based on trafficLightValue', () => {
    render(
      <BrowserRouter>
        <ResultCard
          cardConfig={mockCardConfig}
          result="test"
          trafficLightValue="high"
        />
      </BrowserRouter>
    );

    expect(mockCardConfig.getTrafficLight).toHaveBeenCalledWith('high');
  });
});
