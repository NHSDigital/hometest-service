import { Fieldset, HintText, ErrorMessage } from 'nhsuk-react-components';
import { type ComponentPropsWithoutRef } from 'react';

export interface FieldsetErrorWrapperProps {
  legend?: string;
  legendProps?: ComponentPropsWithoutRef<typeof Fieldset.Legend>;
  id: string;
  hint?: string;
  error: string;
  children: React.ReactNode;
}

export default function FieldsetErrorWrapper({
  legend,
  legendProps,
  id,
  hint,
  error,
  children
}: FieldsetErrorWrapperProps) {
  const ariaDescribedBy = [
    hint ? `${id}--hint` : '',
    error ? `${id}--error-message` : ''
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {/*
        Using separate hint and errors component to work around
        https://github.com/NHSDigital/nhsuk-react-components/issues/214. Using
        the hint and error arguments of the radios component will incorrectly
        link them to a div wrapping the radios, not the fieldset. Once that bug
        is fixed, we can swap to passing hint directly to radios.
        */}
      {hint && <HintText id={`${id}--hint`}>{hint}</HintText>}
      {error && (
        <ErrorMessage id={`${id}--error-message`}>{error}</ErrorMessage>
      )}
      {children}
    </>
  );

  if (legend) {
    return (
      // Manually applying div to work around above bug. This can be removed
      // once we start passing error to radios directly
      <div
        className={`nhsuk-form-group ${error ? 'nhsuk-form-group--error' : ''}`}
      >
        <Fieldset
          {...(ariaDescribedBy && {
            'aria-describedby': ariaDescribedBy
          })}
        >
          <Fieldset.Legend {...{ size: 'l', ...legendProps }}>
            {legend}
          </Fieldset.Legend>
          {content}
        </Fieldset>
      </div>
    );
  }

  return content;
}
