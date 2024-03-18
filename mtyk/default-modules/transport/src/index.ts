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

// --- BEGIN INJECTED CODE ---

// Inject some code to check if we've imported two different versions of any module. This is a common cause of bugs.
const globalObject: any = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : {}
const globalStore = globalObject?.__bbuild ?? {}
if (globalStore["transport"]) {
console.warn(`Duplicate module transport imported. This can lead to bugs.`);
}
globalStore["transport"] = true;
 
// --- END INJECTED CODE ---