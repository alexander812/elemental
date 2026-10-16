import classes from './index.module.pcss'

export type RewardIconKind = 'xp' | 'coin'

const SRC: Record<RewardIconKind, string> = {
  coin: `${import.meta.env.BASE_URL}icons/rewards/coin.svg`,
  xp: `${import.meta.env.BASE_URL}icons/rewards/xp.svg`,
}

export function RewardIcon({ kind, size = 16 }: { kind: RewardIconKind; size?: number }) {
  return (
    <img
      alt=""
      aria-hidden="true"
      className={classes.icon}
      height={size}
      src={SRC[kind]}
      width={size}
    />
  )
}
