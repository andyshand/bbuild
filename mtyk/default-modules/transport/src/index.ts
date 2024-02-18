/**
 * generates a unique(ish) port for a given name between
 * 2023 and 65535
 */
export function getPortForName(name: string) {
  const hash = name.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  return 2023 + (hash % 65535);
}
