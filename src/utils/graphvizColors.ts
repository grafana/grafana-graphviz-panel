export function isDefaultColor(color: string | null): boolean {
  if (!color) {
    return true;
  }
  const defaultColors = ['black', 'none', 'white', '#000000', '#ffffff'];
  return defaultColors.includes(color.toLowerCase());
}
