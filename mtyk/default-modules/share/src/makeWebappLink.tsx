export function makeWebappLink(path?: string) {
  return `${process.env.WEBAPP_URL}${path}`
}
