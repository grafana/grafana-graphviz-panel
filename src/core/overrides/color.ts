export function addStyleToCommaList(existingStyle: string | null, newStyle: string): string {
  const current = existingStyle || '';
  return current.includes(newStyle) ? current : `${current ? current + ',' : ''}${newStyle}`;
}
