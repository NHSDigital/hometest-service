import { Radios } from 'nhsuk-react-components';
import FieldsetErrorWrapper, {
  type FieldsetErrorWrapperProps
} from './fieldset-error-wrapper';

interface RadiosWrapperProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function RadiosWrapper({
  legend,
  legendProps,
  id,
  onChange,
  hint,
  error,
  children
}: RadiosWrapperProps & FieldsetErrorWrapperProps) {
  const radioContent = (
    <>
      <FieldsetErrorWrapper
        legend={legend}
        legendProps={legendProps}
        id={id}
        hint={hint}
        error={error}
      >
        <Radios id={id} name={id} onChange={onChange}>
          {children}
        </Radios>
      </FieldsetErrorWrapper>
    </>
  );

  return radioContent;
}
