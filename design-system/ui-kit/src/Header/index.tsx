import { forwardRef, memo, useMemo, useRef } from 'react';
import type { CSSProperties, ForwardedRef, ReactElement, ReactNode, Ref } from 'react';

import classNames from 'classnames';

import { Box } from '../Box';
import { usePadding } from '../internal/hooks';
import type { Padding } from '../internal/types';
import { parsePxToRem, pxToRemWithUnit } from '../internal/utils';

import { BackButton } from './components/BackButton';
import type { HeaderTextVariant } from './components/HeaderText';
import { HeaderText } from './components/HeaderText';
import { useMaxPadding } from './useMaxPadding';

import classes from './index.module.pcss';

type HeaderProps<P extends string> = {
  back?: boolean;
  dataTestBack?: string;
  dataTestContent?: string;
  endToolbar?: ReactNode | ReactNode[] | undefined;
  minHeight?: CSSProperties['height'];
  onBackClick?: (() => void) | undefined;
  padding?: Padding<P>;
  startToolbar?: ReactNode | ReactNode[] | undefined;
  text: ReactNode;
  textVariant?: HeaderTextVariant;
};

const useVariant = (external: HeaderTextVariant | undefined = void 0, back: boolean) => {
  return useMemo(() => {
    if (external) {
      return external;
    }

    return back ? 'secondary' : 'primary';
  }, [external, back]);
};

const HeaderInternal = <P extends string>(
  {
    back = false,
    dataTestBack = '',
    dataTestContent = '',
    endToolbar,
    minHeight = '64px',
    onBackClick,
    padding = 'm 0',
    startToolbar,
    text,
    textVariant,
  }: HeaderProps<P>,
  ref: ForwardedRef<HTMLDivElement>,
): ReactElement => {
  const variant = useVariant(textVariant, back);

  const startBlockRef = useRef<HTMLDivElement>(null);
  const endBlockRef = useRef<HTMLDivElement>(null);

  const contentInCenter = variant === 'secondary';

  const maxPadding = useMaxPadding({
    enable: contentInCenter,
    startRef: startBlockRef,
    endRef: endBlockRef,
  });

  const centeredContentStyle = useMemo(
    () => ({
      paddingInlineEnd: pxToRemWithUnit(maxPadding),
      paddingInlineStart: pxToRemWithUnit(maxPadding),
    }),
    [maxPadding],
  );

  const content = contentInCenter ? (
    <>
      <Box grow />
      <div className={classes.centeredContent} data-test={dataTestContent} style={centeredContentStyle}>
        <HeaderText variant={variant}>{text}</HeaderText>
      </div>
    </>
  ) : (
    <div className={classes.content} data-test={dataTestContent}>
      <HeaderText variant={variant}>{text}</HeaderText>
    </div>
  );
  const calculatedPadding = usePadding(padding);

  const hostStyle = useMemo(
    () => ({
      minHeight: parsePxToRem(minHeight),
      padding: calculatedPadding,
    }),
    [minHeight, calculatedPadding],
  );

  return (
    <div className={classes.host} ref={ref} style={hostStyle}>
      <div
        className={classNames(classes.inlineContainer, {
          [classes.inlineContainerStartPadding]: !back && !contentInCenter,
        })}
      >
        <div className={classes.container}>
          <div className={classes.startBlock} ref={startBlockRef}>
            {back && <BackButton dataTest={dataTestBack} onClick={onBackClick} />}
            {startToolbar}
          </div>
          {content}
          <div className={classes.endBlock} ref={endBlockRef}>
            {endToolbar}
          </div>
        </div>
      </div>
    </div>
  );
};

const Header = memo(forwardRef(HeaderInternal)) as <P extends string>(
  _: HeaderProps<P> & { ref?: Ref<HTMLDivElement> | undefined },
) => ReactElement;

export { Header };
