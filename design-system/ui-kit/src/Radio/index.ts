import { RadioGroup } from './RadioGroup';
import { RadioOption } from './RadioOption';

type RadioApi = typeof RadioGroup & {
  Option: typeof RadioOption;
};

const Radio = RadioGroup as RadioApi;
Radio.Option = RadioOption;

export { Radio };
