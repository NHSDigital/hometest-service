import { uniqueId } from 'lodash';
import { Card } from 'nhsuk-react-components';
import { type PropsWithChildren, type ReactNode } from 'react';

interface MissingResultCardProps {
  readonly dataTestId: string;
  readonly title: string;
  readonly paragraphs: string[];
}
export default function MissingResultCard(
  props: PropsWithChildren<MissingResultCardProps>
) {
  function renderContent(content: ReactNode | undefined) {
    return (
      <Card data-testid={props.dataTestId} cardType="primary">
        <Card.Content>
          <Card.Heading headingLevel="H3">{props.title}</Card.Heading>
          <Card.Description>
            {props.paragraphs.map((paragraph) => (
              <p key={uniqueId()}>{paragraph}</p>
            ))}
            {content}
          </Card.Description>
        </Card.Content>
      </Card>
    );
  }

  return renderContent(props.children);
}
