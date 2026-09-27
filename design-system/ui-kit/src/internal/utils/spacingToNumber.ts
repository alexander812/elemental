import { spacingMap } from '../constants';
import type { Spacing } from '../constants';

export function spacingToNumber(spacing: Spacing): number {
  return spacingMap[spacing];
}
