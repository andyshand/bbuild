export const splitList = (str: string) => {
  console.log('Splitting list', str)
  if (str.trim().startsWith('1.') || str.includes('2.')) {
    return str
      .split(/[1-9]\./)
      .map(s => s.trim())
      .filter(Boolean)
  }
  return str
    .split('-')
    .map(s => s.trim())
    .filter(Boolean)
}

export default splitList
