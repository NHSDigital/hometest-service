import { Card, ChevronRightIcon } from 'nhsuk-react-components';
import { type ResultCardConfig } from '../ResultCardConfigs';
import { Link } from 'react-router-dom';

interface ResultCardProps {
  readonly cardConfig: ResultCardConfig;
  readonly result: string | undefined;
  readonly resultDetail?: string;
  readonly trafficLightValue?: string;
}
export default function ResultCard({
  cardConfig,
  result,
  resultDetail,
  trafficLightValue
}: ResultCardProps) {
  const cardClass = cardConfig.getTrafficLight(trafficLightValue);
  return (
    <Card.GroupItem width="full">
      <Card
        id={`${cardConfig.id}-card`}
        clickable
        className={
          'nhsuk-u-margin-bottom-3 ' +
          cardClass +
          (!(cardConfig.resultText && result) || !cardConfig.resultDetailsText
            ? ' nhsuk-u-padding-top-4 nhsuk-u-padding-bottom-4'
            : '')
        }
        cardType="primary"
      >
        <Card.Content>
          <Card.Heading headingLevel="H4">
            <Card.Link asElement={Link} to={cardConfig.path}>
              {cardConfig.title}
            </Card.Link>
          </Card.Heading>

          <Card.Description className="nhsuk-u-margin-bottom-0">
            {result && (
              <p>
                {cardConfig.resultText}
                <span
                  className={`${cardConfig.title === 'Smoking status' ? '' : 'nhsuk-u-font-weight-bold'} card-value`}
                >
                  {cardConfig.mapResult(result)}
                </span>
              </p>
            )}
            {cardConfig.resultDetailsText && (
              <p aria-live="off">
                {cardConfig.resultDetailsText}
                <span className="nhsuk-u-visually-hidden">:&nbsp;</span>
                <span className="nhsuk-u-font-weight-bold card-details-value">
                  {cardConfig.mapResultDetail(resultDetail)?.toLowerCase()}
                </span>
              </p>
            )}
          </Card.Description>

          <ChevronRightIcon className="app-chevron--grey" />
        </Card.Content>
      </Card>
    </Card.GroupItem>
  );
}
