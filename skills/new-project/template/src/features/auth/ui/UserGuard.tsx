import type { ReactNode } from 'react'
import { useUnit } from 'effector-react'
import { $user } from '../store'

interface UserGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function UserGuard({ children, fallback = null }: UserGuardProps) {
  const user = useUnit($user)
  if (!user) return <>{fallback}</>
  return <>{children}</>
}
