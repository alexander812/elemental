import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import classes from './PhraseTaskView.module.pcss'

type Props = {
  index: number
  x: number
  phase: string
  current: boolean
  busy: boolean
  children: ReactNode
  restoreScroll: (index: number) => number
  registerScroller: (index: number, node: HTMLDivElement | null) => void
  rememberScroll: (index: number, top: number) => void
}

export function PagePanel({
  index,
  x,
  phase,
  current,
  busy,
  children,
  restoreScroll,
  registerScroller,
  rememberScroll,
}: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const node = contentRef.current
    if (!node) return
    node.scrollTop = restoreScroll(index)
    registerScroller(index, node)
    return () => registerScroller(index, null)
  }, [index, restoreScroll, registerScroller])

  return (
    <div
      className={classes.page}
      data-test="phrase-page-motion"
      data-page-index={index}
      data-current={current}
      data-phase={phase}
      style={{ transform: `translateX(${x}px)` }}
      inert={!current || busy}
      aria-hidden={!current}
    >
      <div
        className={classes.content}
        ref={contentRef}
        onScroll={(event) => rememberScroll(index, event.currentTarget.scrollTop)}
      >
        {children}
      </div>
    </div>
  )
}
