import classes from './TileProgress.module.pcss'

export type TileProgressTone = 'accent' | 'accentOver'

type TileProgressProps = {
  tone?: TileProgressTone
  value: number
}

const clamp = (value: number): number =>
  Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))

export function TileProgress({ tone = 'accent', value }: TileProgressProps) {
  const progress = clamp(value)

  if (progress <= 0) return null

  return (
    <div
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(progress * 100)}
      className={`${classes.host} ${tone === 'accentOver' ? classes.accentOver : ''}`}
      data-test="TileProgress"
      role="progressbar"
    >
      <div className={classes.bar} style={{ width: `${progress * 100}%` }} />
    </div>
  )
}
