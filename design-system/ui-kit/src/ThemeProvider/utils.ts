export function isColorLight(rgbaColor: string): boolean {
  const match = rgbaColor.match(/rgba?\(([^)]+)\)/);

  if (!match) return false;

  const [r, g, b] = match[1].split(',').map((part) => parseFloat(part.trim()));

  if ([r, g, b].some((channel) => Number.isNaN(channel))) return false;

  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

  return luma > 40;
}
