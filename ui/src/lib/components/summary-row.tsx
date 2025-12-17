import { SummaryList } from 'nhsuk-react-components';
import { Link } from 'react-router-dom';
import { Fragment } from 'react/jsx-runtime';

export interface SummaryItem {
  key: string;
  value: string | string[];
  changeLink?: string;
  id: string;
  screenReaderSuffix: string;
}

interface SummaryRowsProps {
  items: SummaryItem[];
}

export function SummaryRows({ items }: SummaryRowsProps) {
  return (
    <>
      {items.map((item) => (
        <SummaryRow
          id={item.id}
          key={item.key}
          keyValue={item.key}
          value={item.value}
          changeLink={item.changeLink}
          screenReaderSuffix={item.screenReaderSuffix}
        />
      ))}
    </>
  );
}

interface ISummaryRowProps {
  keyValue: string;
  value: string | string[];
  changeLink?: string;
  id: string;
  screenReaderSuffix: string;
}

export function SummaryRow({
  id,
  keyValue,
  value,
  changeLink,
  screenReaderSuffix
}: ISummaryRowProps) {
  return (
    <SummaryList.Row key={keyValue} id={id}>
      <SummaryList.Key id={`${id}-key`}>{keyValue}</SummaryList.Key>
      <SummaryList.Value id={`${id}-value`}>
        {Array.isArray(value)
          ? value.map((line, index) => (
              <Fragment key={index}>
                {line}
                {index < value.length - 1 && <br />}
              </Fragment>
            ))
          : value}
      </SummaryList.Value>
      <SummaryList.Actions id={`${id}-changeLink`}>
        {changeLink && (
          <Link to={changeLink}>
            Change{/* */}
            {screenReaderSuffix && (
              <span className="nhsuk-u-visually-hidden">
                {' '}
                {screenReaderSuffix}
              </span>
            )}
          </Link>
        )}
      </SummaryList.Actions>
    </SummaryList.Row>
  );
}
