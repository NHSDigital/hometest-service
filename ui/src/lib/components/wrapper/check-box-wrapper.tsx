import { Checkboxes } from 'nhsuk-react-components';
import FieldsetErrorWrapper, {
  type FieldsetErrorWrapperProps
} from './fieldset-error-wrapper';

interface CheckboxWrapperProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CheckboxWrapper({
  legend,
  legendProps,
  id,
  onChange,
  hint,
  error,
  children
}: CheckboxWrapperProps & FieldsetErrorWrapperProps) {
  const content = (
    <>
      <FieldsetErrorWrapper
        legend={legend}
        legendProps={legendProps}
        id={id}
        hint={hint}
        error={error}
      >
        <Checkboxes id={id} name={id} onChange={onChange}>
          {children}
        </Checkboxes>
      </FieldsetErrorWrapper>
    </>
  );

  return content;
}
