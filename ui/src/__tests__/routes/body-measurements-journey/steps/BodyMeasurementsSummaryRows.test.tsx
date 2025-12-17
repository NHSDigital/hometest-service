import { render, screen } from '@testing-library/react';
import {
  HeightDisplayPreference,
  WeightDisplayPreference,
  WaistMeasurementDisplayPreference
} from '@dnhc-health-checks/shared';
import BodyMeasurementsSummaryRows from '../../../../routes/body-measurements-journey/steps/BodyMeasurementsSummaryRows';
import * as converters from '../../../../../src/lib/converters/body-measurements-converter';
import { MemoryRouter } from 'react-router';

jest.mock(
  '../../../../../src/lib/converters/body-measurements-converter',
  () => ({
    convertCmToFtAndInches: jest.fn(),
    convertKgToLbsAndStones: jest.fn(),
    convertCmToInches: jest.fn()
  })
);

describe('BodyMeasurementsSummaryRows', () => {
  beforeEach(() => {
    (converters.convertCmToFtAndInches as jest.Mock).mockReturnValue({
      ft: 5,
      inch: 9
    });
    (converters.convertKgToLbsAndStones as jest.Mock).mockReturnValue({
      stones: 11,
      pounds: 0
    });
    (converters.convertCmToInches as jest.Mock).mockReturnValue(32.5);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders height, weight, waist correctly', () => {
    const props = {
      bodyMeasurementsAnswers: {
        height: 175,
        heightDisplayPreference: HeightDisplayPreference.FeetAndInches,
        weight: 70,
        weightDisplayPreference: WeightDisplayPreference.StonesAndPounds,
        waistMeasurement: 82,
        waistMeasurementDisplayPreference:
          WaistMeasurementDisplayPreference.Inches
      }
    };

    render(
      <MemoryRouter>
        <BodyMeasurementsSummaryRows {...props} />
      </MemoryRouter>
    );

    expect(screen.getByText('What is your height?')).toBeInTheDocument();
    expect(screen.getByText('5ft and 9in')).toBeInTheDocument();

    expect(screen.getByText('What is your weight?')).toBeInTheDocument();
    expect(screen.getByText('11st and 0lb')).toBeInTheDocument();

    expect(
      screen.getByText('What is your waist measurement?')
    ).toBeInTheDocument();
    expect(screen.getByText('32.5in')).toBeInTheDocument();
  });
});
