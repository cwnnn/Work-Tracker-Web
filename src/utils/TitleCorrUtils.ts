export function toTitleCase(text: string): string {
  return text
    .toLocaleLowerCase('tr')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase('tr') + word.slice(1))
    .join(' ')
}
