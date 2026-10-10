import type { FC } from 'react';

import { useModel, useStore } from '@hedron/react';

import { useAsyncLibrary } from '@design-system/ui-kit';

import { ConfettiViewModel } from '../../models/ConfettiViewModel';

import classes from './index.module.pcss';

const libLoader = () => import(/* webpackChunkName: "lib.react-confetti" */ 'react-confetti');

type ConfettiProps = {};

const Content: FC<{ duration: number }> = ({ duration }) => {
  const confettiLib = useAsyncLibrary(libLoader);

  const height = window.innerHeight;
  const width = window.innerWidth;

  return confettiLib ? (
    <div className={classes.host}>
      <confettiLib.default
        height={height}
        numberOfPieces={width * 1.25}
        recycle={false}
        tweenDuration={duration}
        width={width}
      />
    </div>
  ) : null;
};

export const Confetti: FC<ConfettiProps> = () => {
  const confetti = useModel(ConfettiViewModel);

  const { options, visible } = useStore(confetti.store);

  return visible ? <Content duration={options.duration} /> : null;
};
