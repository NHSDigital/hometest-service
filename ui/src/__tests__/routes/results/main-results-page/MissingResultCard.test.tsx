import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MissingResultCard from '../../../../routes/results/main-results-page/MissingResultCard';

describe('MissingResultCard Component', () => {
  const title = 'Missing Results';
  const dataTestId = 'missing-result-card';

  it('renders a card with a single paragraph', () => {
    const paragraphs = ['Some results are missing. Please check back later.'];

    render(
      <MissingResultCard
        dataTestId={dataTestId}
        title={title}
        paragraphs={paragraphs}
      />
    );

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByTestId(dataTestId)).toBeInTheDocument();
    expect(screen.getByText(paragraphs[0])).toBeInTheDocument();
  });

  it('renders card with multiple paragraphs', () => {
    const paragraphs = [
      'Some results are missing.',
      'Please check back later.'
    ];

    render(
      <MissingResultCard
        dataTestId={dataTestId}
        title={title}
        paragraphs={paragraphs}
      />
    );

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByTestId(dataTestId)).toBeInTheDocument();
    paragraphs.forEach((paragraph) => {
      expect(screen.getByText(paragraph)).toBeInTheDocument();
    });
  });
});
