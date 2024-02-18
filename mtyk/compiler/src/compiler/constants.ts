import { safePackages } from "./module/safePackages";
import { loadOneConfig } from "./one/loadOneConfig";

export async function getProjectName() {
  try {
    const config = await loadOneConfig();
    return config.name;
  } catch (e) {
    console.error(e);
    // ignore
  }
  return "one";
}

export async function getPackageOrg() {
  return `@bbuild`;
  // return getProjectName().then((n) => "@" + n);
}

/**
 * @deprecated use `safePackages` instead
 */
export const TYPESCRIPT_VERSION = safePackages.typescript;

export const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

export const IMPORTS_REGEX =
  /(?:import\s+(\w+)\s+from\s+['"]([^'"]+)['"]|import\s+\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"]|import\s+\{([\s\S]*?)\s+as\s+([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"]|import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]|import\s+`module-(\w+)`|const\s+\{([\s\S]*?)\}\s+=\s+require\s*\(\s*['"]([^'"]+)['"]\s*\)|const\s+\{([\s\S]*?)\s*:\s*([\s\S]*?)\}\s+=\s+require\s*\(\s*['"]([^'"]+)['"]\s*\)|const\s+(\w+)\s+=\s+require\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s+type\s+\{([\s\S]*?)\}\s+from\s+['"]([^'"]+)['"]|import\s+type\s+(\w+)\s+from\s+['"]([^'"]+)['"]|(let|var|const)\s+(\{[\s\S]*?\}|[\w\s]+)\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\);?)/gi;
