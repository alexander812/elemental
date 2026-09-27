import type { FC } from 'react';
import { memo } from 'react';

import { ButtonIcon } from '../../../ButtonIcon';
import { useIcon } from '../../../IconsProvider';

type BackButtonProps = {
  dataTest: string;
  onClick: (() => void) | undefined;
};

export const BackButton: FC<BackButtonProps> = memo(({ dataTest, onClick }) => {
  const backIcon = useIcon('back', {
    size: 24,
  });

  return <ButtonIcon color="neutral" dataTest={dataTest} icon={backIcon} size="s" variant="flat" onClick={onClick} />;
});
