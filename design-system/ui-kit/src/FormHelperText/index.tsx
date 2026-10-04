import type { FC, PropsWithChildren } from 'react';
import { memo } from 'react';

import classNames from 'classnames';

import { Text } from '../Text';

import classes from './index.module.pcss';

type FormHelperTextVariant = 'error' | 'neutral' | 'success' | 'warning';

type FormHelperTextProps = PropsWithChildren<{
  dataTest?: string;
  rounded?: boolean;
  variant?: FormHelperTextVariant;
}>;

const hostVariantClasses: Record<FormHelperTextVariant, string> = {
  error: classes.hostVariantError,
  neutral: classes.hostVariantNeutral,
  success: classes.hostVariantSuccess,
  warning: classes.hostVariantWarning,
};

export const FormHelperText: FC<FormHelperTextProps> = memo(
  ({ children, dataTest = 'FormHelperText', rounded = false, variant = 'neutral' }) => {
    return (
      <div
        className={classNames(classes.host, hostVariantClasses[variant], {
          [classes.hostRounded]: rounded,
        })}
        data-test={dataTest}
      >
        <Text as="span" inline variant="XS / Medium">
          {children}
        </Text>
      </div>
    );
  },
);

FormHelperText.displayName = 'FormHelperText';

export type { FormHelperTextVariant };
