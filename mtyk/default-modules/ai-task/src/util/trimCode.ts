export const trimCode = (
  str: string,
  opts: {
    components?: {
      divs: boolean
    }
  } = {}
) => {
  let out = str
    .replace(/[ ]+/gm, ' ')
    .replace(/[\t]+/gm, ' ')
    .replace(/[\n\r]+/gm, '\n')
    .trim()

  if (opts?.components?.divs) {
    out = out.replace(/<[a-zA-Z0-9\.]+/gim, `<div`)
    out = out.replace(/<\/[a-zA-Z0-9\.]+/gim, `</div`)
  }

  return out
}
export default trimCode
