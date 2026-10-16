import classes from './index.module.pcss'

export type LevelBadgeSize = 's' | 'm' | 'l'

const SIZE_PX: Record<LevelBadgeSize, number> = { s: 28, m: 40, l: 64 }
const MAX_LEVEL_ASSET = 5

export function LevelBadge({ level, size = 'm' }: { level: number; size?: LevelBadgeSize }) {
  const tier = Math.min(Math.max(level, 0), MAX_LEVEL_ASSET)
  const px = SIZE_PX[size]

  return (
    <img
      alt=""
      aria-hidden="true"
      className={classes.badge}
      height={px}
      src={`${import.meta.env.BASE_URL}icons/levels/level-${tier}.svg`}
      width={px}
    />
  )
}
