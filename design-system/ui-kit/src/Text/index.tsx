import { forwardRef, useMemo } from 'react';
import type { CSSProperties, PropsWithChildren } from 'react';

import classNames from 'classnames';

import type { ColorToken } from '../internal/types';
import typography from '../internal/typography/typography.module.pcss';
import { mapColor } from '../internal/utils';

import classes from './index.module.pcss';

const variantSeparator = ' / ';

type FontSize = 'L' | 'M' | 'M Compact' | 'S' | 'S Compact' | 'XL' | 'XS' | 'XXL' | 'XXS';
type TextStyle = 'Address' | 'CAPS' | 'Medium' | 'Mono Num' | 'Strikethrough' | 'Underlined';

type VariantSeparator = typeof variantSeparator;

type TextProps = PropsWithChildren<{
  align?: 'center' | 'end' | 'start';
  as?: 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  color?: ColorToken | 'inherit';
  dataTest?: string | undefined;
  inline?: boolean;
  lineHeight?: number;
  opacity?: number;
  overflow?: 'anywhere' | 'ellipsis' | 'nowrap' | undefined;
  textTransform?: CSSProperties['textTransform'];
  variant: TextVariant;
}>;

type TextVariant = `${FontSize}${VariantSeparator}${TextStyle}`;

const Text = forwardRef<HTMLDivElement, TextProps>(
  (
    {
      align = 'start',
      as,
      children,
      color = 'inherit',
      dataTest = 'Text',
      inline,
      lineHeight,
      opacity,
      overflow,
      textTransform,
      variant,
    },
    ref,
  ) => {
    const Component = as ?? (inline ? 'span' : 'p');

    const [vSize, vStyle] = variant.split(variantSeparator);

    const style = useMemo(() => {
      const colorResult = color === 'inherit' ? color : mapColor(color);
      const styles = {
        color: colorResult,
        display: inline ? 'inline' : 'block',
        lineHeight,
        opacity: opacity ?? void 0,
      } as CSSProperties;

      if (textTransform) {
        styles.textTransform = textTransform;
      }

      return styles;
    }, [textTransform, color, opacity, inline, lineHeight]);

    return (
      <Component
        className={classNames(classes.text, typography.typography)}
        data-align={align}
        data-overflow={overflow}
        data-size={vSize}
        data-style={vStyle}
        data-test={dataTest}
        ref={ref}
        style={style}
      >
        {children}
      </Component>
    );
  },
);

Text.displayName = 'Text(ui-kit)';

export type { TextVariant };
export { Text };
