import { BpChartFigure } from 'nhsuk-tools-chart-components-react';
import { systolicRanges, diastolicRanges } from './blood-pressure-ranges';
import {
  BloodPressureLocation,
  type BloodPressureCategory
} from '@dnhc-health-checks/shared';
import { Details } from 'nhsuk-react-components';

export enum BpClassificationLevel {
  Low = 'low',
  Healthy = 'healthy',
  SlightlyRaised = 'slightlyRaised',
  High = 'high',
  VeryHigh = 'veryHigh'
}

export function BloodPressureGraph({
  systolic,
  diastolic,
  location,
  bloodPressureCategory,
  description
}: {
  systolic: number;
  diastolic: number;
  location: BloodPressureLocation;
  bloodPressureCategory: BloodPressureCategory;
  description?: string;
}) {
  const locationSpecificDetails =
    location === BloodPressureLocation.Monitor
      ? 'Some of the ranges are different if you get your reading taken at a GP or pharmacy.'
      : 'Some of the ranges are different if you take your blood pressure at home.';

  const bounds = {
    systolic: {
      lower: 70,
      upper: {
        [BpClassificationLevel.Low]: {
          value: systolicRanges.low[location].upperBoundary
        },
        [BpClassificationLevel.Healthy]: {
          value: systolicRanges.healthy[location].upperBoundary
        },
        [BpClassificationLevel.SlightlyRaised]: {
          value: systolicRanges.slightlyRaised[location].upperBoundary
        },
        [BpClassificationLevel.High]: {
          value: systolicRanges.high[location].upperBoundary
        },
        [BpClassificationLevel.VeryHigh]: {
          value: 300
        }
      }
    },
    diastolic: {
      lower: 40,
      upper: {
        [BpClassificationLevel.Low]: {
          value: diastolicRanges.low[location].upperBoundary
        },
        [BpClassificationLevel.Healthy]: {
          value: diastolicRanges.healthy[location].upperBoundary
        },
        [BpClassificationLevel.SlightlyRaised]: {
          value: diastolicRanges.slightlyRaised[location].upperBoundary
        },
        [BpClassificationLevel.High]: {
          value: diastolicRanges.high[location].upperBoundary
        },
        [BpClassificationLevel.VeryHigh]: {
          value: 200
        }
      }
    }
  };

  const graphLayout = {
    systolicLabel: 'Systolic (high number)',
    diastolicLabel: 'Diastolic (low number)',
    rows: [
      {
        id: '0',
        cells: [
          { id: '0-0', firstInColumn: true, firstInRow: true },
          { id: '0-1', firstInColumn: true, firstInRow: false },
          { id: '0-2', firstInColumn: true, firstInRow: false },
          { id: '0-3', firstInColumn: true, firstInRow: false },
          { id: '0-4', firstInColumn: true, firstInRow: false },
          { id: '0-5', firstInColumn: true, firstInRow: false }
        ]
      }
    ]
  };

  const detailTextHeading = `This blood pressure chart shows your reading of ${systolic}/${diastolic} as a cross in the ${bloodPressureCategory.toString().toLowerCase()} blood pressure area.`;
  const lowBPDetails = `low blood pressure, shown in purple - this ranges from ${systolicRanges.low[location].lowerBoundary}/${diastolicRanges.low[location].lowerBoundary} to ${systolicRanges.low[location].upperBoundary - 1}/${diastolicRanges.low[location].upperBoundary - 1}`;
  const healthyBPDetails = `healthy blood pressure, shown in green - this ranges from ${systolicRanges.healthy[location].lowerBoundary}/${diastolicRanges.healthy[location].lowerBoundary} to ${systolicRanges.healthy[location].upperBoundary}/${diastolicRanges.healthy[location].upperBoundary}`;
  const slightlyRaisedBPDetails = `slightly raised blood pressure, shown in yellow - this ranges from ${systolicRanges.slightlyRaised[location].lowerBoundary + 1}/${diastolicRanges.slightlyRaised[location].lowerBoundary + 1} to ${systolicRanges.slightlyRaised[location].upperBoundary - 1}/${diastolicRanges.slightlyRaised[location].upperBoundary - 1}`;
  const highBloodPressure = `high blood pressure, shown in red - this ranges from ${systolicRanges.high[location].lowerBoundary}/${diastolicRanges.high[location].lowerBoundary} to ${systolicRanges.high[location].upperBoundary - 1}/${diastolicRanges.high[location].upperBoundary - 1}`;

  return (
    <div className="nhsuk-u-reading-width nhsuk-tools_info-card">
      <div>
        {description && <p>{description}</p>}

        <BpChartFigure
          ariaLabel="Your blood pressure reading is shown on a chart here. A full description can be found in the text below it."
          bounds={bounds}
          reading={{ systolic, diastolic }}
          graphLayout={graphLayout}
          legendMarkerText="Your reading"
          legendKeys={{
            high: 'High',
            slightlyraised: 'Slightly raised',
            healthy: 'Healthy',
            low: 'Low'
          }}
        />

        <Details className="nhsuk-u-margin-bottom-0 nhsuk-u-margin-top-4">
          <Details.Summary>Chart description</Details.Summary>
          <Details.Text>
            <p>{detailTextHeading}</p>
            <p>
              The vertical line shows systolic blood pressure numbers. The
              horizontal line shows diastolic blood pressure numbers.
            </p>

            <p>The chart is divided into:</p>
            <ul>
              <li>{lowBPDetails}</li>
              <li>{healthyBPDetails}</li>
              <li>{slightlyRaisedBPDetails}</li>
              <li>{highBloodPressure}</li>
            </ul>

            <p>{locationSpecificDetails}</p>
          </Details.Text>
        </Details>
      </div>
    </div>
  );
}
