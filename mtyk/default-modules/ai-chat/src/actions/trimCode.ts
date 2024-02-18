
export const trimCode = (
  str: string

) => {
  let out = str
    .replace(/[ ]+/gm, ' ')
    .replace(/[\t]+/gm, ' ')
    .replace(/[\n\r]+/gm, '\n')
    .trim();



  return out;
};
