import { retrieveOptionalEnvVariable } from '../utils';
import _ from 'lodash';

export default function validateFreeTextInputLength(input: string): boolean {
  const inputMaxLength = Number.parseInt(
    retrieveOptionalEnvVariable('ADDRESS_TEXT_INPUT_MAX_LENGTH', '35')
  );
  const escapedInput = _.escape(input);
  return escapedInput.length <= inputMaxLength;
}
