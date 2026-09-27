import type { CSSProperties, PropsWithChildren, PropsWithRef } from 'react';
import { forwardRef } from 'react';

import type { IconSize } from '../size';
import { getSize } from '../size';

type SvgIconProps = PropsWithChildren<
  PropsWithRef<{
    className?: string;
    color?: string;
    flipForRtl?: boolean;
    fontSize?: IconSize | 'inherit';
    preserveAspectRatio?: string;
    style?: CSSProperties;
    title?: string;
    titleId?: string;
    viewBox?: string;
  }>
>;

/**
 * Component has same behavior like font icons.
 * It's mean you should use CSS `font-size` property for change `width` and `height`.
 *
 * Default font size is 24px. Set `fontSize` to 'inherit' for change this.
 */
const SvgIcon = forwardRef<SVGSVGElement, SvgIconProps>(
  (
    {
      children,
      className,
      color,
      flipForRtl,
      fontSize = 'm',
      preserveAspectRatio,
      style,
      title,
      titleId,
      viewBox = '0 0 24 24',
    }: SvgIconProps,
    ref,
  ) => {
    const computedStyle: CSSProperties = {
      color,
      display: 'inline-block',
      flexShrink: 0,
      fontSize: fontSize === 'inherit' ? 'inherit' : getSize(fontSize),
      height: '1em',
      width: '1em',
      ...(flipForRtl ? { transform: 'scaleX(-1)' } : {}),
      ...style,
    };

    return (
      <svg
        aria-hidden={title ? 'false' : 'true'}
        aria-labelledby={titleId}
        className={className}
        focusable="false"
        preserveAspectRatio={preserveAspectRatio}
        ref={ref}
        role={title ? 'img' : 'presentation'}
        style={computedStyle}
        viewBox={viewBox}
      >
        {title ? <title id={titleId}>{title}</title> : null}
        {children}
      </svg>
    );
  },
);

SvgIcon.displayName = '@elemental/icons(SvgIcon)';

export type { SvgIconProps };
export { SvgIcon };
